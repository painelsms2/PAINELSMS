-- supabase/migrations/15_secure_rls.sql

-- 1. Create a trigger function to block unauthorized changes to sensitive profile fields
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user is NOT an admin, revert any attempts to change sensitive fields
  -- We check is_admin() directly.
  IF NOT public.is_admin() THEN
    NEW.role = OLD.role;
    NEW.status = OLD.status;
    NEW.balance = OLD.balance;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach the trigger to the profiles table
DROP TRIGGER IF EXISTS on_profile_update_security ON public.profiles;
CREATE TRIGGER on_profile_update_security
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.protect_profile_fields();

-- 3. Drop the vulnerable UPDATE policy on activations
-- Users should never update activations directly via client API.
-- All operations (like cancel) are handled via RPCs which run with SECURITY DEFINER and bypass RLS.
DROP POLICY IF EXISTS "Users can update own activations" ON public.activations;

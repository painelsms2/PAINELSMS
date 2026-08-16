-- supabase/seed.sql
-- Seed script for initial services and admin user

--------------------------------------------------------------------------------
-- 1. SEED SERVICES
--------------------------------------------------------------------------------

INSERT INTO public.services (id, name, icon_key, price, country, stock, active)
VALUES 
  ('whatsapp', 'WhatsApp', 'MessageCircle', 5.50, 'Brasil', 124, true),
  ('telegram', 'Telegram', 'Send', 4.00, 'Brasil', 89, true),
  ('instagram', 'Instagram', 'Camera', 2.50, 'Brasil', 245, true),
  ('facebook', 'Facebook', 'Facebook', 2.00, 'Brasil', 432, true),
  ('google', 'Google', 'Chrome', 3.50, 'Brasil', 156, true),
  ('tiktok', 'TikTok', 'Music', 2.00, 'Brasil', 320, true),
  ('discord', 'Discord', 'MessageSquare', 1.50, 'Brasil', 67, true),
  ('uber', 'Uber', 'Car', 4.50, 'Brasil', 12, true),
  ('twitter', 'X / Twitter', 'Twitter', 2.50, 'Brasil', 54, true),
  ('netflix', 'Netflix', 'Tv', 1.50, 'Brasil', 8, true)
ON CONFLICT (id) DO UPDATE SET 
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  active = EXCLUDED.active;

--------------------------------------------------------------------------------
-- 2. CREATE ADMIN ACCOUNT
-- IMPORTANT: This password is a DEV/TEST placeholder. MUST change before production!
--------------------------------------------------------------------------------

DO $$
DECLARE
  v_admin_uid uuid;
BEGIN
  -- Check if admin already exists
  SELECT id INTO v_admin_uid FROM auth.users WHERE email = 'admin@2026gmail.com';
  
  IF v_admin_uid IS NULL THEN
    v_admin_uid := gen_random_uuid();
    
    -- Insert into auth.users with correct casting
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_admin_uid,
      'authenticated',
      'authenticated',
      'admin@2026gmail.com',
      crypt('admin@2026', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Admin"}'::jsonb,
      now(),
      now()
    );

    -- Insert into auth.identities to ensure login works correctly in modern Supabase
    INSERT INTO auth.identities (
      id, provider_id, user_id, identity_data, provider, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_admin_uid,
      v_admin_uid,
      format('{"sub":"%s","email":"%s"}', v_admin_uid::text, 'admin@2026gmail.com')::jsonb,
      'email',
      now(),
      now()
    );

    -- The handle_new_user trigger automatically creates the profile row with role='user'.
    -- We need to update it to 'admin'.
    UPDATE public.profiles SET role = 'admin' WHERE id = v_admin_uid;
    
    RAISE NOTICE 'Admin user created successfully.';
  ELSE
    RAISE NOTICE 'Admin user already exists.';
  END IF;
END $$;

-- 12_cleanup_duplicates.sql
-- This script merges duplicates created by SMS24H sync when matching failed.
-- It moves service_offers from the duplicate service to the original service
-- and then deletes the duplicate.

DO $$
DECLARE
  v_dup record;
  v_real_id text;
  v_dup_prefix text;
BEGIN
  -- Iterate over inactive services that were likely created by the sync fallback
  FOR v_dup IN 
    SELECT id, icon_file FROM public.services WHERE active = false
  LOOP
    -- Extract the prefix from the duplicate's icon (e.g. 'wa0.png' -> 'wa')
    v_dup_prefix := replace(replace(v_dup.icon_file, '0.png', ''), '.png', '');
    
    -- Find the real active service that has the SAME prefix
    SELECT id INTO v_real_id FROM public.services 
    WHERE active = true 
      AND id != v_dup.id
      AND (
        replace(replace(icon_file, '0.png', ''), '.png', '') = v_dup_prefix
        OR id = v_dup_prefix
      )
    LIMIT 1;

    IF v_real_id IS NOT NULL THEN
      -- 1. Move any service_offers attached to the duplicate over to the real service
      UPDATE public.service_offers 
      SET service_id = v_real_id 
      WHERE service_id = v_dup.id;
      
      -- 2. Delete the duplicate service
      DELETE FROM public.services WHERE id = v_dup.id;
      
      RAISE NOTICE 'Merged duplicate % into real service %', v_dup.id, v_real_id;
    END IF;
  END LOOP;
END $$;

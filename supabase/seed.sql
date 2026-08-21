-- supabase/seed.sql
-- Seed script for initial services and admin user

--------------------------------------------------------------------------------
-- 1. SEED SERVICES
--------------------------------------------------------------------------------

insert into public.services (id, name, icon_file, country, active) values
  ('99app', '99app', 'ki0.png', 'Brasil', true),
  ('agibank', 'Agibank', 'sa0.png', 'Brasil', true),
  ('aliexpress', 'AliExpress', 'hx0.png', 'Brasil', true),
  ('amazon', 'Amazon', 'am0.png', 'Brasil', true),
  ('asaas', 'Asaas', 'bqr0.png', 'Brasil', true),
  ('autodesk', 'Autodesk', 'bbl0.png', 'Brasil', true),
  ('badoo', 'Badoo', 'qv0.png', 'Brasil', true),
  ('baidu', 'Baidu', 'li0.png', 'Brasil', true),
  ('banqi', 'Banqi', 'vc0.png', 'Brasil', true),
  ('beboo', 'BeBoo', 'abd0.png', 'Brasil', true),
  ('bet365', 'Bet365', 'ie0.png', 'Brasil', true),
  ('bipa', 'Bipa', 'baj0.png', 'Brasil', true),
  ('bitso', 'Bitso', 'ht0.png', 'Brasil', true),
  ('blablacar', 'BlaBlaCar', 'ua0.png', 'Brasil', true),
  ('bradesco', 'Bradesco', 'ann0.png', 'Brasil', true),
  ('brahma', 'Brahma', 'sy0.png', 'Brasil', true),
  ('bv', 'BV', 'avy0.png', 'Brasil', true),
  ('c6_bank', 'C6 Bank', 'aff0.png', 'Brasil', true),
  ('coinbase', 'Coinbase', 're0.png', 'Brasil', true),
  ('corona', 'Corona', 'om0.png', 'Brasil', true),
  ('crefisamais', 'CrefisaMais', 'ax0.png', 'Brasil', true),
  ('cruzeiro', 'Cruzeiro', 'ccl0.png', 'Brasil', true),
  ('cupidmedia', 'CupidMedia', 'aje0.png', 'Brasil', true),
  ('daki', 'Daki', 'ahi0.png', 'Brasil', true),
  ('discord', 'Discord', 'ds0.png', 'Brasil', true),
  ('dotz', 'Dotz', 'xj0.png', 'Brasil', true),
  ('efi_bank', 'Efí Bank', 'efi0.png', 'Brasil', true),
  ('enjoei', 'Enjoei', 'arf0.png', 'Brasil', true),
  ('ero_me', 'Ero Me', 'cau0.png', 'Brasil', true),
  ('etoro', 'eToro', 'apb0.png', 'Brasil', true),
  ('facebook', 'Facebook', 'fb0.png', 'Brasil', true),
  ('facily', 'Facily', 'alc0.png', 'Brasil', true),
  ('familhao', 'Familhao', 'asl0.png', 'Brasil', true),
  ('fastearn', 'FastEarn', 'any0.png', 'Brasil', true),
  ('firebase', 'Firebase', 'aim0.png', 'Brasil', true),
  ('gappx', 'Gappx', 'arg0.png', 'Brasil', true),
  ('getninjas', 'GetNinjas', 'aiu0.png', 'Brasil', true),
  ('google', 'Google', 'go0.png', 'Brasil', true),
  ('google_chat', 'Google Chat', 'ccu0.png', 'Brasil', true),
  ('googlemessenger', 'GoogleMessenger', 'gmsg0.png', 'Brasil', true),
  ('googlevoice', 'GoogleVoice', 'gf0.png', 'Brasil', true),
  ('govbr', 'GovBr', 'afe0.png', 'Brasil', true),
  ('grindr', 'Grindr', 'yw0.png', 'Brasil', true),
  ('guiche_web', 'Guiche Web', 'alb0.png', 'Brasil', true),
  ('gurubets', 'GuruBets', 'ik0.png', 'Brasil', true),
  ('icq', 'icq', 'iq0.png', 'Brasil', true),
  ('ifood', 'IFood', 'pd0.png', 'Brasil', true),
  ('infinitepay', 'InfinitePay', 'anx0.png', 'Brasil', true),
  ('instagram', 'Instagram', 'ig0.png', 'Brasil', true),
  ('itau', 'Itau', 'btn0.png', 'Brasil', true),
  ('iti', 'Iti', 'ad0.png', 'Brasil', true),
  ('kakaotalk', 'KakaoTalk', 'kt0.png', 'Brasil', true),
  ('kwai', 'Kwai', 'vp0.png', 'Brasil', true),
  ('lalamove', 'Lalamove', 'fh0.png', 'Brasil', true),
  ('line_msg', 'Line msg', 'me0.png', 'Brasil', true),
  ('luup', 'LUUP', 'beh0.png', 'Brasil', true),
  ('magalu', 'MagaLu', 'afq0.png', 'Brasil', true),
  ('mamba', 'Mamba', 'fd0.png', 'Brasil', true),
  ('manus', 'Manus', 'bwv0.png', 'Brasil', true),
  ('meliuz', 'Meliuz', 'uy0.png', 'Brasil', true),
  ('mercado', 'Mercado', 'cq0.png', 'Brasil', true),
  ('meseems', 'MeSeems', 'amv0.png', 'Brasil', true),
  ('monzo', 'Monzo', 'aom0.png', 'Brasil', true),
  ('moonpay', 'MoonPay', 'bgj0.png', 'Brasil', true),
  ('n_me_perturbe', 'Ñ Me Perturbe', 'axm0.png', 'Brasil', true),
  ('natura_avon', 'Natura Avon', 'awg0.png', 'Brasil', true),
  ('naver', 'Naver', 'nv0.png', 'Brasil', true),
  ('neon', 'Neon', 'aex0.png', 'Brasil', true),
  ('netflix', 'Netflix', 'nf0.png', 'Brasil', true),
  ('next', 'Next', 'aey0.png', 'Brasil', true),
  ('ngcash', 'NgCash', 'awh0.png', 'Brasil', true),
  ('nubank', 'Nubank', 'aaa0.png', 'Brasil', true),
  ('ok_ru', 'Ok.ru', 'ok0.png', 'Brasil', true),
  ('okx', 'OKX', 'aor0.png', 'Brasil', true),
  ('olx', 'OLX', 'sn0.png', 'Brasil', true),
  ('openai', 'OpenAI', 'dr0.png', 'Brasil', true),
  ('outlier', 'Outlier', 'auz0.png', 'Brasil', true),
  ('outros', 'outros', 'ot0.png', 'Brasil', true),
  ('pagbank', 'PagBank', 'abg0.png', 'Brasil', true),
  ('parimatch', 'Parimatch', 'abf0.png', 'Brasil', true),
  ('paysera', 'Paysera', 'aol0.png', 'Brasil', true),
  ('pedir_gas', 'Pedir Gás', 'bqh0.png', 'Brasil', true),
  ('pgbonus', 'PGbonus', 'fx0.png', 'Brasil', true),
  ('picpay', 'Picpay', 'ev0.png', 'Brasil', true),
  ('pof_com', 'pof.com', 'pf0.png', 'Brasil', true),
  ('premmia', 'Premmia', 'anw0.png', 'Brasil', true),
  ('privalia', 'Privalia', 'afs0.png', 'Brasil', true),
  ('protonmail', 'ProtonMail', 'dp0.png', 'Brasil', true),
  ('quero_q_pag', 'Quero-Q PAG', 'bxj0.png', 'Brasil', true),
  ('radquest', 'Radquest', 'ayk0.png', 'Brasil', true),
  ('rappi', 'Rappi', 'aba0.png', 'Brasil', true),
  ('reclameaqui', 'ReclameAQUI', 'aoz0.png', 'Brasil', true),
  ('revolut', 'Revolut', 'ij0.png', 'Brasil', true),
  ('ripio', 'Ripio', 'avp0.png', 'Brasil', true),
  ('santander', 'Santander', 'lj0.png', 'Brasil', true),
  ('serasa', 'Serasa', 'abj0.png', 'Brasil', true),
  ('shein', 'Shein', 'aez0.png', 'Brasil', true),
  ('shellbox', 'ShellBox', 'vg0.png', 'Brasil', true),
  ('shopee', 'Shopee', 'ka0.png', 'Brasil', true),
  ('sicredi', 'sicredi', 'ana0.png', 'Brasil', true),
  ('skrill', 'Skrill', 'aqt0.png', 'Brasil', true),
  ('snapchat', 'Snapchat', 'fu0.png', 'Brasil', true),
  ('soop', 'SOOP', 'bxz0.png', 'Brasil', true),
  ('spaten', 'Spaten', 'ky0.png', 'Brasil', true),
  ('telegram', 'Telegram', 'tg0.png', 'Brasil', true),
  ('temu', 'Temu', 'ep0.png', 'Brasil', true),
  ('tencent_qq', 'Tencent QQ', 'qq0.png', 'Brasil', true),
  ('tick', 'Tick', 'rb0.png', 'Brasil', true),
  ('ticketmaster', 'Ticketmaster', 'gp0.png', 'Brasil', true),
  ('tiktok', 'TikTok', 'lf0.png', 'Brasil', true),
  ('tinder', 'Tinder', 'oi0.png', 'Brasil', true),
  ('totalpass', 'TotalPass', 'auc0.png', 'Brasil', true),
  ('twitch', 'twitch', 'hb0.png', 'Brasil', true),
  ('uber', 'Uber', 'ub0.png', 'Brasil', true),
  ('ubisoft', 'Ubisoft', 'ahb0.png', 'Brasil', true),
  ('ultragaz', 'Ultragaz', 'afr0.png', 'Brasil', true),
  ('uol', 'Uol', 'abh0.png', 'Brasil', true),
  ('valora', 'Valora', 'bdw0.png', 'Brasil', true),
  ('viber', 'Viber', 'vi0.png', 'Brasil', true),
  ('vk_com', 'vk.com', 'vk0.png', 'Brasil', true),
  ('voltz', 'Voltz', 'eb0.png', 'Brasil', true),
  ('walmart', 'Walmart', 'wr0.png', 'Brasil', true),
  ('webmotors', 'Webmotors', 'bfa0.png', 'Brasil', true),
  ('wechat', 'WeChat', 'wb0.png', 'Brasil', true),
  ('weststein', 'WestStein', 'th0.png', 'Brasil', true),
  ('whatsapp', 'Whatsapp', 'wa0.png', 'Brasil', true),
  ('will', 'Will', 'bsa0.png', 'Brasil', true),
  ('winzo', 'Winzo', 'vs0.png', 'Brasil', true),
  ('wirex', 'Wirex', 'baa0.png', 'Brasil', true),
  ('wise', 'Wise', 'bo0.png', 'Brasil', true),
  ('xbox', 'Xbox', 'aml0.png', 'Brasil', true),
  ('xiaomi', 'Xiaomi', 'yu0.png', 'Brasil', true),
  ('yahoo', 'Yahoo', 'mb0.png', 'Brasil', true),
  ('yalla', 'Yalla', 'yl0.png', 'Brasil', true),
  ('yandex', 'Yandex', 'ya0.png', 'Brasil', true),
  ('yowin', 'YoWin', 'sm0.png', 'Brasil', true),
  ('zedelivery', 'ZéDelivery', 'em0.png', 'Brasil', true),
  ('zeenow', 'ZeeNow', 'btm0.png', 'Brasil', true),
  ('zoho', 'Zoho', 'zh0.png', 'Brasil', true)
on conflict (id) do update set
  icon_file = excluded.icon_file,
    name = excluded.name;


--------------------------------------------------------------------------------
-- 1.5 SEED PROVIDERS AND OFFERS
--------------------------------------------------------------------------------

INSERT INTO public.providers (key, name, logo_key, active) VALUES
  ('provider1', 'Fornecedor 1', 'provider1.png', true),
  ('provider2', 'Fornecedor 2', 'provider2.png', true)
ON CONFLICT (key) DO NOTHING;

DO $
DECLARE
  v_p1 uuid;
  v_p2 uuid;
  v_svc record;
BEGIN
  SELECT id INTO v_p1 FROM public.providers WHERE key = 'provider1';
  SELECT id INTO v_p2 FROM public.providers WHERE key = 'provider2';

  FOR v_svc IN SELECT * FROM public.services LOOP
    -- Insert offer for provider 1
    INSERT INTO public.service_offers (service_id, provider_id, cost_price, sale_price, stock, active, is_default)
    VALUES (v_svc.id, v_p1, 0.50, 1.00, 100, true, true)
    ON CONFLICT (service_id, provider_id) DO NOTHING;
    
    -- Insert offer for provider 2 (randomly inactive or active)
    INSERT INTO public.service_offers (service_id, provider_id, cost_price, sale_price, stock, active, is_default)
    VALUES (v_svc.id, v_p2, 0.80, 1.50, 50, true, false)
    ON CONFLICT (service_id, provider_id) DO NOTHING;
  END LOOP;
END $;

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

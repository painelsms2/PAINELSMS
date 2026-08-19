-- supabase/seed.sql
-- Seed script for initial services and admin user

--------------------------------------------------------------------------------
-- 1. SEED SERVICES
--------------------------------------------------------------------------------

insert into public.services (id, name, icon_file, cost_price, sale_price, country, stock, active) values
  ('99app', '99app', 'ki0.png', 0.80, 1.60, 'Brasil', 0, true),
  ('agibank', 'Agibank', 'sa0.png', 0.70, 1.40, 'Brasil', 0, true),
  ('aliexpress', 'AliExpress', 'hx0.png', 0.80, 1.60, 'Brasil', 0, true),
  ('amazon', 'Amazon', 'am0.png', 0.70, 1.40, 'Brasil', 0, true),
  ('asaas', 'Asaas', 'bqr0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('autodesk', 'Autodesk', 'bbl0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('badoo', 'Badoo', 'qv0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('baidu', 'Baidu', 'li0.png', 0.40, 0.80, 'Brasil', 0, true),
  ('banqi', 'Banqi', 'vc0.png', 0.30, 0.60, 'Brasil', 0, true),
  ('beboo', 'BeBoo', 'abd0.png', 1.00, 2.00, 'Brasil', 0, true),
  ('bet365', 'Bet365', 'ie0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('bipa', 'Bipa', 'baj0.png', 0.60, 1.20, 'Brasil', 0, true),
  ('bitso', 'Bitso', 'ht0.png', 0.30, 0.60, 'Brasil', 0, true),
  ('blablacar', 'BlaBlaCar', 'ua0.png', 0.55, 1.10, 'Brasil', 0, true),
  ('bradesco', 'Bradesco', 'ann0.png', 0.40, 0.80, 'Brasil', 0, true),
  ('brahma', 'Brahma', 'sy0.png', 0.60, 1.20, 'Brasil', 0, true),
  ('bv', 'BV', 'avy0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('c6_bank', 'C6 Bank', 'aff0.png', 0.80, 1.60, 'Brasil', 0, true),
  ('coinbase', 'Coinbase', 're0.png', 1.00, 2.00, 'Brasil', 0, true),
  ('corona', 'Corona', 'om0.png', 0.20, 0.40, 'Brasil', 0, true),
  ('crefisamais', 'CrefisaMais', 'ax0.png', 0.35, 0.70, 'Brasil', 0, true),
  ('cruzeiro', 'Cruzeiro', 'ccl0.png', 1.00, 2.00, 'Brasil', 0, true),
  ('cupidmedia', 'CupidMedia', 'aje0.png', 0.70, 1.40, 'Brasil', 0, true),
  ('daki', 'Daki', 'ahi0.png', 0.65, 1.30, 'Brasil', 0, true),
  ('discord', 'Discord', 'ds0.png', 0.40, 0.80, 'Brasil', 0, true),
  ('dotz', 'Dotz', 'xj0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('efi_bank', 'Efí Bank', 'efi0.png', 1.00, 2.00, 'Brasil', 0, true),
  ('enjoei', 'Enjoei', 'arf0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('ero_me', 'Ero Me', 'cau0.png', 1.00, 2.00, 'Brasil', 0, true),
  ('etoro', 'eToro', 'apb0.png', 0.65, 1.30, 'Brasil', 0, true),
  ('facebook', 'Facebook', 'fb0.png', 0.80, 1.60, 'Brasil', 0, true),
  ('facily', 'Facily', 'alc0.png', 0.70, 1.40, 'Brasil', 0, true),
  ('familhao', 'Familhao', 'asl0.png', 0.40, 0.80, 'Brasil', 0, true),
  ('fastearn', 'FastEarn', 'any0.png', 0.60, 1.20, 'Brasil', 0, true),
  ('firebase', 'Firebase', 'aim0.png', 0.70, 1.40, 'Brasil', 0, true),
  ('gappx', 'Gappx', 'arg0.png', 0.61, 1.22, 'Brasil', 0, true),
  ('getninjas', 'GetNinjas', 'aiu0.png', 0.65, 1.30, 'Brasil', 0, true),
  ('google', 'Google', 'go0.png', 1.00, 2.00, 'Brasil', 0, true),
  ('google_chat', 'Google Chat', 'ccu0.png', 1.00, 2.00, 'Brasil', 0, true),
  ('googlemessenger', 'GoogleMessenger', 'gmsg0.png', 1.00, 2.00, 'Brasil', 0, true),
  ('googlevoice', 'GoogleVoice', 'gf0.png', 1.00, 2.00, 'Brasil', 0, true),
  ('govbr', 'GovBr', 'afe0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('grindr', 'Grindr', 'yw0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('guiche_web', 'Guiche Web', 'alb0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('gurubets', 'GuruBets', 'ik0.png', 0.25, 0.50, 'Brasil', 0, true),
  ('icq', 'icq', 'iq0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('ifood', 'IFood', 'pd0.png', 0.65, 1.30, 'Brasil', 0, true),
  ('infinitepay', 'InfinitePay', 'anx0.png', 0.64, 1.28, 'Brasil', 0, true),
  ('instagram', 'Instagram', 'ig0.png', 0.64, 1.28, 'Brasil', 0, true),
  ('itau', 'Itau', 'btn0.png', 0.60, 1.20, 'Brasil', 0, true),
  ('iti', 'Iti', 'ad0.png', 0.40, 0.80, 'Brasil', 0, true),
  ('kakaotalk', 'KakaoTalk', 'kt0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('kwai', 'Kwai', 'vp0.png', 0.55, 1.10, 'Brasil', 0, true),
  ('lalamove', 'Lalamove', 'fh0.png', 0.55, 1.10, 'Brasil', 0, true),
  ('line_msg', 'Line msg', 'me0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('luup', 'LUUP', 'beh0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('magalu', 'MagaLu', 'afq0.png', 0.65, 1.30, 'Brasil', 0, true),
  ('mamba', 'Mamba', 'fd0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('manus', 'Manus', 'bwv0.png', 1.00, 2.00, 'Brasil', 0, true),
  ('meliuz', 'Meliuz', 'uy0.png', 0.10, 0.20, 'Brasil', 0, true),
  ('mercado', 'Mercado', 'cq0.png', 1.30, 2.60, 'Brasil', 0, true),
  ('meseems', 'MeSeems', 'amv0.png', 1.00, 2.00, 'Brasil', 0, true),
  ('monzo', 'Monzo', 'aom0.png', 0.60, 1.20, 'Brasil', 0, true),
  ('moonpay', 'MoonPay', 'bgj0.png', 1.00, 2.00, 'Brasil', 0, true),
  ('n_me_perturbe', 'Ñ Me Perturbe', 'axm0.png', 1.00, 2.00, 'Brasil', 0, true),
  ('natura_avon', 'Natura Avon', 'awg0.png', 1.00, 2.00, 'Brasil', 0, true),
  ('naver', 'Naver', 'nv0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('neon', 'Neon', 'aex0.png', 0.45, 0.90, 'Brasil', 0, true),
  ('netflix', 'Netflix', 'nf0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('next', 'Next', 'aey0.png', 0.45, 0.90, 'Brasil', 0, true),
  ('ngcash', 'NgCash', 'awh0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('nubank', 'Nubank', 'aaa0.png', 1.20, 2.40, 'Brasil', 0, true),
  ('ok_ru', 'Ok.ru', 'ok0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('okx', 'OKX', 'aor0.png', 0.70, 1.40, 'Brasil', 0, true),
  ('olx', 'OLX', 'sn0.png', 0.70, 1.40, 'Brasil', 0, true),
  ('openai', 'OpenAI', 'dr0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('outlier', 'Outlier', 'auz0.png', 0.80, 1.60, 'Brasil', 0, true),
  ('outros', 'outros', 'ot0.png', 1.00, 2.00, 'Brasil', 0, true),
  ('pagbank', 'PagBank', 'abg0.png', 0.40, 0.80, 'Brasil', 0, true),
  ('parimatch', 'Parimatch', 'abf0.png', 0.64, 1.28, 'Brasil', 0, true),
  ('paysera', 'Paysera', 'aol0.png', 0.80, 1.60, 'Brasil', 0, true),
  ('pedir_gas', 'Pedir Gás', 'bqh0.png', 0.60, 1.20, 'Brasil', 0, true),
  ('pgbonus', 'PGbonus', 'fx0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('picpay', 'Picpay', 'ev0.png', 1.00, 2.00, 'Brasil', 0, true),
  ('pof_com', 'pof.com', 'pf0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('premmia', 'Premmia', 'anw0.png', 0.65, 1.30, 'Brasil', 0, true),
  ('privalia', 'Privalia', 'afs0.png', 0.61, 1.22, 'Brasil', 0, true),
  ('protonmail', 'ProtonMail', 'dp0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('quero_q_pag', 'Quero-Q PAG', 'bxj0.png', 1.00, 2.00, 'Brasil', 0, true),
  ('radquest', 'Radquest', 'ayk0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('rappi', 'Rappi', 'aba0.png', 1.00, 2.00, 'Brasil', 0, true),
  ('reclameaqui', 'ReclameAQUI', 'aoz0.png', 0.63, 1.26, 'Brasil', 0, true),
  ('revolut', 'Revolut', 'ij0.png', 0.80, 1.60, 'Brasil', 0, true),
  ('ripio', 'Ripio', 'avp0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('santander', 'Santander', 'lj0.png', 0.70, 1.40, 'Brasil', 0, true),
  ('serasa', 'Serasa', 'abj0.png', 0.55, 1.10, 'Brasil', 0, true),
  ('shein', 'Shein', 'aez0.png', 1.00, 2.00, 'Brasil', 0, true),
  ('shellbox', 'ShellBox', 'vg0.png', 0.30, 0.60, 'Brasil', 0, true),
  ('shopee', 'Shopee', 'ka0.png', 0.80, 1.60, 'Brasil', 0, true),
  ('sicredi', 'sicredi', 'ana0.png', 1.00, 2.00, 'Brasil', 0, true),
  ('skrill', 'Skrill', 'aqt0.png', 0.70, 1.40, 'Brasil', 0, true),
  ('snapchat', 'Snapchat', 'fu0.png', 0.40, 0.80, 'Brasil', 0, true),
  ('soop', 'SOOP', 'bxz0.png', 1.00, 2.00, 'Brasil', 0, true),
  ('spaten', 'Spaten', 'ky0.png', 0.35, 0.70, 'Brasil', 0, true),
  ('telegram', 'Telegram', 'tg0.png', 4.00, 8.00, 'Brasil', 0, true),
  ('temu', 'Temu', 'ep0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('tencent_qq', 'Tencent QQ', 'qq0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('tick', 'Tick', 'rb0.png', 0.35, 0.70, 'Brasil', 0, true),
  ('ticketmaster', 'Ticketmaster', 'gp0.png', 1.00, 2.00, 'Brasil', 0, true),
  ('tiktok', 'TikTok', 'lf0.png', 0.60, 1.20, 'Brasil', 0, true),
  ('tinder', 'Tinder', 'oi0.png', 0.67, 1.34, 'Brasil', 0, true),
  ('totalpass', 'TotalPass', 'auc0.png', 0.30, 0.60, 'Brasil', 0, true),
  ('twitch', 'twitch', 'hb0.png', 0.40, 0.80, 'Brasil', 0, true),
  ('uber', 'Uber', 'ub0.png', 0.80, 1.60, 'Brasil', 0, true),
  ('ubisoft', 'Ubisoft', 'ahb0.png', 1.00, 2.00, 'Brasil', 0, true),
  ('ultragaz', 'Ultragaz', 'afr0.png', 0.64, 1.28, 'Brasil', 0, true),
  ('uol', 'Uol', 'abh0.png', 0.54, 1.08, 'Brasil', 0, true),
  ('valora', 'Valora', 'bdw0.png', 0.70, 1.40, 'Brasil', 0, true),
  ('viber', 'Viber', 'vi0.png', 0.10, 0.20, 'Brasil', 0, true),
  ('vk_com', 'vk.com', 'vk0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('voltz', 'Voltz', 'eb0.png', 0.30, 0.60, 'Brasil', 0, true),
  ('walmart', 'Walmart', 'wr0.png', 0.70, 1.40, 'Brasil', 0, true),
  ('webmotors', 'Webmotors', 'bfa0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('wechat', 'WeChat', 'wb0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('weststein', 'WestStein', 'th0.png', 0.70, 1.40, 'Brasil', 0, true),
  ('whatsapp', 'Whatsapp', 'wa0.png', 8.00, 16.00, 'Brasil', 0, true),
  ('will', 'Will', 'bsa0.png', 0.65, 1.30, 'Brasil', 0, true),
  ('winzo', 'Winzo', 'vs0.png', 0.65, 1.30, 'Brasil', 0, true),
  ('wirex', 'Wirex', 'baa0.png', 0.70, 1.40, 'Brasil', 0, true),
  ('wise', 'Wise', 'bo0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('xbox', 'Xbox', 'aml0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('xiaomi', 'Xiaomi', 'yu0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('yahoo', 'Yahoo', 'mb0.png', 0.12, 0.24, 'Brasil', 0, true),
  ('yalla', 'Yalla', 'yl0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('yandex', 'Yandex', 'ya0.png', 0.20, 0.40, 'Brasil', 0, true),
  ('yowin', 'YoWin', 'sm0.png', 0.50, 1.00, 'Brasil', 0, true),
  ('zedelivery', 'ZéDelivery', 'em0.png', 0.25, 0.50, 'Brasil', 0, true),
  ('zeenow', 'ZeeNow', 'btm0.png', 0.60, 1.20, 'Brasil', 0, true),
  ('zoho', 'Zoho', 'zh0.png', 0.50, 1.00, 'Brasil', 0, true)
on conflict (id) do update set
  icon_file = excluded.icon_file,
  cost_price = excluded.cost_price,
  sale_price = excluded.sale_price,
  name = excluded.name;

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

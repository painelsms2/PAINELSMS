-- Migration 17_cleanup_junk_services.sql
-- Desativa manualmente os serviços "lixo" criados pelo sync automático
-- (códigos de 2 a 5 letras maiúsculas, sem ícone configurado)

UPDATE public.services
SET active = false
WHERE name ~ '^[A-Z0-9_]{2,5}$'
  AND name = upper(name)
  AND (icon_file IS NULL OR trim(icon_file) = '');

-- 07_multi_provider.sql

-- Adiciona a coluna para selecionar o fornecedor ativo (padrão 'provider1')
ALTER TABLE public.services 
ADD COLUMN active_provider text NOT NULL DEFAULT 'provider1';

-- Adiciona a coluna para mapear o código do serviço no fornecedor 2 (numero-virtual.app)
-- Caso seja vazio, tentaremos usar o mesmo código do provider1
ALTER TABLE public.services 
ADD COLUMN provider2_service_code text;

-- (Opcional) Adiciona campos para cache de preço/estoque do fornecedor 2
ALTER TABLE public.services
ADD COLUMN provider2_stock integer DEFAULT 0,
ADD COLUMN provider2_price numeric(10,2) DEFAULT 0.00;

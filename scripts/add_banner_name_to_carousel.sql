-- Script para adicionar nome editável aos banners do carrossel Pós+
-- Execute no Supabase SQL Editor se a tabela já existe

ALTER TABLE public.post_plus_carousel_items
ADD COLUMN IF NOT EXISTS nome_banner TEXT;

UPDATE public.post_plus_carousel_items
SET nome_banner = CONCAT('Banner Pós+ #', ordem)
WHERE nome_banner IS NULL OR TRIM(nome_banner) = '';

ALTER TABLE public.post_plus_carousel_items
ALTER COLUMN nome_banner SET NOT NULL;

COMMENT ON COLUMN public.post_plus_carousel_items.nome_banner IS 'Nome editável do banner para gestão e analytics';

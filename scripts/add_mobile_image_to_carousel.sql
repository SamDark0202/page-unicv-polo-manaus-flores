-- Script para adicionar suporte a imagens mobile no carrossel Pós+
-- Execute este script no Supabase SQL Editor se a tabela já existe

-- Adiciona coluna de imagem mobile (1080x1080)
ALTER TABLE public.post_plus_carousel_items 
ADD COLUMN IF NOT EXISTS imagem_mobile_url TEXT;

-- Atualiza registros existentes para usar a mesma imagem em ambos os formatos temporariamente
UPDATE public.post_plus_carousel_items 
SET imagem_mobile_url = imagem_url 
WHERE imagem_mobile_url IS NULL;

-- Torna a coluna obrigatória após preencher os valores
ALTER TABLE public.post_plus_carousel_items 
ALTER COLUMN imagem_mobile_url SET NOT NULL;

-- Comentário sobre a coluna
COMMENT ON COLUMN public.post_plus_carousel_items.imagem_mobile_url IS 'URL da imagem otimizada para mobile (proporção 1080x1080)';

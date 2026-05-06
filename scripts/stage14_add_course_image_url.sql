-- Adiciona campo opcional de imagem para cursos (usado em cards e página de detalhes)
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS imagem_url TEXT;

-- Limpa valores vazios para manter padrão null quando não houver imagem
UPDATE public.courses
SET imagem_url = NULL
WHERE imagem_url IS NOT NULL
  AND btrim(imagem_url) = '';

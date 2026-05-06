-- Adiciona slug unico para permitir paginas individuais por curso (SEO)
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Preenche slug para registros existentes
UPDATE public.courses
SET slug = lower(regexp_replace(nome_curso, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR btrim(slug) = '';

-- Remove hifens duplicados e extremidades
UPDATE public.courses
SET slug = trim(both '-' FROM regexp_replace(slug, '-{2,}', '-', 'g'))
WHERE slug IS NOT NULL;

-- Resolve duplicidades de slug acrescentando sufixo incremental
WITH ranked AS (
  SELECT
    id,
    slug,
    row_number() OVER (PARTITION BY slug ORDER BY created_at, id) AS rn
  FROM public.courses
)
UPDATE public.courses c
SET slug = CASE
  WHEN r.rn = 1 THEN r.slug
  ELSE r.slug || '-' || r.rn::text
END
FROM ranked r
WHERE c.id = r.id
  AND r.slug IS NOT NULL;

-- Garante formato valido e preenchimento
ALTER TABLE public.courses
  ALTER COLUMN slug SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'courses_slug_format_chk'
  ) THEN
    ALTER TABLE public.courses
      ADD CONSTRAINT courses_slug_format_chk
      CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
  END IF;
END$$;

-- Indices/constraints de unicidade
CREATE UNIQUE INDEX IF NOT EXISTS courses_slug_unique_idx ON public.courses (slug);

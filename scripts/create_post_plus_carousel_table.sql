CREATE TABLE IF NOT EXISTS public.post_plus_carousel_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_banner TEXT NOT NULL,
  imagem_url TEXT NOT NULL,
  imagem_mobile_url TEXT NOT NULL,
  meta_descricao TEXT NOT NULL,
  link_url TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS post_plus_carousel_ordem_idx ON public.post_plus_carousel_items (ordem);
CREATE INDEX IF NOT EXISTS post_plus_carousel_ativo_idx ON public.post_plus_carousel_items (ativo);

CREATE OR REPLACE FUNCTION public.set_post_plus_carousel_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_post_plus_carousel_updated_at ON public.post_plus_carousel_items;
CREATE TRIGGER set_post_plus_carousel_updated_at
BEFORE UPDATE ON public.post_plus_carousel_items
FOR EACH ROW
EXECUTE PROCEDURE public.set_post_plus_carousel_updated_at();

ALTER TABLE public.post_plus_carousel_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active post plus carousel" ON public.post_plus_carousel_items;
CREATE POLICY "Public read active post plus carousel"
  ON public.post_plus_carousel_items
  FOR SELECT
  USING (ativo = TRUE);

DROP POLICY IF EXISTS "Authenticated manage post plus carousel" ON public.post_plus_carousel_items;
CREATE POLICY "Authenticated manage post plus carousel"
  ON public.post_plus_carousel_items
  FOR ALL
  TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

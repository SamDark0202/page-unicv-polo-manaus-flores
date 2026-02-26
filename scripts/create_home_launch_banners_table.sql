CREATE TABLE IF NOT EXISTS public.home_launch_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_banner TEXT NOT NULL,
  imagem_url TEXT NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS home_launch_banners_ordem_idx ON public.home_launch_banners (ordem);
CREATE INDEX IF NOT EXISTS home_launch_banners_ativo_idx ON public.home_launch_banners (ativo);
CREATE INDEX IF NOT EXISTS home_launch_banners_course_idx ON public.home_launch_banners (course_id);

CREATE OR REPLACE FUNCTION public.set_home_launch_banners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_home_launch_banners_updated_at ON public.home_launch_banners;
CREATE TRIGGER set_home_launch_banners_updated_at
BEFORE UPDATE ON public.home_launch_banners
FOR EACH ROW
EXECUTE PROCEDURE public.set_home_launch_banners_updated_at();

ALTER TABLE public.home_launch_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active home launch banners" ON public.home_launch_banners;
CREATE POLICY "Public read active home launch banners"
  ON public.home_launch_banners
  FOR SELECT
  USING (ativo = TRUE);

DROP POLICY IF EXISTS "Authenticated manage home launch banners" ON public.home_launch_banners;
CREATE POLICY "Authenticated manage home launch banners"
  ON public.home_launch_banners
  FOR ALL
  TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

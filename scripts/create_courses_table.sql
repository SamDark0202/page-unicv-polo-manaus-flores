-- Criação do tipo enumerado para modalidade
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'course_modality'
  ) THEN
    CREATE TYPE public.course_modality AS ENUM ('bacharelado', 'licenciatura', 'tecnologo');
  END IF;
END$$;

-- Tabela principal
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modalidade public.course_modality NOT NULL,
  nome_curso TEXT NOT NULL,
  duracao TEXT NOT NULL,
  texto_preview TEXT NOT NULL,
  sobre_curso TEXT NOT NULL,
  mercado_trabalho TEXT NOT NULL,
  matriz_curricular JSONB NOT NULL DEFAULT '[]'::jsonb,
  requisitos TEXT NOT NULL DEFAULT '',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT courses_modality_name_unique UNIQUE (modalidade, nome_curso),
  CONSTRAINT courses_curriculum_is_array CHECK (jsonb_typeof(matriz_curricular) = 'array')
);

-- Índices auxiliares
CREATE INDEX IF NOT EXISTS courses_modalidade_idx ON public.courses (modalidade);
CREATE INDEX IF NOT EXISTS courses_ativo_idx ON public.courses (ativo);
CREATE INDEX IF NOT EXISTS courses_modalidade_ativo_idx ON public.courses (modalidade, ativo);

-- Trigger para manter updated_at sincronizado
CREATE OR REPLACE FUNCTION public.set_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_courses_updated_at ON public.courses;
CREATE TRIGGER set_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE PROCEDURE public.set_courses_updated_at();

-- Row Level Security
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Seleção pública apenas para cursos ativos
DROP POLICY IF EXISTS "Public read active courses" ON public.courses;
CREATE POLICY "Public read active courses"
  ON public.courses
  FOR SELECT
  USING (ativo = TRUE);

-- Acesso completo para usuários autenticados (painel)
DROP POLICY IF EXISTS "Authenticated manage courses" ON public.courses;
CREATE POLICY "Authenticated manage courses"
  ON public.courses
  FOR ALL
  TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

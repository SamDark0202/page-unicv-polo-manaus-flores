-- ============================================================
-- Tabela: leads_vocacional
-- Captura leads do Teste Vocacional Conversacional
-- ============================================================

CREATE TABLE IF NOT EXISTS public.leads_vocacional (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  nome        TEXT        NOT NULL,
  telefone    TEXT        NOT NULL,
  email       TEXT        NOT NULL,
  origem      TEXT        DEFAULT 'teste_vocacional',
  status      TEXT        DEFAULT 'novo',
  perfil      TEXT,
  top_areas   TEXT[],
  top_cursos  TEXT[],
  score_json  JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.leads_vocacional ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_vocacional NO FORCE ROW LEVEL SECURITY;

-- Grants (necessários além das policies RLS)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT ON TABLE public.leads_vocacional TO anon, authenticated;
GRANT UPDATE ON TABLE public.leads_vocacional TO authenticated;

-- Permite inserção pública (qualquer visitante pode enviar o lead)
DROP POLICY IF EXISTS "leads_vocacional_public_insert" ON public.leads_vocacional;
CREATE POLICY "leads_vocacional_public_insert"
  ON public.leads_vocacional
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Permite update apenas para usuários autenticados (para atualizar perfil/resultado)
DROP POLICY IF EXISTS "leads_vocacional_auth_update" ON public.leads_vocacional;
CREATE POLICY "leads_vocacional_auth_update"
  ON public.leads_vocacional
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Index para busca por email/telefone no painel admin
CREATE INDEX IF NOT EXISTS leads_vocacional_email_idx   ON public.leads_vocacional (email);
CREATE INDEX IF NOT EXISTS leads_vocacional_created_idx ON public.leads_vocacional (created_at DESC);

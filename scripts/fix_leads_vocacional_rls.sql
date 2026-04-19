-- ============================================================
-- HOTFIX RLS: leads_vocacional
-- Resolve erro: new row violates row-level security policy
-- Execute este script no Supabase SQL Editor
-- ============================================================

BEGIN;

-- Garantir que a tabela existe no schema esperado
DO $$
BEGIN
  IF to_regclass('public.leads_vocacional') IS NULL THEN
    RAISE EXCEPTION 'Tabela public.leads_vocacional nao existe. Rode primeiro create_leads_vocacional_table.sql';
  END IF;
END $$;

-- RLS ativo, sem FORCE
ALTER TABLE public.leads_vocacional ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_vocacional NO FORCE ROW LEVEL SECURITY;

-- Grants obrigatorios para operacao via API
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT ON TABLE public.leads_vocacional TO anon, authenticated;
GRANT UPDATE ON TABLE public.leads_vocacional TO authenticated;

-- Recria policies de forma idempotente
DROP POLICY IF EXISTS "leads_vocacional_public_insert" ON public.leads_vocacional;
CREATE POLICY "leads_vocacional_public_insert"
  ON public.leads_vocacional
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "leads_vocacional_auth_update" ON public.leads_vocacional;
CREATE POLICY "leads_vocacional_auth_update"
  ON public.leads_vocacional
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMIT;

-- Verificacao rapida (opcional)
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'leads_vocacional'
ORDER BY policyname;

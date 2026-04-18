-- ===========================================================================
-- Fix crítico: recursão infinita em RLS que quebra todo o Painel do Parceiro
-- ===========================================================================
--
-- PROBLEMA:
--   internal_actor_role() consulta internal_users.
--   A tabela internal_users tem RLS com policy que chama internal_actor_role().
--   → Recursão infinita → PostgreSQL lança erro em QUALQUER query que
--     use essas funções como policy (parceiros, indicacoes, comissoes).
--   → Parceiro autenticado não consegue carregar perfil, indicações ou comissões.
--
-- SOLUÇÃO:
--   Marcar internal_actor_role(), can_manage_partners() e can_edit_crm()
--   como SECURITY DEFINER + set search_path = public.
--   Funções SECURITY DEFINER rodam com o papel do owner (postgres/superuser),
--   que tem BYPASSRLS — quebrando a recursão de forma segura.
--
-- Seguro para executar múltiplas vezes (idempotente).
-- ===========================================================================

-- 1. internal_actor_role: precisa SECURITY DEFINER para consultar
--    internal_users sem acionar as RLS policies dessa tabela.
create or replace function public.internal_actor_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select iu.role
  from public.internal_users iu
  where iu.auth_user_id = auth.uid()
    and iu.status = 'ativo'
  limit 1;
$$;

-- 2. can_manage_partners: chama internal_actor_role → herdaria o problema;
--    SECURITY DEFINER para consistência e performance.
create or replace function public.can_manage_partners()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.internal_actor_role() = 'administrador';
$$;

-- 3. can_edit_crm: mesma razão.
create or replace function public.can_edit_crm()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.internal_actor_role() in ('administrador', 'vendedor');
$$;

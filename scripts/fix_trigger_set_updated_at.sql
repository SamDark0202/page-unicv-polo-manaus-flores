-- Fix: separa as funções de trigger para as tabelas que usam colunas diferentes
-- Problema: stage12 sobrescreveu set_updated_at() para usar new.updated_at,
--           mas indicacoes usa new.atualizado_em — causando falha em todo UPDATE de leads.
-- Seguro para executar mais de uma vez.

-- 1. Cria função específica para indicacoes (coluna atualizado_em)
create or replace function public.set_indicacoes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

-- 2. Atualiza o trigger de indicacoes para usar a função correta
drop trigger if exists indicacoes_set_updated_at on public.indicacoes;
create trigger indicacoes_set_updated_at
before update on public.indicacoes
for each row
execute function public.set_indicacoes_updated_at();

-- 3. Garante que set_updated_at() (usada em internal_users) permanece com updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 4. Confirma que o trigger de internal_users ainda aponta para set_updated_at
drop trigger if exists trg_internal_users_set_updated_at on public.internal_users;
create trigger trg_internal_users_set_updated_at
before update on public.internal_users
for each row execute function public.set_updated_at();

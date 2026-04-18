-- Stage 12 - RBAC interno, auditoria e RLS base

create extension if not exists pgcrypto;

create table if not exists public.internal_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  email text not null unique,
  nome text not null,
  role text not null check (role in ('redator', 'analista', 'vendedor', 'administrador')),
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_internal_users_email on public.internal_users (lower(email));
create index if not exists idx_internal_users_auth_user_id on public.internal_users (auth_user_id);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  actor_email text,
  actor_nome text,
  actor_role text,
  action text not null,
  table_name text not null,
  record_id text,
  ip_address text,
  changes jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at desc);
create index if not exists idx_audit_logs_actor_user_id on public.audit_logs (actor_user_id);
create index if not exists idx_audit_logs_table_name on public.audit_logs (table_name);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_internal_users_set_updated_at on public.internal_users;
create trigger trg_internal_users_set_updated_at
before update on public.internal_users
for each row execute function public.set_updated_at();

create or replace function public.internal_actor_role()
returns text
language sql
stable
as $$
  select iu.role
  from public.internal_users iu
  where iu.auth_user_id = auth.uid()
    and iu.status = 'ativo'
  limit 1;
$$;

create or replace function public.can_manage_partners()
returns boolean
language sql
stable
as $$
  select public.internal_actor_role() = 'administrador';
$$;

create or replace function public.can_edit_crm()
returns boolean
language sql
stable
as $$
  select public.internal_actor_role() in ('administrador', 'vendedor');
$$;

alter table public.internal_users enable row level security;
alter table public.audit_logs enable row level security;

-- Internal users: apenas administradores ativos podem gerenciar.
drop policy if exists internal_users_select_admin on public.internal_users;
create policy internal_users_select_admin on public.internal_users
for select
using (public.internal_actor_role() = 'administrador');

drop policy if exists internal_users_write_admin on public.internal_users;
create policy internal_users_write_admin on public.internal_users
for all
using (public.internal_actor_role() = 'administrador')
with check (public.internal_actor_role() = 'administrador');

-- Audit logs: somente administradores podem consultar.
drop policy if exists audit_logs_select_admin on public.audit_logs;
create policy audit_logs_select_admin on public.audit_logs
for select
using (public.internal_actor_role() = 'administrador');

-- Regras de segurança para tabelas críticas (para operações não-service-role).
alter table public.parceiros enable row level security;
alter table public.indicacoes enable row level security;
alter table public.comissoes enable row level security;

-- Parceiros: leitura para analista/vendedor/administrador, escrita só administrador.
drop policy if exists parceiros_read_internal on public.parceiros;
create policy parceiros_read_internal on public.parceiros
for select
using (public.internal_actor_role() in ('analista', 'vendedor', 'administrador'));

drop policy if exists parceiros_write_admin on public.parceiros;
create policy parceiros_write_admin on public.parceiros
for all
using (public.can_manage_partners())
with check (public.can_manage_partners());

-- Indicações: leitura para analista/vendedor/administrador.
drop policy if exists indicacoes_read_internal on public.indicacoes;
create policy indicacoes_read_internal on public.indicacoes
for select
using (public.internal_actor_role() in ('analista', 'vendedor', 'administrador'));

-- Indicações: update para administrador/vendedor; delete só administrador.
drop policy if exists indicacoes_update_operational on public.indicacoes;
create policy indicacoes_update_operational on public.indicacoes
for update
using (public.can_edit_crm())
with check (public.can_edit_crm());

drop policy if exists indicacoes_insert_operational on public.indicacoes;
create policy indicacoes_insert_operational on public.indicacoes
for insert
with check (public.can_edit_crm());

drop policy if exists indicacoes_delete_admin on public.indicacoes;
create policy indicacoes_delete_admin on public.indicacoes
for delete
using (public.can_manage_partners());

-- Comissões: leitura para analista/vendedor/administrador, escrita só administrador.
drop policy if exists comissoes_read_internal on public.comissoes;
create policy comissoes_read_internal on public.comissoes
for select
using (public.internal_actor_role() in ('analista', 'vendedor', 'administrador'));

drop policy if exists comissoes_write_admin on public.comissoes;
create policy comissoes_write_admin on public.comissoes
for all
using (public.can_manage_partners())
with check (public.can_manage_partners());

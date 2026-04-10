-- Etapa 1: Estrutura base do Painel de Indicacao e Parcerias
-- Executar no Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.parceiros (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  nome text not null,
  email text not null unique,
  tipo text not null check (tipo in ('institucional', 'indicador')),
  chave_pix text,
  link_personalizado text unique,
  data_criacao timestamptz not null default now()
);

create index if not exists parceiros_tipo_idx on public.parceiros (tipo);
create index if not exists parceiros_data_criacao_idx on public.parceiros (data_criacao desc);

create table if not exists public.indicacoes (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros (id) on delete cascade,
  nome text not null,
  telefone text not null,
  email text,
  observacao text,
  status text not null default 'novo' check (status in ('novo', 'em_negociacao', 'convertido', 'nao_convertido')),
  origem_link text,
  data_criacao timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists indicacoes_parceiro_id_idx on public.indicacoes (parceiro_id);
create index if not exists indicacoes_status_idx on public.indicacoes (status);
create index if not exists indicacoes_data_criacao_idx on public.indicacoes (data_criacao desc);

create table if not exists public.comissoes (
  id uuid primary key default gen_random_uuid(),
  parceiro_id uuid not null references public.parceiros (id) on delete cascade,
  indicacao_id uuid references public.indicacoes (id) on delete set null,
  referencia_mes date not null,
  valor numeric(12, 2) not null check (valor >= 0),
  status_pagamento text not null default 'pendente' check (status_pagamento in ('pendente', 'pago')),
  pago_em timestamptz,
  data_criacao timestamptz not null default now()
);

create index if not exists comissoes_parceiro_id_idx on public.comissoes (parceiro_id);
create index if not exists comissoes_referencia_mes_idx on public.comissoes (referencia_mes desc);
create index if not exists comissoes_status_pagamento_idx on public.comissoes (status_pagamento);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists indicacoes_set_updated_at on public.indicacoes;
create trigger indicacoes_set_updated_at
before update on public.indicacoes
for each row
execute function public.set_updated_at();

alter table public.parceiros enable row level security;
alter table public.indicacoes enable row level security;
alter table public.comissoes enable row level security;

drop policy if exists parceiros_select_own on public.parceiros;
create policy parceiros_select_own
on public.parceiros
for select
to authenticated
using (auth_user_id = auth.uid());

drop policy if exists indicacoes_select_own on public.indicacoes;
create policy indicacoes_select_own
on public.indicacoes
for select
to authenticated
using (
  exists (
    select 1
    from public.parceiros p
    where p.id = indicacoes.parceiro_id
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists indicacoes_insert_own on public.indicacoes;
create policy indicacoes_insert_own
on public.indicacoes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.parceiros p
    where p.id = indicacoes.parceiro_id
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists comissoes_select_own on public.comissoes;
create policy comissoes_select_own
on public.comissoes
for select
to authenticated
using (
  exists (
    select 1
    from public.parceiros p
    where p.id = comissoes.parceiro_id
      and p.auth_user_id = auth.uid()
  )
);
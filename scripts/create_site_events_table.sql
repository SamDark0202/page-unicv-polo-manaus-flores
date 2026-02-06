-- ==========================================================
--  Tabela de eventos para analytics interno do painel UniCV
-- ==========================================================

create table if not exists site_events (
  id            bigint generated always as identity primary key,
  event_type    text not null,          -- 'page_view' | 'card_click' | 'form_submit' | 'session_end'
  page_path     text,                   -- ex: '/bacharelado'
  referrer      text,
  metadata      jsonb default '{}',     -- dados extras (card_name, form_name, session_duration_ms, etc.)
  visitor_id    text,                   -- hash anônimo do visitante (fingerprint leve)
  session_id    text,                   -- identificador da sessão
  user_agent    text,
  created_at    timestamptz default now()
);

-- Índices para consultas rápidas no dashboard
create index if not exists idx_site_events_type      on site_events (event_type);
create index if not exists idx_site_events_created_at on site_events (created_at);
create index if not exists idx_site_events_page       on site_events (page_path);
create index if not exists idx_site_events_session     on site_events (session_id);

-- RLS: qualquer visitante pode inserir eventos, apenas admins leem
alter table site_events enable row level security;

-- Política de inserção pública (anon key)
create policy "allow_insert_events"
  on site_events for insert
  to anon, authenticated
  with check (true);

-- Política de leitura apenas para usuários autenticados
create policy "allow_read_events_authenticated"
  on site_events for select
  to authenticated
  using (true);

-- Etapa 11: alinhamento do schema de comissões e CRM para o fluxo atual
-- Seguro para executar mais de uma vez no Supabase SQL Editor

alter table public.indicacoes
  add column if not exists curso_interesse text,
  add column if not exists data_conversao timestamptz,
  add column if not exists valor_matricula numeric(12, 2),
  add column if not exists forma_pagamento text;

alter table public.comissoes
  add column if not exists descricao text;

comment on column public.indicacoes.curso_interesse is 'Curso escolhido/interesse final na conversão do lead';
comment on column public.indicacoes.data_conversao is 'Data/hora em que o lead foi convertido';
comment on column public.indicacoes.valor_matricula is 'Valor financeiro usado operacionalmente como valor da comissão';
comment on column public.indicacoes.forma_pagamento is 'Campo legado mantido apenas por compatibilidade';
comment on column public.comissoes.descricao is 'Descrição opcional de apoio para lançamentos de comissão';
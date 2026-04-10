-- Etapa 10: campos extras para mini CRM de indicações
-- Execute no Supabase SQL Editor antes de usar a Etapa 10 em produção

alter table public.indicacoes
  add column if not exists curso_interesse text,
  add column if not exists data_conversao timestamptz,
  add column if not exists valor_matricula numeric(12, 2),
  add column if not exists forma_pagamento text;

comment on column public.indicacoes.curso_interesse is 'Curso escolhido/interesse final na conversão do lead';
comment on column public.indicacoes.data_conversao is 'Data/hora em que o lead foi convertido';
comment on column public.indicacoes.valor_matricula is 'Valor financeiro associado a conversão';
comment on column public.indicacoes.forma_pagamento is 'Forma de pagamento registrada na conversão';

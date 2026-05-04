# Guia Operacional para IA (Projeto Uniive Flores)

Objetivo: este arquivo define como a IA deve atuar ao fazer adicoes, manutencao e novas integracoes de API neste projeto.

## 1) Visao geral da arquitetura

- Frontend: Vite + React + TypeScript.
- Hospedagem frontend: Vercel.
- APIs principais: Cloudflare Workers (worker API-only).
- Reescrita de API em producao: Vercel reescreve `/api/*` para dominio da API no Cloudflare.
- Banco e auth: Supabase.

## 2) Regra de ouro para APIs

Sempre manter o padrao de chamada no frontend como rota relativa:

- Usar `/api/...` no frontenpd.
- Nao chamar dominio externo direto no browser ara evitar CORS.
- Encaminhamento de ambiente deve ser tratado por proxy/rewrite, nao por URL hardcoded em componentes.

## 3) Fluxo por ambiente

### Desenvolvimento local

- Servidor local: `npm run dev`.
- Proxy remoto opcional por variavel:
  - `VITE_DEV_API_PROXY_TARGET=https://api.unicivepoloam.com.br`
- Se esta variavel estiver definida, `/api/*` local deve ser encaminhado para a API remota.
- Para rotas sensiveis a CORS (como cursos), preferir middleware local quando necessario.

### Producao

- Frontend publica na Vercel.
- `vercel.json` deve manter rewrite de `/api/(.*)` para o dominio canonico da API.
- Worker Cloudflare deve responder somente rotas `/api/*`.

## 4) Regras de roteamento Cloudflare

- Nunca usar rota global `*.unicivepoloam.com.br/*` para o worker de API.
- Usar subdominio dedicado de API:
  - `api.unicivepoloam.com.br/*`
- O dominio principal `www.unicivepoloam.com.br` deve continuar servido pela Vercel.

## 5) Padrao para adicionar nova API

Ao criar endpoint novo, seguir esta sequencia:

1. Criar handler em `api/novo-endpoint.js` reaproveitando os cores quando houver.
2. Registrar rota no worker em `worker/index.mjs` (mapa de loaders e roteamento `/api/*`).
3. Garantir metodos HTTP permitidos e respostas JSON consistentes.
4. Tratar erros com status correto (400, 401, 403, 404, 500, 502).
5. Atualizar documentacao tecnica relevante em `.md`.
6. Validar local e remoto antes de merge.

## 6) Variaveis de ambiente e deploy

- Deploy de Worker deve preservar variaveis:
  - usar `npm run cf:deploy` (wrangler deploy com `--keep-vars`).
- Segredos e vars de texto devem ser revisados antes de deploy.
- Nunca commitar segredo real em arquivo versionado.

## 7) Auth, permissao e dados sensiveis

- Painel admin deve usar cliente autenticado de admin quando a policy exigir auth.
- Nao usar cliente anon para leituras administrativas.
- Para analytics:
  - insercao publica pode usar anon (tracker).
  - leitura do dashboard admin deve usar sessao admin autenticada.

## 8) Checklist obrigatorio antes de concluir mudanca

1. Build local sem erro (`npm run build`).
2. Endpoint novo testado localmente (`/api/...`).
3. Endpoint novo testado no Worker remoto.
4. Confirmar que nao existe CORS por chamada direta do browser para dominio externo.
5. Confirmar que `vercel.json` continua correto para `/api/*`.
6. Confirmar que dominio principal do site abre normalmente.
7. Confirmar que nao houve regressao em auth admin/parceiro.

## 9) Politica de mudanca segura

- Fazer mudancas minimas e focadas.
- Nao alterar comportamento de producao sem necessidade.
- Evitar refatoracao ampla no mesmo commit de bugfix.
- Quando houver duvida de infra (DNS/roteamento), validar primeiro com teste de endpoint.

## 10) Convencao de commit recomendada

- `fix(api): corrige roteamento e CORS de endpoint X`
- `feat(api): adiciona endpoint Y no worker`
- `chore(vercel): ajusta rewrite de /api para dominio canonico`
- `docs: atualiza guia de arquitetura e deploy de API`

## 11) Fontes de verdade neste projeto

- Roteamento de producao: `vercel.json`.
- Configuracao do worker: `wrangler.toml`.
- Adaptador de API no worker: `worker/index.mjs`.
- Endpoints serverless/handlers: pasta `api/`.
- Migracao e operacao Cloudflare: `CLOUDFLARE_WORKERS_MIGRATION.md`.

---

Se uma mudanca violar qualquer item acima, a IA deve pausar e corrigir o plano antes de implementar.

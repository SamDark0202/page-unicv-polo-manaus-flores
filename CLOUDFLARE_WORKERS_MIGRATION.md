# Migracao para Cloudflare Workers (manual)

Este guia migra apenas as APIs para Cloudflare Workers.
O frontend continua na Vercel.

## 1) Pre-requisitos

- Conta Cloudflare ativa (voce ja tem)
- Node 18+
- Projeto com dependencias instaladas (`npm install`)

## 2) O que foi preparado no projeto

- `worker/index.mjs`: roteador para `/api/*` (API-only)
- `wrangler.toml`: configuracao de deploy no Workers

Observacao: este Worker nao serve arquivos estaticos e nao entrega frontend.

## 3) Variaveis de ambiente obrigatorias no Worker

Configure no Cloudflare (Workers & Pages > seu Worker > Settings > Variables and Secrets):

### Secrets

- `SUPABASE_SERVICE_ROLE_KEY`
- `IMAGEKIT_PRIVATE_KEY`
- `UPLOAD_API_SECRET` (se voce usa)

### Plain text variables

- `SUPABASE_URL`
- `VITE_SUPABASE_URL`
- `ADMIN_ALLOWED_EMAILS`
- `MAKE_WEBHOOK_URL`
- `MAKE_INDICATION_WEBHOOK_URL`
- `MAKE_PARTNERSHIP_WEBHOOK_URL`
- `ALLOWED_ORIGIN`
- `ADMIN_PASSWORD_SETUP_REDIRECT_URL`
- `PARTNER_PASSWORD_SETUP_REDIRECT_URL`
- `PARTNER_PANEL_REDIRECT_URL`

Observacao: mantenha os mesmos valores usados na Vercel para evitar regressao.

## 4) Login Cloudflare via terminal

Na raiz do projeto:

```bash
npx wrangler login
```

## 5) Build local

Nao precisa build do frontend para subir a API.

## 6) Deploy do Worker

```bash
npx wrangler deploy
```

Ao final, o Wrangler mostrara a URL `*.workers.dev`.

Importante: para nao apagar variaveis de texto configuradas no painel da Cloudflare, use deploy com `--keep-vars`.

## 7) Conectar frontend Vercel na API Cloudflare

Voce tem duas formas.

### Opcao A (recomendada): custom domain da API

1. No Cloudflare Workers, adicione dominio customizado, por exemplo `api.unicvflores.com.br`
2. No frontend (Vercel), mantenha chamadas para `/api/*` e configure rewrite na Vercel para encaminhar para `https://api.unicvflores.com.br/api/*`
3. Assim o frontend continua igual, sem alterar as chamadas do React

### Opcao B: chamar dominio Cloudflare direto

1. Alterar frontend para chamar URL completa `https://<seu-worker>.workers.dev/api/*`
2. Exige CORS mais rigoroso nos endpoints
3. Geralmente da mais retrabalho

## 8) Testes rapidos pos-deploy

Teste os endpoints criticos:

- `GET /api/admin-session`
- `GET /api/cursos?tipo=tecnicos`
- `POST /api/webhooks?tipo=lead`
- `POST /api/partner-public-lead`
- `POST /api/imagekit-upload`

## 9) Dominio customizado

No painel Cloudflare:

1. Workers & Pages > seu Worker
2. Settings > Domains & Routes
3. Add custom domain da API (ex.: `api.unicvflores.com.br`)
4. Validar DNS proxied (nuvem laranja)

## 10) Ajuste final na Vercel (sem tirar frontend)

Somente apos validacao da API no Cloudflare:

1. Configure rewrite de `/api/:path*` para a URL da API no Cloudflare
2. Monitore erros por 24h
3. Mantenha deploy normal do frontend na Vercel

## 11) Rollback rapido (se precisar)

- Remova o rewrite da Vercel para Cloudflare API
- Volte as APIs para Vercel temporariamente
- Corrija e publique novamente no Cloudflare

## Notas importantes

- Plano Free do Workers tem limite de 100.000 requests por dia por conta.
- Se ultrapassar, considere Workers Paid.
- O Worker atual usa compatibilidade Node (`nodejs_compat`) para manter os handlers atuais funcionando com menor retrabalho.

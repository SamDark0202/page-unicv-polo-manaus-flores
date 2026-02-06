# UniCV Flores Website

Site institucional do Centro Universitário UniCV - Polo Flores.

## Tecnologias Utilizadas

Este projeto foi construído com:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Como executar localmente

Requisitos:
- Node.js 16+ 
- npm ou yarn

Passos para execução:

```bash
# 1. Instalar dependências
npm install
# ou
yarn install

# 2. Iniciar servidor de desenvolvimento
npm run dev
# ou
yarn dev
```

## Supabase

As páginas públicas (cursos) e o painel administrativo dependem de um projeto Supabase configurado com as variáveis abaixo no arquivo `.env.local`:

```
VITE_SUPABASE_URL=<url-do-projeto>
VITE_SUPABASE_ANON_KEY=<chave-anon>
SUPABASE_SERVICE_ROLE_KEY=<chave-service-role> # usado apenas em scripts locais
```

### Estrutura da tabela `courses`

| coluna             | tipo                   | observação                                        |
|--------------------|------------------------|---------------------------------------------------|
| `id`               | uuid (pk)              | gerado automaticamente                             |
| `modalidade`       | text                   | `bacharelado`, `licenciatura` ou `tecnologo`       |
| `nome_curso`       | text                   | nome exibido nas páginas                           |
| `duracao`          | text                   | ex.: `3 anos`                                      |
| `texto_preview`    | text                   | resumo curto (cards e introdução)                  |
| `sobre_curso`      | text                   | descrição completa para o modal de detalhes        |
| `mercado_trabalho` | text                   | áreas de atuação                                   |
| `matriz_curricular`| jsonb                  | array de objetos `{ title, items: string[] }`      |
| `requisitos`       | text                   | pré-requisitos / observações                       |
| `ativo`            | boolean                | controla exibição pública                          |
| `created_at`       | timestamptz (default)  | preenchido pelo banco                              |
| `updated_at`       | timestamptz (default)  | preenchido pelo banco                              |

## Migração dos cursos

Os cursos que antes estavam fixos no código agora são carregados do Supabase. Para popular a tabela `courses` com todos os cursos antigos execute:

```bash
npm run migrate:courses

# modo dry-run (somente log)
DRY_RUN=1 npm run migrate:courses
```

O script lê a fonte `scripts/courseSeedData.ts`, insere ou atualiza cada curso e preenche campos textuais com mensagens padrão para que possam ser refinados pelo painel.

## Painel administrativo

- `/controle` agora possui menu lateral para alternar entre **Gestão de Blog** e **Gestão de Cursos**.
- A seção de cursos oferece CRUD completo: criação, edição, (des)ativação e exclusão definitiva diretamente no Supabase.
- Os cursos ativos são exibidos automaticamente nas páginas de modalidade e no modal de detalhes com CTA para WhatsApp.
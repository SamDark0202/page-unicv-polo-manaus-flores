# 🗺️ Gerador de Sitemap Dinâmico

Script automatizado para gerar `sitemap.xml` com todas as páginas, cursos e posts do blog.

## 📋 O que é incluído?

O sitemap gerado inclui automaticamente:

- ✅ **7 páginas principais** (home, bacharelado, licenciatura, tecnólogo, pós-graduação, blog, formulário de parceria)
- ✅ **117 cursos** (27 bacharelado + 23 licenciatura + 67 tecnólogo) com URLs com âncoras (#)
- ✅ **Posts do blog** (todos os posts com status "published" do Supabase)

## 🚀 Como usar

### Comando rápido

```bash
npm run sitemap
```

### O que o script faz:

1. Conecta ao Supabase (se configurado)
2. Busca todos os posts publicados
3. Lê a lista de cursos de `courseSeedData.ts`
4. Gera XML do sitemap com prioridades e frequências otimizadas
5. Salva em `public/sitemap.xml`

## ⚙️ Configuração (Opcional)

### Para incluir posts do blog:

Crie arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

**Sem configuração:** O script irá gerar sitemap apenas com páginas estáticas e cursos (sem posts do blog).

## 📊 Prioridades do Sitemap

| Tipo | Prioridade | Changefreq |
| --- | --- | --- |
| Home `/` | 1.0 | daily |
| Blog `/blog` | 0.8 | daily |
| Páginas principais | 0.9 | weekly |
| Cursos populares | 0.85-0.9 | monthly |
| Cursos regulares | 0.8 | monthly |
| Posts do blog | 0.7 | monthly |

### Cursos com prioridade elevada:

**Bacharelado (0.85):**
- Administração
- Ciências Contábeis
- Educação Física
- Psicanálise
- Engenharia de Dados
- Engenharia de Software
- Engenharia de Segurança Cibernética

**Licenciatura (0.9):**
- Pedagogia

**Licenciatura (0.85):**
- Educação Física
- Matemática
- História
- Psicopedagogia
- Educação Especial

**Tecnólogo (0.9):**
- Marketing Digital
- Inteligência Artificial

**Tecnólogo (0.85):**
- Processos Gerenciais
- Análise e Desenvolvimento de Sistemas
- Gestão de Recursos Humanos
- Logística
- Gestão Financeira
- Gestão de TI
- Segurança da Informação
- Segurança no Trabalho
- Marketing
- Gestão Comercial
- Jogos Digitais
- Sistemas para Internet
- Transformação Digital

## 🔄 Quando executar?

Execute o comando sempre que:

- ✅ **Publicar novos posts** no blog
- ✅ **Antes de fazer deploy** para produção
- ✅ **Semanalmente** para manter datas atualizadas
- ✅ **Adicionar/remover cursos** em `courseSeedData.ts`

## 📝 Estrutura do XML gerado

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  <!-- PÁGINAS PRINCIPAIS -->
  <url>
    <loc>https://www.unicvpoloam.com.br/</loc>
    <lastmod>2026-02-11</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- CURSOS -->
  <url>
    <loc>https://www.unicvpoloam.com.br/bacharelado#administracao</loc>
    <lastmod>2026-02-11</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.85</priority>
  </url>
  
  <!-- POSTS DO BLOG -->
  <url>
    <loc>https://www.unicvpoloam.com.br/blog/graduacao-ead-como-funciona</loc>
    <lastmod>2026-01-15</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
</urlset>
```

## 🔍 Validação

Após gerar o sitemap, valide em:

- **Google Search Console:** https://search.google.com/search-console
- **Bing Webmaster Tools:** https://www.bing.com/webmaster
- **Validador XML:** https://www.xml-sitemaps.com/validate-xml-sitemap.html

## 🛠️ Manutenção

### Adicionar novos cursos:

1. Edite `scripts/courseSeedData.ts`
2. Execute `npm run sitemap`
3. Faça deploy

### Adicionar novos posts:

Os posts são adicionados automaticamente quando:
- Status = "published" no Supabase
- Próxima execução de `npm run sitemap`

### Trocar prioridades:

Edite as variáveis `priority` no arquivo `scripts/generateSitemap.ts` (linhas com lógica de prioridade elevada).

## 🌐 Arquivo de saída

- **Localização:** `public/sitemap.xml`
- **URL pública:** https://www.unicvpoloam.com.br/sitemap.xml
- **Acesso no robots.txt:** Já declarado automaticamente

## 📦 Dependências

- `@supabase/supabase-js` - Buscar posts do blog
- `tsx` - Executar TypeScript direto
- `courseSeedData.ts` - Lista de cursos

## 🐛 Solução de problemas

### "Variáveis de ambiente não encontradas"
➡️ **Solução:** Crie `.env.local` com credenciais do Supabase (veja seção Configuração)
➡️ **Alternativa:** O script irá funcionar sem posts do blog

### "Could not find the table 'posts'"
➡️ **Solução:** Verifique se a tabela existe no Supabase e se as credenciais estão corretas

### "Número de URLs não corresponde"
➡️ **Solução:** Execute `npm run sitemap` novamente após adicionar/remover conteúdo

## 📚 Documentação adicional

- Ver `SEO_OPTIMIZATION_GUIDE.md` para estratégias completas de SEO
- Ver `public/robots.txt` para configurações de crawlers

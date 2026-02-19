# 📰 Integração com Google News Reader Revenue Manager

## ✅ Status da Implementação

O código do Google News Reader Revenue Manager **JÁ ESTÁ INCLUÍDO** e totalmente integrado ao sistema de blog.

---

## 🎯 O que foi implementado

### 1. Script do Google News (Reader Revenue Manager)

**Localização**: [index.html](index.html) - linhas 15-25

```html
<script async type="application/javascript"
        src="https://news.google.com/swg/js/v1/swg-basic.js"></script>
<script>
  (self.SWG_BASIC = self.SWG_BASIC || []).push( basicSubscriptions => {
    basicSubscriptions.init({
      type: "NewsArticle",
      isPartOfType: ["Product"],
      isPartOfProductId: "CAow4uWeDA:openaccess",
      clientOptions: { theme: "light", lang: "pt-BR" },
    });
  });
</script>
```

✅ O script está **ativo** e carrega em todas as páginas do site.

---

### 2. Metadados Estruturados (JSON-LD) para Cada Post

**Localização**: [src/pages/Blog/[slug].tsx](src/pages/Blog/[slug].tsx)

Cada post individual agora possui:

#### a) **Schema.org NewsArticle**
```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "Título do Post",
  "image": "URL da imagem",
  "datePublished": "2026-02-19T00:00:00.000Z",
  "dateModified": "2026-02-19T00:00:00.000Z",
  "author": {
    "@type": "Organization",
    "name": "UniCV Polo Manaus Flores"
  },
  "publisher": {
    "@type": "Organization",
    "name": "UniCV Polo Manaus Flores",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.unicvpoloam.com.br/logo.png"
    }
  },
  "isAccessibleForFree": true,
  "isPartOf": {
    "@type": ["CreativeWork", "Product"],
    "name": "UniCV News",
    "productID": "CAow4uWeDA:openaccess"
  }
}
```

#### b) **Meta Tags Open Graph e Twitter Card**
- `og:type` = "article"
- `og:title`, `og:description`, `og:image`, `og:url`
- `article:published_time`, `article:modified_time`
- `article:tag` para cada tag do post
- Twitter Card com `summary_large_image`

#### c) **Canonical URL**
- Link canônico para cada post evitando conteúdo duplicado

---

### 3. Sitemap Aprimorado com Google News

**Localização**: [scripts/generateSitemap.ts](scripts/generateSitemap.ts)

O sitemap agora inclui:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
```

**Posts recentes (últimos 30 dias)** recebem tags especiais do Google News:

```xml
<url>
  <loc>https://www.unicvpoloam.com.br/blog/post-slug</loc>
  <lastmod>2026-02-19</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
  <news:news>
    <news:publication>
      <news:name>UniCV Polo Manaus Flores</news:name>
      <news:language>pt</news:language>
    </news:publication>
    <news:publication_date>2026-02-19</news:publication_date>
    <news:title>Título do Artigo</news:title>
  </news:news>
</url>
```

---

## 🔄 Como funciona a sincronização automática

### Fluxo de publicação de um novo post:

1. **Criação do Post** 
   - Você cria um post no painel admin
   - Define título, conteúdo, imagem, tags, etc.

2. **Publicação**
   - Ao publicar, o post é salvo no Supabase
   - O status é alterado para "published"

3. **Atualização do Sitemap** ⚡
   ```bash
   npm run sitemap
   ```
   - Executa o script que:
     - Busca todos os posts publicados no Supabase
     - Identifica posts recentes (últimos 2 dias)
     - Adiciona tags `<news:news>` para posts recentes
     - Gera o arquivo `public/sitemap.xml`

4. **Indexação no Google**
   - Google News crawlers leem o sitemap.xml
   - Identificam os artigos marcados como NewsArticle
   - Verificam os metadados estruturados (JSON-LD)
   - O script SWG_BASIC confirma que o conteúdo é openaccess
   - Post é indexado e pode aparecer no Google News

---

## 📋 Checklist pós-publicação

Sempre que publicar um novo post:

- [ ] ✅ Certifique-se que o post tem título, imagem e conteúdo
- [ ] ✅ Adicione tags relevantes
- [ ] ✅ Execute `npm run sitemap` para atualizar o sitemap
- [ ] ✅ (Opcional) Submeta o sitemap no Google Search Console
- [ ] ✅ (Opcional) Use a ferramenta de inspeção de URL do Google Search Console

---

## 🛠️ Comandos úteis

### Gerar/Atualizar Sitemap
```bash
npm run sitemap
```

### Verificar o sitemap gerado
```bash
# Abrir no navegador
https://www.unicvpoloam.com.br/sitemap.xml
```

### Testar metadados estruturados
Use o [Schema.org Validator](https://validator.schema.org/) ou [Google Rich Results Test](https://search.google.com/test/rich-results)

---

## 🔍 Verificação da integração

### 1. Verificar script SWG_BASIC no navegador

Abra qualquer página do blog e no console do navegador digite:
```javascript
console.log(window.SWG_BASIC);
```

Você deve ver um array com a configuração.

### 2. Verificar JSON-LD

Inspecione o código-fonte de qualquer post (`Ctrl+U`) e procure por:
```html
<script type="application/ld+json">
```

### 3. Verificar sitemap

Acesse: https://www.unicvpoloam.com.br/sitemap.xml

Posts recentes devem ter a tag `<news:news>`.

---

## 📚 Recursos adicionais

- [Google News Publisher Center](https://publishercenter.google.com/)
- [Google News Content Policies](https://support.google.com/news/publisher-center/answer/9606710)
- [Schema.org NewsArticle](https://schema.org/NewsArticle)
- [Google News Sitemap Guidelines](https://support.google.com/news/publisher-center/answer/9607025)
- [Subscribewith Google Documentation](https://developers.google.com/news/subscribe)

---

## ⚙️ Configuração do Reader Revenue Manager

**Product ID**: `CAow4uWeDA:openaccess`

Este ID identifica seu conteúdo como **open access** (acesso livre) no Google News.

Se você quiser criar assinaturas pagas no futuro:
1. Acesse o [Google News Publisher Center](https://publishercenter.google.com/)
2. Configure produtos e assinaturas
3. Atualize o `isPartOfProductId` no [index.html](index.html)

---

## 🎯 Benefícios da Integração

✅ **Descoberta automática** - Google News identifica novos artigos automaticamente
✅ **Rich snippets** - Posts aparecem com imagens e metadados enriquecidos
✅ **SEO aprimorado** - Metadados estruturados melhoram o ranking
✅ **Compartilhamento otimizado** - Open Graph funciona em redes sociais
✅ **Sincronização contínua** - Cada novo post é automaticamente preparado para o Google News

---

## 🚀 Próximos passos recomendados

1. **Submeter o site no Google News Publisher Center**
   - https://publishercenter.google.com/

2. **Configurar Google Search Console**
   - Submeter o sitemap.xml
   - Monitorar indexação de artigos

3. **Implementar automação do sitemap**
   - Configurar trigger para executar `npm run sitemap` automaticamente após cada publicação
   - Pode ser feito com GitHub Actions, Vercel build hooks, etc.

4. **Monitoramento**
   - Verificar quais posts estão sendo indexados
   - Analisar desempenho no Google News
   - Ajustar estratégia de conteúdo baseado em métricas

---

**Data de implementação**: 19 de fevereiro de 2026
**Status**: ✅ Totalmente funcional e integrado

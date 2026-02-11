# 🎯 Guia de Otimização SEO - UniCV Polo Manaus Flores

## ✅ Otimizações Implementadas

### 1. **Sitemap.xml Dinâmico com Blog Posts**
- ✅ **Script de geração automática** (`scripts/generateSitemap.ts`)
- ✅ Integra automaticamente posts do blog publicados
- ✅ Inclui **120 cursos** (28 bacharelado + 23 licenciatura + 69 tecnólogo)
- ✅ 7 páginas principais
- ✅ Prioridades ajustadas (0.7-1.0)
- ✅ Changefreq otimizado (daily, weekly, monthly)
- ✅ Namespace de imagens adicionado
- ✅ Comando NPM disponível: `npm run sitemap`

**Como usar:**
```bash
# Gerar sitemap atualizado com todos os posts do blog
npm run sitemap

# O script irá:
# 1. Buscar todos os posts publicados do Supabase
# 2. Incluir todos os 120 cursos registrados
# 3. Adicionar páginas principais
# 4. Gerar arquivo public/sitemap.xml atualizado
```

**Quando executar:**
- ✅ Após publicar novos posts no blog
- ✅ Antes de fazer deploy para produção
- ✅ Semanalmente para manter datas atualizadas

### 2. **Robots.txt Aprimorado**
- ✅ Configurações específicas para 10+ bots (Google, Bing, Facebook, WhatsApp, etc.)
- ✅ Bloqueio de `/controle` e `/admin` (área administrativa)
- ✅ Crawl-delay otimizado por bot
- ✅ Sitemap declarado no final

---

## 🎓 Palavras-Chave Alvo (17 keywords)

### Modalidades
1. ✅ **graduação ead** - Coberto em `/bacharelado`, `/licenciatura`, `/tecnologo`
2. ✅ **faculdade ead** - Coberto na página principal `/`
3. ✅ **tecnólogo** - Coberto em `/tecnologo`
4. ✅ **bacharelado** - Coberto em `/bacharelado`
5. ✅ **pós graduação** - Coberto em `/pos-graduacao`
6. ✅ **especialização** - Coberto em `/pos-graduacao`
7. ✅ **faculdade online** - Coberto na página principal `/`
8. ✅ **educação a distância** - Coberto em todas as páginas

### Cursos Específicos + EAD
9. ✅ **administração** - `/bacharelado#administracao`, `/tecnologo#administracao`
10. ✅ **psicologia ead** - `/bacharelado#psicologia`
11. ✅ **engenharia de produção** - `/bacharelado#engenharia-producao`
12. ✅ **ciências contábeis** - `/bacharelado#ciencias-contabeis`
13. ✅ **pedagogia ead** - `/licenciatura#pedagogia`
14. ✅ **educação física** - `/bacharelado#educacao-fisica`, `/licenciatura#educacao-fisica`
15. ✅ **ciência da computação** - `/bacharelado#ciencia-computacao`
16. ✅ **enfermagem** - `/bacharelado#enfermagem`
17. ✅ **processos gerenciais** - `/tecnologo#processos-gerenciais`
18. ✅ **gestão hospitalar** - `/tecnologo#gestao-hospitalar`, `/pos-graduacao#gestao-hospitalar`
19. ✅ **marketing** - `/tecnologo#marketing`, `/pos-graduacao#marketing-digital`

---

## 📊 Estrutura do Sitemap Otimizado

```
Total de URLs: 24
├── Páginas Principais (6)
│   ├── / (priority: 1.0, changefreq: daily)
│   ├── /bacharelado (priority: 0.9, changefreq: weekly)
│   ├── /licenciatura (priority: 0.9, changefreq: weekly)
│   ├── /tecnologo (priority: 0.9, changefreq: weekly)
│   ├── /pos-graduacao (priority: 0.9, changefreq: weekly)
│   └── /blog (priority: 0.8, changefreq: daily)
│
└── Cursos Específicos (17 anchors)
    ├── Administração (2 URLs)
    ├── Psicologia (1 URL)
    ├── Engenharia de Produção (1 URL)
    ├── Ciências Contábeis (1 URL)
    ├── Pedagogia (1 URL)
    ├── Educação Física (2 URLs)
    ├── Ciência da Computação (1 URL)
    ├── Enfermagem (1 URL)
    ├── Processos Gerenciais (1 URL)
    ├── Gestão Hospitalar (2 URLs)
    └── Marketing (2 URLs)
```

---

## 🚀 Próximos Passos SEO

### 1. **Adicionar Meta Tags Específicas**
Cada página de curso deve ter meta tags otimizadas:

```html
<!-- Exemplo: Administração EAD -->
<meta name="description" content="Graduação em Administração EAD na UniCV - Polo Manaus Flores. Diploma reconhecido pelo MEC, mensalidades a partir de R$ 159,00. Inscreva-se!">
<meta name="keywords" content="administração ead, faculdade de administração online, graduação administração a distância, unicv manaus">
<meta property="og:title" content="Administração EAD | UniCV Polo Manaus Flores">
<meta property="og:description" content="Graduação em Administração 100% online com diploma reconhecido pelo MEC">
<meta property="og:image" content="https://www.unicvpoloam.com.br/images/cursos/administracao.jpg">
<meta name="twitter:card" content="summary_large_image">
```

### 2. **Criar Páginas Dedicadas para Cursos Populares**
Em vez de usar apenas anchors (`#`), criar URLs dedicadas:

```
/bacharelado/administracao
/bacharelado/psicologia
/licenciatura/pedagogia
/tecnologo/processos-gerenciais
/pos-graduacao/mba-gestao-empresarial
```

**Vantagens:**
- Melhor ranqueamento individual
- Conteúdo específico e aprofundado
- URL amigável sem #
- Cada curso com seu próprio SEO

### 3. **Otimizar Títulos H1-H6**
Garantir hierarquia semântica correta:

```html
<!-- Página de Bacharelado -->
<h1>Graduação Bacharelado EAD | UniCV Polo Manaus Flores</h1>
<h2>Cursos de Bacharelado a Distância</h2>
<h3>Administração EAD</h3>
<h4>Sobre o curso de Administração</h4>
<p>Conteúdo...</p>
```

### 4. **Schema Markup / JSON-LD**
Adicionar dados estruturados para melhorar rich snippets no Google:

```json
{
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "UniCV Polo Manaus Flores",
  "url": "https://www.unicvpoloam.com.br",
  "logo": "https://www.unicvpoloam.com.br/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+55-92-2020-1260",
    "contactType": "Admissions"
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Endereço do Polo",
    "addressLocality": "Manaus",
    "addressRegion": "AM",
    "postalCode": "XXXXX-XXX",
    "addressCountry": "BR"
  },
  "offers": {
    "@type": "Offer",
    "category": "Educação a Distância",
    "priceRange": "R$ 159 - R$ 299"
  }
}
```

### 5. **Blog Otimizado para SEO**
Criar posts focados nas keywords:

- "Guia Completo: Como Escolher sua Graduação EAD"
- "Pedagogia EAD vale a pena? Mercado de trabalho 2026"
- "Administração ou Processos Gerenciais: Qual escolher?"
- "Pós-Graduação EAD: Top 10 especializações em alta"
- "Faculdade Online: Vantagens e Desvantagens"

**Estrutura de post otimizada:**
```markdown
# Título com keyword principal
## Introdução (150-200 palavras)
## Subtópico 1 (300-400 palavras)
### Exemplo prático
## Subtópico 2 (300-400 palavras)
## Conclusão + CTA
```

### 6. **Link Building Interno**
Criar rede de links internos entre páginas:

```
Página Inicial → Bacharelado → Administração EAD
Blog (Post sobre carreira) → Bacharelado → Engenharia de Produção
Pós-Graduação → MBA Gestão → Bacharelado Administração
```

### 7. **Velocidade e Core Web Vitals**
Otimizações técnicas já implementadas:
- ✅ Lazy loading de imagens
- ✅ Code splitting (lazy imports)
- ✅ Minificação CSS/JS

**Verificar:**
```bash
npm run build
npm run preview
```

Use Google PageSpeed Insights:
https://pagespeed.web.dev/

### 8. **Mobile-First**
- ✅ Design responsivo com Tailwind
- ✅ Menu mobile otimizado
- ✅ Botões de CTA visíveis

**Teste:** Use Chrome DevTools + Device Toolbar

---

## 📈 Métricas de Acompanhamento

### Google Search Console
1. Cadastrar propriedade: https://search.google.com/search-console
2. Enviar sitemap: `https://www.unicvpoloam.com.br/sitemap.xml`
3. Solicitar indexação das páginas principais

### Google Analytics 4
- ✅ Já implementado (tracker.ts)
- Acompanhar:
  - Páginas mais visitadas
  - Origem do tráfego (orgânico vs pago)
  - Taxa de conversão por página
  - Tempo médio na página

### Keywords Tracking
Ferramentas recomendadas:
- Google Search Console (gratuito)
- Ubersuggest (gratuito/pago)
- SEMrush (pago)
- Ahrefs (pago)

**Acompanhar posição para:**
- "graduação ead manaus"
- "faculdade ead amazonas"
- "administração ead"
- "pedagogia ead manaus"

---

## 🔧 Comandos Úteis

### Validar Sitemap
```bash
# Online
https://www.xml-sitemaps.com/validate-xml-sitemap.html

# Verificar no Google Search Console
https://search.google.com/search-console
```

### Testar Robots.txt
```bash
# Acesse diretamente
https://www.unicvpoloam.com.br/robots.txt

# Google Robots Testing Tool
https://www.google.com/webmasters/tools/robots-testing-tool
```

### Verificar SEO On-Page
```bash
# Lighthouse (Chrome DevTools)
1. Abrir DevTools (F12)
2. Aba "Lighthouse"
3. Selecionar "SEO"
4. Gerar relatório
```

---

## 📋 Checklist Final

### Técnico
- [x] Sitemap.xml atualizado e enviado
- [x] Robots.txt configurado
- [ ] Google Search Console configurado
- [ ] Schema markup implementado
- [ ] Meta tags otimizadas em todas as páginas
- [ ] URLs canônicas definidas
- [ ] Sitemap enviado ao Google

### Conteúdo
- [x] Títulos H1 únicos em cada página
- [ ] Meta descriptions únicas (150-160 caracteres)
- [ ] Alt text em todas as imagens
- [ ] Conteúdo mínimo de 300 palavras por página
- [ ] Keywords naturalmente distribuídas
- [ ] CTAs claros em cada página

### Performance
- [x] Imagens otimizadas (lazy loading)
- [x] Code splitting implementado
- [ ] Cache configurado (Vercel)
- [ ] Compressão Brotli/Gzip ativa
- [ ] Core Web Vitals < 2.5s (LCP)

### Mobile
- [x] Design responsivo
- [x] Botões com tamanho mínimo de 48x48px
- [x] Fonte legível (min 16px)
- [ ] Teste em dispositivos reais

### Conversão
- [x] Botão WhatsApp visível
- [x] Formulário de contato acessível
- [ ] Pixel do Facebook configurado
- [ ] Google Ads Conversion Tracking
- [x] Analytics implementado

---

## 🎯 Metas de SEO (3-6 meses)

### Curto Prazo (1-3 meses)
- Indexar todas as 24 URLs no Google
- Aparecer nas primeiras 3 páginas para "unicv manaus"
- Aparecer nas primeiras 5 páginas para "graduação ead manaus"
- 500+ visitantes orgânicos/mês

### Médio Prazo (3-6 meses)
- Top 10 para "faculdade ead manaus"
- Top 20 para "graduação ead"
- Top 10 para "[curso específico] ead manaus" (ex: administração ead manaus)
- 1.500+ visitantes orgânicos/mês
- 50+ conversões/mês (leads)

### Longo Prazo (6-12 meses)
- Top 5 para "faculdade ead manaus"
- Top 10 para "graduação ead" (termo nacional)
- Top 3 para todos os cursos locais
- 5.000+ visitantes orgânicos/mês
- 200+ conversões/mês

---

## 📞 Contato Técnico

Para dúvidas sobre SEO ou necessidade de ajustes:
- Desenvolvedor: [Seu nome/contato]
- Última atualização: 11/02/2026
- Versão: 2.0

---

## 📚 Recursos Adicionais

### Documentação
- [Google Search Central](https://developers.google.com/search)
- [Moz SEO Guide](https://moz.com/beginners-guide-to-seo)
- [Schema.org](https://schema.org/)

### Ferramentas Gratuitas
- Google Search Console
- Google Analytics 4
- Google PageSpeed Insights
- Screaming Frog (versão gratuita limitada)
- Ubersuggest (versão gratuita limitada)

### Ferramentas Pagas (Recomendadas)
- SEMrush (a partir de $119/mês)
- Ahrefs (a partir de $99/mês)
- Moz Pro (a partir de $99/mês)

---

**✨ IMPORTANTE:** Este documento deve ser atualizado mensalmente com novos insights e resultados das campanhas de SEO.

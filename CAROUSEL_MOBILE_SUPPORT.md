# Suporte a Imagens Mobile no Carrossel Pós+

## 📱 Visão Geral

O carrossel de Cursos Pós+ agora suporta **imagens separadas para desktop e mobile**, otimizando a experiência do usuário em diferentes dispositivos.

## 🎨 Especificações de Imagens

### Desktop
- **Formato:** Horizontal/Widescreen
- **Proporção recomendada:** 16:7 ou similar
- **Uso:** Exibido em tablets (≥768px) e desktop

### Mobile
- **Formato:** Quadrado
- **Proporção:** 1080x1080 pixels (1:1)
- **Uso:** Exibido apenas em smartphones (<768px)

## 🔧 Como Usar

### 1. Atualizar Banco de Dados

Se a tabela já existe, execute no **Supabase SQL Editor**:
```sql
-- Arquivo: scripts/add_mobile_image_to_carousel.sql
```

Se for criar do zero, use:
```sql
-- Arquivo: scripts/create_post_plus_carousel_table.sql
```

### 2. Fazer Upload das Imagens

1. Acesse: **Painel Admin → Gestão de Cursos → Carrossel Pós+**
2. Clique em **"Novo banner"** ou edite um existente
3. Faça upload de **duas imagens**:
   - **Imagem Desktop:** Formato horizontal
   - **Imagem Mobile:** Formato quadrado (1080x1080)
4. Preencha os demais campos (meta descrição, link, ordem)
5. Clique em **"Salvar banner"**

### 3. Verificar no Site

- **Desktop:** Visualize em `/pos-graduacao` - verá a imagem horizontal
- **Mobile:** Abra em smartphone - verá a imagem quadrada

## 📂 Arquivos Modificados

### Backend/Database
- `scripts/create_post_plus_carousel_table.sql` - Schema atualizado
- `scripts/add_mobile_image_to_carousel.sql` - Migration para adicionar coluna

### TypeScript/Types
- `src/types/postPlusCarousel.ts` - Adicionado campo `mobileImageUrl`

### Service Layer
- `src/lib/postPlusCarouselService.ts` - Suporte a `imagem_mobile_url`

### Components
- `src/components/admin/courses/PostPlusCarouselManager.tsx`:
  - Dois campos de upload separados
  - Preview lado a lado (Desktop | Mobile)
  - Validação para ambas imagens obrigatórias

### Pages
- `src/pages/PosGraduacao.tsx`:
  - Renderização condicional via Tailwind (`md:hidden` / `hidden md:block`)
  - Imagem mobile: `aspect-square object-cover`
  - Imagem desktop: `object-contain` com altura fixa

## 🎯 Comportamento Responsivo

```tsx
{/* Mobile - visível apenas < 768px */}
<img 
  src={item.mobileImageUrl} 
  className="md:hidden w-full aspect-square object-cover" 
/>

{/* Desktop - visível apenas ≥ 768px */}
<img 
  src={item.imageUrl} 
  className="hidden md:block h-[420px] lg:h-[480px] object-contain" 
/>
```

## ✅ Validações

O formulário admin agora valida:
- ✅ URL da imagem desktop preenchida
- ✅ URL da imagem mobile preenchida
- ✅ Meta descrição para SEO
- ✅ Link opcional válido (http/https)
- ✅ Ordem numérica

## 🚀 Deploy

Após fazer push das alterações:

1. **Supabase:** Execute o script SQL de migration
2. **Vercel/Deploy:** Build automático detectará as mudanças
3. **Admin:** Faça upload das imagens nos dois formatos
4. **Teste:** Valide em dispositivos mobile e desktop

## 📝 Notas

- Imagens existentes precisarão ter versão mobile adicionada manualmente
- O campo `mobileImageUrl` é **obrigatório** - sistema não permite salvar sem ele
- Storage Supabase: Ambas imagens são salvas na pasta `blog-images/pos-plus-carousel/`
- Performance: Browser carrega apenas a imagem correspondente ao dispositivo

## 🔍 Troubleshooting

### Erro: "Tabela não encontrada"
Execute o script SQL no Supabase Editor

### Erro: "Column imagem_mobile_url does not exist"
Execute `add_mobile_image_to_carousel.sql` para adicionar a coluna

### Imagem não aparece no mobile
Verifique se:
1. Upload foi feito corretamente
2. Item está marcado como "ativo"
3. Clear cache do browser
4. Inspecione elemento para verificar se a URL está correta

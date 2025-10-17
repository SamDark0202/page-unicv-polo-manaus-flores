export type Post = {
  slug: string;
  title: string;
  date: string;            // ISO (YYYY-MM-DD)
  author: string;
  imageUrl: string;
  excerpt: string;
  content: string;         // HTML
  // Campos SEO (vamos preencher no Passo 3/6)
  metaDescription?: string;
  tags?: string[];
  canonicalUrl?: string;
  category?: string;
};

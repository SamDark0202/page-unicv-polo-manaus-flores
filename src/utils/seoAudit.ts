// src/utils/seoAudit.ts
import type { Post } from "@/types/post";

export type Issue = { level: "error" | "warn"; message: string };

const LINK_COLOR = "#ce9e0d";

export function validateDraft(
  draft: Partial<Post> & {
    metaDescription?: string;
    tags?: string[];
    canonicalUrl?: string;
    category?: string;
    content?: string;
  },
  allPosts: Post[],
  currentIndex: number | null
): Issue[] {
  const issues: Issue[] = [];
  const content = draft.content || "";

  // Obrigatórios
  if (!trim(draft.title)) issues.push(err("Título é obrigatório."));
  if (!trim(draft.slug)) issues.push(err("Slug é obrigatório."));
  if (!trim(draft.date)) issues.push(err("Data é obrigatória."));
  if (!trim(draft.author)) issues.push(err("Autor é obrigatório."));
  if (!trim(draft.excerpt)) issues.push(err("Excerpt (resumo) é obrigatório."));
  if (!trim(draft.metaDescription)) issues.push(err("Meta Description é obrigatória para SEO."));
  if (!trim(content)) issues.push(err("Conteúdo (HTML) é obrigatório."));

  // Formatos / tamanhos
  if (len(draft.title) > 65) issues.push(warn("Título muito longo (ideal ≤ 60–65 caracteres)."));
  if (len(draft.metaDescription) > 170) issues.push(warn("Meta Description muito longa (ideal ~155 caracteres)."));
  if (draft.date && !/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) issues.push(err("Data deve estar no formato YYYY-MM-DD."));

  // Slug único
  if (draft.slug) {
    const slug = String(draft.slug);
    const clash = allPosts.findIndex((p, i) => p.slug === slug && i !== (currentIndex ?? -1));
    if (clash !== -1) issues.push(err(`Slug já usado por outro post: "${slug}".`));
  }

  // Caminho da imagem
  if (draft.imageUrl && !/\/src\/assets\/Imgblog\//.test(draft.imageUrl)) {
    issues.push(warn('Caminho da imagem fora do padrão "/src/assets/Imgblog/".'));
  }

  // Headings no conteúdo
  if (content && !/<strong[^>]*style=['"][^'"]*font-size\s*:\s*26px/i.test(content)) {
    issues.push(warn("Recomenda-se um título principal com <strong style=\"font-size:26px;\">…</strong>."));
  }

  // "Meta Description" visível (não usar)
  if (/Meta\s*Description\s*:/i.test(content)) {
    issues.push(err('Remova "Meta Description:" do conteúdo — use apenas a meta tag (o painel já injeta automaticamente).'));
  }

  // Links sem cor de marca
  const hasBadLinks = anchorsWithoutColor(content, LINK_COLOR).length > 0;
  if (hasBadLinks) {
    issues.push(warn("Há links sem a cor padrão de marca (#ce9e0d). Use o botão 'Ajustar cor dos links'."));
  }

  return issues;
}

/** Corrige os <a> que não tiverem color: aplicando a cor de marca. */
export function fixLinksColor(html: string, color = LINK_COLOR): string {
  try {
    const div = document.createElement("div");
    div.innerHTML = html;
    const as = Array.from(div.querySelectorAll("a"));
    as.forEach((a) => {
      const style = (a.getAttribute("style") || "").trim();
      const hasColor = /color\s*:/.test(style);
      if (!hasColor) a.setAttribute("style", (style ? style + ";" : "") + `color:${color}`);
    });
    return div.innerHTML;
  } catch {
    // fallback muito simples (não mexe quando falha)
    return html;
  }
}

/** Retorna todos os <a> sem color na style inline */
function anchorsWithoutColor(html: string, color: string): string[] {
  try {
    const div = document.createElement("div");
    div.innerHTML = html;
    const as = Array.from(div.querySelectorAll("a"));
    return as
      .filter((a) => !/color\s*:/.test(a.getAttribute("style") || ""))
      .map((a) => a.outerHTML);
  } catch {
    return [];
  }
}

const err = (message: string): Issue => ({ level: "error", message });
const warn = (message: string): Issue => ({ level: "warn", message });
const trim = (v?: string) => (v || "").trim();
const len = (v?: string) => (v || "").length;

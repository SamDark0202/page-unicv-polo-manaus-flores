// src/components/admin/PostEditor.tsx
import { useEffect, useMemo, useState } from "react";
import { useAdminPosts } from "@/hooks/useAdminPosts";
import { slugify } from "@/utils/slugify";
import type { Post } from "@/types/post";
import ImagePicker from "@/components/admin/ImagePicker";
import { readText, writeText, upsertPostPush } from "@/utils/postsFileBridge";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { validateDraft, fixLinksColor, type Issue } from "@/utils/seoAudit";

type Props = {
  index: number | null;          // índice do post para editar; null = novo
  onBack: () => void;
  fileHandle?: any;              // FileSystemFileHandle | undefined
};

type Draft = Post & {
  metaDescription?: string;
  tags?: string[];
  canonicalUrl?: string;
  category?: string;
};

const DEFAULT_AUTHOR = "UniCV Polo Manaus Flores";
const BRAND_LINK_COLOR = "#ce9e0d";
const IMG_FOLDER_PREFIX = "/src/assets/Imgblog/";

export default function PostEditor({ index, onBack, fileHandle }: Props) {
  const { posts, upsertPost } = useAdminPosts();

  const initial: Draft = useMemo(() => {
    if (index !== null && index >= 0 && index < posts.length) {
      const p = posts[index];
      return {
        ...p,
        metaDescription: p.metaDescription || "",
        tags: p.tags || [],
        canonicalUrl: p.canonicalUrl || "",
        category: p.category || "",
      };
    }
    const today = new Date().toISOString().slice(0, 10);
    return {
      slug: "",
      title: "",
      date: today,
      author: DEFAULT_AUTHOR,
      imageUrl: "",
      excerpt: "",
      content: "",
      metaDescription: "",
      tags: [],
      canonicalUrl: "",
      category: "",
    };
  }, [index, posts]);

  const [draft, setDraft] = useState<Draft>(initial);
  const [tagInput, setTagInput] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [code, setCode] = useState<string>("");
  const [issues, setIssues] = useState<Issue[]>([]);

  useEffect(() => {
    setDraft(initial);
    setErrors([]);
    setCode("");
    setShowPreview(false);
  }, [initial]);

  // Revalida a cada alteração relevante
  useEffect(() => {
    const res = validateDraft(draft, posts, index ?? null);
    setIssues(res);
  }, [draft, posts, index]);

  function suggestImageUrl(newSlug: string) {
    if (!newSlug) return "";
    const fileName = `${newSlug}.png`;
    return `${IMG_FOLDER_PREFIX}${fileName}`;
  }

  function handleTitleChange(v: string) {
    const s = slugify(v);
    setDraft(d => ({
      ...d,
      title: v,
      slug: d.slug ? d.slug : s,
      imageUrl: d.imageUrl ? d.imageUrl : suggestImageUrl(s),
    }));
  }

  function handleSlugChange(v: string) {
    const s = slugify(v);
    setDraft(d => ({
      ...d,
      slug: s,
      imageUrl: d.imageUrl ? d.imageUrl : suggestImageUrl(s),
    }));
  }

  function addTag() {
    const t = tagInput.trim();
    if (!t) return;
    if (draft.tags?.includes(t)) {
      setTagInput("");
      return;
    }
    setDraft(d => ({ ...d, tags: [...(d.tags || []), t] }));
    setTagInput("");
  }
  function removeTag(tag: string) {
    setDraft(d => ({ ...d, tags: (d.tags || []).filter(t => t !== tag) }));
  }

  function validateBlocking(): string[] {
    // mantém mensagens antigas por compatibilidade, mas agora usamos issues (error/warn)
    const hardErrors = issues.filter(i => i.level === "error").map(i => i.message);
    return hardErrors;
  }

  function handleSaveLocal() {
    const hardErrors = validateBlocking();
    setErrors(hardErrors);
    if (hardErrors.length > 0) return;

    const payload: Post = {
      slug: draft.slug,
      title: draft.title,
      date: draft.date,
      author: draft.author,
      imageUrl: draft.imageUrl,
      excerpt: draft.excerpt,
      content: draft.content,
      metaDescription: draft.metaDescription,
      tags: draft.tags,
      canonicalUrl: draft.canonicalUrl,
      category: draft.category,
    };
    upsertPost(index, payload);
    alert("Post salvo localmente (painel). Você ainda pode salvar no arquivo posts.ts ou exportar no Passo 5.");
    onBack();
  }

  function generatePushCode() {
    const hardErrors = validateBlocking();
    setErrors(hardErrors);
    if (hardErrors.length > 0) return;

    const metaTag = `<meta name="description" content="${escapeAttr(draft.metaDescription || "")}">`;

    const jsonLd = buildJsonLd({
      title: draft.title,
      date: draft.date,
      author: draft.author,
      imageUrl: draft.imageUrl,
      description: draft.metaDescription || draft.excerpt,
      canonicalUrl: draft.canonicalUrl,
    });

    const contentHtml = draft.content;

    const final = `
posts.push({
  slug: '${escapeStr(draft.slug)}',
  title: '${escapeStr(draft.title)}',
  date: '${escapeStr(draft.date)}',
  author: '${escapeStr(draft.author)}',
  imageUrl: '${escapeStr(draft.imageUrl)}',
  excerpt: '${escapeStr(draft.excerpt)}',
  content: \`
    ${metaTag}
    ${draft.canonicalUrl ? `<link rel="canonical" href="${escapeAttr(draft.canonicalUrl)}">` : ""}
    ${contentHtml}

    <script type="application/ld+json">
    ${jsonLd}
    </script>
  \`,
  ${draft.metaDescription ? `metaDescription: '${escapeStr(draft.metaDescription)}',` : ""}
  ${draft.tags && draft.tags.length ? `tags: ${JSON.stringify(draft.tags)},` : ""}
  ${draft.canonicalUrl ? `canonicalUrl: '${escapeStr(draft.canonicalUrl)}',` : ""}
  ${draft.category ? `category: '${escapeStr(draft.category)}',` : ""}
});
`.trim();

    setCode(final);
    setShowPreview(false);
  }

  async function saveDirectToFile() {
    if (!fileHandle) {
      alert("Conecte o arquivo posts.ts no topo do painel (botão 'Conectar posts.ts').");
      return;
    }
    const hardErrors = validateBlocking();
    setErrors(hardErrors);
    if (hardErrors.length > 0) return;

    const metaTag = `<meta name="description" content="${escapeAttr(draft.metaDescription || "")}">`;
    const jsonLd = buildJsonLd({
      title: draft.title,
      date: draft.date,
      author: draft.author,
      imageUrl: draft.imageUrl,
      description: draft.metaDescription || draft.excerpt,
      canonicalUrl: draft.canonicalUrl,
    });
    const contentHtml = draft.content;

    const pushCode = `
posts.push({
  slug: '${escapeStr(draft.slug)}',
  title: '${escapeStr(draft.title)}',
  date: '${escapeStr(draft.date)}',
  author: '${escapeStr(draft.author)}',
  imageUrl: '${escapeStr(draft.imageUrl)}',
  excerpt: '${escapeStr(draft.excerpt)}',
  content: \`
    ${metaTag}
    ${draft.canonicalUrl ? `<link rel="canonical" href="${escapeAttr(draft.canonicalUrl)}">` : ""}
    ${contentHtml}

    <script type="application/ld+json">
    ${jsonLd}
    </script>
  \`,
  ${draft.metaDescription ? `metaDescription: '${escapeStr(draft.metaDescription)}',` : ""}
  ${draft.tags && draft.tags.length ? `tags: ${JSON.stringify(draft.tags)},` : ""}
  ${draft.canonicalUrl ? `canonicalUrl: '${escapeStr(draft.canonicalUrl)}',` : ""}
  ${draft.category ? `category: '${escapeStr(draft.category)}',` : ""}
});
`.trim();

    try {
      const current = await readText(fileHandle);
      const updated = upsertPostPush(current, pushCode, draft.slug);
      await writeText(fileHandle, updated);

      const payload: Post = {
        slug: draft.slug,
        title: draft.title,
        date: draft.date,
        author: draft.author,
        imageUrl: draft.imageUrl,
        excerpt: draft.excerpt,
        content: draft.content,
        metaDescription: draft.metaDescription,
        tags: draft.tags,
        canonicalUrl: draft.canonicalUrl,
        category: draft.category,
      };
      upsertPost(index, payload);

      alert("Salvo com sucesso em src/data/posts.ts 🎉");
      onBack();
    } catch (e: any) {
      console.error(e);
      alert("Não foi possível escrever no arquivo. Verifique permissões do navegador, use Chrome/Edge e reconecte o posts.ts.");
    }
  }

  function downloadCode() {
    const blob = new Blob([code || ""], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${draft.slug || "post"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFixLinks() {
    setDraft(d => ({ ...d, content: fixLinksColor(d.content || "", BRAND_LINK_COLOR) }));
  }

  const hardErrorsCount = issues.filter(i => i.level === "error").length;
  const warnings = issues.filter(i => i.level === "warn");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{index !== null ? "Editar Post" : "Novo Post"}</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-2xl border" onClick={onBack}>
            Voltar
          </button>
          <button
            className={`px-4 py-2 rounded-2xl ${hardErrorsCount ? "bg-gray-300 text-gray-600" : "bg-[#11493C] text-white"}`}
            onClick={handleSaveLocal}
            disabled={hardErrorsCount > 0}
            title={hardErrorsCount ? "Corrija os erros antes de salvar" : "Salvar localmente"}
          >
            Salvar (local)
          </button>
          <button
            className="px-4 py-2 rounded-2xl border"
            onClick={saveDirectToFile}
            disabled={!fileHandle || hardErrorsCount > 0}
            title={!fileHandle ? "Conecte o posts.ts" : (hardErrorsCount ? "Corrija os erros antes de salvar" : "Salvar no src/data/posts.ts")}
          >
            Salvar em posts.ts
          </button>
        </div>
      </div>

      {/* Painel de auditoria */}
      {(issues.length > 0) && (
        <div className="rounded-xl border p-4">
          <div className="font-semibold mb-2">Auditoria do post</div>
          <ul className="list-disc ml-5 space-y-1 text-sm">
            {issues.map((i, idx) => (
              <li key={idx} className={i.level === "error" ? "text-red-700" : "text-amber-700"}>
                <strong>{i.level === "error" ? "Erro:" : "Aviso:"}</strong> {i.message}
              </li>
            ))}
          </ul>

          {/* Ação rápida para links */}
          {warnings.some(w => /links.*cor/i.test(w.message)) && (
            <div className="mt-3">
              <button className="px-3 py-1.5 rounded-2xl border" onClick={handleFixLinks}>
                Ajustar cor dos links (#ce9e0d)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Básico */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Título</label>
          <input
            className="w-full border rounded-2xl px-3 py-2"
            value={draft.title}
            onChange={(e) => handleTitleChange(e.target.value)}
          />
          <div className="text-xs text-gray-500 mt-1">Ideal ≤ 60–65 caracteres.</div>
        </div>
        <div>
          <label className="block text-sm mb-1">Slug</label>
          <input
            className="w-full border rounded-2xl px-3 py-2 font-mono"
            value={draft.slug}
            onChange={(e) => handleSlugChange(e.target.value)}
          />
          <div className="text-xs text-gray-500 mt-1">Será usado na URL. Ex.: gestao-do-conhecimento</div>
        </div>

        <div>
          <label className="block text-sm mb-1">Data (YYYY-MM-DD)</label>
          <input
            className="w-full border rounded-2xl px-3 py-2"
            value={draft.date}
            onChange={(e) => setDraft(d => ({ ...d, date: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Autor</label>
          <input
            className="w-full border rounded-2xl px-3 py-2"
            value={draft.author}
            onChange={(e) => setDraft(d => ({ ...d, author: e.target.value }))}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm mb-1">Resumo (excerpt)</label>
          <textarea
            className="w-full border rounded-2xl px-3 py-2 h-20"
            value={draft.excerpt}
            onChange={(e) => setDraft(d => ({ ...d, excerpt: e.target.value }))}
          />
        </div>
      </section>

      {/* Imagem */}
      <section className="grid grid-cols-1 gap-4">
        <ImagePicker
          slug={draft.slug}
          value={draft.imageUrl}
          onChange={(newUrl) => setDraft(d => ({ ...d, imageUrl: newUrl }))}
          folderPrefix="/src/assets/Imgblog/"
          maxWidth={1600}
        />
      </section>

      {/* SEO */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Meta Description</label>
          <textarea
            className="w-full border rounded-2xl px-3 py-2 h-20"
            value={draft.metaDescription}
            onChange={(e) => setDraft(d => ({ ...d, metaDescription: e.target.value }))}
          />
          <div className="text-xs text-gray-500 mt-1">
            Aparece somente como meta tag (não no front). Ideal ~155 caracteres.
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Canonical URL (opcional)</label>
          <input
            className="w-full border rounded-2xl px-3 py-2"
            value={draft.canonicalUrl}
            onChange={(e) => setDraft(d => ({ ...d, canonicalUrl: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Categoria (opcional)</label>
          <input
            className="w-full border rounded-2xl px-3 py-2"
            value={draft.category}
            onChange={(e) => setDraft(d => ({ ...d, category: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Tags</label>
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-2xl px-3 py-2"
              placeholder="adicione uma tag e pressione +"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
            />
            <button className="px-3 py-2 rounded-2xl border" onClick={addTag} type="button">+</button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {(draft.tags || []).map(t => (
              <span key={t} className="px-2 py-1 rounded-full bg-gray-100 border text-sm">
                {t} <button className="ml-1 text-red-600" onClick={() => removeTag(t)} title="remover">×</button>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Editor de conteúdo (WYSIWYG) */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm">Conteúdo (HTML)</label>
          <div className="text-xs text-gray-600">
            Use <code>&lt;strong style="font-size: 26px;"&gt;</code> para títulos e <code>20–24px</code> para subtítulos.{" "}
            Links internos com <code>style="color: {BRAND_LINK_COLOR}"</code>.
          </div>
        </div>

        <RichTextEditor
          value={draft.content}
          onChange={(html) => setDraft(d => ({ ...d, content: html }))}
          brandLinkColor={BRAND_LINK_COLOR}
        />

        <div className="flex gap-2 mt-3">
          <button className="px-4 py-2 rounded-2xl border" onClick={() => setShowPreview(v => !v)}>
            {showPreview ? "Ocultar Preview" : "Pré-visualizar"}
          </button>
          <button className="px-4 py-2 rounded-2xl border" onClick={generatePushCode}>
            Gerar código posts.push(...)
          </button>
          <button className="px-4 py-2 rounded-2xl border" onClick={handleFixLinks}>
            Ajustar cor dos links
          </button>
          {code && (
            <button className="px-4 py-2 rounded-2xl bg-[#11493C] text-white" onClick={downloadCode}>
              Baixar snippet
            </button>
          )}
        </div>

        {showPreview && (
          <div className="mt-4 border rounded-2xl p-4">
            <div className="text-sm text-gray-500 mb-2">Preview (renderizado):</div>
            <div dangerouslySetInnerHTML={{ __html: draft.content }} />
          </div>
        )}
      </section>

      {/* Código gerado */}
      {code && (
        <section className="mt-6">
          <div className="text-sm font-semibold mb-2">Código gerado:</div>
          <pre className="whitespace-pre-wrap text-xs border rounded-2xl p-3 bg-gray-50">{code}</pre>
        </section>
      )}
    </div>
  );
}

/* ---------------- helpers ---------------- */

function escapeStr(s: string) {
  return (s || "")
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$")
    .replace(/'/g, "\\'");
}

function escapeAttr(s: string) {
  return (s || "")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildJsonLd(opts: {
  title: string;
  date: string;
  author: string;
  imageUrl: string;
  description?: string;
  canonicalUrl?: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": opts.title,
    "datePublished": opts.date,
    "author": { "@type": "Person", "name": opts.author },
    "publisher": { "@type": "Organization", "name": "UniCV Polo Manaus Flores" },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": opts.canonicalUrl || "https://www.unicvpoloam.com.br/"
    },
    "image": opts.imageUrl,
    "description": opts.description || ""
  };
  return JSON.stringify(data, null, 2);
}

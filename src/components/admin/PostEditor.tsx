// src/components/admin/PostEditor.tsx
import { useEffect, useMemo, useState } from "react";
import { useAdminPosts } from "@/hooks/useAdminPosts";
import { slugify } from "@/utils/slugify";
import type { Post } from "@/types/post";
import ImagePicker from "@/components/admin/ImagePicker";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { validateDraft, fixLinksColor, type Issue } from "@/utils/seoAudit";
import { uploadInlineMedia } from "@/lib/supabaseClient";

type Props = {
  index: number | null;          // índice do post para editar; null = novo
  onBack: () => void;
};

type Draft = Post & {
  metaDescription?: string;
  tags?: string[];
  canonicalUrl?: string;
  category?: string;
};

const DEFAULT_AUTHOR = "UniCV Polo Manaus Flores";
const BRAND_LINK_COLOR = "#ce9e0d";

export default function PostEditor({ index, onBack }: Props) {
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
  const [issues, setIssues] = useState<Issue[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(initial);
    setErrors([]);
    setShowPreview(false);
  }, [initial]);

  // Revalida a cada alteração relevante
  useEffect(() => {
    const res = validateDraft(draft, posts, index ?? null);
    setIssues(res);
  }, [draft, posts, index]);

  function handleTitleChange(v: string) {
    const s = slugify(v);
    setDraft(d => ({
      ...d,
      title: v,
      slug: d.slug ? d.slug : s,
    }));
  }

  function handleSlugChange(v: string) {
    const s = slugify(v);
    setDraft(d => ({
      ...d,
      slug: s,
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
    const hardErrors = issues.filter(i => i.level === "error").map(i => i.message);
    return hardErrors;
  }

  async function handleSave() {
    const hardErrors = validateBlocking();
    setErrors(hardErrors);
    if (hardErrors.length > 0) return;

    setSaving(true);
    try {
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
      await upsertPost(index, payload);
      alert("Post salvo com sucesso no Supabase! 🎉");
      onBack();
    } catch (err: any) {
      console.error(err);
      alert(`Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
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
          <button className="px-4 py-2 rounded-2xl border" onClick={onBack} disabled={saving}>
            Voltar
          </button>
          <button
            className={`px-4 py-2 rounded-2xl ${hardErrorsCount || saving ? "bg-gray-300 text-gray-600" : "bg-[#11493C] text-white"}`}
            onClick={handleSave}
            disabled={hardErrorsCount > 0 || saving}
            title={hardErrorsCount ? "Corrija os erros antes de salvar" : "Salvar no Supabase"}
          >
            {saving ? "Salvando..." : "Salvar"}
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

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        <section className="space-y-4">
          <div className="rounded-2xl border p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold">Conteudo</label>
              <div className="text-xs text-gray-600">
                Use o menu para inserir midia e formatacao.
              </div>
            </div>

            <RichTextEditor
              value={draft.content}
              onChange={(html) => setDraft(d => ({ ...d, content: html }))}
              brandLinkColor={BRAND_LINK_COLOR}
              onUploadImage={(file) => uploadInlineMedia(file, "content-images")}
              onUploadVideo={(file) => uploadInlineMedia(file, "content-videos")}
            />

            <div className="flex gap-2 mt-3">
              <button className="px-4 py-2 rounded-2xl border" onClick={() => setShowPreview(v => !v)}>
                {showPreview ? "Ocultar Preview" : "Pre-visualizar"}
              </button>
              <button className="px-4 py-2 rounded-2xl border" onClick={handleFixLinks}>
                Ajustar cor dos links
              </button>
            </div>

            {showPreview && (
              <div className="mt-4 border rounded-2xl p-4">
                <div className="text-sm text-gray-500 mb-2">Preview (renderizado):</div>
                <div dangerouslySetInnerHTML={{ __html: draft.content }} />
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border p-4 space-y-3">
            <div className="font-semibold">Informacoes</div>
            <div>
              <label className="block text-sm mb-1">Titulo</label>
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
              <div className="text-xs text-gray-500 mt-1">Sera usado na URL.</div>
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
            <div>
              <label className="block text-sm mb-1">Resumo (excerpt)</label>
              <textarea
                className="w-full border rounded-2xl px-3 py-2 h-20"
                value={draft.excerpt}
                onChange={(e) => setDraft(d => ({ ...d, excerpt: e.target.value }))}
              />
            </div>
          </section>

          <section className="rounded-2xl border p-4">
            <ImagePicker
              slug={draft.slug}
              value={draft.imageUrl}
              onChange={(newUrl) => setDraft(d => ({ ...d, imageUrl: newUrl }))}
              maxWidth={1600}
            />
          </section>

          <section className="rounded-2xl border p-4 space-y-3">
            <div className="font-semibold">SEO</div>
            <div>
              <label className="block text-sm mb-1">Meta Description</label>
              <textarea
                className="w-full border rounded-2xl px-3 py-2 h-20"
                value={draft.metaDescription}
                onChange={(e) => setDraft(d => ({ ...d, metaDescription: e.target.value }))}
              />
              <div className="text-xs text-gray-500 mt-1">
                Ideal ~155 caracteres.
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
        </aside>
      </div>
    </div>
  );
}

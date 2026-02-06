import { useMemo, useState } from "react";
import { useAdminPosts } from "@/hooks/useAdminPosts";
import type { Post } from "@/types/post";

export default function PostList({
  onEdit,
  onCreate,
}: {
  onEdit: (index: number) => void;
  onCreate: () => void;
}) {
  const { posts, removePost, duplicatePost, loading, error } = useAdminPosts();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(p =>
      (p.title?.toLowerCase() ?? "").includes(q) ||
      (p.slug?.toLowerCase() ?? "").includes(q) ||
      (p.author?.toLowerCase() ?? "").includes(q)
    );
  }, [query, posts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Carregando posts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="font-semibold text-red-800">Erro ao carregar posts</div>
        <div className="text-sm text-red-600 mt-1">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-3">
        <input
          placeholder="Buscar por título, slug ou autor..."
          className="w-full md:w-80 rounded-2xl border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          value={query}
          onChange={(e)=>setQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {filtered.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Nenhum post encontrado. Tente ajustar sua busca.
          </div>
        )}

        {filtered.map((post, idxInFiltered) => {
          // Precisamos do índice real no array original para editar/excluir
          const realIndex = posts.findIndex(p => p.slug === post.slug);

          return (
            <div key={post.slug} className="rounded-2xl border bg-card p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 transition-colors">
              <div className="flex items-start gap-4">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-28 h-20 object-cover rounded-lg border"
                  onError={(e: any) => { e.currentTarget.style.opacity = 0.3; }}
                />
                <div>
                  <div className="font-semibold text-foreground">{post.title}</div>
                  <div className="text-xs text-muted-foreground">
                    slug: <span className="font-mono">{post.slug}</span> • {post.date} • {post.author}
                  </div>
                  <div className="text-sm text-muted-foreground/80 line-clamp-2 mt-1">{post.excerpt}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1.5 rounded-2xl border bg-background text-foreground hover:bg-muted/60 text-sm transition-colors"
                  onClick={() => onEdit(realIndex)}
                  title="Editar post"
                >
                  Editar
                </button>
                <button
                  className="px-3 py-1.5 rounded-2xl border bg-background text-foreground hover:bg-muted/60 text-sm transition-colors"
                  onClick={async () => {
                    await duplicatePost(realIndex);
                  }}
                  title="Duplicar post"
                >
                  Duplicar
                </button>
                <button
                  className="px-3 py-1.5 rounded-2xl border border-red-200 bg-red-50/80 text-red-700 hover:bg-red-100 dark:border-red-500/40 dark:bg-red-500/20 dark:text-red-50 dark:hover:bg-red-500/30 text-sm transition-colors"
                  onClick={() => {
                    const ok = confirm(`Excluir "${post.title}" do Supabase?`);
                    if (ok) removePost(realIndex);
                  }}
                  title="Excluir do Supabase"
                >
                  Excluir
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-muted-foreground">
        Total: {posts.length} post{posts.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

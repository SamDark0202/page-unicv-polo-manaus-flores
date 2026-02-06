import { useEffect, useState } from "react";
import type { Post } from "@/types/post";
import { fetchPosts, upsertPost as upsertSupabase, deletePost as deleteSupabase } from "@/lib/supabaseClient";

export function useAdminPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      setLoading(true);
      const data = await fetchPosts();
      setPosts(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar posts");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function upsertPost(index: number | null, data: Post) {
    try {
      await upsertSupabase(data);
      await loadPosts(); // reload from db
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message}`);
      throw err;
    }
  }

  async function removePost(index: number) {
    const post = posts[index];
    if (!post) return;
    try {
      await deleteSupabase(post.slug);
      await loadPosts();
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message}`);
      throw err;
    }
  }

  async function duplicatePost(index: number) {
    const basePost = posts[index];
    if (!basePost) return;
    const clone = { ...basePost };
    // gera slug único incrementando sufixo
    let base = clone.slug.replace(/-\d+$/, "");
    let inc = 2;
    let newSlug = `${base}-${inc}`;
    const slugs = new Set(posts.map(p => p.slug));
    while (slugs.has(newSlug)) {
      inc += 1;
      newSlug = `${base}-${inc}`;
    }
    clone.slug = newSlug;
    clone.title = `${clone.title} (Cópia)`;
    clone.date = new Date().toISOString().slice(0, 10);

    try {
      await upsertSupabase(clone);
      await loadPosts();
    } catch (err: any) {
      alert(`Erro ao duplicar: ${err.message}`);
      throw err;
    }
  }

  function replaceAll(postsNew: Post[]) {
    setPosts(postsNew);
  }

  return { posts, setPosts, upsertPost, removePost, duplicatePost, replaceAll, loading, error, reload: loadPosts };
}

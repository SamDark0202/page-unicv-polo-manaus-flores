import { useEffect, useState } from "react";
import type { Post } from "@/types/post";

// Tenta importar no formato mais comum: default export OU named export.
import * as postsModule from "@/data/posts";

function getModulePosts(): Post[] {
  // Tenta pegar default ou named "posts"
  const mod: any = postsModule as any;
  const arr = (mod.default || mod.posts) as Post[] | undefined;
  if (Array.isArray(arr)) return arr;

  // fallback: alguns projetos exportam um getter
  if (typeof mod.getPosts === "function") {
    return mod.getPosts();
  }

  console.warn("[Admin] Não foi possível detectar o array de posts em src/data/posts.ts. Verifique o export (default ou named 'posts').");
  return [];
}

const SESSION_KEY = "ucv-admin-posts";

export function useAdminPosts() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    // 1) carrega do sessionStorage (edições locais em andamento)
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Post[];
        setPosts(parsed);
        return;
      } catch {}
    }
    // 2) carrega do módulo (estado inicial do repo)
    const fromModule = getModulePosts();
    // Ordena por data desc no primeiro load
    const sorted = [...fromModule].sort((a, b) => (a.date < b.date ? 1 : -1));
    setPosts(sorted);
  }, []);

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(posts));
  }, [posts]);

  function upsertPost(index: number | null, data: Post) {
    setPosts((prev) => {
      const copy = [...prev];
      if (index === null || index < 0 || index >= prev.length) {
        copy.unshift(data); // novo no topo
      } else {
        copy[index] = data;
      }
      return copy;
    });
  }

  function removePost(index: number) {
    setPosts((prev) => prev.filter((_, i) => i !== index));
  }

  function duplicatePost(index: number) {
    setPosts((prev) => {
      const clone = { ...prev[index] };
      // gera slug único incrementando sufixo
      let base = clone.slug.replace(/-\d+$/, "");
      let inc = 2;
      let newSlug = `${base}-${inc}`;
      const slugs = new Set(prev.map(p => p.slug));
      while (slugs.has(newSlug)) {
        inc += 1;
        newSlug = `${base}-${inc}`;
      }
      clone.slug = newSlug;
      clone.title = `${clone.title} (Cópia)`;
      // data atual opcional
      // clone.date = new Date().toISOString().slice(0,10);
      return [clone, ...prev];
    });
  }

  function replaceAll(postsNew: Post[]) {
    setPosts(postsNew);
  }

  return { posts, setPosts, upsertPost, removePost, duplicatePost, replaceAll };
}

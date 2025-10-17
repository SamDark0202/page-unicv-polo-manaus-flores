// src/pages/Controle.tsx
import { useState } from "react";
import LoginGate from "../components/admin/LoginGate";
import PostList from "../components/admin/PostList";
import PostEditor from "../components/admin/PostEditor";
import { pickPostsFile, readText } from "../utils/postsFileBridge";

type View = "list" | "editor";

export default function Controle() {
  const [view, setView] = useState<View>("list");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [fileHandle, setFileHandle] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  async function connectFile() {
    const h = await pickPostsFile();
    if (h) {
      setFileHandle(h);
      const txt = await readText(h);
      if (!/posts\.push\(/.test(txt)) {
        alert(
          "Aviso: não encontrei 'posts.push(' no arquivo selecionado. Confirme se é o 'src/data/posts.ts'."
        );
      } else {
        alert("Arquivo 'posts.ts' conectado com sucesso!");
      }
    }
  }

  // Quando voltar do editor, força um remount da lista para recarregar do sessionStorage
  function backToListAndRefresh() {
    setView("list");
    // pequeno atraso para garantir que o sessionStorage do editor foi gravado
    setTimeout(() => setRefreshKey((k) => k + 1), 0);
  }

  return (
    <LoginGate>
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-10 border-b bg-white">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
            <div className="text-xl font-bold">Painel • UniCV Polo Manaus Flores</div>
            <div className="space-x-2">
              <button
                className="px-4 py-2 rounded-2xl border"
                onClick={connectFile}
                title="Selecionar e conectar src/data/posts.ts"
              >
                Conectar posts.ts
              </button>
              <button
                className="px-4 py-2 rounded-2xl bg-[#11493C] text-white hover:opacity-90"
                onClick={() => {
                  setView("editor");
                  setEditingIndex(null);
                }}
              >
                + Novo Post
              </button>
              <button
                className="px-4 py-2 rounded-2xl border"
                onClick={() => setView("list")}
              >
                Posts
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6">
          {view === "list" && (
            <PostList
              key={`list-${refreshKey}`} // <— remount garantido ao voltar do editor
              onEdit={(idx) => {
                setEditingIndex(idx);
                setView("editor");
              }}
              onCreate={() => {
                setEditingIndex(null);
                setView("editor");
              }}
            />
          )}

          {view === "editor" && (
            <PostEditor
              index={editingIndex}
              onBack={backToListAndRefresh}   // <— volta e força recarregar a lista
              fileHandle={fileHandle}         // editor salva direto no src/data/posts.ts se conectado
            />
          )}
        </main>
      </div>
    </LoginGate>
  );
}

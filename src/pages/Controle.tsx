// src/pages/Controle.tsx
import { useState } from "react";
import LoginGate from "../components/admin/LoginGate";
import PostList from "../components/admin/PostList";
import PostEditor from "../components/admin/PostEditor";

type View = "list" | "editor";

export default function Controle() {
  const [view, setView] = useState<View>("list");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function backToList() {
    setView("list");
  }

  return (
    <LoginGate>
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-10 border-b bg-white">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
            <div className="text-xl font-bold">Painel • UniCV Polo Manaus Flores</div>
            <div className="space-x-2">
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
              onBack={backToList}
            />
          )}
        </main>
      </div>
    </LoginGate>
  );
}

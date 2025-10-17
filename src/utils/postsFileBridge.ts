// src/utils/postsFileBridge.ts
// Permite escolher o arquivo posts.ts, ler e escrever dentro dele.
// Requer Chrome/Edge em https ou localhost.

export type FSHandle = FileSystemFileHandle;

const LS_KEY = "ucv-posts-handle";

export async function pickPostsFile(): Promise<FSHandle | null> {
  // @ts-ignore
  if (!window.showOpenFilePicker) {
    alert("Seu navegador não suporta File System Access API. Use Chrome/Edge em https/localhost.");
    return null;
  }
  // @ts-ignore
  const [handle] = await window.showOpenFilePicker({
    types: [
      {
        description: "posts.ts",
        accept: { "text/typescript": [".ts"] },
      },
    ],
    excludeAcceptAllOption: false,
    multiple: false,
  });
  localStorage.setItem(LS_KEY, await serializeHandle(handle));
  return handle;
}

// Persistência do handle (Origin Private File System)
async function serializeHandle(handle: FSHandle): Promise<string> {
  // Alguns browsers permitem put no localStorage via serialização permissiva
  // Tentamos a API nova; se indisponível, caímos fora sem persistir.
  try {
    // @ts-ignore
    const ser = await (handle as any).serialize?.();
    return ser ?? "";
  } catch {
    return "";
  }
}

export async function restoreHandle(): Promise<FSHandle | null> {
  const ser = localStorage.getItem(LS_KEY);
  if (!ser) return null;
  try {
    // @ts-ignore
    const handle = await (window as any).FileSystemFileHandle.deserialize?.(ser);
    return handle ?? null;
  } catch {
    return null;
  }
}

export async function readText(handle: FSHandle): Promise<string> {
  const file = await handle.getFile();
  return await file.text();
}

export async function writeText(handle: FSHandle, text: string) {
  const writable = await handle.createWritable();
  await writable.write(text);
  await writable.close();
}

export function upsertPostPush(sourceTs: string, pushCode: string, slug: string): string {
  // localiza bloco posts.push({ ... slug: 'X' ... });
  const slugEsc = slug.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const re = new RegExp(
    String.raw`posts\.push\(\s*{[\s\S]*?slug:\s*['"\`]${slugEsc}['"\`][\s\S]*?}\s*\);\s*`,
    "m"
  );

  if (re.test(sourceTs)) {
    // substitui bloco existente
    return sourceTs.replace(re, pushCode.trim() + "\n");
  }
  // senão, adiciona no final (com quebra de linha)
  const sep = sourceTs.endsWith("\n") ? "" : "\n";
  return sourceTs + sep + pushCode.trim() + "\n";
}

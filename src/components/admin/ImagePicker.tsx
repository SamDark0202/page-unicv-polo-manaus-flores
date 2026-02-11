import { useEffect, useRef, useState } from "react";
import { uploadCoverImage } from "@/lib/supabaseClient";

type Props = {
  slug: string;
  value: string; // imageUrl atual (caminho)
  onChange: (newUrl: string) => void;
  maxWidth?: number;     // default: 1600
};

export default function ImagePicker({
  slug,
  value,
  onChange,
  maxWidth = 1600,
}: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [filename, setFilename] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const safeSlug = (slug || "").trim();
    if (value) {
      // tenta extrair nome do caminho
      const parts = value.split("/");
      setFilename(parts[parts.length - 1] || `${safeSlug}.png`);
    } else {
      setFilename("imagem.png");
    }
  }, [slug, value]);

  function chooseFile() {
    fileRef.current?.click();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!slug.trim()) {
      setStatus("Informe o slug antes de enviar a imagem.");
      return;
    }
    setStatus("Processando imagem...");

    try {
      setUploading(true);
      const pngBlob = await toPngResized(file, maxWidth);
      const pngFile = new File([pngBlob], `${slug}.png`, { type: "image/png" });

      const url = await uploadCoverImage(pngFile, slug);
      setPreviewUrl(url);
      setFilename(url.split("/").pop() || "imagem.png");
      onChange(url);
      setStatus("Imagem enviada com sucesso.");
    } catch (err: any) {
      console.error(err);
      setStatus("Falha ao enviar a imagem. Tente outra ou reduza a resolução.");
    } finally {
      setUploading(false);
    }
  }

  function clearImage() {
    setPreviewUrl("");
    setFilename("imagem.png");
    onChange("");
    setStatus("Imagem removida.");
  }

  return (
    <div className="rounded-2xl border p-4 dark:border-gray-600 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold dark:text-gray-100">Imagem do Post</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">PNG otimizado • Largura max: {maxWidth}px</div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <div className="flex gap-2">
            <button
              className="px-3 py-2 rounded-2xl border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100"
              onClick={chooseFile}
              type="button"
              disabled={uploading}
            >
              {uploading ? "Enviando..." : "Selecionar e enviar"}
            </button>
            <button
              className="px-3 py-2 rounded-2xl border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 disabled:opacity-50"
              onClick={clearImage}
              type="button"
              disabled={uploading || !value}
            >
              Remover imagem
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />

          <div className="mt-3 text-sm dark:text-gray-300">
            <div className="flex flex-wrap gap-1">
              <span className="text-gray-500 dark:text-gray-400">Arquivo:</span>
              <code className="break-all dark:bg-gray-800 px-1 rounded">{filename || "imagem.png"}</code>
            </div>
            <div className="text-gray-500 dark:text-gray-400 break-words">
              URL salva no post: <code className="break-all dark:bg-gray-800 px-1 rounded">{value || "(vazio)"}</code>
            </div>
          </div>

          {status && <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">{status}</div>}
        </div>

        <div className="w-full md:w-1/3">
          {value || previewUrl ? (
            <img
              src={value || previewUrl}
              alt="preview"
              className="w-full aspect-video object-cover rounded-lg border dark:border-gray-600"
              onError={(e:any)=>{ e.currentTarget.style.opacity=0.3; }}
            />
          ) : (
            <div className="grid place-items-center w-full aspect-video border rounded-lg text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400 dark:bg-gray-800">
              Sem preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- utils ---------------- */

function toPngResized(file: File, maxWidth = 1600): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const targetW = Math.round(img.width * scale);
        const targetH = Math.round(img.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas não suportado"));

        ctx.drawImage(img, 0, 0, targetW, targetH);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Falha ao gerar PNG"));
            resolve(blob);
          },
          "image/png",
          0.92
        );
      };
      img.onerror = () => reject(new Error("Não foi possível carregar a imagem"));
      img.src = String(fr.result);
    };
    fr.onerror = () => reject(new Error("Falha ao ler arquivo"));
    fr.readAsDataURL(file);
  });
}

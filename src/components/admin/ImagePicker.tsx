import { useEffect, useRef, useState } from "react";

type Props = {
  slug: string;
  value: string; // imageUrl atual (caminho)
  onChange: (newUrl: string) => void;
  folderPrefix?: string; // default: "/src/assets/Imgblog/"
  maxWidth?: number;     // default: 1600
};

export default function ImagePicker({
  slug,
  value,
  onChange,
  folderPrefix = "/src/assets/Imgblog/",
  maxWidth = 1600,
}: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [filename, setFilename] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    const safeSlug = (slug || "").trim();
    if (!value && safeSlug) {
      setFilename(`${safeSlug}.png`);
    } else if (value) {
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
    setStatus("Lendo imagem…");

    try {
      const pngBlob = await toPngResized(file, maxWidth);
      // cria URL de preview
      const url = URL.createObjectURL(pngBlob);
      setPreviewUrl(url);

      // Sugere caminho final para o projeto
      const safeSlug = (slug || "imagem").trim();
      const suggestedName = `${safeSlug}.png`;
      setFilename(suggestedName);

      // Atualiza o imageUrl no PostEditor
      const finalPath = `${folderPrefix}${suggestedName}`;
      onChange(finalPath);

      setStatus("Imagem pronta para download. Clique em 'Baixar PNG otimizado'.");
    } catch (err: any) {
      console.error(err);
      setStatus("Falha ao processar a imagem. Tente outra ou reduza a resolução.");
    }
  }

  function downloadOptimized() {
    if (!previewUrl) {
      alert("Selecione uma imagem primeiro.");
      return;
    }
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = filename || "imagem.png";
    a.click();
  }

  function copyPath() {
    const path = `${folderPrefix}${filename || "imagem.png"}`;
    navigator.clipboard.writeText(path);
    setStatus("Caminho copiado para a área de transferência.");
  }

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">Imagem do Post</div>
        <div className="text-xs text-gray-500">Formato final: PNG • Largura máx: {maxWidth}px</div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-2/3">
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded-2xl border" onClick={chooseFile} type="button">
              Selecionar arquivo
            </button>
            <button className="px-3 py-2 rounded-2xl border" onClick={downloadOptimized} type="button">
              Baixar PNG otimizado
            </button>
            <button className="px-3 py-2 rounded-2xl border" onClick={copyPath} type="button">
              Copiar caminho final
            </button>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />

          <div className="mt-3 text-sm">
            <div><span className="text-gray-500">Nome sugerido:</span> <code>{filename || "imagem.png"}</code></div>
            <div className="text-gray-500">Mover para: <code>src/assets/Imgblog</code></div>
            <div className="text-gray-500">Caminho salvo no post: <code>{value || `${folderPrefix}${filename || "imagem.png"}`}</code></div>
          </div>

          {status && <div className="mt-2 text-xs text-gray-600">{status}</div>}
        </div>

        <div className="w-full md:w-1/3">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="preview"
              className="w-full aspect-video object-cover rounded-lg border"
              onError={(e:any)=>{ e.currentTarget.style.opacity=0.3; }}
            />
          ) : (
            <div className="grid place-items-center w-full aspect-video border rounded-lg text-sm text-gray-500">
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

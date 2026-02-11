import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;                      // HTML atual
  onChange: (html: string) => void;   // retorna HTML
  brandLinkColor?: string;            // default: #ce9e0d
  onUploadImage?: (file: File) => Promise<string>;
  onUploadVideo?: (file: File) => Promise<string>;
};

const BRAND = "#ce9e0d";

/** Ícones de alinhamento SVG profissionais */
const AlignLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="2" y1="3" x2="14" y2="3"/>
    <line x1="2" y1="6" x2="10" y2="6"/>
    <line x1="2" y1="9" x2="14" y2="9"/>
    <line x1="2" y1="12" x2="10" y2="12"/>
  </svg>
);

const AlignCenterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="1" y1="3" x2="15" y2="3"/>
    <line x1="3" y1="6" x2="13" y2="6"/>
    <line x1="1" y1="9" x2="15" y2="9"/>
    <line x1="3" y1="12" x2="13" y2="12"/>
  </svg>
);

const AlignRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="2" y1="3" x2="14" y2="3"/>
    <line x1="6" y1="6" x2="14" y2="6"/>
    <line x1="2" y1="9" x2="14" y2="9"/>
    <line x1="6" y1="12" x2="14" y2="12"/>
  </svg>
);

const AlignJustifyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="2" y1="3" x2="14" y2="3"/>
    <line x1="2" y1="6" x2="14" y2="6"/>
    <line x1="2" y1="9" x2="14" y2="9"/>
    <line x1="2" y1="12" x2="14" y2="12"/>
  </svg>
);

/** Insere HTML ao redor da seleção atual (fallback simples e prático) */
function wrapSelectionWith(htmlBefore: string, htmlAfter: string) {
  const sel = window.getSelection?.();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);

  const frag = range.extractContents();
  const container = document.createElement("div");
  container.appendChild(frag);

  const wrapper = document.createElement("span");
  wrapper.innerHTML = htmlBefore + container.innerHTML + htmlAfter;

  range.insertNode(wrapper);
  // posiciona cursor após o wrapper
  range.setStartAfter(wrapper);
  range.setEndAfter(wrapper);
  sel.removeAllRanges();
  sel.addRange(range);
}

/** Aplica style de cor nos <a> sem sobrescrever outros estilos */
function enforceLinkColor(root: HTMLElement, brandColor: string) {
  const links = root.querySelectorAll("a");
  links.forEach((a) => {
    const style = (a.getAttribute("style") || "").trim();
    const noColor = !/color\s*:/.test(style);
    if (noColor) a.setAttribute("style", (style ? style + ";" : "") + `color:${brandColor}`);
  });
}

export default function RichTextEditor({
  value,
  onChange,
  brandLinkColor = BRAND,
  onUploadImage,
  onUploadVideo,
}: Props) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const [bubble, setBubble] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  useEffect(() => {
    // sincroniza HTML inicial ao montar/trocar post
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
      enforceLinkColor(editorRef.current, brandLinkColor);
    }
  }, [value, brandLinkColor]);

  function emitChange() {
    if (!editorRef.current) return;
    enforceLinkColor(editorRef.current, brandLinkColor);
    onChange(editorRef.current.innerHTML);
  }

  function cmd(command: string, showUI = false, value?: string) {
    editorRef.current?.focus();
    document.execCommand(command, showUI, value);
    emitChange();
  }

  function onCreateLink() {
    editorRef.current?.focus();
    const url = prompt("Informe a URL do link:");
    if (!url) return;
    document.execCommand("createLink", false, url);
    emitChange();
  }

  function onTitle26() {
    wrapSelectionWith(`<strong style="font-size:26px;">`, `</strong>`);
    emitChange();
  }
  
  function onSubtitle22() {
    wrapSelectionWith(`<strong style="font-size:22px;">`, `</strong>`);
    emitChange();
  }

  function onAlignLeft() {
    document.execCommand("justifyLeft");
    emitChange();
  }

  function onAlignCenter() {
    document.execCommand("justifyCenter");
    emitChange();
  }

  function onAlignRight() {
    document.execCommand("justifyRight");
    emitChange();
  }

  function onAlignJustify() {
    document.execCommand("justifyFull");
    emitChange();
  }

  function onClearFormat() {
    editorRef.current?.focus();
    document.execCommand("removeFormat");
    // remove <font> etc que alguns browsers injetam
    if (editorRef.current) {
      editorRef.current.querySelectorAll("font").forEach((n) => n.replaceWith(...Array.from(n.childNodes)));
    }
    emitChange();
  }

  function saveSelection() {
    const sel = window.getSelection?.();
    if (!sel || sel.rangeCount === 0) return;
    savedRangeRef.current = sel.getRangeAt(0);
  }

  function restoreSelection() {
    const sel = window.getSelection?.();
    if (!sel || !savedRangeRef.current) return;
    sel.removeAllRanges();
    sel.addRange(savedRangeRef.current);
  }

  function insertHtmlAtCursor(html: string) {
    editorRef.current?.focus();
    restoreSelection();
    document.execCommand("insertHTML", false, html);
    emitChange();
  }

  function onInsertYouTube() {
    const input = prompt("URL ou ID do YouTube:");
    if (!input) return;
    const id = extractYouTubeId(input);
    if (!id) {
      alert("URL do YouTube invalida.");
      return;
    }
    const html = `
      <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;">
        <iframe
          src="https://www.youtube.com/embed/${id}"
          title="YouTube video"
          style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    `;
    insertHtmlAtCursor(html);
  }

  function updateBubble() {
    const sel = window.getSelection?.();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) {
      setBubble((b) => ({ ...b, visible: false }));
      return;
    }
    const range = sel.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) {
      setBubble((b) => ({ ...b, visible: false }));
      return;
    }
    const rect = range.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;
    setBubble({ x, y, visible: true });
    saveSelection();
  }

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!onUploadImage) {
      alert("Upload de imagem nao configurado.");
      return;
    }
    try {
      const url = await onUploadImage(file);
      insertHtmlAtCursor(`<img src="${url}" alt="" style="max-width:100%;" />`);
    } catch (err) {
      console.error(err);
      alert("Falha ao enviar imagem.");
    } finally {
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  }

  async function handleVideoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!onUploadVideo) {
      alert("Upload de video nao configurado.");
      return;
    }
    try {
      const url = await onUploadVideo(file);
      insertHtmlAtCursor(`<video controls style="max-width:100%;" src="${url}"></video>`);
    } catch (err) {
      console.error(err);
      alert("Falha ao enviar video.");
    } finally {
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  }

  return (
    <div className="border rounded-2xl relative dark:border-gray-600 dark:bg-gray-950">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
        <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100" onClick={() => cmd("bold")}>B</button>
        <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100" onClick={() => cmd("italic")}><i>I</i></button>
        <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100" onClick={() => cmd("underline")}><u>U</u></button>
        <span className="mx-2 border-l dark:border-gray-600" />
        <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100" onClick={onTitle26}>Título 26px</button>
        <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100" onClick={onSubtitle22}>Subtítulo 22px</button>
        <span className="mx-2 border-l dark:border-gray-600" />
        <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100" onClick={() => cmd("insertUnorderedList")}>• Lista</button>
        <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100" onClick={() => cmd("insertOrderedList")}>1. Lista</button>
        <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100" onClick={() => cmd("formatBlock", false, "blockquote")}>" Citação</button>
        <span className="mx-2 border-l dark:border-gray-600" />
        <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 flex items-center justify-center w-8" onClick={onAlignLeft} title="Alinhar à esquerda"><AlignLeftIcon /></button>
        <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 flex items-center justify-center w-8" onClick={onAlignCenter} title="Alinhar ao centro"><AlignCenterIcon /></button>
        <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 flex items-center justify-center w-8" onClick={onAlignRight} title="Alinhar à direita"><AlignRightIcon /></button>
        <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 flex items-center justify-center w-8" onClick={onAlignJustify} title="Justificar"><AlignJustifyIcon /></button>
        <span className="mx-2 border-l dark:border-gray-600" />
        <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100" onClick={onCreateLink}>🔗 Link</button>
        <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100" onClick={onClearFormat}>Limpar</button>
        <span className="mx-2 border-l dark:border-gray-600" />
        <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100" onClick={() => imageInputRef.current?.click()}>
          + Imagem
        </button>
        <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100" onClick={onInsertYouTube}>YouTube</button>
        <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100" onClick={() => videoInputRef.current?.click()}>
          + Video
        </button>
      </div>

      {/* Área editável */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[260px] p-3 outline-none dark:bg-gray-800 dark:text-gray-100"
        onInput={emitChange}
        onBlur={emitChange}
        onMouseUp={updateBubble}
        onKeyUp={updateBubble}
      />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFile}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleVideoFile}
      />

      {bubble.visible && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 border dark:border-gray-600 shadow-sm rounded-xl px-2 py-1 flex gap-1"
          style={{
            top: Math.max(8, bubble.y - 10),
            left: Math.max(8, bubble.x),
            transform: "translate(-50%, -100%)",
          }}
        >
          <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100" onClick={() => cmd("bold")}>B</button>
          <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100" onClick={() => cmd("italic")}><i>I</i></button>
          <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100" onClick={() => cmd("underline")}><u>U</u></button>
          <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100" onClick={() => cmd("insertUnorderedList")}>•</button>
          <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100" onClick={() => cmd("formatBlock", false, "blockquote")}>"</button>
          <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 flex items-center justify-center w-6" onClick={onAlignLeft} title="Alinha esquerda"><AlignLeftIcon /></button>
          <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 flex items-center justify-center w-6" onClick={onAlignCenter} title="Alinha centro"><AlignCenterIcon /></button>
          <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 flex items-center justify-center w-6" onClick={onAlignRight} title="Alinha direita"><AlignRightIcon /></button>
          <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100" onClick={onCreateLink}>🔗</button>
          <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100" onClick={() => imageInputRef.current?.click()}>
            Img
          </button>
          <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100" onClick={onInsertYouTube}>YT</button>
          <button className="px-2 py-1 rounded border hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100" onClick={() => videoInputRef.current?.click()}>
            Vid
          </button>
        </div>
      )}
    </div>
  );
}

function extractYouTubeId(input: string) {
  try {
    if (input.includes("youtu.be/")) {
      return input.split("youtu.be/")[1]?.split("?")[0] || "";
    }
    if (input.includes("youtube.com")) {
      const url = new URL(input);
      return url.searchParams.get("v") || "";
    }
    return input;
  } catch {
    return "";
  }
}

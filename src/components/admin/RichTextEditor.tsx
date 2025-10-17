import { useEffect, useRef } from "react";

type Props = {
  value: string;                      // HTML atual
  onChange: (html: string) => void;   // retorna HTML
  brandLinkColor?: string;            // default: #ce9e0d
};

const BRAND = "#ce9e0d";

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

export default function RichTextEditor({ value, onChange, brandLinkColor = BRAND }: Props) {
  const editorRef = useRef<HTMLDivElement | null>(null);

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
    document.execCommand(command, showUI, value);
    emitChange();
  }

  function onCreateLink() {
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

  function onClearFormat() {
    document.execCommand("removeFormat");
    // remove <font> etc que alguns browsers injetam
    if (editorRef.current) {
      editorRef.current.querySelectorAll("font").forEach((n) => n.replaceWith(...Array.from(n.childNodes)));
    }
    emitChange();
  }

  return (
    <div className="border rounded-2xl">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50">
        <button className="px-2 py-1 rounded border" onClick={() => cmd("bold")}>B</button>
        <button className="px-2 py-1 rounded border" onClick={() => cmd("italic")}><i>I</i></button>
        <button className="px-2 py-1 rounded border" onClick={() => cmd("underline")}><u>U</u></button>
        <span className="mx-2 border-l" />
        <button className="px-2 py-1 rounded border" onClick={onTitle26}>Título 26px</button>
        <button className="px-2 py-1 rounded border" onClick={onSubtitle22}>Subtítulo 22px</button>
        <span className="mx-2 border-l" />
        <button className="px-2 py-1 rounded border" onClick={() => cmd("insertUnorderedList")}>• Lista</button>
        <button className="px-2 py-1 rounded border" onClick={() => cmd("insertOrderedList")}>1. Lista</button>
        <button className="px-2 py-1 rounded border" onClick={() => cmd("formatBlock", false, "blockquote")}>“ Citação</button>
        <span className="mx-2 border-l" />
        <button className="px-2 py-1 rounded border" onClick={onCreateLink}>🔗 Link</button>
        <button className="px-2 py-1 rounded border" onClick={onClearFormat}>Limpar</button>
      </div>

      {/* Área editável */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[260px] p-3 outline-none"
        onInput={emitChange}
        onBlur={emitChange}
      />
    </div>
  );
}

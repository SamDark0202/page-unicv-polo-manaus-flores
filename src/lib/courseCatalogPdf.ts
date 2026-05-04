import { jsPDF } from "jspdf";
import type { Course, CourseModality } from "@/types/course";
import logoUnicv from "@/assets/unicive-logo-branco.png";

type GenerateCatalogOptions = {
  generatedAt?: Date;
};

const modalityOrder: CourseModality[] = ["bacharelado", "licenciatura", "tecnologo"];

const modalityLabel: Record<CourseModality, string> = {
  bacharelado: "Bacharelado",
  licenciatura: "Licenciatura",
  tecnologo: "Tecnólogo",
};

const modalityTheme: Record<CourseModality, { primary: [number, number, number]; soft: [number, number, number] }> = {
  bacharelado: { primary: [18, 87, 166], soft: [233, 241, 252] },
  licenciatura: { primary: [15, 129, 88], soft: [232, 246, 239] },
  tecnologo: { primary: [217, 119, 6], soft: [255, 247, 237] },
};

const poloInfo = {
  name: "Unicive Polo Manaus Flores",
  address: "Av. Prof. Nilton Lins, 1984 - Flores, Manaus - AM",
  cep: "CEP: 69058-300",
  phone: "(92) 2020-1260",
  email: "polo.manaus.flores@unicive.edu.br",
};

const whatsappNumber = "559220201260";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Detecta emojis e codepoints fora do range Latin que Helvetica não renderiza.
const EMOJI_RE = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2B00}-\u{2BFF}\u{1F300}-\u{1F9FF}\u{FE00}-\u{FE0F}]/u;

function containsEmoji(texts: string[]): boolean {
  return texts.some((t) => EMOJI_RE.test(t));
}

// Sanitiza apenas para campos de metadados (nome do curso, etc.)
// onde emoji é improvável mas causaria garrafados.
function sanitizePdfText(value: string): string {
  return value
    .replace(
      /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2B00}-\u{2BFF}\u{1F300}-\u{1F9FF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu,
      ""
    )
    .replace(/ {2,}/g, " ")
    .trim();
}

/**
 * Renderiza linhas de texto via Canvas 2D do navegador (que usa fontes do sistema
 * com suporte a emoji colorido) e retorna um PNG data URL para embutir no PDF.
 *
 * fontSizePt: tamanho em pontos tipográficos (como no jsPDF)
 * lineHeightMm: espaço vertical por linha em milímetros
 * widthMm: largura disponível em milímetros
 * colorHex: cor do texto em formato hex, ex: "#2d2d2d"
 */
async function renderLinesToCanvas(
  lines: string[],
  fontSizePt: number,
  lineHeightMm: number,
  widthMm: number,
  colorHex: string
): Promise<{ dataUrl: string; heightMm: number }> {
  const scale = 3; // fator de resolução (3× = qualidade adequada para PDF)
  const mmToPx = 3.7795; // px por mm a 96 DPI
  const ptToPx = 96 / 72; // px por ponto tipográfico a 96 DPI

  const fontSizePx = fontSizePt * ptToPx * scale;
  const lineHeightPx = lineHeightMm * mmToPx * scale;
  const canvasW = Math.ceil(widthMm * mmToPx * scale);
  const canvasH = Math.ceil(lines.length * lineHeightPx + scale * 2);

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  // Stack de fontes: emojis nativos do sistema, com fallback seguro
  ctx.font = `${fontSizePx}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Twemoji Mozilla", "Segoe UI", Arial, sans-serif`;
  ctx.fillStyle = colorHex;
  ctx.textBaseline = "top";

  lines.forEach((line, i) => {
    if (line.trim()) {
      ctx.fillText(line, 0, i * lineHeightPx);
    }
  });

  return {
    dataUrl: canvas.toDataURL("image/png"),
    heightMm: lines.length * lineHeightMm,
  };
}

function getTeachingMode(course: Course) {
  return course.deliveryMode === "semipresencial" ? "Semipresencial" : "EAD";
}

function groupedCourses(courses: Course[]) {
  const groups: Record<CourseModality, Course[]> = {
    bacharelado: [],
    licenciatura: [],
    tecnologo: [],
  };

  courses.forEach((course) => {
    groups[course.modality].push(course);
  });

  modalityOrder.forEach((modality) => {
    groups[modality].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  });

  return groups;
}

type LoadedImage = {
  dataUrl: string;
  width: number;
  height: number;
};

function loadImageDataUrl(src: string) {
  return new Promise<LoadedImage>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Não foi possível obter contexto do canvas para a logo."));
        return;
      }

      context.drawImage(image, 0, 0);
      resolve({
        dataUrl: canvas.toDataURL("image/png"),
        width: image.width,
        height: image.height,
      });
    };
    image.onerror = () => reject(new Error("Falha ao carregar logo da Unicive."));
    image.src = src;
  });
}

function buildFormattedLines(doc: jsPDF, content: string, maxWidth: number) {
  const source = (content || "").replace(/\r\n/g, "\n").trim();
  if (!source) return ["Informação não cadastrada."];

  const unorderedRegex = /^[-*•]\s+/;
  const orderedRegex = /^(\d+)[.)]\s+/;

  const lines = source.split("\n");
  const formatted: string[] = [];

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      formatted.push("");
      return;
    }

    if (unorderedRegex.test(line)) {
      const contentLine = line.replace(unorderedRegex, "").trim();
      formatted.push(...doc.splitTextToSize(`- ${contentLine}`, maxWidth));
      return;
    }

    const orderedMatch = line.match(orderedRegex);
    if (orderedMatch) {
      const contentLine = line.replace(orderedRegex, "").trim();
      formatted.push(...doc.splitTextToSize(`${orderedMatch[1]}) ${contentLine}`, maxWidth));
      return;
    }

    formatted.push(...doc.splitTextToSize(line, maxWidth));
  });

  return formatted.length > 0 ? formatted : ["Informação não cadastrada."];
}

function buildCurriculumLines(doc: jsPDF, curriculum: string[], maxWidth: number) {
  if (!curriculum || curriculum.length === 0) {
    return ["Informação não cadastrada."];
  }

  const lines: string[] = [];
  curriculum.forEach((item) => {
    const text = (item || "Informação não cadastrada.").trim();
    lines.push(...doc.splitTextToSize(`- ${text}`, maxWidth));
  });

  return lines;
}

export async function generateCourseCatalogPdf(courses: Course[], options?: GenerateCatalogOptions) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const safeBottomSpace = 16;
  const generatedAt = options?.generatedAt ?? new Date();
  const logoImage = await loadImageDataUrl(logoUnicv);

  let cursorY = 0;

  const drawTopHeader = (variant: "first" | "middle" | "last") => {
    const showPoloInfo = variant === "first" || variant === "last";
    const headerHeight = 44;
    const logoBoxWidth = 30;
    const logoBoxHeight = 30;
    const logoBoxX = pageWidth - margin - logoBoxWidth;
    const logoBoxY = 7;

    doc.setFillColor(17, 73, 60);
    doc.rect(0, 0, pageWidth, headerHeight, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Catálogo de Cursos Unicive", margin, 16);

    const logoRatio = logoImage.width / logoImage.height;
    const boxRatio = logoBoxWidth / logoBoxHeight;
    const renderWidth = logoRatio > boxRatio ? logoBoxWidth : logoBoxHeight * logoRatio;
    const renderHeight = logoRatio > boxRatio ? logoBoxWidth / logoRatio : logoBoxHeight;
    const renderX = logoBoxX + (logoBoxWidth - renderWidth) / 2;
    const renderY = logoBoxY + (logoBoxHeight - renderHeight) / 2;
    doc.addImage(logoImage.dataUrl, "PNG", renderX, renderY, renderWidth, renderHeight);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(`Cursos disponíveis: ${courses.length}`, margin, 24);

    if (showPoloInfo) {
      const poloTextWidth = pageWidth - margin * 2 - logoBoxWidth - 6;
      const poloLines = doc.splitTextToSize(
        `${poloInfo.name} | ${poloInfo.address} | ${poloInfo.cep} | Tel: ${poloInfo.phone} | ${poloInfo.email}`,
        poloTextWidth
      );
      doc.setFontSize(8.5);
      doc.text(poloLines.slice(0, 2), margin, 30);
    }

    cursorY = 48;
  };

  const ensureSpace = (height: number) => {
    if (cursorY + height <= pageHeight - safeBottomSpace) return;
    doc.addPage();
    drawTopHeader("middle");
  };

  drawTopHeader("first");

  const groups = groupedCourses(courses);

  for (const modality of modalityOrder) {
    const modalityCourses = groups[modality];
    if (modalityCourses.length === 0) continue;

    const theme = modalityTheme[modality];

    ensureSpace(14);
    doc.setFillColor(...theme.primary);
    doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 10, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`${modalityLabel[modality]} | ${modalityCourses.length} curso(s)`, margin + 3, cursorY + 6.8);
    cursorY += 13;

    for (const course of modalityCourses) {
      const previewLines = buildFormattedLines(doc, course.preview || "", pageWidth - margin * 2 - 8).slice(0, 6);
      const blockHeight = 24 + previewLines.length * 4;

      ensureSpace(blockHeight + 4);

      doc.setFillColor(...theme.soft);
      doc.roundedRect(margin, cursorY, pageWidth - margin * 2, blockHeight, 2, 2, "F");
      doc.setDrawColor(...theme.primary);
      doc.roundedRect(margin, cursorY, pageWidth - margin * 2, blockHeight, 2, 2);

      doc.setFillColor(...theme.primary);
      doc.rect(margin, cursorY, 2.2, blockHeight, "F");

      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(sanitizePdfText(course.name), margin + 5, cursorY + 7);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(
        `Tipo: ${modalityLabel[course.modality]} | Oferta: ${getTeachingMode(course)} | Duração: ${course.duration}`,
        margin + 5,
        cursorY + 12
      );

      const statusLabel = course.active ? "Ativo" : "Inativo";
      doc.text(`Status: ${statusLabel}`, margin + 5, cursorY + 16);

      if (containsEmoji(previewLines)) {
        const { dataUrl, heightMm } = await renderLinesToCanvas(
          previewLines,
          9,
          4,
          pageWidth - margin * 2 - 10,
          "#464646"
        );
        doc.addImage(dataUrl, "PNG", margin + 5, cursorY + 19.5, pageWidth - margin * 2 - 10, heightMm);
      } else {
        doc.setTextColor(70, 70, 70);
        doc.text(previewLines, margin + 5, cursorY + 21);
      }

      cursorY += blockHeight + 4;
    }

    cursorY += 2;
  }

  const pages = doc.getNumberOfPages();

  if (pages > 1) {
    doc.setPage(pages);
    drawTopHeader("last");
  }

  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Página ${page} de ${pages}`, pageWidth - margin, pageHeight - 6, { align: "right" });
  }

  const fileDate = generatedAt.toISOString().slice(0, 10);
  doc.save(`catalogo-cursos-unicive-${fileDate}.pdf`);
}

function buildWhatsAppLink(courseName: string) {
  const text = `Olá! Tenho interesse no curso ${courseName} da Unicive Polo Manaus Flores. Quero esse curso!`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
}

export async function generateCourseInformationPdf(course: Course, options?: GenerateCatalogOptions) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const generatedAt = options?.generatedAt ?? new Date();
  const logoImage = await loadImageDataUrl(logoUnicv);
  const theme = modalityTheme[course.modality];
  const whatsappUrl = buildWhatsAppLink(course.name);

  let cursorY = 0;

  const drawHeader = () => {
    const headerHeight = 42;
    doc.setFillColor(17, 73, 60);
    doc.rect(0, 0, pageWidth, headerHeight, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text("Informações do Curso", margin, 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text("Unicive Polo Manaus Flores", margin, 21);

    const logoBoxWidth = 30;
    const logoBoxHeight = 28;
    const logoBoxX = pageWidth - margin - logoBoxWidth;
    const logoBoxY = 7;
    const logoRatio = logoImage.width / logoImage.height;
    const boxRatio = logoBoxWidth / logoBoxHeight;
    const renderWidth = logoRatio > boxRatio ? logoBoxWidth : logoBoxHeight * logoRatio;
    const renderHeight = logoRatio > boxRatio ? logoBoxWidth / logoRatio : logoBoxHeight;
    const renderX = logoBoxX + (logoBoxWidth - renderWidth) / 2;
    const renderY = logoBoxY + (logoBoxHeight - renderHeight) / 2;
    doc.addImage(logoImage.dataUrl, "PNG", renderX, renderY, renderWidth, renderHeight);

    doc.setFillColor(...theme.soft);
    doc.roundedRect(margin, 27, pageWidth - margin * 2 - logoBoxWidth - 4, 11, 2, 2, "F");
    doc.setTextColor(35, 35, 35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(`Curso: ${sanitizePdfText(course.name)}`, margin + 2.5, 32);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(
      `Tipo: ${modalityLabel[course.modality]} | Oferta: ${getTeachingMode(course)} | Duração: ${course.duration}`,
      margin + 2.5,
      36
    );

    cursorY = 50;
  };

  const drawFooter = (page: number, total: number) => {
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Página ${page} de ${total}`, pageWidth - margin, pageHeight - 6, { align: "right" });
  };

  const ensureSpace = (height: number) => {
    if (cursorY + height <= pageHeight - 22) return;
    doc.addPage();
    drawHeader();
  };

  const drawSection = async (title: string, content: string | string[]) => {
    const lines = Array.isArray(content)
      ? buildCurriculumLines(doc, content, pageWidth - margin * 2 - 6)
      : buildFormattedLines(doc, content, pageWidth - margin * 2 - 6);

    const blockHeight = 10 + lines.length * 4.2;
    ensureSpace(blockHeight + 4);

    doc.setFillColor(...theme.primary);
    doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 8, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(title, margin + 2.5, cursorY + 5.6);
    cursorY += 9;

    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(225, 225, 225);
    doc.roundedRect(margin, cursorY, pageWidth - margin * 2, blockHeight, 2, 2, "FD");

    if (containsEmoji(lines)) {
      // Renderiza via canvas para preservar emojis coloridos do sistema
      const { dataUrl, heightMm } = await renderLinesToCanvas(
        lines,
        9.4,
        4.2,
        pageWidth - margin * 2 - 6,
        "#2d2d2d"
      );
      doc.addImage(dataUrl, "PNG", margin + 3, cursorY + 5, pageWidth - margin * 2 - 6, heightMm);
    } else {
      doc.setTextColor(45, 45, 45);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.4);
      doc.text(lines, margin + 3, cursorY + 6);
    }

    cursorY += blockHeight + 5;
  };

  drawHeader();

  await drawSection("Resumo", course.preview || "Informação não cadastrada.");
  await drawSection("Sobre o curso", course.about || "Informação não cadastrada.");
  await drawSection("Mercado de trabalho", course.jobMarket || "Informação não cadastrada.");
  await drawSection(
    "Matriz curricular",
    course.curriculum && course.curriculum.length > 0 ? course.curriculum : ["Informação não cadastrada."]
  );
  await drawSection("Requisitos", course.requirements || "Informação não cadastrada.");

  const ctaHeight = 20;
  ensureSpace(ctaHeight + 10);
  doc.setFillColor(...theme.primary);
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, ctaHeight, 3, 3, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Quero esse curso no WhatsApp", margin + 3, cursorY + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Clique aqui para falar com o polo e garantir sua matrícula.", margin + 3, cursorY + 13.5);

  doc.link(margin, cursorY, pageWidth - margin * 2, ctaHeight, { url: whatsappUrl });
  cursorY += ctaHeight + 5;

  ensureSpace(14);
  doc.setTextColor(65, 65, 65);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("Dados do Polo", margin, cursorY + 2);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.8);
  doc.text(
    [
      poloInfo.name,
      poloInfo.address,
      poloInfo.cep,
      `Telefone: ${poloInfo.phone} | E-mail: ${poloInfo.email}`,
    ],
    margin,
    cursorY + 7
  );

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    drawFooter(page, pages);
  }

  const fileDate = generatedAt.toISOString().slice(0, 10);
  const safeName = normalizeText(course.name).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  doc.save(`curso-${safeName || "unicive"}-${fileDate}.pdf`);
}

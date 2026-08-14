import { jsPDF } from "jspdf";
import type { PostGraduateCourse } from "@/types/posGraduacao";

type GeneratePdfOptions = {
  searchTerm?: string;
  selectedCategories?: string[];
};

const formatPrice = (value: string) => {
  const clean = (value || "").replace(/\./g, "").replace(",", ".").trim();
  const numberValue = Number(clean);
  if (!Number.isNaN(numberValue) && numberValue > 0) {
    return numberValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  return value || "-";
};

const formatDuration = (value: string) => {
  const text = (value || "").trim();
  if (!text) return "Sob consulta";
  if (text.toLowerCase().includes("hora") || text.toLowerCase().includes("h")) return text;
  return `${text} horas`;
};

const getDisplayPrice = (course: PostGraduateCourse) => {
  if (course.installment_price && course.installment_price.trim()) {
    const formattedInstallment = formatPrice(course.installment_price);
    if (formattedInstallment !== "-") {
      return `1+12x de ${formattedInstallment}`;
    }
  }
  if (course.current_price && course.current_price.trim()) {
    const formattedCurrent = formatPrice(course.current_price);
    if (formattedCurrent !== "-") {
      return formattedCurrent;
    }
  }
  return "-";
};

function normalizePdfText(value: string): string {
  return (value || "")
    .replace(
      /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2B00}-\u{2BFF}\u{1F300}-\u{1F9FF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu,
      ""
    )
    .replace(/ {2,}/g, " ")
    .trim();
}

export function generatePosGraduacaoPdf(
  courses: PostGraduateCourse[],
  options?: GeneratePdfOptions
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const safeBottomSpace = 18;
  const usableWidth = pageWidth - margin * 2; // 182mm

  const colWidths = {
    name: 104,
    duration: 36,
    price: 42,
  };

  const colX = {
    name: margin,
    duration: margin + colWidths.name,
    price: margin + colWidths.name + colWidths.duration,
  };

  let cursorY = 0;

  const drawHeader = () => {
    const headerHeight = 36;
    doc.setFillColor(17, 73, 60); // Cor institucional green/teal
    doc.rect(0, 0, pageWidth, headerHeight, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Relatório de Cursos de Pós-Graduação", margin, 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text("Unicive Polo Manaus Flores - Área de Controle", margin, 20);

    const now = new Date();
    const formattedDate = now.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    let subtitleText = `Gerado em: ${formattedDate} | Total de cursos exibidos: ${courses.length}`;
    if (options?.searchTerm) {
      subtitleText += ` | Busca: "${options.searchTerm}"`;
    }
    if (options?.selectedCategories && options.selectedCategories.length > 0) {
      subtitleText += ` | Categorias: ${options.selectedCategories.join(", ")}`;
    }

    const subtitleLines = doc.splitTextToSize(subtitleText, usableWidth);
    doc.setFontSize(8.5);
    doc.text(subtitleLines.slice(0, 2), margin, 26);

    cursorY = 42;
  };

  const drawTableHeader = () => {
    const tableHeaderHeight = 9;
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(margin, cursorY, usableWidth, tableHeaderHeight, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);

    doc.text("NOME DO CURSO", colX.name + 3, cursorY + 6);
    doc.text("CARGA HORÁRIA", colX.duration + 3, cursorY + 6);
    doc.text("VALOR DO CURSO", colX.price + 3, cursorY + 6);

    cursorY += tableHeaderHeight;
  };

  const ensureSpace = (height: number) => {
    if (cursorY + height <= pageHeight - safeBottomSpace) return;
    doc.addPage();
    drawHeader();
    drawTableHeader();
  };

  drawHeader();
  drawTableHeader();

  if (courses.length === 0) {
    ensureSpace(16);
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, cursorY, usableWidth, 14, "F");
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text("Nenhum curso de pós-graduação encontrado para os filtros selecionados.", margin + 4, cursorY + 9);
    cursorY += 14;
  } else {
    courses.forEach((course, index) => {
      const nameText = normalizePdfText(course.name);
      const durationText = formatDuration(course.duration_hours);
      const priceText = getDisplayPrice(course);

      const nameLines = doc.splitTextToSize(nameText, colWidths.name - 6);
      const rowHeight = Math.max(8, nameLines.length * 4.2 + 4);

      ensureSpace(rowHeight);

      // Linha com fundo alternado
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252); // slate-50
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.rect(margin, cursorY, usableWidth, rowHeight, "F");

      // Borda inferior suave
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(margin, cursorY + rowHeight, margin + usableWidth, cursorY + rowHeight);

      // Nome do Curso
      doc.setTextColor(30, 41, 59); // slate-800
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(nameLines, colX.name + 3, cursorY + 5);

      // Carga Horária
      doc.setTextColor(71, 85, 105); // slate-600
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(durationText, colX.duration + 3, cursorY + 5);

      // Valor
      doc.setTextColor(17, 73, 60); // brand green
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(priceText, colX.price + 3, cursorY + 5);

      cursorY += rowHeight;
    });
  }

  // Rodapé em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Unicive Polo Manaus Flores - Gestão de Cursos de Pós-Graduação", margin, pageHeight - 6);
    doc.text(`Página ${page} de ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: "right" });
  }

  const fileDate = new Date().toISOString().slice(0, 10);
  doc.save(`relatorio-pos-graduacao-unicive-${fileDate}.pdf`);
}

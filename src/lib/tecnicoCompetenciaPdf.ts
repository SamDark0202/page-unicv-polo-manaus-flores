import { jsPDF } from "jspdf";
import type { TechnicalCompetenceCourse } from "@/lib/technicalCompetenceStorage";
import logoUnicv from "@/assets/unicive-logo-branco.png";

const logoUniversalUrl = "/logo-colegio-tec-universal.png";

type LoadedImage = {
  dataUrl: string;
  width: number;
  height: number;
};

function loadImageDataUrl(src: string): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Erro ao obter contexto do canvas."));
        return;
      }
      context.drawImage(image, 0, 0);
      resolve({
        dataUrl: canvas.toDataURL("image/png"),
        width: image.width,
        height: image.height,
      });
    };
    image.onerror = () => reject(new Error(`Falha ao carregar imagem: ${src}`));
    image.src = src;
  });
}

export async function generateTecnicoCompetenciaPdf(courses: TechnicalCompetenceCourse[]) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const safeBottomSpace = 16;

  // Carregar logos
  let logoUnicvImage: LoadedImage | null = null;
  let logoUniversalImage: LoadedImage | null = null;

  try {
    logoUnicvImage = await loadImageDataUrl(logoUnicv);
  } catch (e) {
    console.warn("Logo Unicive não pôde ser carregada no PDF", e);
  }

  try {
    logoUniversalImage = await loadImageDataUrl(logoUniversalUrl);
  } catch (e) {
    console.warn("Logo Colégio Técnico Universal não pôde ser carregada no PDF", e);
  }

  let cursorY = 0;

  const drawTopHeader = () => {
    const headerHeight = 44;
    doc.setFillColor(17, 73, 60); // #11493c
    doc.rect(0, 0, pageWidth, headerHeight, "F");

    // Logo Unicive (lado esquerdo do cabeçalho)
    if (logoUnicvImage) {
      const logoW = 32;
      const logoRatio = logoUnicvImage.width / logoUnicvImage.height;
      const logoH = logoW / logoRatio;
      doc.addImage(logoUnicvImage.dataUrl, "PNG", margin, 7, logoW, Math.min(logoH, 18));
    }

    // Logo Colégio Técnico Universal (lado direito do cabeçalho)
    if (logoUniversalImage) {
      const logoW = 28;
      const logoRatio = logoUniversalImage.width / logoUniversalImage.height;
      const logoH = logoW / logoRatio;
      const logoX = pageWidth - margin - logoW;
      doc.addImage(logoUniversalImage.dataUrl, "PNG", logoX, 5, logoW, Math.min(logoH, 22));
    }

    // Título do cabeçalho
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Técnico por Competência", margin + 36, 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text("Certificação Técnica Profissional (Lei Federal 9.394/96 Art. 41)", margin + 36, 18);

    doc.setFontSize(7.5);
    doc.setTextColor(220, 240, 235);
    doc.text("Instituição Emissora: Colégio Técnico Universal (SISTEC: 61295)", margin + 36, 23);
    doc.text("Polo: Unicive Polo Manaus Flores | Tel: (92) 2020-1260", margin + 36, 27);

    cursorY = 48;
  };

  const drawColumnHeader = () => {
    doc.setFillColor(226, 232, 240);
    doc.rect(margin, cursorY, pageWidth - margin * 2, 7, "F");

    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);

    const colX = {
      course: margin + 3,
      cash: margin + 82,
      credit: margin + 110,
      boleto: margin + 142,
      matricula: pageWidth - margin - 3,
    };

    doc.text("Curso Técnico", colX.course, cursorY + 4.8);
    doc.text("À Vista", colX.cash, cursorY + 4.8);
    doc.text("Cartão de Crédito", colX.credit, cursorY + 4.8);
    doc.text("Boleto", colX.boleto, cursorY + 4.8);
    doc.text("Matrícula", colX.matricula, cursorY + 4.8, { align: "right" });
    cursorY += 8;
  };

  const ensureSpace = (height: number) => {
    if (cursorY + height <= pageHeight - safeBottomSpace) return;
    doc.addPage();
    drawTopHeader();
    drawColumnHeader();
  };

  drawTopHeader();

  // Agrupar cursos por categoria
  const categoriesMap = new Map<string, TechnicalCompetenceCourse[]>();
  courses.forEach((c) => {
    const cat = c.category || "Outros";
    if (!categoriesMap.has(cat)) categoriesMap.set(cat, []);
    categoriesMap.get(cat)!.push(c);
  });

  const categories = Array.from(categoriesMap.keys());

  for (const category of categories) {
    const catCourses = categoriesMap.get(category) || [];
    if (catCourses.length === 0) continue;

    ensureSpace(14);

    // Banner da Categoria
    doc.setFillColor(17, 73, 60);
    doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 7, 1.5, 1.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(`${category} (${catCourses.length} curso${catCourses.length > 1 ? "s" : ""})`, margin + 3, cursorY + 5);
    cursorY += 9;

    drawColumnHeader();

    catCourses.forEach((c, idx) => {
      const nameLines = doc.splitTextToSize(c.name, 76);
      const rowHeight = Math.max(7, nameLines.length * 3.8 + 2);

      ensureSpace(rowHeight + 1);

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, cursorY, pageWidth - margin * 2, rowHeight, "F");
      }

      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.2);

      doc.text(nameLines, margin + 3, cursorY + 4.5);
      doc.text(c.cashPrice || "-", margin + 82, cursorY + 4.5);
      doc.text(c.creditCardInstallment || "-", margin + 110, cursorY + 4.5);
      doc.text(c.boletoInstallment || "-", margin + 142, cursorY + 4.5);
      doc.text(c.matriculaTax || "-", pageWidth - margin - 3, cursorY + 4.5, { align: "right" });

      cursorY += rowHeight;
    });

    cursorY += 4;
  }

  // Rodapé com número de página
  const totalPages = doc.getNumberOfPages();
  const dateStr = new Date().toLocaleDateString("pt-BR");

  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(
      `Unicive Polo Manaus Flores & Colégio Técnico Universal • Emissão: ${dateStr}`,
      margin,
      pageHeight - 5
    );
    doc.text(`Página ${page} de ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: "right" });
  }

  const filenameDate = new Date().toISOString().slice(0, 10);
  doc.save(`cursos-tecnico-por-competencia-${filenameDate}.pdf`);
}

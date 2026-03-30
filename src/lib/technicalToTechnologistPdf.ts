import { jsPDF } from "jspdf";
import logoUnicv from "@/assets/unicive-logo-principal.png";

export interface CompatibleCoursePdfItem {
  courseName: string;
  duration: string | null;
  installments: string | null;
  value: string | number | null;
  totalHours: string | number | null;
}

type GenerateTechnicalToTechnologistPdfOptions = {
  generatedAt?: Date;
};

type LoadedImage = {
  dataUrl: string;
  width: number;
  height: number;
};

const poloInfo = {
  name: "Unicive Polo Manaus Flores",
  address: "Av. Prof. Nilton Lins, 1984 - Flores, Manaus - AM",
  cep: "CEP: 69058-300",
  phone: "(92) 2020-1260",
  email: "polo.manaus.flores@unicv.edu.br",
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

function formatCurrency(value: string | number | null) {
  if (value === null || value === "") return "-";
  if (typeof value === "number") {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  const numberValue = Number(value);
  if (!Number.isNaN(numberValue) && value.trim() !== "") {
    return numberValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  return value;
}

function formatDuration(value: string | number | null) {
  if (value === null || value === "") return "-";
  const text = String(value).trim();
  if (!text) return "-";
  if (/trimestre/i.test(text)) return text;
  return `${text} Trimestres`;
}

function formatHours(value: string | number | null) {
  if (value === null || value === "") return "-";
  const text = String(value).trim();
  if (!text) return "-";
  if (/hora/i.test(text)) return text;
  return `${text} Horas`;
}

function sanitizeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function generateTechnicalToTechnologistPdf(
  technicalCourseName: string,
  compatibleCourses: CompatibleCoursePdfItem[],
  options?: GenerateTechnicalToTechnologistPdfOptions
) {
  const generatedAt = options?.generatedAt ?? new Date();
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const safeBottom = 16;
  const logoImage = await loadImageDataUrl(logoUnicv);
  let cursorY = 0;

  const drawHeader = () => {
    const headerHeight = 38;
    const logoBoxWidth = 30;
    const logoBoxHeight = 26;
    const logoBoxX = pageWidth - margin - logoBoxWidth;
    const logoBoxY = 6;

    doc.setFillColor(17, 73, 60);
    doc.rect(0, 0, pageWidth, headerHeight, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("Técnico para Tecnólogo", margin, 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(`Curso técnico: ${technicalCourseName}`, margin, 20);
    doc.text(`Cursos compatíveis: ${compatibleCourses.length}`, margin, 25.5);

    const logoRatio = logoImage.width / logoImage.height;
    const boxRatio = logoBoxWidth / logoBoxHeight;
    const renderWidth = logoRatio > boxRatio ? logoBoxWidth : logoBoxHeight * logoRatio;
    const renderHeight = logoRatio > boxRatio ? logoBoxWidth / logoRatio : logoBoxHeight;
    const renderX = logoBoxX + (logoBoxWidth - renderWidth) / 2;
    const renderY = logoBoxY + (logoBoxHeight - renderHeight) / 2;
    doc.addImage(logoImage.dataUrl, "PNG", renderX, renderY, renderWidth, renderHeight);

    cursorY = 44;
  };

  const drawColumnHeader = () => {
    doc.setFillColor(226, 232, 240);
    doc.rect(margin, cursorY, pageWidth - margin * 2, 8, "F");

    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.4);

    const colX = {
      name: margin + 2,
      duration: margin + 87,
      hours: margin + 115,
      subjects: margin + 148,
      paymentRight: pageWidth - margin - 2,
    };

    doc.text("Curso Tecnólogo", colX.name, cursorY + 5.4);
    doc.text("Tempo", colX.duration, cursorY + 5.4);
    doc.text("Horas", colX.hours, cursorY + 5.4);
    doc.text("Discip.", colX.subjects, cursorY + 5.4);
    doc.text("Pagamento", colX.paymentRight, cursorY + 5.4, { align: "right" });
    cursorY += 9;
  };

  const ensureSpace = (height: number) => {
    if (cursorY + height <= pageHeight - safeBottom) return;
    doc.addPage();
    drawHeader();
    drawColumnHeader();
  };

  drawHeader();

  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 11, 2, 2, "F");
  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.4);
  const generatedAtText = generatedAt.toLocaleString("pt-BR");
  doc.text(`Relatório gerado em: ${generatedAtText}`, margin + 2.5, cursorY + 4.8);
  doc.text(
    `${poloInfo.name} • ${poloInfo.phone} • ${poloInfo.email}`,
    margin + 2.5,
    cursorY + 8.7
  );
  cursorY += 14;

  drawColumnHeader();

  compatibleCourses.forEach((course, index) => {
    const nameLines = doc.splitTextToSize(course.courseName, 80);
    const rowHeight = Math.max(9, nameLines.length * 4.2 + 2.2);
    ensureSpace(rowHeight + 1);

    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, cursorY, pageWidth - margin * 2, rowHeight, "F");
    }

    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);

    doc.text(nameLines, margin + 2, cursorY + 5.2);
    doc.text(formatDuration(course.duration), margin + 87, cursorY + 5.2);
    doc.text(formatHours(course.totalHours), margin + 115, cursorY + 5.2);
    doc.text(course.installments || "-", margin + 148, cursorY + 5.2);
    doc.text(`1+12x de ${formatCurrency(course.value)}`, pageWidth - margin - 2, cursorY + 5.2, { align: "right" });

    cursorY += rowHeight;
  });

  cursorY += 5;
  ensureSpace(20);
  doc.setFillColor(17, 73, 60);
  doc.roundedRect(margin, cursorY, pageWidth - margin * 2, 14, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.3);
  doc.text("UniCV Polo Manaus Flores", margin + 2.5, cursorY + 5.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  doc.text(`${poloInfo.address} • ${poloInfo.cep}`, margin + 2.5, cursorY + 10.2);

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Página ${page} de ${pages}`, pageWidth - margin, pageHeight - 6, { align: "right" });
  }

  const fileDate = generatedAt.toISOString().slice(0, 10);
  const safeName = sanitizeFilename(technicalCourseName) || "tecnico";
  doc.save(`tecnico-para-tecnologo-${safeName}-${fileDate}.pdf`);
}
import jsPDF from "jspdf";

export function generatePDF(content: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = 25;

  const addPageIfNeeded = (needed: number) => {
    if (y + needed > 275) {
      doc.addPage();
      y = 25;
    }
  };

  // Header
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Proposta Técnica - Célula Robotizada", margin, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const today = new Date().toLocaleDateString("pt-BR");
  doc.text(`Data: ${today}`, margin, 32);
  doc.text("Documento gerado automaticamente", pageWidth - margin - 60, 32);

  y = 55;
  doc.setTextColor(30, 41, 59);

  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      y += 4;
      continue;
    }

    const isHeading = /^#{1,3}\s/.test(trimmed) || /^\d+\.\s[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]+$/.test(trimmed);

    if (isHeading) {
      addPageIfNeeded(14);
      y += 4;
      doc.setFillColor(245, 158, 11);
      doc.rect(margin, y - 4, 3, 8, "F");
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      const heading = trimmed.replace(/^#{1,3}\s/, "").replace(/^\d+\.\s/, "");
      doc.text(heading, margin + 6, y + 2);
      y += 12;
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      addPageIfNeeded(8);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      const bulletText = trimmed.replace(/^[-•]\s/, "");
      const wrapped = doc.splitTextToSize(`▸ ${bulletText}`, maxWidth - 8);
      doc.text(wrapped, margin + 6, y);
      y += wrapped.length * 5;
    } else {
      addPageIfNeeded(8);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);
      const wrapped = doc.splitTextToSize(trimmed, maxWidth);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 5;
    }
  }

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, 290, { align: "center" });
  }

  doc.save(`proposta-tecnica-${today.replace(/\//g, "-")}.pdf`);
}

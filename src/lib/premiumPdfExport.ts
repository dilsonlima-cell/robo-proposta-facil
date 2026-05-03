import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { renderTemplate, TEMPLATES, type ProposalData } from "./premiumTemplates";

export async function exportPremiumPDF(
  proposalContent: string,
  templateId: string,
  primaryColor: string,
  secondaryColor: string,
  formData: {
    clientName?: string;
    projectTitle?: string;
    proposalVersion?: string;
    initialObjective?: string;
  }
): Promise<void> {
  const template = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
  const orientation = template.orientation;

  const data: ProposalData = {
    client: formData.clientName || "Cliente",
    project: formData.projectTitle || "Projeto",
    value: "Conforme proposta",
    date: new Date().toLocaleDateString("pt-BR"),
    company: "Leve Brisa",
    version: formData.proposalVersion || "Normal",
    docNumber: `PROP-${Date.now().toString().slice(-6)}`,
    content: proposalContent,
  };

  const fullHtml = renderTemplate(templateId, data, primaryColor, secondaryColor);

  // Create off-screen container
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = orientation === "landscape" ? "297mm" : "210mm";
  container.style.background = "white";
  container.style.zIndex = "-1";
  container.innerHTML = fullHtml;
  document.body.appendChild(container);

  // Wait for rendering
  await new Promise((r) => setTimeout(r, 500));

  try {
    const pageElement = container.querySelector(".page") || container.firstElementChild;
    if (!pageElement) throw new Error("Template não encontrado");

    const canvas = await html2canvas(pageElement as HTMLElement, {
      scale: 3,
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF(orientation === "landscape" ? "l" : "p", "mm", "a4");

    const pageWidth = orientation === "landscape" ? 297 : 210;
    const pageHeight = orientation === "landscape" ? 210 : 297;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // If content fits one page, add it. Otherwise split across multiple pages.
    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    } else {
      let yOffset = 0;
      let page = 0;
      while (yOffset < imgHeight) {
        if (page > 0) pdf.addPage();
        // Calculate source crop from canvas
        const srcY = (yOffset / imgHeight) * canvas.height;
        const srcH = Math.min((pageHeight / imgHeight) * canvas.height, canvas.height - srcY);

        // Create cropped canvas for this page
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = srcH;
        const ctx = pageCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
        }

        const pageImgData = pageCanvas.toDataURL("image/png");
        const drawHeight = (srcH * imgWidth) / canvas.width;
        pdf.addImage(pageImgData, "PNG", 0, 0, imgWidth, drawHeight);

        yOffset += pageHeight;
        page++;
      }
    }

    const fileName = `proposta_${template.name.replace(/\s/g, "_")}_${data.client.replace(/\s/g, "_")}.pdf`;
    pdf.save(fileName);
  } finally {
    document.body.removeChild(container);
  }
}

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
  const isLandscape = orientation === "landscape";

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

  // Create off-screen container — use absolute positioning with clip to keep it
  // in the DOM flow (so html2canvas can capture it) but invisible to the user
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:absolute;left:0;top:0;width:0;height:0;overflow:hidden;z-index:-9999;pointer-events:none;";
  document.body.appendChild(wrapper);

  const container = document.createElement("div");
  const widthMM = isLandscape ? 297 : 210;
  // Convert mm to px at 96dpi: 1mm ≈ 3.7795px
  const widthPx = Math.round(widthMM * 3.7795);
  container.style.cssText = `width:${widthPx}px;background:white;font-size:16px;`;
  container.innerHTML = fullHtml;
  wrapper.appendChild(container);

  // Wait for rendering + fonts
  await new Promise((r) => setTimeout(r, 800));

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
      allowTaint: true,
      width: widthPx,
      windowWidth: widthPx,
    });

    const pageWidth = isLandscape ? 297 : 210;
    const pageHeight = isLandscape ? 210 : 297;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF(isLandscape ? "l" : "p", "mm", "a4");

    if (imgHeight <= pageHeight) {
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
    } else {
      // Split into pages by cropping the canvas
      let yOffset = 0;
      let pageNum = 0;
      const srcPageHeight = (pageHeight / imgHeight) * canvas.height;

      while (yOffset < canvas.height) {
        if (pageNum > 0) pdf.addPage();

        const srcH = Math.min(srcPageHeight, canvas.height - yOffset);

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = srcH;
        const ctx = pageCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(canvas, 0, yOffset, canvas.width, srcH, 0, 0, canvas.width, srcH);
        }

        const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.92);
        const drawHeight = (srcH * imgWidth) / canvas.width;
        pdf.addImage(pageImgData, "JPEG", 0, 0, imgWidth, drawHeight);

        yOffset += srcPageHeight;
        pageNum++;
      }
    }

    const fileName = `proposta_${template.name.replace(/\s/g, "_")}_${data.client.replace(/\s/g, "_")}.pdf`;
    pdf.save(fileName);
  } finally {
    document.body.removeChild(wrapper);
  }
}

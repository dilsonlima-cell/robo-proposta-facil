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
    companyName?: string;
    validadeDias?: string;
    representanteName?: string;
    representanteCargo?: string;
    clientRepName?: string;
    clientRepCargo?: string;
  }
): Promise<void> {
  const proposalDate = new Date().toLocaleDateString("pt-BR");
  const docNumber = `PROP-${Date.now().toString().slice(-6)}`;
  const validityDays = formData.validadeDias || "60";

  const data: ProposalData = {
    client: formData.clientName || "Cliente",
    project: formData.projectTitle || "Projeto",
    value: "Conforme proposta",
    date: proposalDate,
    company: formData.companyName || "Leve Brisa",
    version: formData.proposalVersion || "Normal",
    docNumber,
    content: proposalContent,
    validity: `${validityDays} dias`,
    representanteName: formData.representanteName,
    representanteCargo: formData.representanteCargo,
    clientRepName: formData.clientRepName,
    clientRepCargo: formData.clientRepCargo,
  };

  const fullHtml = renderTemplate(templateId, data, primaryColor, secondaryColor);

  const printCss = `
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;900&family=Open+Sans:wght@400;600;700&display=swap');
    @page {
      size: A4 portrait;
      margin: 20mm 15mm 20mm 15mm;
    }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { margin: 0; padding: 0; background: #fff; }
    .page-break { page-break-before: always; break-before: page; }
    h1.proposal-title, h1.cover-title {
      page-break-after: avoid;
      break-after: avoid;
    }
    table { page-break-inside: avoid; break-inside: avoid; }
    .gantt-table { page-break-inside: auto; break-inside: auto; }
    tr { page-break-inside: avoid; break-inside: avoid; }
    .signature-block { page-break-before: always; break-before: page; }
    img { max-width: 100%; page-break-inside: avoid; break-inside: avoid; }
    .image-placeholder-box { page-break-inside: avoid; break-inside: avoid; }
    @media print {
      .no-print { display: none !important; }
    }
  `;

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    alert("Permita pop-ups para exportar o PDF.");
    return;
  }

  printWindow.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proposta_${data.client}_${data.project}</title>
  <style>${printCss}</style>
</head>
<body>${fullHtml}</body>
</html>`);
  printWindow.document.close();

  // Aguarda fontes e imagens carregarem antes de imprimir
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 800);
  };
}

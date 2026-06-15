import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { renderTemplate, TEMPLATES, type ProposalData } from "./premiumTemplates";

/**
 * Block-aware PDF export.
 *
 * Em vez de fatiar o canvas em alturas fixas (que corta tabelas/parágrafos no
 * meio), nós medimos no DOM o offset vertical de cada bloco de topo
 * (h1/h2/seções/tabelas/callouts) e usamos esses pontos como candidatos de
 * quebra. Tabelas mais altas do que uma página são fatiadas entre linhas.
 */
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
  const template = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
  const isLandscape = template.orientation === "landscape";

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

  // Página A4 (mm)
  const pageWidthMM = isLandscape ? 297 : 210;
  const pageHeightMM = isLandscape ? 210 : 297;
  const widthPx = Math.round(pageWidthMM * 3.7795);

  const wrapper = document.createElement("div");
  wrapper.style.cssText =
    "position:fixed;left:-99999px;top:0;width:0;height:0;overflow:hidden;z-index:-9999;pointer-events:none;";
  document.body.appendChild(wrapper);

  const container = document.createElement("div");
  container.style.cssText = `width:${widthPx}px;background:#ffffff;font-size:16px;color:#222;`;
  container.innerHTML = fullHtml;
  wrapper.appendChild(container);

  // Aguarda fontes/imagens carregarem
  try {
    // @ts-ignore
    if (document.fonts?.ready) await (document.fonts as any).ready;
  } catch {}
  await new Promise((r) => setTimeout(r, 600));

  try {
    const pdf = new jsPDF(isLandscape ? "l" : "p", "mm", "a4");

    const coverEl = container.querySelector(".proposal-cover") as HTMLElement | null;
    const bodyEl = container.querySelector(".proposal-body-pages") as HTMLElement | null;

    // === 1) CAPA: uma página, preenche toda a A4 ===
    if (coverEl) {
      const coverCanvas = await html2canvas(coverEl, {
        scale: 2,
        backgroundColor: null,
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: coverEl.offsetWidth,
        height: coverEl.offsetHeight,
        windowWidth: coverEl.offsetWidth,
      });
      const img = coverCanvas.toDataURL("image/jpeg", 0.95);
      pdf.addImage(img, "JPEG", 0, 0, pageWidthMM, pageHeightMM);
    }

    // === 2) MIOLO: paginação por blocos ===
    if (bodyEl) {
      // Margens internas no PDF (mm) — o body já tem padding interno
      const marginTopMM = 10;
      const marginBottomMM = 14; // espaço pro rodapé
      const usableHeightMM = pageHeightMM - marginTopMM - marginBottomMM;

      const bodyCanvas = await html2canvas(bodyEl, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: bodyEl.offsetWidth,
        height: bodyEl.offsetHeight,
        windowWidth: bodyEl.offsetWidth,
      });

      // px do canvas por px do CSS
      const pxRatio = bodyCanvas.height / bodyEl.offsetHeight;
      // Altura máxima de uma página em px do canvas
      const pageMaxCanvasPx = (usableHeightMM / pageWidthMM) * bodyCanvas.width;

      // === Coletar candidatos de quebra ===
      const breakpoints = new Set<number>();
      const bodyRect = bodyEl.getBoundingClientRect();

      const addBreak = (cssY: number) => {
        const y = Math.round(cssY * pxRatio);
        if (y > 0 && y <= bodyCanvas.height) breakpoints.add(y);
      };

      // Top-level: filhos diretos do body (cada bloco/seção/parágrafo/tabela)
      const topChildren = Array.from(bodyEl.children).filter(
        (el) => !(el instanceof HTMLStyleElement)
      ) as HTMLElement[];

      for (const child of topChildren) {
        const r = child.getBoundingClientRect();
        addBreak(r.bottom - bodyRect.top);
      }

      // Sub-blocos importantes (h1/h2 marcam INÍCIO de seção -> quebra ANTES)
      const sectionStarters = bodyEl.querySelectorAll(
        "h1.proposal-title, h2.proposal-title, .page-break, .section-break"
      );
      sectionStarters.forEach((el) => {
        const r = (el as HTMLElement).getBoundingClientRect();
        addBreak(r.top - bodyRect.top);
      });

      // Linhas de tabela (para tabelas maiores que a página)
      const trs = bodyEl.querySelectorAll("tbody tr");
      trs.forEach((el) => {
        const r = (el as HTMLElement).getBoundingClientRect();
        addBreak(r.bottom - bodyRect.top);
      });

      // Itens de listas longas
      const lis = bodyEl.querySelectorAll("ul > li, ol > li");
      lis.forEach((el) => {
        const r = (el as HTMLElement).getBoundingClientRect();
        addBreak(r.bottom - bodyRect.top);
      });

      const sortedBreaks = Array.from(breakpoints).sort((a, b) => a - b);

      // === Algoritmo greedy: maior candidato que cabe ===
      const totalH = bodyCanvas.height;
      let yStart = 0;
      const slices: Array<{ start: number; end: number }> = [];

      while (yStart < totalH) {
        const limit = yStart + pageMaxCanvasPx;
        if (limit >= totalH) {
          slices.push({ start: yStart, end: totalH });
          break;
        }
        // Maior breakpoint <= limit e > yStart
        let chosen = -1;
        for (const bp of sortedBreaks) {
          if (bp > yStart && bp <= limit) chosen = bp;
          if (bp > limit) break;
        }
        if (chosen <= yStart + 10) {
          // Nenhum candidato no intervalo — força corte para evitar loop
          chosen = Math.floor(limit);
        }
        slices.push({ start: yStart, end: chosen });
        yStart = chosen;
      }

      // === Renderiza cada slice como uma página ===
      const drawableWidthMM = pageWidthMM; // body já tem padding interno
      for (let i = 0; i < slices.length; i++) {
        const { start, end } = slices[i];
        const sliceH = end - start;
        if (sliceH <= 0) continue;

        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = bodyCanvas.width;
        sliceCanvas.height = sliceH;
        const ctx = sliceCanvas.getContext("2d");
        if (!ctx) continue;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(
          bodyCanvas,
          0,
          start,
          bodyCanvas.width,
          sliceH,
          0,
          0,
          bodyCanvas.width,
          sliceH
        );

        const imgData = sliceCanvas.toDataURL("image/jpeg", 0.92);
        const drawH = (sliceH / bodyCanvas.width) * drawableWidthMM;

        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, marginTopMM, drawableWidthMM, drawH);

        // Rodapé: número de página + doc + data
        const pageIdx = i + 1;
        const totalBody = slices.length;
        pdf.setFontSize(8);
        pdf.setTextColor(130, 130, 130);
        const footerY = pageHeightMM - 6;
        pdf.text(`${docNumber} · ${proposalDate}`, 10, footerY);
        const pageLabel = `Página ${pageIdx} de ${totalBody}`;
        const tw = pdf.getTextWidth(pageLabel);
        pdf.text(pageLabel, pageWidthMM - tw - 10, footerY);
      }
    }

    const safeName = (s: string) => s.replace(/[^a-zA-Z0-9_\-]+/g, "_");
    const fileName = `proposta_${safeName(template.name)}_${safeName(data.client)}.pdf`;
    pdf.save(fileName);
  } finally {
    document.body.removeChild(wrapper);
  }
}

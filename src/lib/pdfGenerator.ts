import pdfMake from "pdfmake/build/pdfmake";
import type { ParsedProposal, SectionType, GanttPhase } from "@/components/pdf/types";
import { parseProposalHtml, extractGanttFromSections } from "@/lib/proposalParser";

// pdfmake uses Roboto by default which fully supports Portuguese/Latin characters

// Use `any` for pdfmake content to avoid strict typing issues with canvas elements
type PdfContent = any;
type PdfStyleDictionary = Record<string, any>;
type PdfTableCell = any;
// pdfmake includes Roboto by default which handles UTF-8 with accents

const COLORS = {
  primaryDark: "#1a3a5c",
  primaryLight: "#2c5a8c",
  secondary: "#e67e22",
  success: "#27ae60",
  warning: "#f39c12",
  danger: "#e74c3c",
  grayDark: "#333333",
  grayMedium: "#666666",
  grayLight: "#f5f5f5",
  white: "#ffffff",
  tableBorder: "#e0e0e0",
  tableHeaderBg: "#1a3a5c",
  tableAltRow: "#f9f9f9",
  coverGradientStart: "#1a3a5c",
  coverAccent: "#3B82F6",
};

const styles: StyleDictionary = {
  h1: { fontSize: 18, bold: true, color: COLORS.primaryDark, margin: [0, 24, 0, 12] },
  h2: { fontSize: 14, bold: true, color: COLORS.primaryLight, margin: [0, 16, 0, 8] },
  h3: { fontSize: 12, bold: true, color: COLORS.grayDark, margin: [0, 10, 0, 5] },
  bodyText: { fontSize: 10, color: COLORS.grayDark, lineHeight: 1.4, margin: [0, 0, 0, 8], alignment: "justify" as const },
  listItem: { fontSize: 10, color: COLORS.grayDark, lineHeight: 1.4, margin: [0, 2, 0, 2] },
  tableHeader: { fontSize: 9, bold: true, color: COLORS.white, fillColor: COLORS.tableHeaderBg, margin: [4, 6, 4, 6] },
  tableCell: { fontSize: 9, color: COLORS.grayDark, margin: [4, 5, 4, 5] },
  coverTitle: { fontSize: 28, bold: true, color: COLORS.white, alignment: "center" as const },
  coverSubtitle: { fontSize: 14, color: COLORS.white, alignment: "center" as const, margin: [0, 12, 0, 24] },
  coverMeta: { fontSize: 11, color: COLORS.white, margin: [0, 3, 0, 3] },
  footerText: { fontSize: 8, color: "#999999" },
  confidential: { fontSize: 7, color: COLORS.secondary, bold: true },
};

function sanitize(text: string): string {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "")
    .normalize("NFC")
    .trim();
}

function buildCoverPage(cover: ParsedProposal["cover"]): Content[] {
  return [
    {
      canvas: [
        { type: "rect", x: 0, y: 0, w: 515, h: 700, color: COLORS.primaryDark },
        { type: "rect", x: 0, y: 0, w: 515, h: 3, color: COLORS.secondary },
        { type: "rect", x: 0, y: 697, w: 515, h: 3, color: COLORS.secondary },
      ],
      absolutePosition: { x: 40, y: 40 },
    } as ContentCanvas,
    { text: "\n\n\n\n\n\n\n\n\n\n", fontSize: 10 },
    { text: sanitize(cover.title), style: "coverTitle" },
    { text: sanitize(cover.subtitle), style: "coverSubtitle" },
    {
      canvas: [{ type: "line", x1: 170, y1: 0, x2: 345, y2: 0, lineWidth: 2, lineColor: COLORS.secondary }],
      margin: [0, 10, 0, 20] as [number, number, number, number],
    } as ContentCanvas,
    {
      stack: [
        { text: `Cliente: ${sanitize(cover.client)}`, style: "coverMeta", alignment: "center" as const },
        { text: `Data: ${sanitize(cover.date)}`, style: "coverMeta", alignment: "center" as const },
        { text: `Versão: ${sanitize(cover.version)}`, style: "coverMeta", alignment: "center" as const },
        { text: `Documento: ${sanitize(cover.docNumber)}`, style: "coverMeta", alignment: "center" as const },
        { text: `Validade: ${sanitize(cover.validity)}`, style: "coverMeta", alignment: "center" as const },
      ],
      margin: [0, 20, 0, 0] as [number, number, number, number],
    } as ContentStack,
    { text: "", pageBreak: "after" },
  ];
}

function buildHighlightBox(section: Extract<SectionType, { type: "highlight" }>): Content {
  const colorMap = {
    recommendation: { bg: "#F0FDF4", border: COLORS.success, icon: "✓" },
    risk: { bg: "#FEF2F2", border: COLORS.danger, icon: "⚠" },
    info: { bg: "#EFF6FF", border: COLORS.coverAccent, icon: "ℹ" },
    warning: { bg: "#FFFBEB", border: COLORS.warning, icon: "⚠" },
  };
  const c = colorMap[section.variant];

  return {
    stack: [
      ...(section.title ? [{ text: `${c.icon} ${sanitize(section.title)}`, bold: true, fontSize: 10, color: COLORS.grayDark, margin: [0, 0, 0, 4] as [number, number, number, number] }] : []),
      { text: sanitize(section.content), fontSize: 10, color: COLORS.grayDark, lineHeight: 1.3 },
    ],
    margin: [0, 8, 0, 8] as [number, number, number, number],
    fillColor: c.bg,
    // @ts-ignore - pdfmake supports this
    background: c.bg,
  } as ContentStack;
}

function buildTable(section: Extract<SectionType, { type: "table" }>): Content {
  const widths = section.headers.map(() => "*");
  const headerRow: TableCell[] = section.headers.map((h) => ({
    text: sanitize(h),
    style: "tableHeader",
  }));

  const bodyRows: TableCell[][] = section.rows.map((row, rowIdx) =>
    row.map((cell) => ({
      text: sanitize(cell),
      style: "tableCell",
      fillColor: rowIdx % 2 === 0 ? COLORS.white : COLORS.tableAltRow,
    }))
  );

  return {
    table: {
      headerRows: 1,
      widths,
      body: [headerRow, ...bodyRows],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => COLORS.tableBorder,
      vLineColor: () => COLORS.tableBorder,
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: () => 5,
      paddingBottom: () => 5,
    },
    margin: [0, 8, 0, 12] as [number, number, number, number],
  } as ContentTable;
}

function buildGanttChart(
  weeks: number,
  phases: GanttPhase[],
): Content[] {
  const chartWidth = 460;
  const leftLabelWidth = 160;
  const barAreaWidth = chartWidth - leftLabelWidth;
  const rowHeight = 22;
  const headerHeight = 20;
  const weekWidth = barAreaWidth / weeks;

  const canvasItems: any[] = [];

  // Header background
  canvasItems.push({
    type: "rect",
    x: leftLabelWidth,
    y: 0,
    w: barAreaWidth,
    h: headerHeight,
    color: COLORS.primaryDark,
  });

  // Vertical grid lines and week labels
  const weekLabels: Content[] = [];
  for (let i = 0; i <= weeks; i++) {
    const x = leftLabelWidth + i * weekWidth;
    canvasItems.push({
      type: "line",
      x1: x,
      y1: headerHeight,
      x2: x,
      y2: headerHeight + phases.length * rowHeight,
      lineWidth: 0.3,
      lineColor: "#e0e0e0",
    });
  }

  // Phase bars
  phases.forEach((phase, idx) => {
    const y = headerHeight + idx * rowHeight;
    const barStart = leftLabelWidth + (phase.start - 1) * weekWidth;
    const barWidth = (phase.end - phase.start + 1) * weekWidth;

    // Row background
    canvasItems.push({
      type: "rect",
      x: 0,
      y,
      w: chartWidth,
      h: rowHeight,
      color: idx % 2 === 0 ? "#ffffff" : "#f9f9f9",
    });

    // Bar
    canvasItems.push({
      type: "rect",
      x: barStart + 2,
      y: y + 4,
      w: Math.max(barWidth - 4, 4),
      h: rowHeight - 8,
      color: phase.color,
      r: 3,
    });
  });

  // Outer border
  canvasItems.push({
    type: "rect",
    x: 0,
    y: 0,
    w: chartWidth,
    h: headerHeight + phases.length * rowHeight,
    lineWidth: 0.5,
    lineColor: COLORS.tableBorder,
  });

  const totalHeight = headerHeight + phases.length * rowHeight;

  // Week number labels
  const weekNumberTexts: Content[] = [];
  for (let i = 1; i <= weeks; i++) {
    weekNumberTexts.push({
      text: `S${i}`,
      fontSize: 6,
      color: COLORS.white,
      absolutePosition: {
        x: leftLabelWidth + (i - 1) * weekWidth + weekWidth / 2 - 4 + 40,
        y: 5,
      },
    } as ContentText);
  }

  // Phase labels
  const phaseLabels: Content[] = phases.map((phase, idx) => ({
    text: sanitize(phase.name).substring(0, 30),
    fontSize: 7,
    color: COLORS.grayDark,
    absolutePosition: {
      x: 44,
      y: headerHeight + idx * rowHeight + 6,
    },
  })) as Content[];

  return [
    { text: "📅 Cronograma de Implementação", style: "h2" },
    {
      canvas: canvasItems,
      width: chartWidth,
      height: totalHeight,
      margin: [0, 8, 0, 4] as [number, number, number, number],
    } as ContentCanvas,
    // Legend
    {
      columns: phases.slice(0, 4).map((phase) => ({
        stack: [
          {
            canvas: [{ type: "rect", x: 0, y: 0, w: 10, h: 8, color: phase.color, r: 2 }],
          },
          { text: sanitize(phase.name).substring(0, 25), fontSize: 7, color: COLORS.grayMedium, margin: [12, -9, 0, 4] as [number, number, number, number] },
        ],
      })),
      margin: [0, 8, 0, 12] as [number, number, number, number],
    },
  ];
}

function buildPaybackChart(capex: number, data: { month: number; investment: number; returnAccumulated: number }[]): Content[] {
  const chartWidth = 460;
  const chartHeight = 180;
  const margin = { left: 60, right: 20, top: 20, bottom: 30 };
  const plotWidth = chartWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;

  const maxMonth = Math.max(...data.map((d) => d.month));
  const maxValue = Math.max(capex, ...data.map((d) => d.returnAccumulated)) * 1.1;

  const canvasItems: any[] = [];

  // Background
  canvasItems.push({
    type: "rect",
    x: margin.left,
    y: margin.top,
    w: plotWidth,
    h: plotHeight,
    color: "#fafafa",
  });

  // Grid lines
  for (let i = 0; i <= 4; i++) {
    const y = margin.top + (plotHeight / 4) * i;
    canvasItems.push({
      type: "line",
      x1: margin.left,
      y1: y,
      x2: margin.left + plotWidth,
      y2: y,
      lineWidth: 0.3,
      lineColor: "#e0e0e0",
    });
  }

  // Investment line (horizontal)
  const investY = margin.top + plotHeight - (capex / maxValue) * plotHeight;
  canvasItems.push({
    type: "line",
    x1: margin.left,
    y1: investY,
    x2: margin.left + plotWidth,
    y2: investY,
    lineWidth: 1.5,
    lineColor: COLORS.danger,
    dash: { length: 5, space: 3 },
  });

  // Return line
  for (let i = 1; i < data.length; i++) {
    const x1 = margin.left + ((data[i - 1].month / maxMonth) * plotWidth);
    const y1 = margin.top + plotHeight - (data[i - 1].returnAccumulated / maxValue) * plotHeight;
    const x2 = margin.left + ((data[i].month / maxMonth) * plotWidth);
    const y2 = margin.top + plotHeight - (data[i].returnAccumulated / maxValue) * plotHeight;
    canvasItems.push({
      type: "line",
      x1, y1, x2, y2,
      lineWidth: 2,
      lineColor: COLORS.success,
    });
  }

  // Find payback point
  let paybackMonth = 0;
  for (const d of data) {
    if (d.returnAccumulated >= capex) {
      paybackMonth = d.month;
      break;
    }
  }

  if (paybackMonth > 0) {
    const px = margin.left + (paybackMonth / maxMonth) * plotWidth;
    canvasItems.push({
      type: "line",
      x1: px, y1: margin.top, x2: px, y2: margin.top + plotHeight,
      lineWidth: 1,
      lineColor: COLORS.secondary,
      dash: { length: 3, space: 2 },
    });
    canvasItems.push({
      type: "ellipse", x: px, y: investY, r1: 4, r2: 4,
      color: COLORS.secondary,
    });
  }

  // Axes
  canvasItems.push({
    type: "line",
    x1: margin.left, y1: margin.top,
    x2: margin.left, y2: margin.top + plotHeight,
    lineWidth: 1, lineColor: COLORS.grayDark,
  });
  canvasItems.push({
    type: "line",
    x1: margin.left, y1: margin.top + plotHeight,
    x2: margin.left + plotWidth, y2: margin.top + plotHeight,
    lineWidth: 1, lineColor: COLORS.grayDark,
  });

  return [
    { text: "💰 Análise de Retorno sobre Investimento", style: "h2" },
    {
      canvas: canvasItems,
      width: chartWidth,
      height: chartHeight,
      margin: [0, 8, 0, 4] as [number, number, number, number],
    } as ContentCanvas,
    {
      columns: [
        {
          stack: [
            { canvas: [{ type: "line", x1: 0, y1: 4, x2: 20, y2: 4, lineWidth: 2, lineColor: COLORS.danger, dash: { length: 5, space: 3 } }] },
            { text: "Investimento (CAPEX)", fontSize: 7, color: COLORS.grayMedium, margin: [24, -9, 0, 0] as [number, number, number, number] },
          ],
        },
        {
          stack: [
            { canvas: [{ type: "line", x1: 0, y1: 4, x2: 20, y2: 4, lineWidth: 2, lineColor: COLORS.success }] },
            { text: "Retorno Acumulado", fontSize: 7, color: COLORS.grayMedium, margin: [24, -9, 0, 0] as [number, number, number, number] },
          ],
        },
        ...(paybackMonth > 0
          ? [
              {
                stack: [
                  { canvas: [{ type: "ellipse", x: 5, y: 4, r1: 4, r2: 4, color: COLORS.secondary }] },
                  { text: `Payback: ${paybackMonth} meses`, fontSize: 7, color: COLORS.secondary, bold: true, margin: [14, -9, 0, 0] as [number, number, number, number] },
                ],
              },
            ]
          : []),
      ],
      margin: [0, 4, 0, 12] as [number, number, number, number],
    },
  ];
}

function buildCostSummary(section: Extract<SectionType, { type: "costSummary" }>): Content {
  return {
    stack: [
      ...(section.items.length > 0
        ? section.items.map((item) => ({
            columns: [
              { text: sanitize(item.item), fontSize: 10, color: COLORS.primaryLight, width: "60%" },
              { text: sanitize(item.value), fontSize: 10, color: COLORS.grayDark, alignment: "right" as const, width: "40%" },
            ],
            margin: [0, 2, 0, 2] as [number, number, number, number],
          }))
        : []),
      {
        canvas: [{ type: "line", x1: 0, y1: 0, x2: 435, y2: 0, lineWidth: 1, lineColor: COLORS.coverAccent }],
        margin: [0, 8, 0, 8] as [number, number, number, number],
      },
      {
        text: sanitize(section.total),
        fontSize: 18,
        bold: true,
        color: COLORS.primaryDark,
        alignment: "center" as const,
        margin: [0, 4, 0, 4] as [number, number, number, number],
      },
    ],
    fillColor: "#EFF6FF",
    margin: [0, 12, 0, 12] as [number, number, number, number],
  } as ContentStack;
}

function buildRiskMatrix(section: Extract<SectionType, { type: "riskMatrix" }>): Content {
  const headerRow: TableCell[] = [
    { text: "Risco", style: "tableHeader" },
    { text: "Categoria", style: "tableHeader" },
    { text: "Prob.", style: "tableHeader" },
    { text: "Impacto", style: "tableHeader" },
    { text: "Mitigação", style: "tableHeader" },
  ];

  const bodyRows: TableCell[][] = section.risks.map((risk, i) => {
    const impactColor =
      risk.impact.toLowerCase().includes("crít") ? COLORS.danger :
      risk.impact.toLowerCase().includes("alt") ? COLORS.warning :
      COLORS.grayDark;
    return [
      { text: sanitize(risk.description), style: "tableCell", fillColor: i % 2 === 0 ? COLORS.white : COLORS.tableAltRow },
      { text: sanitize(risk.category), style: "tableCell", fillColor: i % 2 === 0 ? COLORS.white : COLORS.tableAltRow },
      { text: sanitize(risk.probability), style: "tableCell", fillColor: i % 2 === 0 ? COLORS.white : COLORS.tableAltRow },
      { text: sanitize(risk.impact), style: "tableCell", color: impactColor, bold: true, fillColor: i % 2 === 0 ? COLORS.white : COLORS.tableAltRow },
      { text: sanitize(risk.mitigation), style: "tableCell", fillColor: i % 2 === 0 ? COLORS.white : COLORS.tableAltRow },
    ];
  });

  return {
    table: {
      headerRows: 1,
      widths: ["20%", "15%", "10%", "10%", "45%"],
      body: [headerRow, ...bodyRows],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => COLORS.tableBorder,
      vLineColor: () => COLORS.tableBorder,
    },
    margin: [0, 8, 0, 12] as [number, number, number, number],
  } as ContentTable;
}

function buildCards(section: Extract<SectionType, { type: "cards" }>): Content {
  const cols = section.items.length <= 2 ? section.items.length : Math.min(3, section.items.length);
  const rows: Content[][] = [];
  for (let i = 0; i < section.items.length; i += cols) {
    rows.push(
      section.items.slice(i, i + cols).map((item) => ({
        stack: [
          { text: sanitize(item.title), fontSize: 10, bold: true, color: COLORS.primaryDark, margin: [0, 0, 0, 4] as [number, number, number, number] },
          { text: sanitize(item.content), fontSize: 9, color: COLORS.grayMedium, lineHeight: 1.3 },
        ],
        fillColor: COLORS.grayLight,
        margin: [4, 4, 4, 4] as [number, number, number, number],
      }))
    );
  }

  return {
    stack: rows.map((row) => ({
      columns: row,
      columnGap: 8,
      margin: [0, 4, 0, 4] as [number, number, number, number],
    })),
    margin: [0, 8, 0, 8] as [number, number, number, number],
  } as ContentStack;
}

function buildSignatureBlock(): Content {
  return {
    stack: [
      { text: "✍ Termo de Aceite e Assinaturas", style: "h2" },
      {
        text: "Pela apresentação desta proposta técnica e comercial, ambas as partes declaram compreender e concordar com os termos, condições e especificações contidas neste documento.",
        style: "bodyText",
        margin: [0, 0, 0, 16] as [number, number, number, number],
      },
      {
        columns: [
          {
            stack: [
              { text: "PELA EMPRESA FORNECEDORA:", fontSize: 10, bold: true, color: COLORS.primaryDark, margin: [0, 0, 0, 40] as [number, number, number, number] },
              { canvas: [{ type: "line", x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5, lineColor: COLORS.grayDark }] },
              { text: "Nome e Assinatura", fontSize: 8, color: COLORS.grayMedium, margin: [0, 4, 0, 2] as [number, number, number, number] },
              { text: "Cargo / CREA", fontSize: 8, color: COLORS.grayMedium, margin: [0, 0, 0, 8] as [number, number, number, number] },
              { text: "Data: ___/___/______", fontSize: 9, color: COLORS.grayDark },
            ],
          },
          {
            stack: [
              { text: "PELA EMPRESA CLIENTE:", fontSize: 10, bold: true, color: COLORS.primaryDark, margin: [0, 0, 0, 40] as [number, number, number, number] },
              { canvas: [{ type: "line", x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5, lineColor: COLORS.grayDark }] },
              { text: "Nome e Assinatura", fontSize: 8, color: COLORS.grayMedium, margin: [0, 4, 0, 2] as [number, number, number, number] },
              { text: "Cargo / CPF", fontSize: 8, color: COLORS.grayMedium, margin: [0, 0, 0, 8] as [number, number, number, number] },
              { text: "Data: ___/___/______", fontSize: 9, color: COLORS.grayDark },
            ],
          },
        ],
        columnGap: 20,
      },
      {
        text: "\nEste documento é confidencial e destinado exclusivamente às partes envolvidas. A reprodução, divulgação ou uso não autorizado é proibido.",
        fontSize: 8,
        color: COLORS.grayMedium,
        italics: true,
        margin: [0, 20, 0, 0] as [number, number, number, number],
      },
    ],
    unbreakable: true,
    margin: [0, 20, 0, 0] as [number, number, number, number],
  } as ContentStack;
}

function buildImagePlaceholder(section: Extract<SectionType, { type: "imagePlaceholder" }>): Content {
  return {
    stack: [
      {
        canvas: [
          { type: "rect", x: 0, y: 0, w: 435, h: 120, lineWidth: 1, lineColor: "#cccccc", dash: { length: 5, space: 3 } },
        ],
      },
      {
        text: `[INSERIR: ${sanitize(section.name)}]`,
        fontSize: 10,
        color: "#999999",
        italics: true,
        alignment: "center" as const,
        margin: [0, -80, 0, 0] as [number, number, number, number],
      },
      {
        text: sanitize(section.description),
        fontSize: 8,
        color: "#bbbbbb",
        alignment: "center" as const,
        margin: [0, 8, 0, 40] as [number, number, number, number],
      },
    ],
    margin: [0, 12, 0, 12] as [number, number, number, number],
    unbreakable: true,
  } as ContentStack;
}

function sectionToContent(section: SectionType): Content | Content[] | null {
  switch (section.type) {
    case "heading":
      return { text: sanitize(section.text), style: `h${section.level}` } as ContentText;

    case "paragraph":
      return { text: sanitize(section.text), style: "bodyText" } as ContentText;

    case "list":
      return {
        [section.ordered ? "ol" : "ul"]: section.items.map((item) => ({
          text: sanitize(item),
          style: "listItem",
        })),
        margin: [12, 4, 0, 8] as [number, number, number, number],
      } as any;

    case "table":
      if (section.headers.length === 0 && section.rows.length === 0) return null;
      return buildTable(section);

    case "highlight":
      return buildHighlightBox(section);

    case "costSummary":
      return buildCostSummary(section);

    case "riskMatrix":
      return buildRiskMatrix(section);

    case "cards":
      return buildCards(section);

    case "signature":
      return buildSignatureBlock();

    case "pageBreak":
      return { text: "", pageBreak: "after" } as ContentText;

    case "imagePlaceholder":
      return buildImagePlaceholder(section);

    case "gantt":
      return buildGanttChart(section.weeks, section.phases);

    case "payback":
      return buildPaybackChart(section.capex, section.data);

    default:
      return null;
  }
}

export function generatePDF(
  htmlContent: string,
  formData?: {
    clientName?: string;
    projectTitle?: string;
    proposalVersion?: string;
    initialObjective?: string;
  }
) {
  const parsed = parseProposalHtml(htmlContent, formData);

  // Try to extract Gantt data from schedule tables
  const ganttData = extractGanttFromSections(parsed.sections);

  // Build content
  const contentItems: Content[] = [];

  // Cover page
  contentItems.push(...buildCoverPage(parsed.cover));

  // Sections
  let ganttInserted = false;
  for (const section of parsed.sections) {
    // Insert Gantt chart before/after schedule section
    if (
      !ganttInserted &&
      ganttData &&
      section.type === "heading" &&
      (section.text.toLowerCase().includes("cronograma") ||
        section.text.toLowerCase().includes("prazo") ||
        section.text.toLowerCase().includes("etapas"))
    ) {
      const result = sectionToContent(section);
      if (result) {
        if (Array.isArray(result)) contentItems.push(...result);
        else contentItems.push(result);
      }
      contentItems.push(...buildGanttChart(ganttData.weeks, ganttData.phases));
      ganttInserted = true;
      continue;
    }

    const result = sectionToContent(section);
    if (result) {
      if (Array.isArray(result)) contentItems.push(...result);
      else contentItems.push(result);
    }
  }

  // Ensure signature block exists
  if (!parsed.sections.some((s) => s.type === "signature")) {
    contentItems.push({ text: "", pageBreak: "before" } as ContentText);
    contentItems.push(buildSignatureBlock());
  }

  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [42, 60, 42, 60], // ~1.5cm left/right, 2cm top/bottom
    content: contentItems,
    styles,
    defaultStyle: {
      font: "Roboto",
      fontSize: 10,
      color: COLORS.grayDark,
    },
    header: (currentPage: number) => {
      if (currentPage === 1) return null; // Skip header on cover
      return {
        columns: [
          { text: sanitize(parsed.cover.subtitle || "Proposta Técnica"), fontSize: 8, color: COLORS.grayMedium, margin: [42, 20, 0, 0] as [number, number, number, number] },
          { text: sanitize(parsed.cover.client), fontSize: 8, color: COLORS.grayMedium, alignment: "right" as const, margin: [0, 20, 42, 0] as [number, number, number, number] },
        ],
      };
    },
    footer: (currentPage: number, pageCount: number) => {
      if (currentPage === 1) return null; // Skip footer on cover
      return {
        columns: [
          { text: `Página ${currentPage} de ${pageCount}`, style: "footerText", margin: [42, 0, 0, 0] as [number, number, number, number] },
          { text: sanitize(parsed.cover.date), style: "footerText", alignment: "center" as const },
          { text: `Versão: ${sanitize(parsed.cover.version)}`, style: "footerText" },
          { text: "CONFIDENCIAL", style: "confidential", alignment: "right" as const, margin: [0, 0, 42, 0] as [number, number, number, number] },
        ],
      };
    },
    info: {
      title: `Proposta - ${parsed.cover.client}`,
      author: "Leve Brisa",
      subject: parsed.cover.subtitle,
    },
  };

  const fileName = `proposta_${(parsed.cover.client || "cliente").replace(/\s+/g, "_")}_${parsed.cover.date.replace(/\//g, "-")}.pdf`;

  pdfMake.createPdf(docDefinition).download(fileName);
}

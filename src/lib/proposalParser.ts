import type { ParsedProposal, SectionType, GanttPhase, GanttMilestone, RiskItem } from "@/components/pdf/types";

/**
 * Parse AI-generated HTML content into structured sections for @react-pdf/renderer.
 */
export function parseProposalHtml(html: string, formData?: {
  clientName?: string;
  projectTitle?: string;
  proposalVersion?: string;
  initialObjective?: string;
}): ParsedProposal {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const root = doc.body.firstElementChild!;

  const cover = extractCover(root, formData);
  const sections = extractSections(root);

  return { cover, sections };
}

function extractCover(root: Element, formData?: Record<string, string | undefined>): ParsedProposal["cover"] {
  const coverEl = root.querySelector(".proposal-cover");
  const today = new Date().toLocaleDateString("pt-BR");

  if (coverEl) {
    const title = coverEl.querySelector(".cover-title")?.textContent?.trim() || "PROPOSTA TÉCNICA E COMERCIAL";
    const subtitle = coverEl.querySelector(".cover-subtitle")?.textContent?.trim() || formData?.projectTitle || "";
    const metaPs = coverEl.querySelectorAll(".cover-meta p");
    let client = formData?.clientName || "";
    let date = today;
    let version = formData?.proposalVersion || "Normal";
    let docNumber = `PROP-${Date.now().toString().slice(-6)}`;
    let validity = "60 dias";

    metaPs.forEach((p) => {
      const text = p.textContent?.trim() || "";
      if (text.toLowerCase().startsWith("cliente:")) client = text.replace(/^cliente:\s*/i, "");
      if (text.toLowerCase().startsWith("data:")) date = text.replace(/^data:\s*/i, "");
      if (text.toLowerCase().startsWith("versão:") || text.toLowerCase().startsWith("versao:")) version = text.replace(/^vers[ãa]o:\s*/i, "");
      if (text.toLowerCase().startsWith("documento")) docNumber = text.replace(/^documento\s*n[°º]?:\s*/i, "");
      if (text.toLowerCase().startsWith("validade:")) validity = text.replace(/^validade:\s*/i, "");
    });

    return { title, subtitle, client, date, version, docNumber, validity };
  }

  return {
    title: formData?.initialObjective === "Gerar Escopo Técnico" ? "ESCOPO TÉCNICO" : "PROPOSTA TÉCNICA E COMERCIAL",
    subtitle: formData?.projectTitle || "",
    client: formData?.clientName || "",
    date: today,
    version: formData?.proposalVersion || "Normal",
    docNumber: `PROP-${Date.now().toString().slice(-6)}`,
    validity: "60 dias",
  };
}

function sanitizeText(text: string): string {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "")
    .normalize("NFC")
    .trim();
}

function extractSections(root: Element): SectionType[] {
  const sections: SectionType[] = [];
  const children = Array.from(root.children);

  for (const child of children) {
    // Skip cover
    if (child.classList.contains("proposal-cover")) continue;

    // Page break
    if (child.classList.contains("page-break")) {
      sections.push({ type: "pageBreak" });
      continue;
    }

    // Signature block
    if (child.classList.contains("signature-block")) {
      sections.push({ type: "signature" });
      continue;
    }

    // Highlight boxes
    if (child.classList.contains("highlight-box")) {
      let variant: "recommendation" | "risk" | "info" | "warning" = "info";
      if (child.classList.contains("highlight-recommendation")) variant = "recommendation";
      if (child.classList.contains("highlight-risk")) variant = "risk";
      if (child.classList.contains("highlight-warning")) variant = "warning";

      const strong = child.querySelector("strong");
      const title = strong?.textContent?.trim() || "";
      const content = sanitizeText(child.textContent?.replace(title, "") || "");
      sections.push({ type: "highlight", variant, title, content });
      continue;
    }

    // Cost summary
    if (child.classList.contains("cost-summary")) {
      const ps = child.querySelectorAll("p");
      const items: { item: string; value: string }[] = [];
      let total = "";
      ps.forEach((p) => {
        const text = p.textContent?.trim() || "";
        if (p.classList.contains("cost-total") || p.querySelector(".cost-total")) {
          total = text;
        } else if (text.includes(":")) {
          const [item, value] = text.split(":").map((s) => s.trim());
          items.push({ item, value });
        } else if (text) {
          total = total || text;
        }
      });
      sections.push({ type: "costSummary", items, total });
      continue;
    }

    // Technical cards in grid
    if (child.classList.contains("grid-2") || child.classList.contains("grid-3")) {
      const cards = child.querySelectorAll(".technical-card");
      if (cards.length > 0) {
        const items = Array.from(cards).map((card) => ({
          title: card.querySelector("h4")?.textContent?.trim() || "",
          content: sanitizeText(
            Array.from(card.querySelectorAll("p"))
              .map((p) => p.textContent?.trim())
              .join("\n") || ""
          ),
        }));
        sections.push({ type: "cards", items });
        continue;
      }
    }

    // Tables
    if (child.tagName === "TABLE" || child.classList.contains("proposal-table")) {
      const table = child.tagName === "TABLE" ? child : child.querySelector("table");
      if (table) {
        sections.push(parseTable(table));
        continue;
      }
    }

    // Headings
    if (child.tagName === "H1" || (child.classList.contains("proposal-title"))) {
      sections.push({ type: "heading", level: 1, text: sanitizeText(child.textContent || "") });
      continue;
    }
    if (child.tagName === "H2" || (child.classList.contains("proposal-subtitle") && child.tagName !== "H3")) {
      sections.push({ type: "heading", level: 2, text: sanitizeText(child.textContent || "") });
      continue;
    }
    if (child.tagName === "H3") {
      sections.push({ type: "heading", level: 3, text: sanitizeText(child.textContent || "") });
      continue;
    }

    // Lists
    if (child.tagName === "UL" || child.tagName === "OL") {
      const items = Array.from(child.querySelectorAll("li")).map((li) => sanitizeText(li.textContent || ""));
      sections.push({ type: "list", ordered: child.tagName === "OL", items });
      continue;
    }

    // Paragraphs
    if (child.tagName === "P" || child.classList.contains("proposal-text")) {
      const text = sanitizeText(child.textContent || "");
      if (text) sections.push({ type: "paragraph", text });
      continue;
    }

    // Image placeholders
    if (child.classList.contains("image-block-wrapper") || child.classList.contains("figure")) {
      const name = child.getAttribute("data-image-block") || child.querySelector("[data-name]")?.getAttribute("data-name") || "imagem";
      const desc = child.querySelector(".figure-caption")?.textContent?.trim() ||
        child.querySelector(".image-placeholder")?.textContent?.trim() || "";
      sections.push({ type: "imagePlaceholder", name, description: desc });
      continue;
    }

    // Proposal section (div wrapper) - recurse into children
    if (child.classList.contains("proposal-section") || child.tagName === "DIV") {
      const innerSections = extractSections(child);
      sections.push(...innerSections);
      continue;
    }
  }

  // Check for image placeholder patterns in text
  const htmlStr = root.innerHTML;
  const imgMatches = htmlStr.matchAll(/<<IMAGEM:(\w+)>>/g);
  for (const match of imgMatches) {
    if (!sections.some((s) => s.type === "imagePlaceholder" && (s as any).name === match[1])) {
      sections.push({ type: "imagePlaceholder", name: match[1], description: `Inserir: ${match[1]}` });
    }
  }

  return sections;
}

function parseTable(table: Element): SectionType {
  const headers: string[] = [];
  const rows: string[][] = [];

  const ths = table.querySelectorAll("thead th");
  ths.forEach((th) => headers.push(sanitizeText(th.textContent || "")));

  // If no thead, use first row
  if (headers.length === 0) {
    const firstRow = table.querySelector("tr");
    if (firstRow) {
      const cells = firstRow.querySelectorAll("th, td");
      cells.forEach((c) => headers.push(sanitizeText(c.textContent || "")));
    }
  }

  const trs = table.querySelectorAll("tbody tr");
  (trs.length ? trs : table.querySelectorAll("tr")).forEach((tr, i) => {
    if (i === 0 && headers.length > 0 && !table.querySelector("thead")) return;
    const cells: string[] = [];
    tr.querySelectorAll("td, th").forEach((td) => cells.push(sanitizeText(td.textContent || "")));
    if (cells.length > 0) rows.push(cells);
  });

  return { type: "table", headers, rows };
}

/**
 * Try to extract Gantt data from sections
 */
export function extractGanttFromSections(sections: SectionType[]): {
  weeks: number;
  phases: GanttPhase[];
  milestones: GanttMilestone[];
} | null {
  // Look for a table that looks like a schedule
  for (const section of sections) {
    if (section.type === "table") {
      const h = section.headers.map((h) => h.toLowerCase());
      const hasPhase = h.some((x) => x.includes("fase") || x.includes("etapa") || x.includes("atividade"));
      const hasWeek = h.some((x) => x.includes("semana") || x.includes("prazo") || x.includes("início") || x.includes("duração"));

      if (hasPhase && hasWeek) {
        const colors = ["#3498db", "#e67e22", "#2ecc71", "#9b59b6", "#f1c40f", "#e74c3c", "#1abc9c", "#34495e"];
        let maxWeek = 0;
        const phases: GanttPhase[] = section.rows.map((row, i) => {
          const name = row[0] || `Fase ${i + 1}`;
          // Try to extract start/end weeks from numbers in the row
          const nums = row.slice(1).join(" ").match(/\d+/g)?.map(Number) || [];
          const start = nums[0] || i * 2 + 1;
          const end = nums[1] || start + 2;
          if (end > maxWeek) maxWeek = end;
          return { name, start, end, color: colors[i % colors.length] };
        });

        return {
          weeks: maxWeek || 14,
          phases,
          milestones: [],
        };
      }
    }
  }
  return null;
}

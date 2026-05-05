// 10 Premium Proposal Templates

export interface TemplateConfig {
  id: string;
  name: string;
  orientation: "portrait" | "landscape";
  description: string;
}

export const TEMPLATES: TemplateConfig[] = [
  { id: "classic", name: "Classic Corporate", orientation: "portrait", description: "Estilo executivo tradicional" },
  { id: "modern-web", name: "Modern Web", orientation: "landscape", description: "Design moderno com gradientes" },
  { id: "minimalist", name: "Minimalist Gray", orientation: "portrait", description: "Clean e minimalista" },
  { id: "corporate-blue", name: "Corporate Blue", orientation: "portrait", description: "Azul corporativo poderoso" },
  { id: "bold-yellow", name: "Bold Yellow", orientation: "landscape", description: "Amarelo ousado e moderno" },
  { id: "dark-luxury", name: "Dark Luxury", orientation: "portrait", description: "Elegância escura premium" },
  { id: "tech-gradient", name: "Tech Gradient", orientation: "portrait", description: "Gradiente tech futurista" },
  { id: "editorial", name: "Editorial", orientation: "portrait", description: "Estilo editorial magazine" },
  { id: "geometric", name: "Geometric Modern", orientation: "landscape", description: "Formas geométricas modernas" },
  { id: "glassmorphism", name: "Glassmorphism", orientation: "portrait", description: "Ultra moderno com vidro" },
];

export interface ProposalData {
  client: string;
  project: string;
  value: string;
  date: string;
  company: string;
  version: string;
  docNumber: string;
  content: string;
  validity?: string;
  representanteName?: string;
  representanteCargo?: string;
  clientRepName?: string;
  clientRepCargo?: string;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function sanitizeText(text: string): string {
  if (!text) return '';
  text = text.normalize('NFC');
  // Remove control characters except \n \r \t
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
  // Remove zero-width chars
  text = text.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
  // Remove leftover placeholders like [Something]
  text = text.replace(/\[(?:Nome|Cargo|Data|CREA|CPF|CNPJ)[^\]]*\]/gi, 'A ser designado');
  return text;
}

function buildContentPages(content: string, primaryColor: string, secondaryColor: string, data: ProposalData): string {
  // Sanitize content
  let sanitized = sanitizeText(content);
  
  // Remove orphaned figure references (Figura X.Y without actual images)
  sanitized = sanitized.replace(/<<IMAGEM:\w+>>/g, '');
  sanitized = sanitized.replace(/<div class="figure">\s*<div class="figure-caption">[^<]*<\/div>\s*<\/div>/gi, '');
  
  const headerHtml = `
    <div class="proposal-page-header" style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;margin-bottom:16px;border-bottom:2px solid ${primaryColor};font-size:8pt;color:#666;font-family:'Inter',system-ui,sans-serif;">
      <div style="font-weight:600;color:${primaryColor};">${escapeHtml(data.project)}</div>
      <div>${escapeHtml(data.docNumber)} · REV. 1.0 · ${escapeHtml(data.date)}</div>
    </div>
  `;

  return `
    <div class="proposal-body-pages" style="page-break-before:always;padding:40px;font-family:'Inter',system-ui,sans-serif;color:#333;background:#ffffff;font-size:11pt;line-height:1.6;">
      <style>
        .proposal-body-pages, .proposal-body-pages * { box-sizing: border-box; }
        .proposal-body-pages { background: #ffffff !important; }
        .proposal-body-pages .proposal-cover { display: none !important; }
        .proposal-body-pages .proposal-section, .proposal-body-pages .signature-block { background: #ffffff; }
        .proposal-body-pages .page-break { page-break-after: always; height: 0; }
        .proposal-title { font-size: 18pt; font-weight: 700; color: ${primaryColor}; margin: 30px 0 12px; page-break-after: avoid; border-bottom: 2px solid ${primaryColor}20; padding-bottom: 8px; }
        .proposal-subtitle { font-size: 14pt; font-weight: 600; color: ${secondaryColor}; margin: 20px 0 8px; page-break-after: avoid; }
        .proposal-text { margin: 0 0 10px; text-align: justify; }
        .proposal-list { margin: 8px 0 12px 20px; }
        .proposal-list li { margin: 4px 0; }
        .proposal-table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 9.5pt; }
        .proposal-table thead { display: table-header-group; }
        .proposal-table th { background: ${primaryColor}; color: white; padding: 8px 10px; text-align: left; font-weight: 600; }
        .proposal-table td { padding: 7px 10px; border-bottom: 1px solid #e0e0e0; }
        .proposal-table tr:nth-child(even) td { background: #f9f9f9; }
        .highlight-box { padding: 14px 18px; border-radius: 8px; margin: 14px 0; border-left: 4px solid; page-break-inside: avoid; }
        .highlight-recommendation { background: #f0fdf4; border-color: #22c55e; }
        .highlight-risk { background: #fef2f2; border-color: #ef4444; }
        .highlight-info { background: #eff6ff; border-color: #3b82f6; }
        .highlight-warning { background: #fffbeb; border-color: #f59e0b; }
        .cost-summary { background: #eff6ff; padding: 16px 20px; border-radius: 8px; margin: 14px 0; }
        .cost-total { font-size: 18pt; font-weight: 700; color: ${primaryColor}; text-align: center; margin-top: 10px; }
        .technical-card { background: #f5f5f5; padding: 14px; border-radius: 8px; margin: 8px 0; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        .signature-block { page-break-inside: avoid; margin-top: 30px; }
        .signature-line .line { border-bottom: 1px solid #333; margin: 30px 0 6px; width: 200px; }
        .proposal-section { margin-bottom: 8px; }
        h1.proposal-title { page-break-before: always; }
        h1.proposal-title:first-of-type { page-break-before: auto; }
        /* Cronograma Gantt style matching reference */
        .gantt-cell { width: 28px; height: 20px; display: inline-block; }
        .gantt-filled { background: ${secondaryColor}; border-radius: 3px; }
        /* Risk matrix badges */
        .risk-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; color: white; font-size: 8pt; font-weight: 600; }
        .risk-baixo { background: #22c55e; }
        .risk-medio { background: ${secondaryColor}; }
        .risk-alto { background: #ef4444; }
      </style>
      ${headerHtml}
      ${sanitized}
    </div>
  `;
}

function buildCover(
  templateId: string,
  data: ProposalData,
  primaryColor: string,
  secondaryColor: string
): string {
  const safe = (s: string) => escapeHtml(s);
  const docType = data.version === "Escopo Inicial" ? "ESCOPO TÉCNICO" : "PROPOSTA TÉCNICA E COMERCIAL";
  
  const coverMeta = `
    <div style="display:flex;flex-wrap:wrap;gap:24px;margin-top:30px;">
      <div><div style="font-size:9px;letter-spacing:2px;opacity:0.6;text-transform:uppercase;">Preparado por</div><div style="font-size:13pt;font-weight:600;margin-top:4px;">${safe(data.company)}</div></div>
      <div><div style="font-size:9px;letter-spacing:2px;opacity:0.6;text-transform:uppercase;">Preparado para</div><div style="font-size:13pt;font-weight:600;margin-top:4px;">${safe(data.client)}</div></div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:24px;margin-top:20px;">
      <div><div style="font-size:9px;letter-spacing:2px;opacity:0.6;text-transform:uppercase;">Data</div><div style="margin-top:4px;">${safe(data.date)}</div></div>
      <div><div style="font-size:9px;letter-spacing:2px;opacity:0.6;text-transform:uppercase;">Versão</div><div style="margin-top:4px;">${safe(data.version)}</div></div>
      <div><div style="font-size:9px;letter-spacing:2px;opacity:0.6;text-transform:uppercase;">Doc Nº</div><div style="margin-top:4px;">${safe(data.docNumber)}</div></div>
      <div><div style="font-size:9px;letter-spacing:2px;opacity:0.6;text-transform:uppercase;">Validade</div><div style="margin-top:4px;">${safe(data.validity || '60 dias')}</div></div>
    </div>
  `;

  switch (templateId) {
    case "classic":
      return `<div style="background:linear-gradient(135deg,${primaryColor},${secondaryColor});padding:80px 50px;min-height:297mm;display:flex;flex-direction:column;justify-content:center;color:white;">
        <div style="font-size:11px;letter-spacing:4px;opacity:0.7;margin-bottom:40px;">${docType}</div>
        <h1 style="font-size:36pt;font-weight:800;line-height:1.1;margin:0 0 20px;">${safe(data.project)}</h1>
        <div style="width:80px;height:3px;background:white;margin:20px 0 30px;opacity:0.6;"></div>
        ${coverMeta}
      </div>`;

    case "modern-web":
      return `<div style="min-height:210mm;padding:60px;display:flex;flex-direction:column;justify-content:center;background:linear-gradient(135deg,#1a1a2e,${primaryColor}33);color:white;">
        <div style="display:flex;gap:60px;align-items:center;">
          <div style="flex:1;">
            <div style="font-size:10px;letter-spacing:3px;color:${secondaryColor};margin-bottom:20px;">PREPARADO PARA</div>
            <div style="font-size:16pt;font-weight:600;margin-bottom:8px;">${safe(data.client)}</div>
            <div style="font-size:10px;letter-spacing:3px;color:${secondaryColor};margin-top:30px;">PREPARADO POR</div>
            <div style="font-size:14pt;margin-top:4px;">${safe(data.company)}</div>
          </div>
          <div style="flex:1.5;">
            <div style="font-size:48pt;font-weight:900;line-height:1;background:linear-gradient(135deg,${secondaryColor},${primaryColor});-webkit-background-clip:text;color:transparent;">${docType.split(' ').slice(0,2).join('<br/>')}</div>
            <div style="font-size:16pt;margin-top:16px;color:#ccc;">${safe(data.project)}</div>
            <div style="margin-top:20px;color:#999;">${safe(data.date)} · ${safe(data.docNumber)} · Validade: ${safe(data.validity || '60 dias')}</div>
          </div>
        </div>
      </div>`;

    case "minimalist":
      return `<div style="min-height:297mm;padding:80px 60px;display:flex;align-items:center;background:#f5f5f5;">
        <div style="display:flex;gap:40px;width:100%;">
          <div style="width:4px;background:${primaryColor};border-radius:2px;"></div>
          <div>
            <div style="font-size:42pt;font-weight:900;color:#333;line-height:1.1;">${docType.split(' ').slice(0,2).join('<br/>')}</div>
            <div style="margin-top:30px;color:#666;font-size:12pt;">
              <p>Cliente: <strong>${safe(data.client)}</strong></p>
              <p>Projeto: <strong>${safe(data.project)}</strong></p>
              <p>Data: ${safe(data.date)} · Versão: ${safe(data.version)}</p>
              <p>Doc: ${safe(data.docNumber)} · Validade: ${safe(data.validity || '60 dias')}</p>
            </div>
          </div>
        </div>
      </div>`;

    case "corporate-blue":
      return `<div style="min-height:297mm;padding:80px 50px;display:flex;flex-direction:column;justify-content:center;background:${primaryColor};color:white;">
        <div style="font-size:12px;letter-spacing:5px;opacity:0.6;">${docType}</div>
        <h1 style="font-size:48pt;font-weight:900;margin:20px 0;">${safe(data.project)}</h1>
        <div style="font-size:14pt;opacity:0.8;margin-bottom:40px;">${safe(data.client)} · ${safe(data.date)}</div>
        <div style="background:rgba(255,255,255,0.1);padding:30px;border-radius:12px;margin-top:20px;">
          <div style="display:flex;gap:30px;flex-wrap:wrap;">
            <div><div style="font-size:10px;letter-spacing:3px;opacity:0.6;">VERSÃO</div><div style="font-size:16pt;font-weight:600;margin-top:4px;">${safe(data.version)}</div></div>
            <div><div style="font-size:10px;letter-spacing:3px;opacity:0.6;">DOCUMENTO</div><div style="font-size:16pt;font-weight:600;margin-top:4px;">${safe(data.docNumber)}</div></div>
            <div><div style="font-size:10px;letter-spacing:3px;opacity:0.6;">VALIDADE</div><div style="font-size:16pt;font-weight:600;margin-top:4px;">${safe(data.validity || '60 dias')}</div></div>
          </div>
        </div>
      </div>`;

    case "bold-yellow":
      return `<div style="min-height:210mm;padding:60px;display:flex;flex-direction:column;justify-content:center;background:#111;color:white;">
        <div style="width:100px;height:6px;background:${secondaryColor};border-radius:3px;margin-bottom:30px;"></div>
        <div style="font-size:48pt;font-weight:900;line-height:0.95;color:${secondaryColor};">${docType.split(' ').slice(0,2).join('<br/>')}</div>
        <div style="margin-top:30px;font-size:14pt;color:#ccc;">${safe(data.client)} | ${safe(data.project)}</div>
        <div style="margin-top:16px;color:#888;">${safe(data.date)} · ${safe(data.docNumber)} · Validade: ${safe(data.validity || '60 dias')}</div>
      </div>`;

    case "dark-luxury":
      return `<div style="min-height:297mm;padding:80px 60px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;border:1px solid ${secondaryColor}33;background:#0a0a0a;color:white;">
        <div style="font-size:10px;letter-spacing:8px;color:${secondaryColor};">PREMIUM</div>
        <div style="width:60px;height:1px;background:${secondaryColor};margin:20px 0;"></div>
        <div style="font-size:14pt;color:#888;margin-bottom:30px;">${docType}</div>
        <h1 style="font-size:36pt;font-weight:300;letter-spacing:2px;">${safe(data.project)}</h1>
        <div style="font-size:16pt;color:#666;margin-top:16px;">${safe(data.client)}</div>
        <div style="font-size:11pt;color:#555;margin-top:10px;">${safe(data.date)} · ${safe(data.docNumber)}</div>
        <div style="font-size:10pt;color:#444;margin-top:6px;">Validade: ${safe(data.validity || '60 dias')}</div>
      </div>`;

    case "tech-gradient":
      return `<div style="min-height:297mm;padding:80px 50px;display:flex;flex-direction:column;justify-content:center;background:linear-gradient(160deg,#0f0c29,#302b63,#24243e);color:white;">
        <div style="font-size:48pt;font-weight:900;line-height:1;background:linear-gradient(135deg,${primaryColor},${secondaryColor});-webkit-background-clip:text;color:transparent;">${docType.split(' ').slice(0,2).join('<br/>')}</div>
        <div style="font-size:16pt;color:#a0a0ff;margin:30px 0;">${safe(data.project)}</div>
        <div style="color:#8888cc;margin-top:10px;">Cliente: ${safe(data.client)}</div>
        <div style="color:#6666aa;margin-top:6px;">${safe(data.date)} · ${safe(data.docNumber)} · Validade: ${safe(data.validity || '60 dias')}</div>
      </div>`;

    case "editorial":
      return `<div style="min-height:297mm;padding:80px 60px;display:flex;flex-direction:column;justify-content:center;background:#faf9f6;font-family:'Georgia','Times New Roman',serif;">
        <h1 style="font-size:56pt;font-weight:900;line-height:0.95;color:#111;font-style:italic;">${docType.split(' ').slice(0,2).join(' ')}</h1>
        <div style="width:60px;height:3px;background:${primaryColor};margin:30px 0;"></div>
        <div style="font-size:14pt;color:#555;">${safe(data.client)} · ${safe(data.project)}</div>
        <div style="font-size:12pt;color:#777;margin-top:16px;">${safe(data.date)} · ${safe(data.docNumber)}</div>
        <div style="font-style:italic;color:#999;margin-top:30px;font-size:14pt;">Versão ${safe(data.version)} · Validade: ${safe(data.validity || '60 dias')}</div>
      </div>`;

    case "geometric":
      return `<div style="min-height:210mm;background:#f0f0f0;position:relative;overflow:hidden;">
        <div style="position:absolute;right:-50px;top:-50px;width:300px;height:300px;background:${primaryColor};border-radius:50%;opacity:0.15;"></div>
        <div style="position:absolute;left:100px;bottom:-80px;width:200px;height:200px;background:${secondaryColor};transform:rotate(45deg);opacity:0.1;"></div>
        <div style="min-height:210mm;padding:60px;display:flex;flex-direction:column;justify-content:center;position:relative;z-index:1;">
          <div style="font-size:46pt;font-weight:900;line-height:1;color:#222;">${docType.split(' ').slice(0,2).join('<br/>')}</div>
          <div style="margin-top:24px;font-size:14pt;color:#555;">${safe(data.client)} | ${safe(data.project)}</div>
          <div style="margin-top:16px;font-size:12pt;color:${primaryColor};">${safe(data.date)} · ${safe(data.docNumber)} · Validade: ${safe(data.validity || '60 dias')}</div>
        </div>
      </div>`;

    case "glassmorphism":
      return `<div style="background:linear-gradient(135deg,#667eea,#764ba2);">
        <div style="min-height:297mm;padding:80px 50px;display:flex;flex-direction:column;justify-content:center;align-items:center;color:white;">
          <div style="background:rgba(255,255,255,0.1);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.2);border-radius:24px;padding:60px;text-align:center;max-width:500px;">
            <div style="font-size:12px;letter-spacing:4px;opacity:0.7;margin-bottom:16px;">${docType}</div>
            <div style="font-size:36pt;font-weight:900;line-height:1;">${safe(data.project)}</div>
            <div style="margin-top:24px;font-size:13pt;opacity:0.8;">${safe(data.client)}</div>
            <div style="opacity:0.6;margin-top:12px;">${safe(data.date)} · ${safe(data.docNumber)}</div>
            <div style="opacity:0.5;margin-top:6px;font-size:10pt;">Validade: ${safe(data.validity || '60 dias')}</div>
          </div>
        </div>
      </div>`;

    default:
      return buildCover("classic", data, primaryColor, secondaryColor);
  }
}

export function renderTemplate(
  templateId: string,
  data: ProposalData,
  primaryColor: string,
  secondaryColor: string
): string {
  const cover = buildCover(templateId, data, primaryColor, secondaryColor);
  const contentPages = buildContentPages(data.content, primaryColor, secondaryColor, data);
  const template = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];
  const isLandscape = template.orientation === "landscape";
  const pageWidth = isLandscape ? "297mm" : "210mm";
  const minHeight = isLandscape ? "210mm" : "297mm";

  return `<div class="page" style="width:${pageWidth};min-height:${minHeight};background:white;font-family:'Inter',system-ui,sans-serif;">
    ${cover}
    ${contentPages}
  </div>`;
}

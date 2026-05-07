export interface TemplateUI {
  id: string;
  name: string;
  html: string;
}

export const TEMPLATES_UI: TemplateUI[] = [
  {
    id: 'classic-corporate',
    name: '01 Classic Corporate',
    html: `
      <style>
        :root { --primary: {{primary}}; --secondary: {{secondary}}; }
        
        body { font-family: 'Open Sans', sans-serif; color: #1a1a1a; margin: 0; padding: 0; background: #f1f5f9; }
        
        /* A4 Page Setup */
        .page-cover { width: 210mm; height: 297mm; padding: 30mm; background: white; position: relative; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; margin: 0 auto; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
        
        .header { border-bottom: 4px solid var(--primary); padding-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
        .logo { font-family: 'Montserrat', sans-serif; font-size: 28px; font-weight: 900; color: var(--primary); letter-spacing: -1px; }
        
        .content-cover { margin-top: 60px; }
        .title { font-family: 'Montserrat', sans-serif; font-size: 42px; font-weight: 900; color: var(--primary); margin-bottom: 10px; line-height: 1.1; letter-spacing: -1px; }
        .subtitle { font-family: 'Montserrat', sans-serif; font-size: 14px; color: var(--secondary); text-transform: uppercase; letter-spacing: 5px; font-weight: 700; opacity: 0.7; }
        
        .meta-box { margin-top: 60px; background: #f8fafc; padding: 40px; border-radius: 20px; border: 1px solid #e2e8f0; }
        .meta-item { margin-bottom: 25px; }
        .meta-item:last-child { margin-bottom: 0; }
        .meta-label { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #64748b; letter-spacing: 1px; margin-bottom: 5px; }
        .meta-value { font-size: 18px; font-weight: 700; color: #0f172a; }
        
        .footer-cover { border-top: 1px solid #eee; padding-top: 20px; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; font-weight: 800; text-transform: uppercase; }

        /* Dossier Body Styles */
        .dossie-body { width: 210mm; margin: 0 auto; padding: 25mm 20mm; box-sizing: border-box; background: white; min-height: 297mm; box-shadow: 0 0 20px rgba(0,0,0,0.1); position: relative; }
        
        h1, .proposal-title { font-family: 'Montserrat', sans-serif; font-size: 22pt; font-weight: 900; color: var(--primary); margin: 30pt 0 15pt; border-bottom: 3px solid var(--primary); padding-bottom: 8pt; text-transform: uppercase; page-break-before: always; }
        h2, .proposal-subtitle { font-family: 'Montserrat', sans-serif; font-size: 16pt; font-weight: 800; color: var(--secondary); margin: 25pt 0 12pt; border-left: 5pt solid var(--primary); padding-left: 12pt; }
        h3 { font-family: 'Montserrat', sans-serif; font-size: 13pt; font-weight: 700; color: #334155; margin: 18pt 0 10pt; }
        
        p, .proposal-text { font-family: 'Open Sans', sans-serif; font-size: 10.5pt; line-height: 1.6; color: #1e293b; margin-bottom: 12pt; text-align: justify; }
        
        /* Table Styles (SPEC v3.0) */
        table, .proposal-table { width: 100%; border-collapse: collapse; margin: 15pt 0; table-layout: fixed; border: 1pt solid #e2e8f0; }
        thead { display: table-header-group; }
        th { background: #f8fafc; color: #0f172a; font-weight: 700; font-size: 9pt; padding: 10pt; border: 1pt solid #e2e8f0; text-align: left; font-family: 'Montserrat', sans-serif; }
        td { padding: 9pt; border: 1pt solid #e2e8f0; font-size: 9.5pt; vertical-align: top; word-wrap: break-word; font-family: 'Open Sans', sans-serif; }
        tr:nth-child(even) td { background: #fbfcfe; }
        
        /* Callouts (SPEC v3.0) */
        .callout { padding: 12pt 15pt; border-radius: 8pt; margin: 15pt 0; border-left: 5pt solid; page-break-inside: avoid; }
        .callout.verde, .callout.sucesso { background: #ecfdf5; border-color: #10b981; color: #065f46; }
        .callout.amarela, .callout.atencao { background: #fffbeb; border-color: #f59e0b; color: #92400e; }
        .callout.vermelha, .callout.perigo { background: #fef2f2; border-color: #ef4444; color: #991b1b; }
        .callout.azul, .callout.info { background: #eff6ff; border-color: #3b82f6; color: #1e40af; }
        .callout.laranja { background: #fff7ed; border-color: #f97316; color: #9a3412; }
        
        /* Signature Blocks */
        .signature-block { margin-top: 40pt; display: grid; grid-template-columns: 1fr 1fr; gap: 40pt; page-break-inside: avoid; }
        .sig-line { border-top: 1pt solid #475569; padding-top: 8pt; text-align: center; }
        .sig-name { font-weight: 700; font-size: 10pt; color: #0f172a; }
        .sig-cargo { font-size: 9pt; color: #64748b; }

        /* Footers */
        .footer-meta { position: absolute; bottom: 10mm; left: 20mm; right: 20mm; font-size: 8pt; color: #94a3b8; display: flex; justify-content: space-between; border-top: 0.5pt solid #e2e8f0; padding-top: 5pt; }
        
        .page-break { page-break-after: always; }
      </style>
      
      <div class="page-cover">
        <div class="header">
          <div class="logo">AXIZ STUDIO</div>
          <div style="text-align: right; font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Industrial Intelligence<br>Engineering & Design</div>
        </div>
        <div class="content-cover">
          <div class="subtitle">Dossiê Técnico Industrial</div>
          <div class="title">{{project}}</div>
          <div class="meta-box">
            <div class="meta-item"><div class="meta-label">Cliente</div><div class="meta-value">{{client}}</div></div>
            <div class="meta-item"><div class="meta-label">ID de Controle</div><div class="meta-value">{{id}}</div></div>
            <div class="meta-item"><div class="meta-label">Emissão</div><div class="meta-value">{{date}}</div></div>
          </div>
        </div>
        <div class="footer-cover">
          <div>© {{year}} Axiz · Confidential · Proprietary Industrial Methodology</div>
          <div>Capa de Documento</div>
        </div>
      </div>
      
      <div class="dossie-body">
        {{content}}
      </div>
    `
  },
  {
    id: 'modern-web',
    name: '02 Modern Web',
    html: `
      <style>
        :root { --primary: {{primary}}; --secondary: {{secondary}}; }
        body { font-family: 'Inter', sans-serif; background: var(--secondary); color: white; margin: 0; padding: 0; }
        .page { width: 297mm; height: 210mm; background: var(--secondary); overflow: hidden; display: flex; }
        .left { width: 40%; padding: 60px; background: rgba(255,255,255,0.05); display: flex; flex-direction: column; justify-content: space-between; }
        .right { width: 60%; padding: 60px; display: flex; flex-direction: column; justify-content: center; }
        .tag { background: var(--primary); color: white; padding: 6px 15px; border-radius: 50px; font-size: 12px; font-weight: 800; display: inline-block; margin-bottom: 20px; }
        .title { font-size: 64px; font-weight: 900; line-height: 1; margin-bottom: 20px; color: white; }
        .client { font-size: 24px; font-weight: 300; opacity: 0.7; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 40px; }
        .info-card { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 15px; }
        .info-label { font-size: 10px; opacity: 0.5; text-transform: uppercase; margin-bottom: 5px; }
        .info-value { font-size: 14px; font-weight: 700; }
      </style>
      <div class="page">
        <div class="left">
          <div class="logo" style="font-weight: 900; font-size: 20px; letter-spacing: 2px;">AXIZ</div>
          <div>
            <div class="info-label">Preparado para</div>
            <div style="font-size: 28px; font-weight: 700; margin-bottom: 10px;">{{client}}</div>
            <div class="info-label">Emitido em {{date}}</div>
          </div>
        </div>
        <div class="right">
          <div class="tag">WEB & CLOUD SOLUTIONS</div>
          <div class="title">{{project}}</div>
          <div style="font-size: 20px; opacity: 0.8; margin-bottom: 40px;">Proposta de Transformação Digital</div>
          <div class="info-grid">
            <div class="info-card">
              <div class="info-label">Investimento Estimado</div>
              <div class="info-value">{{valor}}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Prazo Estimado</div>
              <div class="info-value">12 Semanas</div>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 'minimalist-gray',
    name: '03 Minimalist Gray',
    html: `
      <style>
        :root { --primary: {{primary}}; --secondary: {{secondary}}; }
        body { font-family: 'Inter', sans-serif; color: var(--primary); margin: 0; padding: 0; }
        .page { width: 297mm; height: 210mm; padding: 80px; background: white; position: relative; }
        .line { width: 100px; height: 2px; background: var(--primary); margin-bottom: 40px; }
        .title { font-size: 40px; font-weight: 200; letter-spacing: -1px; margin-bottom: 40px; }
        .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 60px; margin-top: 100px; }
        .label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--secondary); margin-bottom: 10px; }
        .value { font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 30px; }
      </style>
      <div class="page">
        <div class="line"></div>
        <div class="title">Comercial Proposal<br><b>{{project}}</b></div>
        <div class="grid">
          <div>
            <div class="label">Client</div>
            <div class="value">{{client}}</div>
            <div class="label">Project Scope</div>
            <div class="value">Consultoria Estratégica de Engenharia</div>
          </div>
          <div>
            <div class="label">Budget</div>
            <div class="value">{{valor}}</div>
            <div class="label">Date</div>
            <div class="value">{{date}}</div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 'corporate-blue',
    name: '04 Corporate Blue',
    html: `
      <style>
        :root { --primary: {{primary}}; --secondary: {{secondary}}; }
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; }
        .page { width: 297mm; height: 210mm; background: #f0f4f8; display: flex; flex-direction: column; }
        .top { height: 15px; background: var(--primary); }
        .main { flex: 1; padding: 60px; display: flex; }
        .left { flex: 1; display: flex; flex-direction: column; justify-content: center; }
        .right { width: 350px; background: white; margin-left: 60px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.05); padding: 40px; display: flex; flex-direction: column; justify-content: space-between; }
        .tag { color: var(--primary); font-weight: 900; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 10px; }
        .title { font-size: 56px; font-weight: 800; color: #102a43; line-height: 1.1; margin-bottom: 30px; }
        .label { font-size: 11px; font-weight: 700; color: #829ab1; text-transform: uppercase; margin-bottom: 5px; }
        .value { font-size: 16px; font-weight: 600; color: #102a43; margin-bottom: 25px; }
        .circle { width: 100px; height: 100px; border: 15px solid var(--primary); border-radius: 50%; opacity: 0.1; position: absolute; top: -50px; right: -50px; }
      </style>
      <div class="page">
        <div class="top"></div>
        <div class="main">
          <div class="left">
            <div class="tag">Business Proposal</div>
            <div class="title">{{project}}</div>
            <p style="color: #486581; font-size: 18px; max-width: 500px;">Soluções integradas para otimização de processos industriais e aumento de produtividade.</p>
          </div>
          <div class="right" style="position: relative; overflow: hidden;">
            <div class="circle"></div>
            <div>
              <div class="label">Preparado para</div>
              <div class="value">{{client}}</div>
              <div class="label">Investimento</div>
              <div class="value" style="font-size: 24px; color: var(--primary);">{{valor}}</div>
            </div>
            <div>
              <div class="label">Validade</div>
              <div class="value">15 Dias</div>
              <div class="label">Data</div>
              <div class="value">{{date}}</div>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 'bold-yellow',
    name: '05 Bold Yellow',
    html: `
      <style>
        :root { --primary: {{primary}}; --secondary: {{secondary}}; }
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; }
        .page { width: 297mm; height: 210mm; background: var(--primary); display: flex; flex-direction: column; padding: 60px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid black; padding-bottom: 20px; }
        .content { flex: 1; display: flex; align-items: flex-end; }
        .title { font-size: 120px; font-weight: 900; color: black; line-height: 0.8; letter-spacing: -5px; }
        .footer { margin-top: 40px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; border-top: 2px solid black; pt: 20px; }
        .label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: black; opacity: 0.6; }
        .value { font-size: 16px; font-weight: 800; color: black; }
      </style>
      <div class="page">
        <div class="header">
          <div style="font-weight: 900; font-size: 24px;">AXIZ</div>
          <div style="font-weight: 700;">PROPOSAL {{date}}</div>
        </div>
        <div class="content">
          <div class="title">TECH<br>LEVEL UP.</div>
        </div>
        <div class="footer" style="padding-top: 20px;">
          <div><div class="label">Project</div><div class="value">{{project}}</div></div>
          <div><div class="label">Client</div><div class="value">{{client}}</div></div>
          <div><div class="label">Total</div><div class="value">{{valor}}</div></div>
          <div><div class="label">Status</div><div class="value">Approved</div></div>
        </div>
      </div>
    `
  },
  {
    id: 'dark-luxury',
    name: '06 Dark Luxury',
    html: `
      <style>
        :root { --primary: {{primary}}; --secondary: {{secondary}}; }
        body { font-family: 'Playfair Display', serif; background: #000; color: #fff; margin: 0; padding: 0; }
        .page { width: 297mm; height: 210mm; background: #000; padding: 80px; position: relative; display: flex; flex-direction: column; justify-content: center; }
        .border { position: absolute; top: 30px; bottom: 30px; left: 30px; right: 30px; border: 1px solid rgba(255,255,255,0.1); }
        .gold-line { width: 60px; height: 2px; background: var(--primary); margin: 0 auto 40px; }
        .subtitle { font-size: 14px; letter-spacing: 8px; text-transform: uppercase; text-align: center; color: var(--primary); margin-bottom: 20px; }
        .title { font-size: 56px; font-weight: 400; text-align: center; margin-bottom: 60px; }
        .details { display: flex; justify-content: center; gap: 80px; }
        .item { text-align: center; }
        .label { font-size: 9px; letter-spacing: 3px; text-transform: uppercase; opacity: 0.5; margin-bottom: 10px; }
        .value { font-size: 18px; font-weight: 300; }
      </style>
      <div class="page">
        <div class="border"></div>
        <div class="subtitle">Premium Collection</div>
        <div class="title">{{project}}</div>
        <div class="gold-line"></div>
        <div class="details">
          <div class="item">
            <div class="label">Client</div>
            <div class="value">{{client}}</div>
          </div>
          <div class="item">
            <div class="label">Investment</div>
            <div class="value" style="color: var(--primary);">{{valor}}</div>
          </div>
          <div class="item">
            <div class="label">Established</div>
            <div class="value">{{date}}</div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 'tech-gradient',
    name: '07 Tech Gradient',
    html: `
      <style>
        :root { --primary: {{primary}}; --secondary: {{secondary}}; }
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; overflow: hidden; }
        .page { width: 297mm; height: 210mm; background: linear-gradient(135deg, var(--primary), var(--secondary)); position: relative; padding: 80px; color: white; display: flex; flex-direction: column; justify-content: space-between; }
        .glass { background: rgba(255,255,255,0.1); backdrop-filter: blur(20px); border-radius: 30px; padding: 60px; border: 1px solid rgba(255,255,255,0.2); }
        .title { font-size: 72px; font-weight: 900; letter-spacing: -2px; line-height: 0.9; margin-bottom: 20px; }
        .tag { display: inline-block; padding: 8px 20px; background: white; color: var(--primary); border-radius: 50px; font-weight: 800; font-size: 12px; margin-bottom: 30px; }
        .footer { display: flex; justify-content: space-between; align-items: flex-end; }
      </style>
      <div class="page">
        <div class="glass">
          <div class="tag">FUTURE READY</div>
          <div class="title">{{project}}</div>
          <p style="font-size: 20px; opacity: 0.8;">Inovação em escala global para o projeto de {{client}}.</p>
        </div>
        <div class="footer">
          <div>
            <div style="font-size: 48px; font-weight: 800;">{{valor}}</div>
            <div style="opacity: 0.6; text-transform: uppercase; font-size: 10px; letter-spacing: 2px;">Total Budget</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700;">{{date}}</div>
            <div style="opacity: 0.6;">AXIZ.CLOUD</div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 'editorial-magazine',
    name: '08 Editorial Magazine',
    html: `
      <style>
        :root { --primary: {{primary}}; --secondary: {{secondary}}; }
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; color: #000; }
        .page { width: 297mm; height: 210mm; background: #fff; padding: 60px; position: relative; border: 20px solid #f0f0f0; }
        .top { border-bottom: 1px solid #000; padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; font-weight: 800; font-size: 14px; }
        .title { font-size: 100px; font-weight: 900; letter-spacing: -4px; line-height: 0.85; margin-bottom: 40px; }
        .flex { display: flex; gap: 60px; }
        .column { flex: 1; font-size: 16px; line-height: 1.6; color: #444; }
        .highlight { font-size: 24px; font-weight: 700; color: #000; margin-bottom: 20px; }
        .bottom { position: absolute; bottom: 60px; left: 60px; right: 60px; display: flex; justify-content: space-between; border-top: 4px solid #000; pt: 20px; }
      </style>
      <div class="page">
        <div class="top"><div>AXIZ MAGAZINE</div><div>{{date}}</div></div>
        <div class="title">{{project}}</div>
        <div class="flex">
          <div class="column">
            <div class="highlight">A New Perspective for {{client}}.</div>
            Esta proposta redefine os padrões de eficiência para o setor industrial, combinando estética e funcionalidade em uma solução única.
          </div>
          <div class="column">
            O investimento total de {{valor}} reflete o compromisso com a excelência e o retorno garantido sobre cada detalhe planejado.
          </div>
        </div>
        <div class="bottom" style="padding-top: 20px;">
          <div style="font-weight: 900;">001 / PROPOSAL</div>
          <div style="font-weight: 900;">AXIZ.COM</div>
        </div>
      </div>
    `
  },
  {
    id: 'geometric-modern',
    name: '09 Geometric Modern',
    html: `
      <style>
        :root { --primary: {{primary}}; --secondary: {{secondary}}; }
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; overflow: hidden; }
        .page { width: 297mm; height: 210mm; background: #fff; position: relative; }
        .shape { position: absolute; top: 0; right: 0; width: 50%; height: 100%; background: var(--secondary); clip-path: polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%); }
        .content { position: relative; z-index: 1; padding: 80px; height: 100%; display: flex; flex-direction: column; justify-content: center; }
        .title { font-size: 64px; font-weight: 900; color: var(--primary); margin-bottom: 20px; }
        .client { font-size: 32px; font-weight: 400; color: #333; margin-bottom: 60px; }
        .info { background: white; padding: 40px; border-radius: 0 40px 40px 0; box-shadow: 20px 20px 60px rgba(0,0,0,0.05); width: fit-content; border-left: 10px solid var(--primary); }
        .label { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #999; margin-bottom: 5px; }
        .value { font-size: 20px; font-weight: 700; color: #000; }
      </style>
      <div class="page">
        <div class="shape"></div>
        <div class="content">
          <div class="title">{{project}}</div>
          <div class="client">{{client}}</div>
          <div class="info">
            <div class="label">Total Project Value</div>
            <div class="value">{{valor}}</div>
            <div style="margin-top: 20px;" class="label">Date</div>
            <div class="value">{{date}}</div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: 'glassmorphism-ultra',
    name: '10 Glassmorphism',
    html: `
      <style>
        :root { --primary: {{primary}}; --secondary: {{secondary}}; }
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background: #f0f2f5; }
        .page { width: 297mm; height: 210mm; background: linear-gradient(45deg, #f0f2f5, #e0e5ec); padding: 60px; display: flex; align-items: center; justify-content: center; }
        .card { width: 80%; height: 70%; background: rgba(255,255,255,0.4); backdrop-filter: blur(20px); border-radius: 40px; border: 1px solid rgba(255,255,255,0.5); box-shadow: 0 40px 80px rgba(0,0,0,0.1); padding: 60px; display: flex; flex-direction: column; justify-content: space-between; }
        .header { display: flex; justify-content: space-between; align-items: center; }
        .title { font-size: 48px; font-weight: 900; background: linear-gradient(to right, var(--primary), var(--secondary)); -webkit-background-clip: text; color: transparent; }
        .footer { display: flex; justify-content: space-between; border-top: 1px solid rgba(0,0,0,0.05); pt: 20px; }
        .label { font-size: 10px; font-weight: 800; opacity: 0.4; text-transform: uppercase; }
        .value { font-size: 18px; font-weight: 700; color: #1e293b; }
      </style>
      <div class="page">
        <div class="card">
          <div class="header">
            <div style="font-weight: 900; font-size: 20px;">AXIZ STUDIO</div>
            <div style="background: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: 700;">PROPOSAL</div>
          </div>
          <div>
            <div class="label">Project Title</div>
            <div class="title">{{project}}</div>
            <div class="label" style="margin-top: 20px;">For Client</div>
            <div class="value" style="font-size: 32px;">{{client}}</div>
          </div>
          <div class="footer" style="padding-top: 20px;">
            <div><div class="label">Investment</div><div class="value">{{valor}}</div></div>
            <div><div class="label">Date</div><div class="value">{{date}}</div></div>
          </div>
        </div>
      </div>
    `
  }
];

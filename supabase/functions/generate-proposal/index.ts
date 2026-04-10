import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function identifyAgents(miniEscopo: string): string {
  const text = miniEscopo.toLowerCase();
  const agents: string[] = [];

  const agentRules: { keywords: string[]; agent: string; expertise: string }[] = [
    {
      keywords: ["molde", "injeção", "injetora", "plástico", "cavidade", "canal quente", "ejeção", "polímero", "termoformagem", "sopro"],
      agent: "Agente 1: Especialista em Moldes Plásticos",
      expertise: "Projeto de moldes de injeção (DFM, runner, resfriamento, ejeção, venting), simulação Moldflow, materiais (DIN 1.2738, Al 7075), validação FAI, manutenção preventiva. Normas: ISO 12100, VDI 2421, NR-12."
    },
    {
      keywords: ["estampo", "corte", "dobra", "chapa", "prensa", "punção", "progressivo", "transferência", "repuxo", "embutimento", "estampagem"],
      agent: "Agente 2: Especialista em Estampos (Corte, Dobra, Repuxo)",
      expertise: "Estampos progressivos, transfer e tandem. Cálculos: Fc=P×e×τ, Fd=(k×L×e²×Rm)/W, relação de repuxo DR, springback. Materiais: DC01-DC04, Al 5052, Inox 304. Normas: NR-12, ISO 12100, DIN 8580."
    },
    {
      keywords: ["hidráulico", "pneumático", "cilindro", "válvula", "bomba hidráulica", "atuador", "potência fluida"],
      agent: "Agente 3: Especialista em Sistemas Hidráulicos e Pneumáticos",
      expertise: "Dimensionamento de atuadores (F=P×A×η), seleção de válvulas (Cv/Kv), circuitos hidráulicos/pneumáticos, simbologia ISO 1219. Normas: ISO 4413, ISO 4414, NR-12."
    },
    {
      keywords: ["caldeiraria", "estrutura metálica", "tanque", "silo", "tremonha", "chute", "soldagem", "soldada"],
      agent: "Agente 4: Especialista em Caldeiraria e Estruturas Metálicas",
      expertise: "Projeto estrutural (tensões, flechas ≤L/250, flambagem), soldagem (MIG/MAG, TIG, arco submerso), END (LP, PM, US, RX). Normas: NR-13, ASME VIII/IX, AWS D1.1, NBR 8800."
    },
    {
      keywords: ["pintura", "spray", "pó", "eletrostática", "e-coat", "revestimento", "acabamento superficial", "primer"],
      agent: "Agente 5: Especialista em Processos de Pintura Industrial",
      expertise: "Pré-tratamento (fosfatização), especificação de tintas (epóxi, PU, poliéster), parâmetros de aplicação (HVLP, airless), controle de qualidade (aderência, espessura, brilho). Normas: ISO 12944, ASTM D3359."
    },
    {
      keywords: ["cabine de pintura", "estufa", "forno de cura", "túnel de pintura"],
      agent: "Agente 6: Especialista em Cabines e Equipamentos de Pintura",
      expertise: "Projeto de cabines (fluxo de ar 0.4-0.7 m/s), estufas de cura (uniformidade ±3°C), sistemas de transporte (monotrilho, P&F), segurança (NFPA 33/86). Normas: NR-12, NR-13, NFPA 33."
    },
    {
      keywords: ["cnc", "usinagem", "fresar", "tornear", "centro de usinagem", "torno", "retificadora", "fuso", "mandril", "ferramenta de corte"],
      agent: "Agente 7: Especialista em Máquinas-Ferramenta CNC",
      expertise: "Especificação de máquinas CNC (3-5 eixos), parâmetros de corte (Vc, fz, ap, MRR), ferramentas (HSS, MD, cerâmica, CBN/PCD), programação G/M, CAM. Normas: ISO 230, NR-12."
    },
    {
      keywords: ["projeto industrial", "coordenação", "gestão de projeto", "implantação", "comissionamento", "start-up", "eap", "wbs", "cronograma"],
      agent: "Agente 8: Especialista em Engenharia de Projetos Industriais (Coordenador)",
      expertise: "Gestão de escopo (EAP/WBS), cronograma (caminho crítico, Gantt), aquisições (RFQ, PO), FAT/SAT, comissionamento, start-up, gestão de mudanças. Normas: PMBOK, ISO 21500."
    },
    {
      keywords: ["robô", "célula", "celula", "robotizada", "automatizado", "carga e descarga", "paletização", "despaletização", "solda robotizada", "pick and place", "end-of-arm", "eoat", "clp", "plc", "ihm", "hmi", "scada", "servo", "inversor", "automação"],
      agent: "Agente 9: Especialista em Automação e Controle",
      expertise: "CLP, IHM, SCADA, redes industriais, intertravamentos, instrumentação, servoacionamentos, inversores, Safety PLC, integração MES/ERP. Células robotizadas: seleção de robôs, EOAT, simulação offline, segurança NR-12."
    },
    {
      keywords: ["oee", "produtividade", "gargalo", "balanceamento", "layout industrial", "lean", "vsm", "kaizen", "takt time"],
      agent: "Agente 10: Especialista em Processos Industriais e Produtividade (OEE)",
      expertise: "OEE (Disponibilidade×Performance×Qualidade), VSM, balanceamento de linha, gargalos, layout industrial, PCP/S&OP, engenharia de métodos. Foco: redução de perdas e aumento de capacidade."
    },
    {
      keywords: ["qualidade", "metrologia", "inspeção", "cpk", "ppk", "cmm", "visão artificial", "calibração", "ensaio", "fmea", "apqp", "ppap", "spc"],
      agent: "Agente 11: Especialista em Qualidade e Metrologia",
      expertise: "APQP, PPAP, FMEA (DFMEA/PFMEA), plano de controle, MSA (GR&R), SPC/CEP (Cp/Cpk), metrologia (CMM, visão), gestão de NC, CAPA. Normas: IATF 16949, ISO 9001."
    },
    {
      keywords: ["manutenção", "preventiva", "preditiva", "vibração", "termografia", "lubrificação", "confiabilidade", "mtbf", "mttr", "rcm", "tpm"],
      agent: "Agente 12: Especialista em Manutenção e Confiabilidade",
      expertise: "RCM, CBM, TPM, monitoramento de condição (vibração, termografia, análise de óleo), MTBF/MTTR, gestão de sobressalentes, custeio de manutenção. Normas: ISO 55001."
    },
    {
      keywords: ["segurança", "nr-12", "nr12", "nr-13", "intertravamento", "barreira", "scanner", "e-stop", "enclausuramento", "risco", "hazop", "iso 12100", "loto"],
      agent: "Agente 13: Especialista em EHS, Segurança Industrial e HAZOP",
      expertise: "HAZOP, FMEA de segurança, APP, hierarquia de controle de risco, NR-12/ISO 12100, proteções fixas/móveis, E-stop, LOTO, segurança funcional (SIL/PL). Normas: NR-12, ISO 12100, ISO 13849."
    },
    {
      keywords: ["material", "aço", "alumínio", "tratamento térmico", "têmpera", "revenido", "nitretação", "cementação", "metalografia", "dureza"],
      agent: "Agente 14: Especialista em Materiais e Tratamentos Térmicos",
      expertise: "Seleção de materiais (aços carbono, ligados, inox, alumínios, polímeros), tratamentos térmicos (têmpera, revenido, nitretação, cementação), ensaios (tração, dureza, impacto, metalografia). Normas: ASTM, DIN, SAE."
    },
    {
      keywords: ["vaso de pressão", "nr-13", "nr13", "caldeira", "trocador de calor", "tubulação", "pressurizado"],
      agent: "Agente 15: Especialista em Vasos de Pressão, Tubulações e NR-13",
      expertise: "Projeto de vasos de pressão (ASME VIII), tubulações (ASME B31.1/B31.3), tanques (API 650), cálculos de espessura (fórmulas ASME), análise de tensões. Normas: NR-13, ASME, API."
    },
    {
      keywords: ["custo", "proposta comercial", "orçamento", "investimento", "retorno", "payback", "roi", "viabilidade econômica", "capex", "opex"],
      agent: "Agente 16: Especialista em Custos, Proposta Técnica e Comercial",
      expertise: "Estimativa CAPEX/OPEX, análise de viabilidade (VPL, TIR, payback), TCO, custo-hora-máquina, custo por peça, análise de sensibilidade, estruturação de propostas comerciais."
    },
  ];

  for (const rule of agentRules) {
    if (rule.keywords.some(kw => text.includes(kw))) {
      agents.push(`${rule.agent}: ${rule.expertise}`);
    }
  }

  // Always add the commercial agent for proposals
  if (!agents.some(a => a.includes("Agente 16"))) {
    agents.push(`Agente 16: Especialista em Custos, Proposta Técnica e Comercial: Estimativa CAPEX/OPEX, análise de viabilidade, estruturação de propostas comerciais.`);
  }

  if (agents.length <= 1) {
    agents.unshift("Agente Generalista: Especialista em Engenharia Industrial Geral — Análise multidisciplinar de sistemas industriais.");
  }

  return agents.join("\n\n");
}

function getVersionDepthInstructions(version: string, objective: string): string {
  if (objective === "Gerar Escopo Técnico") {
    return `TIPO DE DOCUMENTO: ESCOPO TÉCNICO INICIAL
Gere um documento de escopo técnico preliminar. Foco em:
- Definição clara do problema/necessidade
- Análise de viabilidade preliminar
- Alternativas de solução em alto nível
- Estimativas de ordem de grandeza (custos e prazos)
- Próximos passos e dados a confirmar
NÃO incluir detalhamento de custos por item, critérios de aceitação detalhados ou cronograma completo.
Estrutura simplificada: Apresentação, Contexto, Alternativas, Solução Recomendada, Escopo Preliminar, Estimativas, Próximos Passos.`;
  }

  switch (version) {
    case "Basica":
      return `VERSÃO: BÁSICA — Análise superficial, escopo resumido, poucos detalhes técnicos.
- Seções obrigatórias: 1-Apresentação, 2-Contexto, 3-Alternativas (resumido), 4-Recomendação, 5-Escopo (resumido), 8-Estimativa de Custos (valores globais, sem decomposição), 9-Prazo (global), 14-Fechamento, 15-Recomendações.
- NÃO incluir: Critérios de Aceitação detalhados, Gestão de Riscos detalhada, Visão Conceitual com imagens.
- Nível de detalhe técnico: SUPERFICIAL. Ordens de grandeza.
- Extensão alvo: 3-5 páginas.`;

    case "Normal":
      return `VERSÃO: NORMAL — Análise técnica razoável, escopo detalhado.
- TODAS as 15 seções obrigatórias devem estar presentes.
- Incluir cálculos de tempo de ciclo, carga útil e OEE.
- Estimativa de custos com decomposição por categoria principal.
- Cronograma com fases.
- Gestão de riscos com 3-5 riscos principais.
- Nível de detalhe técnico: MODERADO. Valores calculados com premissas explícitas.
- Extensão alvo: 8-15 páginas.`;

    case "Completa":
      return `VERSÃO: COMPLETA — Análise técnica PROFUNDA, máximo detalhamento.
- TODAS as 15 seções obrigatórias DEVEM estar presentes com MÁXIMO DETALHAMENTO.
- ANÁLISE TÉCNICA PROFUNDA: cálculos detalhados, fórmulas utilizadas, premissas quantificadas.
- DETALHAMENTO POR ESPECIALIDADE: cada agente acionado deve contribuir com conteúdo técnico específico e profundo.
- CRITÉRIOS DE ACEITAÇÃO: métricas mensuráveis (OEE ≥ X%, Cpk ≥ Y, tempo de ciclo ≤ Zs).
- GESTÃO DE RISCOS COMPLETA: matriz de risco com probabilidade×impacto, mitigações específicas.
- ESTIMATIVA DE CUSTOS DETALHADA: decomposição por item (engenharia, material, fabricação, montagem, comissionamento, treinamento, documentação, contingência, impostos, frete).
- VISÃO CONCEITUAL: descrições detalhadas para cada <<IMAGEM:...>> placeholder.
- DADOS A CONFIRMAR: lista explícita de validações necessárias.
- Incluir caixas de destaque para recomendações, riscos e informações críticas.
- Nível de detalhe técnico: MÁXIMO. Equivalente a engenharia básica.
- Extensão alvo: 20-40 páginas.`;

    default:
      return `VERSÃO: NORMAL (padrão). Incluir todas as 15 seções com nível moderado de detalhe.`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { clientName, projectTitle, initialObjective, proposalVersion, miniEscopo, producao, peca, peso, dimensoes, ambiente, automacao, processoAtual, objetivo, observacoes } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const selectedAgents = identifyAgents(miniEscopo || "");
    const versionInstructions = getVersionDepthInstructions(proposalVersion || "Normal", initialObjective || "Gerar Proposta Técnica e Comercial");

    const systemPrompt = `Você é um sistema de coordenação de agentes especializados em engenharia industrial, baseado na ARQUITETURA DE AGENTES ESPECIALIZADOS (Fonte de Verdade).

AGENTES ACIONADOS PARA ESTE PROJETO:
${selectedAgents}

${versionInstructions}

IDENTIDADE E PAPÉIS:
- ENGENHEIRO CONSULTIVO – analisa sob múltiplas perspectivas, recomenda soluções tecnicamente sólidas.
- ANALISTA DE VIABILIDADE – avalia viabilidade técnica, econômica e cronológica.
- ESTRUTURADOR DE SOLUÇÕES – transforma necessidade difusa em plano de execução concreto.
- TRADUTOR ENTRE ÁREAS – engenharia, operação, manutenção, qualidade, EHS, comercial.

PRINCÍPIOS OBRIGATÓRIOS (NÃO NEGOCIÁVEIS):
1. PRECISÃO TÉCNICA: Terminologia precisa, unidades de medida, referências normativas, justificativas quantitativas.
2. DIFERENCIAÇÃO CLARA: FATO vs HIPÓTESE vs PREMISSA vs ESTIMATIVA — sempre explícito.
3. SEM GENERALIZAÇÕES: Premissas explícitas e quantificadas. Proibido "geralmente" sem contexto.
4. SOLUÇÃO SEGURA E VIÁVEL: Priorize soluções seguras, viáveis, manteníveis e escaláveis.
5. VISÃO HOLÍSTICA: CAPEX, OPEX, PRAZO, RISCO, RETORNO, COMPLEXIDADE DE IMPLANTAÇÃO.
6. CICLO DE VIDA: Concepção → Projeto → Fabricação → Instalação → Comissionamento → Operação → Manutenção → Modernização → Descomissionamento.
7. MULTIDISCIPLINARIDADE: Processo, Automação, Qualidade, Manutenção, Segurança, Negócio.
8. SINALIZAÇÃO DE RISCO: Segurança, Qualidade, Prazo, Custo, Integração.
9. HIERARQUIA DE DECISÃO: 1)Segurança/Legal → 2)Viabilidade Técnica → 3)Compatibilidade → 4)Confiabilidade → 5)Performance → 6)Prazo → 7)Custo → 8)Flexibilidade → 9)Sofisticação.
10. MENOR COMPLEXIDADE NECESSÁRIA: Solução mais simples que atende todos os requisitos.
11. INCERTEZAS EXPLÍCITAS: Dados faltantes, grau de confiança, informações a validar.
12. MÚLTIPLAS ROTAS: Conservadora, Intermediária, Otimizada.

PROCESSAMENTO AUTOMÁTICO (executar e apresentar resultados na proposta):
1. TEMPO DE CICLO: Disponível = 3600/produção × 0.85
2. CARGA ÚTIL: (peso + 0.5kg) × 1.1
3. ALCANCE: Distância × 1.2
4. SEGURANÇA: NR-12, ISO 12100 — condição de projeto
5. AMBIENTE: IP adequado, materiais resistentes
6. OEE: Meta ≥ 75%, MTBF > 8760h

DETALHAMENTO DE SERVIÇOS (incluir conforme aplicável):
1. Engenharia Mecânica 2. Engenharia Elétrica 3. Montagens Mecânicas 4. Montagens Elétricas
5. Engenharia de Software 6. Montagens Internas 7. Instalação no Cliente 8. Comissionamento
9. Serviços Contratados 10. Transportes e Logística 11. Aluguel de Equipamentos 12. Despesas de Campo

FORMATO DE SAÍDA — HTML EXECUTIVO:
Gere HTML formatado com design executivo profissional. Use estas classes CSS:

ESTRUTURA VISUAL:
- <div class="proposal-cover"> para capa executiva (fundo gradiente azul profundo)
- <h1 class="proposal-title"> títulos principais
- <h2 class="proposal-subtitle"> subtítulos de seção
- <h3 class="proposal-subtitle"> sub-subtítulos
- <p class="proposal-text"> texto corpo
- <ul class="proposal-list"> / <ol class="proposal-list"> listas
- <div class="proposal-section"> envolver cada seção

ELEMENTOS VISUAIS OBRIGATÓRIOS:
- <div class="highlight-box highlight-recommendation"> para recomendações (verde)
- <div class="highlight-box highlight-risk"> para riscos (vermelho)
- <div class="highlight-box highlight-info"> para informações importantes (azul)
- <div class="highlight-box highlight-warning"> para alertas/próximos passos (amarelo)
- <div class="technical-card"> para cards técnicos
- <div class="grid-2"> para layout em 2 colunas
- <div class="grid-3"> para layout em 3 colunas
- <table class="proposal-table"> para tabelas executivas (cabeçalho azul, zebrado)
- <div class="cost-summary"> para resumo de custos
- <<IMAGEM:NOME>> para placeholders de imagem

CAPA EXECUTIVA (sempre incluir):
<div class="proposal-cover">
  <h1 class="cover-title">${initialObjective === "Gerar Escopo Técnico" ? "ESCOPO TÉCNICO" : "PROPOSTA TÉCNICA E COMERCIAL"}</h1>
  <h2 class="cover-subtitle">${projectTitle || "Projeto Industrial"}</h2>
  <div class="cover-meta">
    <p>Cliente: ${clientName || "A definir"}</p>
    <p>Data: {data atual}</p>
    <p>Versão: ${proposalVersion || "Normal"}</p>
    <p>Documento Nº: PROP-{número sequencial}</p>
    <p>Validade: 60 dias</p>
  </div>
</div>

ESTRUTURA DA PROPOSTA COMPLETA (15 SEÇÕES — ajustar conforme versão):

1. APRESENTAÇÃO — Introdução profissional, contextualização da expertise

2. CONTEXTO DO PROJETO — Cenário atual, necessidade do cliente, cálculos realizados, premissas, nível de maturidade da demanda
   <<IMAGEM:FLUXO_PROCESSO>>

3. ALTERNATIVAS DE SOLUÇÃO — 3 alternativas comparadas:
   - Opção Básica (Conservadora): menor risco, tecnologia comprovada
   - Opção Intermediária: equilíbrio risco/custo/performance
   - Opção Otimizada (Premium): máxima performance
   Usar <table class="proposal-table"> para comparação e <div class="highlight-box highlight-recommendation"> para a recomendada

4. SOLUÇÃO RECOMENDADA E JUSTIFICATIVA — Baseada na hierarquia de decisão

5. ESCOPO TÉCNICO — Detalhamento da solução recomendada com especificações
   <<IMAGEM:LAYOUT_SOLUCAO>>

6. ETAPAS DE EXECUÇÃO — Sequência com responsável, duração, dependências

7. RECURSOS NECESSÁRIOS — Pessoal, Materiais, Equipamentos, Serviços de Terceiros

8. ESTIMATIVA DE CUSTOS — Decomposição com margem de incerteza
   Usar <table class="proposal-table"> e <div class="cost-summary">

9. ESTIMATIVA DE PRAZO — Fases com duração e dependências

10. GESTÃO DE RISCOS — Descrição, probabilidade, impacto, mitigação
    Usar <div class="highlight-box highlight-risk"> para riscos críticos

11. CRITÉRIOS DE ACEITAÇÃO / SUCESSO — Métricas mensuráveis

12. DADOS A CONFIRMAR — Lista de validações necessárias
    Usar <div class="highlight-box highlight-warning">

13. VISÃO CONCEITUAL DA SOLUÇÃO
    <<IMAGEM:CONCEITO_SOLUCAO>>

14. FECHAMENTO COMERCIAL — Recomendar melhor opção, reforçar ganhos

15. RECOMENDAÇÕES FINAIS — Próximos passos concretos e acionáveis

NÃO use markdown (**, ##, etc). Use HTML puro com as classes acima.

REGRAS FINAIS:
- Linguagem técnica + comercial equilibrada, em português brasileiro
- Não inventar marcas ou fabricantes
- Clareza e objetividade
- Segurança como CONDIÇÃO de projeto, não acessório
- Declarar incertezas e dados faltantes explicitamente
- Cada agente acionado DEVE contribuir com conteúdo técnico específico na proposta
- A profundidade do conteúdo DEVE ser proporcional à versão selecionada
- NUNCA inventar especificações sem base
- NUNCA tratar estimativa como valor fechado
- Priorizar solução mais simples que atende todos os requisitos`;

    const userPrompt = `DADOS DO PROJETO:
Cliente: ${clientName || "Não informado"}
Projeto: ${projectTitle || "Não informado"}
Tipo de Documento: ${initialObjective || "Proposta Técnica e Comercial"}
Versão: ${proposalVersion || "Normal"}

Mini Escopo: ${miniEscopo}
Produção desejada: ${producao || "Não informada"} peças/hora
Descrição da peça: ${peca || "Não informada"}
Peso da peça: ${peso || "Não informado"} kg
Dimensões: ${dimensoes || "Não informadas"}
Ambiente: ${ambiente || "Industrial normal"}
Nível de automação: ${automacao || "Não informado"}
Processo atual: ${processoAtual || "Não informado"}
Objetivo do projeto: ${objetivo || "Aumentar produtividade e reduzir custos"}
Observações: ${observacoes || "Nenhuma"}

Gere o documento completo conforme as instruções do sistema.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos esgotados. Adicione créditos em Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("Erro ao gerar proposta com IA");
    }

    const responseText = await response.text();
    if (!responseText) throw new Error("Resposta vazia da IA.");

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error("Failed to parse:", responseText.substring(0, 500));
      throw new Error("Erro ao processar resposta da IA.");
    }

    const proposal = data.choices?.[0]?.message?.content || "Não foi possível gerar a proposta.";

    return new Response(JSON.stringify({ proposal }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

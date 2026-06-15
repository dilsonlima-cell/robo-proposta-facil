import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================
// SCOPE CLASSIFIER — Fase 1, Seção 2.1 da especificação v2.0
// Detecta tipo_projeto e porte antes do dispatch de skills
// ============================================================
interface ScopeClassification {
  tipo_projeto: string;
  porte: "pequeno" | "medio" | "grande" | "nao_identificado";
  nivel_automacao: "manual" | "padrao" | "alta_performance";
  subsistemas_obrigatorios: string[];
}

function classifyScope(miniEscopo: string, peso: string, producao: string, automacao: string): ScopeClassification {
  const text = miniEscopo.toLowerCase();
  const pesoNum = parseFloat(peso || "0");

  let porte: ScopeClassification["porte"] = "nao_identificado";
  if (text.includes("grande porte") || pesoNum >= 500) {
    porte = "grande";
  } else if (text.includes("pequeno porte") || (pesoNum > 0 && pesoNum < 50)) {
    porte = "pequeno";
  } else if (pesoNum >= 50) {
    porte = "medio";
  }

  let tipo_projeto = "automacao_industrial";
  if (["pintura", "cabine", "estufa", "tinta", "revestimento", "primer"].some(k => text.includes(k))) {
    tipo_projeto = "sistema_de_superficies";
  } else if (["robô", "célula", "celula", "robotizada", "cnc", "usinagem"].some(k => text.includes(k))) {
    tipo_projeto = "celula_robotizada";
  } else if (["transportador", "esteira", "agv", "paletiz", "logistica"].some(k => text.includes(k))) {
    tipo_projeto = "movimentacao_logistica";
  } else if (["embalagem", "envase", "envazamento"].some(k => text.includes(k))) {
    tipo_projeto = "embalagem_envase";
  } else if (["solda", "soldagem"].some(k => text.includes(k))) {
    tipo_projeto = "soldagem_robotizada";
  }

  let nivel_automacao: ScopeClassification["nivel_automacao"] = "padrao";
  if (automacao?.toLowerCase().includes("totalmente") || text.includes("alta performance")) {
    nivel_automacao = "alta_performance";
  } else if (automacao?.toLowerCase().includes("semi") || text.includes("semi")) {
    nivel_automacao = "manual";
  }

  const subsistemas_obrigatorios: string[] = [];

  return { tipo_projeto, porte, nivel_automacao, subsistemas_obrigatorios };
}

// ============================================================
// CAMPOS CRÍTICOS UNIVERSAIS — ausência gera premissa obrigatória
// Apenas campos relevantes para qualquer tipo de projeto
// ============================================================
function getMissingCategoryAFields(input: Record<string, string | undefined>): string[] {
  const missing: string[] = [];
  if (!input.dimensoes || input.dimensoes === "") missing.push("Dimensões máximas da peça/produto (L×W×H)");
  if (!input.peso || input.peso === "") missing.push("Peso máximo da peça/produto (kg)");
  if (!input.producao || input.producao === "") missing.push("Produção horária meta (unidades/hora)");
  return missing;
}

// ============================================================
// CONTEXTO DE ESCOPO GENÉRICO — injetado no system prompt
// Diretrizes de qualidade proporcionais ao porte detectado.
// Sem valores hardcoded ou referências a domínio específico.
// ============================================================
function buildScopeEnhancement(scope: ScopeClassification, missingFields: string[]): string {
  const porteRules: Record<string, string> = {
    grande: `
DIRETRIZES OBRIGATÓRIAS — PROJETO DE GRANDE PORTE:
- Estrutura de custos: mínimo 10 itens discriminados com valores unitários
- Cronograma: mínimo 8 fases com durações em semanas
- ROI: obrigatório 3 cenários (conservador, base, otimista) com WACC e vida útil explícitos
- Critérios de Aceitação: mínimo 7 KPIs quantitativos mensuráveis
- Alternativas de investimento: mínimo 2 rotas técnicas comparadas
- Riscos: mínimo 5 riscos identificados com plano de mitigação`,
    medio: `
DIRETRIZES OBRIGATÓRIAS — PROJETO DE MÉDIO PORTE:
- Estrutura de custos: mínimo 7 itens discriminados
- Cronograma: mínimo 5 fases com durações
- ROI: 2 cenários (conservador e base) com premissas declaradas
- Critérios de Aceitação: mínimo 5 KPIs quantitativos
- Riscos: mínimo 3 riscos identificados`,
    pequeno: `
DIRETRIZES OBRIGATÓRIAS — PROJETO DE PEQUENO PORTE:
- Estrutura de custos: mínimo 5 itens discriminados
- Cronograma: fases e marcos principais
- ROI: payback simples com premissas declaradas
- Critérios de Aceitação: mínimo 3 KPIs`,
  };

  let ctx = `\n═══════════════════════════════════════════════
CLASSIFICAÇÃO DE ESCOPO (automática)
═══════════════════════════════════════════════
tipo_projeto: ${scope.tipo_projeto}
porte_estimado: ${scope.porte}
nivel_automacao: ${scope.nivel_automacao}
`;

  const rules = porteRules[scope.porte];
  if (rules) ctx += rules;

  if (missingFields.length > 0) {
    ctx += `

DADOS TÉCNICOS AUSENTES — declarar como PREMISSA CRÍTICA na Seção 2:
${missingFields.map(f => `- ${f}: não informado — usar estimativa técnica conservadora e documentar o impacto na precisão do orçamento.`).join("\n")}`;
  }

  return ctx;
}


function identifyAgents(miniEscopo: string): string {
  const text = miniEscopo.toLowerCase();
  const agents: string[] = [];

  const agentRules: { keywords: string[]; agent: string; expertise: string }[] = [
    // AGENTES 1-5: ENGENHARIA DE PROCESSOS E PRODUÇÃO
    {
      keywords: ["oee", "produtividade", "gargalo", "balanceamento", "layout industrial", "lean", "vsm", "kaizen", "takt time", "pcp", "s&op", "smed", "throughput"],
      agent: "Agente 1: Engenharia de Processos Industriais, Produtividade e OEE",
      expertise: "OEE (Disponibilidade×Performance×Qualidade), VSM, balanceamento de linha, gargalos, layout industrial, PCP/S&OP, SMED, engenharia de métodos, Lean, Kaizen. Foco: redução de perdas e aumento de capacidade."
    },
    {
      keywords: ["clp", "plc", "ihm", "hmi", "scada", "servo", "inversor", "automação", "controle", "safety plc", "intertravamento", "malha de controle", "pid", "profinet", "ethercat", "opc-ua"],
      agent: "Agente 2: Automação Industrial, Controle e Sistemas de Comando",
      expertise: "CLP, IHM, SCADA, redes industriais (Profinet, EtherCAT, OPC-UA), intertravamentos, instrumentação, servoacionamentos, inversores, Safety PLC (SIL/PL), integração MES/ERP. Normas: ISO 13849-1, IEC 62061, IEC 60204-1."
    },
    {
      keywords: ["custo", "proposta comercial", "orçamento", "investimento", "retorno", "payback", "roi", "viabilidade econômica", "capex", "opex", "vpl", "tir", "tco"],
      agent: "Agente 3: Engenharia Econômica, Custos e Retorno de Investimento",
      expertise: "Estimativa CAPEX/OPEX, análise de viabilidade (VPL, TIR, payback descontado), TCO, custo-hora-máquina, custo por peça, análise de sensibilidade, estruturação de propostas comerciais."
    },
    {
      keywords: ["projeto industrial", "coordenação", "gestão de projeto", "implantação", "comissionamento", "start-up", "eap", "wbs", "cronograma", "fat", "sat"],
      agent: "Agente 4: Gestão de Projetos, Integração Multidisciplinar e Coordenação",
      expertise: "Gestão de escopo (EAP/WBS), cronograma (caminho crítico, Gantt), aquisições (RFQ, PO), FAT/SAT, comissionamento, start-up, gestão de mudanças. Normas: PMBOK, ISO 21500."
    },
    {
      keywords: ["qualidade", "metrologia", "inspeção", "cpk", "ppk", "cmm", "calibração", "ensaio", "fmea", "apqp", "ppap", "spc", "msa", "iatf"],
      agent: "Agente 5: Qualidade, Metrologia, Rastreabilidade e Conformidade",
      expertise: "APQP, PPAP, FMEA (DFMEA/PFMEA), plano de controle, MSA (GR&R), SPC/CEP (Cp/Cpk), metrologia (CMM, visão), gestão de NC, CAPA. Normas: IATF 16949, ISO 9001."
    },

    // AGENTES 6-11: MANUFATURA ESPECIALIZADA E PROCESSAMENTO
    {
      keywords: ["solda", "soldagem", "mig", "mag", "tig", "arco submerso", "resistência", "laser welding", "tocha", "cordão"],
      agent: "Agente 6: Dispositivos para Processos de Soldagem Industrial",
      expertise: "Máquinas de solda (MIG/MAG, TIG, Resistência, Arco Submerso, Laser), parâmetros (corrente, tensão, velocidade), fixtures, inspeção (VT, UT, RT), qualificação ASME IX. Normas: ASME IX, AWS D1.1, ISO 5817, NR-12."
    },
    {
      keywords: ["visão artificial", "inspeção automática", "câmera industrial", "visão computacional", "ocr", "detecção de defeitos", "machine vision"],
      agent: "Agente 7: Dispositivos de Inspeção Automática",
      expertise: "Visão computacional 2D/3D, termografia, OCR/Barcode, detecção de defeitos, integração PLC/MES. Taxa rejeição falsa <5%, aceitação falsa <1%."
    },
    {
      keywords: ["montagem", "célula de montagem", "assembly", "cobot", "colaborativo", "dfma", "pick and place", "end-of-arm", "eoat"],
      agent: "Agente 8: Projetos de Células de Montagem Industrial",
      expertise: "DFMA, modularização, sequenciamento, robôs colaborativos (cobots), end effectors, ergonomia, balanceamento de postos, rastreabilidade. Normas: ISO 12100, ISO/TS 15066, NR-12."
    },
    {
      keywords: ["embalagem", "empacotamento", "flow pack", "vffs", "blister", "stretch", "enchimento", "selagem", "alimentício", "agroindustrial"],
      agent: "Agente 9: Equipamentos de Embalagem e Empacotamento",
      expertise: "Horizontal Flow Pack, VFFS, Blister, Stretch Wrapper, enchimento (volumétrico, gravimétrico), selagem (calor, ultrassom), integração com linha. Normas: ANVISA, ISO 22000, NR-12, INMETRO."
    },
    {
      keywords: ["transporte", "esteira", "transportador", "rolo", "corrente", "agv", "amr", "paletização", "despaletização", "armazém", "as/rs", "wms", "movimentação"],
      agent: "Agente 10: Movimentação e Automação de Processos Logísticos",
      expertise: "Transportadores (roletes, corrente, esteira), AGV/AMR, paletizadores, AS/RS, integração WMS/MES/ERP, rastreabilidade RFID. Normas: ISO 3691-4, NR-11, NR-12."
    },
    {
      keywords: ["misturador", "pesagem", "dosagem", "reator", "tanque", "processamento químico", "batelada", "batch"],
      agent: "Agente 11: Misturadores, Pesagem, Dosagem e Processamento",
      expertise: "Reatores, tanques de mistura, sistemas de pesagem, dosagem estequiométrica, integração ISA-88/IEC 61512, rastreabilidade de lote. Normas: ANVISA, ISO 22000, NR-13."
    },

    // AGENTES 12-16: ENGENHARIA MECÂNICA E MANUFATURA AVANÇADA
    {
      keywords: ["robô", "célula", "celula", "robotizada", "robótica", "carga e descarga", "end effector", "manipulador", "cnc", "centro de usinagem", "torno", "fresadora", "retificadora", "máquina especial"],
      agent: "Agente 12: Engenharia Mecânica Industrial, Máquinas Especiais e Robótica",
      expertise: "CNC (3-5 eixos), tornos, fresadoras, retificadoras, robôs industriais (6 eixos), cobots, end effectors, ferramentas de corte (HSS, MD, CBN/PCD), programação G/M, CAM, simulação offline. Normas: ISO 230, ISO 12100, NR-12."
    },
    {
      keywords: ["usinagem", "estampagem", "moldagem", "conformação", "corte", "fresar", "tornear", "parâmetros de corte"],
      agent: "Agente 13: Processos de Manufatura: Usinagem, Estampagem, Moldagem",
      expertise: "Parâmetros de corte (Vc, fz, ap, MRR), ferramentas, moldes, conformação de chapas, processos de fabricação. Normas: ISO 230, DIN 8580."
    },
    {
      keywords: ["molde", "injeção", "injetora", "plástico", "cavidade", "canal quente", "hot runner", "ejeção", "polímero", "termoformagem", "sopro", "moldflow"],
      agent: "Agente 14: Moldes Plásticos e Cavidades de Injeção",
      expertise: "Projeto de moldes de injeção (DFM, runner, resfriamento conformal, ejeção, venting), simulação Moldflow, materiais (DIN 1.2738, Al 7075), validação FAI. Normas: ISO 12100, VDI 2421, NR-12."
    },
    {
      keywords: ["estampo", "dobra", "chapa", "prensa", "punção", "progressivo", "transferência", "repuxo", "embutimento", "estampagem", "matriz"],
      agent: "Agente 15: Estampos: Corte, Dobra e Repuxo",
      expertise: "Estampos progressivos, transfer e tandem. Cálculos: Fc=P×e×τ, Fd=(k×L×e²×Rm)/W, relação de repuxo DR, springback. Materiais: DC01-DC04, Al 5052, Inox 304. Normas: NR-12, ISO 12100, DIN 8580."
    },
    {
      keywords: ["hidráulico", "pneumático", "cilindro", "válvula", "bomba hidráulica", "atuador", "potência fluida"],
      agent: "Agente 16: Sistemas Hidráulicos e Pneumáticos",
      expertise: "Dimensionamento de atuadores (F=P×A×η), seleção de válvulas (Cv/Kv), circuitos hidráulicos/pneumáticos, simbologia ISO 1219. Normas: ISO 4413, ISO 4414, NR-12."
    },

    // AGENTES 17-21: ENGENHARIA ELÉTRICA, TI E CIBERSEGURANÇA
    {
      keywords: ["elétrica", "painel elétrico", "quadro elétrico", "proteção elétrica", "aterramento", "ups", "qualidade de energia", "harmônicas", "subestação", "nr-10"],
      agent: "Agente 17: Engenharia Elétrica Industrial: Distribuição, Proteção e Qualidade de Energia",
      expertise: "Painéis de distribuição, proteção (disjuntores, fusíveis, relés), aterramento (TN-S, TT, IT), qualidade de energia (harmônicas, sag/swell, fator de potência), UPS, redundância. Normas: NR-10, IEC 60204-1, NBR 5410."
    },
    {
      keywords: ["rede industrial", "infraestrutura ti", "servidor", "storage", "backup", "switch", "firewall industrial", "ot/it"],
      agent: "Agente 18: Tecnologia da Informação e Infraestrutura Digital Industrial",
      expertise: "Redes OT/IT (topologia, segmentação, DMZ), servidores, storage, backup/restore (RTO, RPO), switches industriais, VLANs. Normas: ISA-95/IEC 62264."
    },
    {
      keywords: ["embarcado", "fpga", "microcontrolador", "edge computing", "m2m", "iot industrial", "mqtt", "gateway"],
      agent: "Agente 19: Engenharia de Computação Aplicada: Sistemas Embarcados e M2M",
      expertise: "FPGA, microcontroladores, visão embarcada, edge computing, protocolos M2M (MQTT, AMQP, CoAP), gateways IoT. Normas: IEC 62443."
    },
    {
      keywords: ["cibersegurança", "segurança cibernética", "iec 62443", "isa 62443", "hardening", "ids", "ips", "ransomware"],
      agent: "Agente 20: Segurança Cibernética Industrial (OT/IT)",
      expertise: "Segmentação de rede, hardening, firewalls industriais, IDS/IPS, monitoramento de anomalias, resposta a incidente. Normas: ISA/IEC 62443, NIST CSF."
    },
    {
      keywords: ["lgpd", "gdpr", "proteção de dados", "privacidade", "consentimento", "anonimização"],
      agent: "Agente 21: Proteção de Dados, Privacidade e Conformidade LGPD/GDPR",
      expertise: "Coleta e consentimento, anonimização/pseudonimização, auditoria de dados, direitos do titular, DPO, DPIA. Normas: LGPD, GDPR, ISO 27701."
    },

    // AGENTES 22-26: DADOS, IA E ANALYTICS
    {
      keywords: ["ciência de dados", "analytics", "bi", "dashboard", "kpi", "eda", "estatística", "big data"],
      agent: "Agente 22: Ciência de Dados: Coleta, Processamento, Analytics e BI",
      expertise: "EDA, modelagem estatística, dashboards, KPIs, métricas, pipelines de dados (ETL/ELT), Data Lake, historiador, SQL/NoSQL."
    },
    {
      keywords: ["inteligência artificial", "machine learning", "deep learning", "ia", "ml", "detecção de anomalia", "rede neural", "cnn"],
      agent: "Agente 23: Inteligência Artificial e Machine Learning Aplicado à Manufatura",
      expertise: "Supervised/unsupervised learning, deep learning (CNN, RNN), detecção de anomalias, classificação, regressão, IA preditiva."
    },
    {
      keywords: ["explicabilidade", "xai", "governança de dados", "shap", "lime", "ética ia"],
      agent: "Agente 24: Explicabilidade de IA (XAI) e Governança de Dados",
      expertise: "Interpretabilidade de modelos (SHAP, LIME), transparência, ethics AI, governança de dados. Normas: IEEE 7000, NIST AI RMF, ISO/IEC 42001."
    },
    {
      keywords: ["manutenção", "preventiva", "preditiva", "vibração", "termografia", "lubrificação", "confiabilidade", "mtbf", "mttr", "rcm", "tpm"],
      agent: "Agente 25: Manutenção Preditiva, Confiabilidade e Gestão de Falhas",
      expertise: "RCM, CBM, TPM, monitoramento de condição, MTBF/MTTR, gestão de sobressalentes, MLOps para manutenção preditiva. Normas: ISO 55001."
    },
    {
      keywords: ["otimização", "reinforcement learning", "algoritmo genético", "heurística", "otimização de processo", "otimização de energia"],
      agent: "Agente 26: Otimização com IA: Processos, Produção e Energia",
      expertise: "Reinforcement Learning, algoritmos heurísticos (genético, PSO), otimização contínua de processos, energia, produção."
    },

    // AGENTES 27-30: SEGURANÇA, COMPLIANCE E COMUNICAÇÃO
    {
      keywords: ["segurança", "nr-12", "nr12", "iso 12100", "proteção de máquina", "barreira", "scanner", "e-stop", "enclausuramento", "loto"],
      agent: "Agente 27: Segurança Operacional, Máquinas e Sistemas de Proteção (NR-12, ISO 12100)",
      expertise: "Apreciação de risco ISO 12100, proteções fixas/móveis, intertravamentos, E-stop, LOTO, segurança funcional (SIL/PL), cortinas de luz, scanners. Normas: NR-12, ISO 12100, ISO 13849, ISO 14119."
    },
    {
      keywords: ["ehs", "meio ambiente", "saúde", "hazop", "nr-13", "nr13", "caldeira", "vaso de pressão", "tubulação"],
      agent: "Agente 28: EHS Integrado: Segurança, Saúde, Ambiente e Conformidade Regulatória",
      expertise: "Hierarquia de controles, HAZOP, vasos de pressão (ASME VIII), tubulações (ASME B31), caldeiras. Normas: NR-13, ASME, API, ISO 45001."
    },
    {
      keywords: ["design", "diagramação", "comunicação visual", "documentação técnica", "layout de documento", "diagrama", "fluxograma"],
      agent: "Agente 29: Design, Diagramação, Comunicação Visual e Documentação Técnica",
      expertise: "Diagramas técnicos, layouts dimensionados, fluxogramas, hierarquia visual, tipografia, acessibilidade WCAG 2.1 AA. Normas: ISO 10628-1, ISO 1219-1, ISO 7010."
    },
    {
      keywords: ["gestão de risco", "compliance", "conformidade", "matriz de risco", "análise de risco", "risco multidimensional"],
      agent: "Agente 30: Gestão de Risco, Conformidade e Integração de Segurança Multidimensional",
      expertise: "Matriz de risco (probabilidade×impacto), conformidade normativa integrada, riscos em 7 dimensões, planos de contingência."
    },

    // AGENTES AUXILIARES DE ESPECIALIDADE CRUZADA
    {
      keywords: ["material", "aço", "alumínio", "tratamento térmico", "têmpera", "revenido", "nitretação", "cementação", "metalografia", "dureza"],
      agent: "Agente Auxiliar: Materiais e Tratamentos Térmicos",
      expertise: "Seleção de materiais (aços carbono, ligados, inox, alumínios, polímeros), tratamentos térmicos, ensaios. Normas: ASTM, DIN, SAE."
    },
    {
      keywords: ["caldeiraria", "estrutura metálica", "silo", "tremonha", "chute", "soldagem estrutural"],
      agent: "Agente Auxiliar: Caldeiraria e Estruturas Metálicas",
      expertise: "Projeto estrutural (tensões, flechas ≤L/250, flambagem), soldagem estrutural, END. Normas: NR-13, ASME VIII/IX, AWS D1.1, NBR 8800."
    },
    {
      keywords: ["pintura", "spray", "pó", "eletrostática", "e-coat", "revestimento", "acabamento superficial", "primer", "cabine de pintura", "estufa", "forno de cura"],
      agent: "Agente Auxiliar: Processos e Equipamentos de Pintura Industrial",
      expertise: "Pré-tratamento (fosfatização), tintas (epóxi, PU, poliéster), cabines (fluxo 0.4-0.7 m/s), estufas (uniformidade ±3°C). Normas: ISO 12944, NFPA 33, NR-12."
    },
  ];

  for (const rule of agentRules) {
    if (rule.keywords.some(kw => text.includes(kw))) {
      agents.push(`${rule.agent}: ${rule.expertise}`);
    }
  }

  // Always add the commercial/costs agent for proposals
  if (!agents.some(a => a.includes("Agente 3"))) {
    agents.push(`Agente 3: Engenharia Econômica, Custos e Retorno de Investimento: Estimativa CAPEX/OPEX, análise de viabilidade (VPL, TIR, payback), TCO, estruturação de propostas comerciais.`);
  }

  // Always add safety agent
  if (!agents.some(a => a.includes("Agente 27"))) {
    agents.push(`Agente 27: Segurança Operacional (NR-12, ISO 12100): Apreciação de risco, proteções, intertravamentos, segurança funcional.`);
  }

  // Always add risk management agent
  if (!agents.some(a => a.includes("Agente 30"))) {
    agents.push(`Agente 30: Gestão de Risco e Conformidade: Matriz de risco multidimensional, conformidade normativa integrada.`);
  }

  if (agents.length <= 3) {
    agents.unshift("Agente Generalista: Especialista em Engenharia Industrial Geral — Análise multidisciplinar integrada de sistemas industriais, conforme DNA Mestre da Arquitetura de 30 Agentes.");
  }

  return agents.join("\n\n");
}

function getVersionDepthInstructions(version: string, objective: string): string {
  if (objective === "Gerar Escopo Técnico") {
    return `TIPO DE DOCUMENTO: ESCOPO TÉCNICO INICIAL
NÍVEL DE MATURIDADE: IDEIA ou CONCEITO (conforme Seção 0.4 da Fonte de Verdade)
Gere um documento de escopo técnico preliminar. Foco em:
- Definição clara do problema/necessidade (causa raiz, não sintoma)
- Análise de viabilidade preliminar com premissas explícitas
- Alternativas de solução em alto nível (Conservadora, Intermediária, Otimizada)
- Estimativas de ordem de grandeza (custos ±50-100% e prazos)
- Riscos macro identificados
- Dados faltantes críticos e seu impacto
- Próximos passos concretos e acionáveis
Estrutura simplificada: Apresentação, Contexto e Premissas, Diagnóstico Técnico Inicial, Alternativas, Solução Recomendada, Escopo Preliminar, Estimativas, Riscos, Próximos Passos.`;
  }

  switch (version) {
    case "Basica":
      return `VERSÃO: BÁSICA — NÍVEL PRÉ-VIABILIDADE (conforme Seção 0.4)
- Seções obrigatórias: 1-Apresentação, 2-Contexto e Premissas, 3-Alternativas (resumido com tabela comparativa), 4-Recomendação, 5-Escopo (resumido), 8-Estimativa de Custos (valores globais ±30-50%), 9-Prazo (global), 10-Riscos (3 principais), 14-Fechamento, 15-Recomendações.
- Cada especialidade técnica identificada contribui com 1-2 parágrafos de conteúdo específico, sem revelar bastidores metodológicos.
- Diferenciar FATO vs HIPÓTESE vs PREMISSA vs ESTIMATIVA.
- Declarar dados faltantes e incertezas.
- Nível de detalhe técnico: SUPERFICIAL mas PRECISO. Ordens de grandeza com margem declarada.
- Extensão alvo: 3-5 páginas.`;

    case "Normal":
      return `VERSÃO: NORMAL — NÍVEL VIABILIDADE (conforme Seção 0.4)
- TODAS as 15 seções obrigatórias devem estar presentes.
- Incluir cálculos de tempo de ciclo, carga útil, OEE, com fórmulas e premissas.
- Estimativa de custos com decomposição por categoria principal (±20-30%).
- Cronograma com fases e dependências.
- Gestão de riscos com 5-8 riscos em formato: Descrição, Categoria, Probabilidade, Impacto, Mitigação.
- Cada especialidade técnica identificada contribui com análise técnica detalhada (3-5 parágrafos), sem revelar bastidores metodológicos.
- Incluir tabela comparativa de alternativas com métricas quantificadas.
- Especificações funcionais por subsistema.
- Diferenciar FATO vs HIPÓTESE vs PREMISSA vs ESTIMATIVA.
- Nível de detalhe técnico: MODERADO. Valores calculados com premissas explícitas.
- Extensão alvo: 8-15 páginas.`;

    case "Completa":
      return `VERSÃO: COMPLETA — NÍVEL ENGENHARIA BÁSICA (conforme Seção 0.4)
- TODAS as 15+ seções obrigatórias DEVEM estar presentes com MÁXIMO DETALHAMENTO.
- ANÁLISE TÉCNICA PROFUNDA: cálculos detalhados com fórmulas, premissas quantificadas, cadeia de raciocínio reproduzível.
- DETALHAMENTO POR ESPECIALIDADE: cada especialidade técnica identificada DEVE contribuir com conteúdo técnico específico e profundo (5-10 parágrafos), sem revelar bastidores metodológicos.
- HIERARQUIA DE DECISÃO APLICADA: demonstrar como a hierarquia (Segurança→Viabilidade→Confiabilidade→Performance→Custo) foi usada.
- CRITÉRIOS DE ACEITAÇÃO: métricas mensuráveis (OEE ≥ X%, Cpk ≥ Y, tempo de ciclo ≤ Zs, MTBF > W horas).
- GESTÃO DE RISCOS COMPLETA: matriz em 7 dimensões (operacional, elétrica, cibernética, dados, qualidade, prazo, integração), com probabilidade×impacto, mitigações específicas.
- ESTIMATIVA DE CUSTOS DETALHADA (±10-20%): decomposição por item (engenharia, material, fabricação, montagem, comissionamento, treinamento, documentação, contingência, impostos, frete).
- ANÁLISE DE RETORNO: VPL, TIR, payback descontado, análise de sensibilidade.
- ESCOPO TÉCNICO COMPLETO: especificações funcionais E técnicas, BOM preliminar, arquitetura de automação, layout conceitual.
- VISÃO CONCEITUAL: descrições detalhadas para cada <<IMAGEM:...>> placeholder.
- DADOS A CONFIRMAR: lista explícita de validações necessárias com impacto.
- NORMAS APLICÁVEIS: listar todas as NRs, ISOs, ASMEs aplicáveis.
- CICLO DE VIDA: considerar Concepção→Projeto→Fabricação→Instalação→Comissionamento→Operação→Manutenção→Modernização→Descomissionamento.
- Incluir caixas de destaque para recomendações, riscos e informações críticas.
- Diferenciar explicitamente FATO vs HIPÓTESE vs PREMISSA vs ESTIMATIVA em toda a proposta.
- Nível de detalhe técnico: MÁXIMO. Equivalente a engenharia básica.
- Extensão alvo: documento completo, priorizando terminar todas as seções com consistência técnica antes de ampliar o volume textual.

SEÇÕES ADICIONAIS PARA VERSÃO COMPLETA (conforme Seção 0.7 da Fonte de Verdade):
- Seção 16: [Se Investimento] ANÁLISE DE RETORNO (VPL, TIR, payback descontado, sensibilidade)
- Seção 17: [Se Segurança] PERIGOS E MEDIDAS DE PROTEÇÃO (ISO 12100, hierarquia de controle)
- Seção 18: [Se Elétrica] ESPECIFICAÇÕES ELÉTRICAS E PROTEÇÕES
- Seção 19: [Se TI/Dados] ARQUITETURA DE INFRAESTRUTURA E CIBERSEGURANÇA
- Seção 20: [Se IA] GOVERNANÇA DE IA, DADOS E EXPLICABILIDADE`;

    default:
      return `VERSÃO: NORMAL (padrão). Incluir todas as 15 seções com nível moderado de detalhe.`;
  }
}

function buildApplicationAnalysis(input: Record<string, string | undefined>): string {
  const goal = input.objetivo?.trim() || "aumentar produtividade, reduzir custos operacionais e elevar a confiabilidade do processo";
  const process = input.processoAtual?.trim() || "processo atual a confirmar em levantamento técnico";
  const automation = input.automacao?.trim() || "nível de automação a confirmar";
  const part = input.peca?.trim() || "produto/peça informado no escopo";
  const production = input.producao?.trim() ? `meta produtiva de ${input.producao} peças/hora` : "meta produtiva ainda não consolidada";
  const environment = input.ambiente?.trim() || "ambiente industrial";

  return `A necessidade central do cliente é transformar o ${process} em uma solução tecnicamente controlada, segura e escalável para ${part}, alinhando ${production}, ${automation} e condições de ${environment}. A aplicação deve reduzir dependências operacionais, estabilizar repetibilidade, preservar conformidade de segurança e criar uma base confiável para qualidade, manutenção e expansão futura. O foco da proposta, portanto, não é apenas fornecer um equipamento ou serviço, mas estruturar uma solução que resolva a necessidade de negócio declarada: ${goal}.`;
}

function validateProposalIntegrity(html: string): string[] {
  const warnings: string[] = [];
  const lowerHtml = html.toLowerCase();

  // 1. Check for textual graphs (SPEC v3.0 prohibits ■)
  if (html.includes('■') || html.includes('█')) {
    warnings.push("Gráfico de caracteres detectado e bloqueado conforme SPEC v3.0.");
  }

  // 2. Check for missing critical structures
  if (!lowerHtml.includes('signature-block') && !lowerHtml.includes('assinaturas')) {
    warnings.push("Bloco de assinaturas não identificado.");
  }

  if (!lowerHtml.includes('footer-meta')) {
    warnings.push("Metadados de rodapé ausentes.");
  }

  // 3. Check for length vs premium expectations
  if (html.length < 3000) {
    warnings.push("Conteúdo técnico abaixo do limite de densidade industrial esperado.");
  }

  // 4. Check for forbidden terms (IA/Agents) - although sanitized, we check if they are still there
  if (/\bIA\b|\bagente\b/i.test(html)) {
    warnings.push("Resquícios de terminologia de IA detectados.");
  }

  return warnings;
}

function sanitizeProposal(html: string, formInput?: Record<string, string | undefined>): string {
  let result = html;

  // 0. CRÍTICO: Strip markdown code fences (```html, ```, ~~~)
  result = result.replace(/```[\w]*\n?|```/g, '');
  result = result.replace(/~~~[\w]*\n?|~~~/g, '');
  
  // 1. Remove control characters and zero-width chars
  result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
  result = result.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
  // 1.b Remove mojibake artifacts comuns (UTF-8 mal decodificado) e box-drawing residual
  result = result.replace(/[■█▪▫◆◇░▒▓]/g, '');
  result = result.replace(/\uFFFD/g, '');
  result = result.replace(/Â(?=[\s\xA0])/g, '');
  // Normaliza NBSP visualmente quebrado e múltiplos espaços
  result = result.replace(/\u00A0/g, ' ').replace(/[ \t]{3,}/g, '  ');

  // 2. Protect SPEC v3.0 structures (Tables & Head)
  if (result.includes('<table') && !result.includes('<thead')) {
    result = result.replace(/(<table[^>]*>)\s*(<tr>\s*<th)/gi, '$1<thead>$2');
    result = result.replace(/(<\/th>\s*<\/tr>)\s*(<tr>\s*<td>)/gi, '$1</thead><tbody>$2');
    result = result.replace(/(<\/td>\s*<\/tr>)\s*(<\/table>)/gi, '$1</tbody>$2');
  }

  // 3. Replace AI/agent terms
  result = result
    .replace(/gerad[ao]s? automaticamente/gi, "elaborado")
    .replace(/inteligência artificial/gi, "engenharia consultiva")
    .replace(/\bIA\b/g, "engenharia consultiva")
    .replace(/\bagentes?\b/gi, "especialistas");

  // 3.b Remove blocos duplicados consecutivos (parágrafos, headings, tabelas idênticas)
  result = result.replace(
    /(<(?:p|h1|h2|h3|h4|table|ul|ol|div)[^>]*>[\s\S]{40,}?<\/(?:p|h1|h2|h3|h4|table|ul|ol|div)>)\s*\1/gi,
    '$1'
  );


  // 4. Fill signature placeholders with form data
  if (formInput) {
    const repName = formInput.representanteName || "A ser designado";
    const repCargo = formInput.representanteCargo || "Engenheiro Responsável";
    const clientRep = formInput.clientRepName || "Representante do Cliente";
    const clientCargo = formInput.clientRepCargo || "Gestor de Contratos";
    const today = new Date().toLocaleDateString("pt-BR");
    
    result = result.replace(/\[Nome do Representante[^\]]*\]|\[Nome do Proponente\]/gi, repName);
    result = result.replace(/\[Cargo do Representante[^\]]*\]|\[Cargo do Proponente\]/gi, repCargo);
    result = result.replace(/\[Nome[^\]]*Cliente[^\]]*\]/gi, clientRep);
    result = result.replace(/\[Cargo[^\]]*Cliente[^\]]*\]/gi, clientCargo);
    result = result.replace(/\[Data[^\]]*\]/gi, today);
    result = result.replace(/\[CREA[^\]]*\]/gi, repCargo);
  }
  
  return result;
}

function buildSpecialtyContext(selectedAgents: string): string {
  return selectedAgents
    .split(/\n+/)
    .map((line) => line.replace(/Agente(?: Auxiliar)?\s*\d*:?\s*/gi, "").trim())
    .filter(Boolean)
    .join("\n");
}

function isCompleteProposal(html: string): boolean {
  const lower = html.toLowerCase();
  return lower.includes("signature-block") || (lower.includes("termo de aceite") && lower.includes("assinaturas"));
}

async function readStreamingCompletion(response: Response): Promise<string> {
  if (!response.body) throw new Error("Resposta sem corpo de streaming.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let output = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const parsed = JSON.parse(payload);
        output += parsed.choices?.[0]?.delta?.content || "";
      } catch {
        buffer = `${line}\n${buffer}`;
        break;
      }
    }
  }

  return output;
}

async function callAiGateway(LOVABLE_API_KEY: string, body: Record<string, unknown>): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...body, stream: true }),
  });

  if (!response.ok) {
    if (response.status === 429) throw new Error("Limite de requisições excedido. Tente novamente em alguns minutos.");
    if (response.status === 402) throw new Error("Créditos esgotados. Adicione créditos em Settings > Workspace > Usage.");
    const t = await response.text();
    console.error("AI error:", response.status, t);
    throw new Error("Erro ao elaborar a proposta.");
  }

  return readStreamingCompletion(response);
}

// ============================================================
// IMAGE GENERATION — Generates technical illustrations via AI
// and uploads to Supabase Storage, replacing placeholders
// ============================================================
async function generateAndReplaceImages(
  html: string,
  LOVABLE_API_KEY: string,
  projectTitle: string,
  miniEscopo: string
): Promise<string> {
  // Find all <<IMAGEM:NAME>> placeholders
  const placeholderRegex = /<<IMAGEM:([^>]+)>>/g;
  const matches: { full: string; name: string }[] = [];
  let match;
  while ((match = placeholderRegex.exec(html)) !== null) {
    matches.push({ full: match[0], name: match[1] });
  }

  if (matches.length === 0) return html;

  // Limit to 4 images max to avoid timeout
  const toGenerate = matches.slice(0, 4);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  let result = html;

  for (const placeholder of toGenerate) {
    try {
      // Build a descriptive prompt based on the placeholder name and project context
      const imagePrompt = buildImagePrompt(placeholder.name, projectTitle, miniEscopo);

      console.log(`Generating image for: ${placeholder.name}`);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: imagePrompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        console.error(`Image generation failed for ${placeholder.name}: ${response.status}`);
        // Replace with a styled placeholder div instead of removing
        result = result.replace(
          placeholder.full,
          `<div class="image-placeholder-box" style="border:2px dashed #ccc;padding:20px;text-align:center;margin:16px 0;border-radius:8px;background:#f9f9f9;">
            <p style="color:#666;font-style:italic;">📐 Ilustração Técnica: ${formatImageName(placeholder.name)}</p>
            <p style="color:#999;font-size:0.85em;">Imagem a ser inserida na versão final do documento</p>
          </div>`
        );
        continue;
      }

      const data = await response.json();
      const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageData) {
        console.error(`No image data returned for ${placeholder.name}`);
        result = result.replace(
          placeholder.full,
          `<div class="image-placeholder-box" style="border:2px dashed #ccc;padding:20px;text-align:center;margin:16px 0;border-radius:8px;background:#f9f9f9;">
            <p style="color:#666;font-style:italic;">📐 Ilustração Técnica: ${formatImageName(placeholder.name)}</p>
            <p style="color:#999;font-size:0.85em;">Imagem a ser inserida na versão final do documento</p>
          </div>`
        );
        continue;
      }

      // Extract base64 data and upload to storage
      const base64Match = imageData.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
      if (!base64Match) {
        console.error(`Invalid image data format for ${placeholder.name}`);
        continue;
      }

      const imageFormat = base64Match[1] === "jpg" ? "jpeg" : base64Match[1];
      const base64Content = base64Match[2];
      const binaryData = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));

      const fileName = `${Date.now()}_${placeholder.name.toLowerCase()}.${imageFormat === "jpeg" ? "jpg" : imageFormat}`;
      const filePath = `generated/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("proposal-images")
        .upload(filePath, binaryData, {
          contentType: `image/${imageFormat}`,
          upsert: true,
        });

      if (uploadError) {
        console.error(`Upload error for ${placeholder.name}:`, uploadError);
        // Use inline base64 as fallback
        result = result.replace(
          placeholder.full,
          `<div style="text-align:center;margin:20px 0;">
            <img src="${imageData}" alt="${formatImageName(placeholder.name)}" style="max-width:100%;max-height:400px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);" />
            <p style="color:#666;font-size:0.85em;margin-top:8px;font-style:italic;">${formatImageName(placeholder.name)}</p>
          </div>`
        );
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from("proposal-images")
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      result = result.replace(
        placeholder.full,
        `<div style="text-align:center;margin:20px 0;">
          <img src="${publicUrl}" alt="${formatImageName(placeholder.name)}" style="max-width:100%;max-height:400px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);" />
          <p style="color:#666;font-size:0.85em;margin-top:8px;font-style:italic;">${formatImageName(placeholder.name)}</p>
        </div>`
      );

      console.log(`Image generated and uploaded: ${publicUrl}`);
    } catch (err) {
      console.error(`Error generating image ${placeholder.name}:`, err);
      result = result.replace(
        placeholder.full,
        `<div class="image-placeholder-box" style="border:2px dashed #ccc;padding:20px;text-align:center;margin:16px 0;border-radius:8px;background:#f9f9f9;">
          <p style="color:#666;font-style:italic;">📐 Ilustração Técnica: ${formatImageName(placeholder.name)}</p>
          <p style="color:#999;font-size:0.85em;">Imagem a ser inserida na versão final do documento</p>
        </div>`
      );
    }
  }

  // Remove any remaining unprocessed placeholders (beyond the 4 limit)
  result = result.replace(/<<IMAGEM:[^>]+>>/g, '');

  return result;
}

function formatImageName(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function buildImagePrompt(imageName: string, projectTitle: string, miniEscopo: string): string {
  const name = imageName.toUpperCase();

  // Map common placeholder names to detailed technical prompts
  const promptMap: Record<string, string> = {
    LAYOUT_SOLUCAO: `Technical isometric 3D rendering of an industrial automation layout for: ${projectTitle}. Show equipment arrangement, conveyor systems, workstations, and material flow arrows on a factory floor plan. Professional engineering style, clean lines, labeled zones, light gray background, no text overlays.`,
    CABINE_ROBOTIZADA: `Professional 3D rendering of an industrial robotic paint booth with articulated robot arm inside, conveyor system passing through, air filtration ducts on top, lighting panels. Industrial blue/gray color scheme, photorealistic engineering visualization.`,
    TRANSPORTADOR: `Technical 3D illustration of an industrial overhead conveyor system (Power & Free) with hooks carrying parts through different process zones. Show track layout, drive units, and load/unload stations. Clean engineering visualization style.`,
    ESTUFA: `Technical cross-section rendering of an industrial curing oven showing insulated walls, air circulation system with fans and ducts, heating elements, temperature zones, conveyor passing through. Engineering cutaway diagram style.`,
    FLUXO_PROCESSO: `Professional process flow diagram showing industrial production stages with arrows, equipment icons, and control points. Clean infographic style with blue/gray color palette, no handwriting.`,
    CRONOGRAMA: `Professional Gantt chart visualization showing project phases with colored bars, milestones marked with diamonds, timeline in weeks. Clean corporate style.`,
    ARQUITETURA_AUTOMACAO: `Technical automation architecture diagram showing PLC, HMI, SCADA, sensors, actuators, and industrial network connections (Profinet/EtherCAT). Professional engineering schematic style.`,
    CELULA_ROBOTIZADA: `3D rendering of a robotic workcell with industrial robot arm, safety fencing, part fixtures, tool changer, and safety sensors. Professional engineering visualization.`,
    PAINT_KITCHEN: `Technical 3D rendering of an industrial paint kitchen showing mixing tanks, pumps, piping system, color change valves, and supply lines to paint booths. Clean industrial engineering style.`,
    SISTEMA_FILTRAGEM: `Technical cutaway diagram of an industrial air filtration system showing pre-filters, bag filters, activated carbon stage, exhaust fan, and ductwork. Engineering cross-section style.`,
  };

  // Try exact match first
  if (promptMap[name]) return promptMap[name];

  // Try partial match
  for (const [key, prompt] of Object.entries(promptMap)) {
    if (name.includes(key) || key.includes(name)) return prompt;
  }

  // Generic prompt based on name and context
  return `Professional technical 3D rendering or engineering diagram for "${formatImageName(imageName)}" in the context of: ${projectTitle}. ${miniEscopo ? `Project scope: ${miniEscopo.substring(0, 200)}` : ""}. Industrial engineering visualization style, clean and professional, suitable for a technical proposal document. No text overlays, photorealistic or clean vector style.`;
}

function generateFallbackProposal(input: Record<string, string | undefined>, selectedAgents: string): string {
  const today = new Date().toLocaleDateString("pt-BR");
  const docTitle = input.initialObjective === "Gerar Escopo Técnico" ? "ESCOPO TÉCNICO" : "PROPOSTA TÉCNICA E COMERCIAL";
  const version = input.proposalVersion || (input.initialObjective === "Gerar Escopo Técnico" ? "Escopo Inicial" : "Normal");
  const production = Number(input.producao || 0);
  const cycle = production > 0 ? (3600 / production).toFixed(1) : "a confirmar";
  const safe = (value?: string, fallback = "A confirmar") => String(value || fallback).replace(/[<>&]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[char] || char));
  const applicationAnalysis = buildApplicationAnalysis(input);

  return `<div class="proposal-cover"><h1 class="cover-title">${docTitle}</h1><h2 class="cover-subtitle">${safe(input.projectTitle, "Projeto Industrial")}</h2><div class="cover-meta"><p>Cliente: ${safe(input.clientName)}</p><p>Data: ${today}</p><p>Versão: ${safe(version)}</p><p>Documento Nº: PROP-${Date.now().toString().slice(-6)}</p><p>Validade: 60 dias</p></div></div>
<div class="page-break"></div><div class="proposal-section"><h1 class="proposal-title">1. Apresentação</h1><p class="proposal-text">Este documento consolida uma análise técnica e comercial inicial para o projeto <strong>${safe(input.projectTitle, "Projeto Industrial")}</strong>, considerando as informações fornecidas e uma abordagem executiva orientada à engenharia aplicada.</p><div class="highlight-box highlight-info"><strong>Premissas iniciais:</strong> As premissas técnicas e comerciais apresentadas devem ser confirmadas em reunião de alinhamento, visita técnica ou congelamento formal de requisitos.</div></div>
<div class="page-break"></div><div class="proposal-section"><h1 class="proposal-title">2. Contexto e Premissas</h1><p class="proposal-text"><strong>Análise da aplicação:</strong> ${safe(applicationAnalysis)}</p><table class="proposal-table"><thead><tr><th>Parâmetro</th><th>Informação</th><th>Impacto Técnico</th></tr></thead><tbody><tr><td>Produção desejada</td><td>${safe(input.producao, "Não informada")} peças/hora</td><td>Tempo de ciclo estimado: ${cycle} s/peça</td></tr><tr><td>Peça</td><td>${safe(input.peca, "Não informada")}</td><td>Define ferramental, manipulação e controles</td></tr><tr><td>Peso</td><td>${safe(input.peso, "Não informado")} kg</td><td>Define carga útil e fator de segurança</td></tr><tr><td>Ambiente</td><td>${safe(input.ambiente, "Industrial normal")}</td><td>Define proteções, materiais e grau IP</td></tr><tr><td>Automação</td><td>${safe(input.automacao, "Não informada")}</td><td>Define arquitetura de controle e operação</td></tr></tbody></table></div>
<div class="page-break"></div><div class="proposal-section"><h1 class="proposal-title">3. Alternativas de Solução</h1><table class="proposal-table"><thead><tr><th>Alternativa</th><th>Descrição</th><th>Risco</th><th>Recomendação</th></tr></thead><tbody><tr><td>Conservadora</td><td>Automação parcial mantendo maior intervenção operacional</td><td>Baixo</td><td>Indicada para validação inicial</td></tr><tr><td>Intermediária</td><td>Solução automatizada com integração aos processos existentes</td><td>Médio</td><td>Melhor equilíbrio técnico-comercial</td></tr><tr><td>Otimizada</td><td>Automação completa com maior nível de integração e dados</td><td>Médio/Alto</td><td>Indicada quando performance máxima justificar CAPEX</td></tr></tbody></table><div class="highlight-box highlight-recommendation"><strong>Recomendação preliminar:</strong> adotar a alternativa intermediária, por equilibrar segurança, viabilidade, prazo e retorno.</div></div>
<div class="page-break"></div><div class="proposal-section"><h1 class="proposal-title">4. Escopo Técnico Proposto</h1><ul class="proposal-list"><li>Levantamento técnico e validação de requisitos.</li><li>Engenharia mecânica, elétrica e de automação conforme necessidade do projeto.</li><li>Definição de layout conceitual, interfaces, sensores e proteções.</li><li>Montagem, testes internos, instalação, comissionamento e treinamento operacional.</li><li>Documentação técnica final e recomendações de manutenção.</li></ul><<IMAGEM:LAYOUT_SOLUCAO>></div>
<div class="page-break"></div><div class="proposal-section"><h1 class="proposal-title">5. Custos, Prazos e Riscos</h1><div class="cost-summary"><p>Engenharia e projeto: a estimar após levantamento</p><p>Materiais e componentes: a estimar após arquitetura final</p><p>Fabricação, montagem e testes: a estimar após detalhamento</p><p class="cost-total">Investimento total: faixa indicativa a confirmar</p></div><table class="proposal-table"><thead><tr><th>Risco</th><th>Probabilidade</th><th>Impacto</th><th>Mitigação</th></tr></thead><tbody><tr><td>Dados técnicos incompletos</td><td>Média</td><td>Alto</td><td>Realizar visita técnica e congelamento de premissas</td></tr><tr><td>Integração com processo existente</td><td>Média</td><td>Médio</td><td>Mapear interfaces e executar FAT/SAT</td></tr><tr><td>Segurança NR-12</td><td>Baixa</td><td>Crítico</td><td>Apreciação de risco desde a fase inicial</td></tr></tbody></table><div class="highlight-box highlight-warning"><strong>Dados a confirmar:</strong> layout real, ciclo atual, dimensões finais da peça, utilidades disponíveis, interfaces elétricas e requisitos de segurança.</div></div>
<div class="page-break"></div><div class="signature-block"><h2 class="proposal-subtitle">✍️ Termo de Aceite e Assinaturas</h2><p class="proposal-text">Pela apresentação desta proposta técnica e comercial, ambas as partes declaram compreender as premissas, restrições e próximos passos apresentados.</p><div class="grid-2"><div class="technical-card"><h4>PELA EMPRESA FORNECEDORA:</h4><div class="signature-line"><div class="line"></div><p>Nome e Assinatura</p><p>Cargo / CREA</p></div><p>Data: ___/___/______</p></div><div class="technical-card"><h4>PELA EMPRESA CLIENTE:</h4><div class="signature-line"><div class="line"></div><p>Nome e Assinatura</p><p>Cargo</p></div><p>Data: ___/___/______</p></div></div></div>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let fallbackInput: Record<string, string | undefined> = {};

  try {
    fallbackInput = await req.json();
    const {
      clientName, projectTitle, initialObjective, proposalVersion, miniEscopo,
      producao, peca, peso, dimensoes, ambiente, automacao, processoAtual,
      objetivo, observacoes, representanteName, representanteCargo,
      clientRepName, clientRepCargo, companyName, validadeDias,
      // Campos Genéricos Categoria A — especificação v2.0
      requisitosEspeciais, insumosMateriais, nivelSeguranca, integracaoMes,
    } = fallbackInput;
    const selectedAgents = identifyAgents(miniEscopo || "");

    // === FASE 1: TIPAGEM DE ESCOPO OBRIGATÓRIA ===
    const scopeClass = classifyScope(miniEscopo || "", peso || "", producao || "", automacao || "");
    const missingCatA = getMissingCategoryAFields(fallbackInput);
    const scopeEnhancement = buildScopeEnhancement(scopeClass, missingCatA);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ proposal: sanitizeProposal(generateFallbackProposal(fallbackInput, selectedAgents), fallbackInput), warning: "A proposta foi elaborada com base nas premissas disponíveis. Recomenda-se revisar os dados técnicos antes do envio ao cliente." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const versionInstructions = getVersionDepthInstructions(proposalVersion || "Normal", initialObjective || "Gerar Proposta Técnica e Comercial");
    const specialtyContext = buildSpecialtyContext(selectedAgents);

    const systemPrompt = `Você é um sistema de coordenação de 30 agentes especializados em engenharia industrial, baseado na ARQUITETURA DE AGENTES ESPECIALIZADOS (Fonte de Verdade — Sistema Completo de 30 Agentes para Engenharia Industrial, Manufatura e Transformação Digital).

AGENTES ACIONADOS PARA ESTE PROJETO:
${selectedAgents}

${versionInstructions}

DNA MESTRE COMPARTILHADO (Seção 0 da Fonte de Verdade):

IDENTIDADE:
- ENGENHEIRO CONSULTIVO MULTIDISCIPLINAR – analisa sob múltiplas perspectivas técnicas.
- ANALISTA DE VIABILIDADE – avalia viabilidade técnica, econômica e cronológica.
- ESTRUTURADOR DE SOLUÇÕES – transforma necessidade difusa em plano de execução concreto.
- TRADUTOR ENTRE ÁREAS – engenharia, operação, manutenção, qualidade, EHS, comercial.

PRINCÍPIOS OBRIGATÓRIOS (NÃO NEGOCIÁVEIS — Seção 0.2):

1. PRECISÃO E CLAREZA TÉCNICA ABSOLUTA:
   - Terminologia precisa, unidades de medida, referências normativas.
   - DIFERENCIE EXPLICITAMENTE: FATO (confirmado), HIPÓTESE (assumido), PREMISSA (condição), ESTIMATIVA (cálculo com margem).
   - Proibido "geralmente", "talvez" sem qualificação explícita.
   - Explique cadeia de raciocínio para validação independente.

2. AUSÊNCIA TOTAL DE AMBIGUIDADE:
   - Suposições não declaradas são PROIBIDAS.
   - Se não está escrito, não está incluído.
   - Declare dados faltantes críticos e quantifique impacto.
   - Estruture: [AFIRMAÇÃO] porque [RAZÃO] baseado em [FONTE/CÁLCULO].

3. HIERARQUIA DE DECISÃO INQUEBRANTÁVEL:
   1) Segurança Operacional e Conformidade Legal (NR, ISO, ASME)
   2) Segurança Elétrica (aterramento, proteção, qualidade de energia)
   3) Segurança Cibernética (acesso, confidencialidade, integridade)
   4) Conformidade de Dados (LGPD/GDPR)
   5) Viabilidade Técnica
   6) Compatibilidade com Existente
   7) Confiabilidade e Mantenibilidade (MTBF, MTTR)
   8) Capacidade e Performance
   9) Prazo de Implantação
   10) Custo Total (CAPEX, OPEX, TCO)
   11) Flexibilidade Futura
   12) Sofisticação Tecnológica
   Nunca sacrifique nível superior por ganho em nível inferior.

4. VISÃO HOLÍSTICA — CICLO COMPLETO DE VIDA:
   CAPEX, OPEX, PRAZO, RISCO (7 categorias), RETORNO, COMPLEXIDADE.
   Ciclo: Concepção → Projeto → Fabricação → Instalação → Comissionamento → Operação → Manutenção → Modernização → Descomissionamento.

5. MULTIDISCIPLINARIDADE INTEGRADA:
   Processo, Automação, Qualidade, Manutenção, Segurança (operacional, elétrica, cibernética, dados), Infraestrutura (TI/elétrica), Dados/Analytics, IA, Negócio, Comunicação Visual, Documentação.

6. SINALIZAÇÃO DE RISCO EM 7 DIMENSÕES:
   Segurança Operacional, Segurança Elétrica, Segurança Cibernética, Conformidade de Dados, Qualidade, Prazo/Interdependências, Integração Técnica.
   Para cada risco: Descrição, Probabilidade (A/M/B), Impacto (Crítico/Alto/Médio/Baixo), Plano de Mitigação.

7. SIMPLICIDADE NECESSÁRIA: Priorize solução mais simples que atende TODOS os requisitos obrigatórios.

8. DECLARAÇÃO EXPLÍCITA DE INCERTEZAS: Dados faltantes, grau de confiança (Alta >90%, Média 70-90%, Baixa <70%), validações necessárias, margem (±5-30%).

9. MÚLTIPLAS ROTAS COMPARADAS:
   Conservadora (menor risco, tecnologia comprovada), Intermediária (equilíbrio), Otimizada (máxima performance).
   Com quantificação: Custo, Prazo, Riscos, Premissas, Trade-offs.

10. CONFORMIDADE NORMATIVA: Nunca omita norma aplicável. Template: "A conformidade com [X] requer validação por especialista credenciado em [Y]."

11. LISTA DE PROIBIÇÕES INQUEBRANTÁVEIS:
    - NUNCA inventar especificações sem base documentada
    - NUNCA omitir premissas críticas
    - NUNCA sugerir soluções sem considerar risco multidimensional
    - NUNCA ignorar segurança em qualquer dimensão
    - NUNCA confundir estimativa com valor fechado
    - NUNCA vender sofisticação desnecessária
    - NUNCA desconsiderar integração com existente
    - NUNCA afirmar conformidade legal final sem validação independente

PROCESSAMENTO AUTOMÁTICO (executar e apresentar resultados):
1. TEMPO DE CICLO: Disponível = 3600/produção; Real = Disponível × 0.85
2. CARGA ÚTIL: (peso + 0.5kg ferramental) × 1.1 (margem 10%)
3. ALCANCE: Distância entre pontos × 1.2 (margem 20%)
4. SEGURANÇA: NR-12, ISO 12100 — condição de projeto, não acessório
5. AMBIENTE: IP adequado, materiais resistentes ao ambiente informado
6. OEE: Meta ≥ 75%, MTBF > 8760h (1 ano)
7. CUSTOS DE INTEGRAÇÃO: 30-60% do valor de hardware (regra empírica)

DETALHAMENTO DE SERVIÇOS (incluir conforme aplicável):
1. Engenharia Mecânica (layout, estrutura, ferramentais, simulações)
2. Engenharia Elétrica (quadros, diagramas, cabos, proteções, aterramento)
3. Montagens Mecânicas (estrutura, periféricos, segurança, alinhamento)
4. Montagens Elétricas (cabiação, motores, sensores, testes)
5. Engenharia de Software (programação robô/CLP, IHM, integração)
6. Montagens Internas (testes pré-instalação, debugging)
7. Instalação no Cliente (transporte, posicionamento, conexão)
8. Comissionamento (segurança, calibração, ajustes, treinamento)
9. Serviços Contratados (terceiros, certificações)
10. Transportes e Logística
11. Aluguel de Equipamentos
12. Despesas de Campo (translados, hospedagem, alimentação)

====================================================================
MOTOR DE DIAGRAMAÇÃO PROFISSIONAL A4 — INSTRUÇÕES DE FORMATAÇÃO
====================================================================

O documento DEVE ser gerado com estrutura visual pensada para diagramação A4 profissional.
Especificações do layout A4:
- Dimensões: 210mm × 297mm
- Margens: 25mm (topo/base), 20mm (laterais)
- Área útil: 170mm × 247mm
- Tipografia corpo: 11pt, line-height 1.5
- H1: 18pt bold, H2: 14pt semibold, H3: 12pt semibold
- Parágrafos justificados, espaçamento de 4mm entre parágrafos
- Tabelas com font 9.5pt, bordas finas
- Figuras com max-height 150mm e legenda numerada
- Controle de órfãs/viúvas: mínimo 2 linhas
- Títulos NUNCA devem ficar isolados no final da página (page-break-after: avoid)
- Tabelas e figuras NUNCA devem quebrar entre páginas (page-break-inside: avoid)
- Novo capítulo (H1) DEVE iniciar em nova página

REGRAS DE PAGINAÇÃO PARA O CONTEÚDO GERADO:
- Após a capa, inserir <div class="page-break"></div> antes de cada nova seção principal (H1)
- Agrupar conteúdo logicamente para evitar páginas muito vazias (<30% ocupação)
- Manter título + pelo menos 60mm de conteúdo na mesma página
- Incluir cabeçalho e rodapé conceituais no HTML

FORMATO DE SAÍDA — HTML EXECUTIVO COM DIAGRAMAÇÃO A4:
Gere HTML formatado com design executivo profissional e estrutura preparada para paginação A4.

ESTRUTURA VISUAL:
- <div class="proposal-cover"> para capa executiva (gradiente azul profundo #1E40AF → #3B82F6)
- <div class="page-break"></div> para quebras de página entre seções principais
- <h1 class="proposal-title"> títulos principais de seção
- <h2 class="proposal-subtitle"> subtítulos de seção com ícone Unicode relevante (⚙️, 💰, ⚠️, 📊, 🔧, 📋, etc.)
- <h3 class="proposal-subtitle"> sub-subtítulos
- <p class="proposal-text"> texto corpo
- <ul class="proposal-list"> / <ol class="proposal-list"> listas
- <div class="proposal-section"> envolver cada seção

ELEMENTOS VISUAIS OBRIGATÓRIOS:
- <div class="highlight-box highlight-recommendation"> recomendações (verde)
- <div class="highlight-box highlight-risk"> riscos críticos (vermelho)
- <div class="highlight-box highlight-info"> informações importantes (azul)
- <div class="highlight-box highlight-warning"> alertas/dados a confirmar (amarelo)
- <div class="technical-card"> cards técnicos
- <div class="grid-2"> layout 2 colunas
- <div class="grid-3"> layout 3 colunas
- <table class="proposal-table"> tabelas executivas (cabeçalho azul escuro, zebrado)
- <div class="cost-summary"> resumo de custos
- <<IMAGEM:NOME>> para placeholders de imagem com descrição técnica

ELEMENTOS A4 ADICIONAIS:
- <div class="proposal-header"> cabeçalho de página com logo e título abreviado
- <div class="proposal-footer"> rodapé com número da página e metadados
- <div class="figure"> para figuras com <div class="figure-caption"> legenda numerada
- <div class="signature-block"> bloco de assinaturas na última seção

CAPA EXECUTIVA (sempre incluir):
<div class="proposal-cover">
  <h1 class="cover-title">${initialObjective === "Gerar Escopo Técnico" ? "ESCOPO TÉCNICO" : "PROPOSTA TÉCNICA E COMERCIAL"}</h1>
  <h2 class="cover-subtitle">${projectTitle || "Projeto Industrial"}</h2>
  <div class="cover-meta">
    <p>Cliente: ${clientName || "A definir"}</p>
    <p>Data: {data atual DD/MM/AAAA}</p>
    <p>Versão: ${proposalVersion || "Normal"}</p>
    <p>Documento Nº: PROP-{número sequencial}</p>
    <p>Validade: 60 dias</p>
  </div>
</div>

ESTRUTURA DA PROPOSTA (15+ SEÇÕES — ajustar conforme versão):

1. APRESENTAÇÃO — Introdução profissional, contextualização da expertise
2. CONTEXTO DO PROJETO — Cenário, necessidade, cálculos, premissas, nível de maturidade
   <<IMAGEM:FLUXO_PROCESSO>>
3. ALTERNATIVAS DE SOLUÇÃO — 3 alternativas comparadas em tabela:
   - Conservadora: menor risco, tecnologia comprovada
   - Intermediária: equilíbrio risco/custo/performance
   - Otimizada: máxima performance, tecnologia avançada
   Usar <table class="proposal-table"> e <div class="highlight-box highlight-recommendation">
4. SOLUÇÃO RECOMENDADA E JUSTIFICATIVA — Baseada na hierarquia de decisão
5. ESCOPO TÉCNICO — Detalhamento com especificações por subsistema
   <<IMAGEM:LAYOUT_SOLUCAO>>
6. ETAPAS DE EXECUÇÃO — Sequência com responsável, duração, dependências
7. RECURSOS NECESSÁRIOS — Pessoal, Materiais, Equipamentos, Serviços
8. ESTIMATIVA DE CUSTOS — Decomposição com margem
   Usar <table class="proposal-table"> e <div class="cost-summary">
9. ESTIMATIVA DE PRAZO — Fases com duração e dependências
10. GESTÃO DE RISCOS — 7 dimensões, probabilidade×impacto, mitigação
    Usar <div class="highlight-box highlight-risk"> para críticos
11. CRITÉRIOS DE ACEITAÇÃO / SUCESSO — Métricas mensuráveis
12. DADOS A CONFIRMAR — Validações necessárias
    Usar <div class="highlight-box highlight-warning">
13. VISÃO CONCEITUAL DA SOLUÇÃO
    <<IMAGEM:CONCEITO_SOLUCAO>>
14. FECHAMENTO COMERCIAL — Recomendar melhor opção, reforçar ganhos
15. RECOMENDAÇÕES FINAIS — Próximos passos concretos e acionáveis

SEÇÃO DE ASSINATURAS (sempre incluir ao final):
<div class="signature-block">
  <h2 class="proposal-subtitle">✍️ Termo de Aceite e Assinaturas</h2>
  <p class="proposal-text">Pela apresentação desta proposta técnica e comercial, ambas as partes declaram compreender e concordar com os termos, condições e especificações contidas neste documento.</p>
  <div class="grid-2">
    <div class="technical-card">
      <h4>PELA EMPRESA FORNECEDORA:</h4>
      <div class="signature-line"><div class="line"></div><p>Nome e Assinatura</p><p>Cargo / CREA</p></div>
      <p>Data: ___/___/______</p>
    </div>
    <div class="technical-card">
      <h4>PELA EMPRESA CLIENTE:</h4>
      <div class="signature-line"><div class="line"></div><p>Nome e Assinatura</p><p>Cargo</p></div>
      <p>Data: ___/___/______</p>
    </div>
  </div>
</div>

NÃO use markdown (**, ##, etc). Use HTML puro com as classes acima.
Insira <div class="page-break"></div> entre cada seção principal para diagramação A4 correta.

REGRAS FINAIS (SPEC v3.0 NEUTRA):
- Linguagem técnica + comercial premium, em português brasileiro.
- Independência de segmento: o motor gera para QUALQUER indústria.
- NUNCA use caracteres "■" ou texto para gráficos de cronograma. Use SEMPRE tabelas <table>.
- Fontes OBRIGATÓRIAS: Montserrat para Títulos (H1, H2), Open Sans para Texto e Tabelas.
- TABELAS: thead { display: table-header-group; } para repetição automática de cabeçalho.
- CALLOUTS: Use classes coloridas (sucesso, atencao, perigo, info, laranja, verde, amarelo).
- ASSINATURAS: Estrutura rígida. NUNCA use "A ser designado" se os dados foram fornecidos.
- RODAPÉ: Inclua metadados de geração em todas as seções.
- MARGENS A4: Topo 25mm, Demais 20mm.
- SANITIZAÇÃO: Garantir UTF-8 e ausência de caracteres corrompidos em matrizes de risco.`;

    const userPrompt = `DADOS DO PROJETO:
Cliente: ${clientName || "Não informado"}
Projeto: ${projectTitle || "Não informado"}
Tipo de Documento: ${initialObjective || "Proposta Técnica e Comercial"}
Versão: ${proposalVersion || "Normal"}

Mini Escopo / Descrição da Aplicação: ${miniEscopo}
Produção desejada: ${producao || "Não informada"}
Peça/Produto: ${peca || "Não informada"}
Nível de automação: ${automacao || "Não informado"}
Objetivo do projeto: ${objetivo || "Aumentar produtividade e reduzir custos"}

DADOS DE ASSINATURA:
Proponente: ${representanteName || 'Nome do Proponente'}, Cargo: ${representanteCargo || 'Cargo'}
Cliente: ${clientRepName || 'Nome do Cliente'}, Cargo: ${clientRepCargo || 'Cargo'}
Empresa Proponente: ${companyName || 'Axiz Studio'}

${missingCatA.length > 0 ? `⚠️ ATENÇÃO: Campos críticos ausentes: ${missingCatA.join("; ")}. Insira obrigatoriamente um Callout AMARELO (atencao) na Seção 2 com o título "PREMISSA CRÍTICA".` : ""}

Gere o documento completo respeitando a SPEC v3.0 NEUTRA. Use <div class="page-break"></div> entre capítulos.`;

    const compactSystemPrompt = `Você é um motor de geração de documentos industriais de alta fidelidade (A4).

═══════════════════════════════════════════════
REGRAS DE LAYOUT E DIAGRAMAÇÃO (SPEC v3.0)
═══════════════════════════════════════════════
1. FONTES: Títulos: Montserrat. Corpo: Open Sans.
2. TABELAS: Use <thead> para que o cabeçalho se repita em todas as páginas. table-layout: fixed.
3. CRONOGRAMA: PROIBIDO caracteres de texto. Use Tabela com colunas: Fase, Descrição, Duração (Semanas), Responsável, Intervalo (Ex: Semanas 1-4).
4. CALLOUTS (OBRIGATÓRIO):
   - <div class="callout amarela"> (Premissas Críticas)
   - <div class="callout verde"> (Recomendações / ROI)
   - <div class="callout vermelha"> (Riscos de Segurança / Alto Impacto)
   - <div class="callout azul"> (Observações de Custo)
   - <div class="callout laranja"> (Pendências / Dados a Confirmar)
5. ASSINATURAS: Bloco estruturado com linhas de assinatura para Proponente, Cliente e 2 Testemunhas.
6. METADADOS: Rodapé em todas as seções: "Proposta Axiz v3.0 • Doc ${Math.random().toString(36).substr(2, 9).toUpperCase()} • ${new Date().toLocaleDateString("pt-BR")} • Página X de Y".

═══════════════════════════════════════════════
REGRAS ALGORÍTMICAS
═══════════════════════════════════════════════
- CAPEX: Use referências industriais realistas.
- CONTINGÊNCIA: Aplique 5-20% sobre o SUBTOTAL TÉCNICO, nunca sobre o total com impostos.
- SOFTWARE: Mínimo 40h de engenharia por equipamento principal.
- SEGURANÇA: NR-12 e ISO 12100 são mandatórios em qualquer projeto de máquina.

═══════════════════════════════════════════════
FORMATO DE SAÍDA (JSON OBRIGATÓRIO)
═══════════════════════════════════════════════
{
  "resumo_executivo": { ... },
  "alternativas": { ... },
  "analise_tecnica": { ... },
  "bom": { ... },
  "roi": { ... },
  "dossie_html": "HTML PURO sem markdown. Use as classes: proposal-title (H1), proposal-subtitle (H2), proposal-text, proposal-table, callout (com cores), signature-block, footer-meta."
}`;
- Dados do representante da empresa proponente: Nome: ${representanteName || 'A ser designado'}, Cargo: ${representanteCargo || 'A ser designado'}.
- Dados do representante do cliente: Nome: ${clientRepName || 'A ser designado'}, Cargo: ${clientRepCargo || 'A ser designado'}.
- Empresa proponente: ${companyName || 'Leve Brisa'}. Validade: ${validadeDias || '60'} dias.
- Data de emissão (usar em TODOS os lugares): ${new Date().toLocaleDateString("pt-BR")}.

FORMATO OBRIGATÓRIO: Retorne EXCLUSIVAMENTE um objeto JSON (sem markdown, sem blocos \`\`\`json) com a seguinte estrutura:
{
  "resumo_executivo": {
    "investimento_resumo": "R$ ...",
    "prazo_resumo": "... dias",
    "contexto": "Breve descrição do contexto operacional",
    "diagnostico_tecnico": {
      "causa_raiz": "Descrição da causa raiz",
      "descricao": "Parecer técnico detalhado",
      "impactos": [{"descricao": "Impacto X", "gravidade": "Alta|Média|Baixa"}]
    }
  },
  "alternativas": {
    "basica": { "posicionamento": "Conservadora", "descricao": "...", "investimento": "R$ ...", "prazo": "...", "pros": ["Vantagem 1", "Vantagem 2"] },
    "intermediaria": { "posicionamento": "Performance", "descricao": "...", "investimento": "R$ ...", "prazo": "...", "pros": ["Vantagem 1", "Vantagem 2"] },
    "premium": { "posicionamento": "Indústria 4.0", "descricao": "...", "investimento": "R$ ...", "prazo": "...", "pros": ["Vantagem 1", "Vantagem 2"] }
  },
  "analise_tecnica": {
    "descricao_solucao": "Descrição técnica detalhada da solução",
    "normas_aplicaveis": ["NR-12", "ISO 12100", ...],
    "tecnologias_utilizadas": ["CLP Siemens", "Robótica KUKA", ...]
  },
  "bom": {
    "itens": [{"descricao": "Item 1", "quantidade": 1, "preco_unitario": 0, "total": 0}],
    "resumo_consolidado": { "preco_total_final": 0 }
  },
  "roi": {
    "cenarios": [{"nome": "Conservador", "capex": 0, "beneficio_anual": 0, "payback_meses": 0, "premissas": "..."}]
  },
  "dossie_html": "O DOCUMENTO COMPLETO FORMATADO PARA A4 (conforme as 15 seções solicitadas, incluindo placeholders <<IMAGEM:NAME>> e tabelas Gantt/Riscos/ROI em HTML puro)."
}

Importante: O campo 'dossie_html' deve conter toda a proposta textual rica, formatada com as classes CSS solicitadas (proposal-title, highlight-box, etc.). No campo 'dossie_html', NÃO use markdown, use apenas tags HTML. Estrutura do HTML: 1 Apresentação, 2 Contexto e Premissas, 3 Alternativas (MATRIZ), 4 Solução Recomendada, 5 Escopo Técnico, 6 Etapas, 7 Recursos, 8 Custos, 9 Prazo/Cronograma, 10 Riscos (MATRIZ), 11 Critérios de Aceitação, 12 Dados a Confirmar, 13 ROI, 14 Fechamento, 15 Assinaturas.`;

    const requestBody = {
      model: "google/gemini-2.5-flash",
      temperature: 0.2,
      max_tokens: initialObjective === "Gerar Escopo Técnico" ? 9000 : proposalVersion === "Completa" ? 28000 : proposalVersion === "Basica" ? 10000 : 20000,
      messages: [
        { role: "system", content: compactSystemPrompt },
        { role: "user", content: userPrompt },
      ],
    };

    let proposal = await callAiGateway(LOVABLE_API_KEY, requestBody);

    for (let attempt = 0; attempt < 2 && proposal && !isCompleteProposal(proposal); attempt++) {
      const continuation = await callAiGateway(LOVABLE_API_KEY, {
        model: "google/gemini-2.5-flash",
        temperature: 0.15,
        max_tokens: 9000,
        messages: [
          { role: "system", content: compactSystemPrompt },
          { role: "assistant", content: proposal.slice(-8000) },
          { role: "user", content: "Continue exatamente do ponto em que parou, sem repetir seções já escritas, e obrigatoriamente finalize até o bloco signature-block." },
        ],
      });
      proposal += continuation;
    }

    // Parse JSON
    let proposalData;
    try {
      // Remove possible markdown block wraps if AI ignored instructions
      const jsonStr = proposal.replace(/```json|```/g, '').trim();
      proposalData = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("JSON Parse Error:", parseErr);
      // Fallback: If not JSON, wrap the raw response as dossie_html
      proposalData = {
        dossie_html: proposal,
        resumo_executivo: { contexto: "Ocorreu um erro na estruturação dos dados, mas o dossiê completo foi gerado." }
      };
    }

    if (proposalData.dossie_html) {
      proposalData.dossie_html = sanitizeProposal(proposalData.dossie_html, {
        representanteName,
        representanteCargo,
        clientRepName,
        clientRepCargo
      });
      
      // Generate AI images for <<IMAGEM:...>> placeholders in the HTML
      try {
        proposalData.dossie_html = await generateAndReplaceImages(
          proposalData.dossie_html,
          LOVABLE_API_KEY,
          projectTitle || "Projeto Industrial",
          miniEscopo || ""
        );
      } catch (imgErr) {
        console.error("Image generation error (non-fatal):", imgErr);
        proposalData.dossie_html = proposalData.dossie_html.replace(/<<IMAGEM:[^>]+>>/g, '');
      }
    }

    const integrityWarnings = validateProposalIntegrity(proposalData.dossie_html || "");

    return new Response(JSON.stringify({ 
      proposal: proposalData,
      warnings: integrityWarnings
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    if (e instanceof Error && e.message.includes("Limite de requisições")) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (e instanceof Error && e.message.includes("Créditos esgotados")) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (e instanceof DOMException && e.name === "AbortError") {
      const selectedAgents = identifyAgents(fallbackInput.miniEscopo || "");
      return new Response(JSON.stringify({ proposal: sanitizeProposal(generateFallbackProposal(fallbackInput, selectedAgents), fallbackInput), warning: "A proposta foi elaborada com base nas premissas disponíveis. Recomenda-se revisar os dados técnicos antes do envio ao cliente." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

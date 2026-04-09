import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Dynamic agent selection based on mini escopo keywords
function identifyAgents(miniEscopo: string): string {
  const text = miniEscopo.toLowerCase();
  const agents: string[] = [];

  const agentRules: { keywords: string[]; agent: string; expertise: string }[] = [
    {
      keywords: ["molde", "injeção", "injetora", "plástico", "cavidade", "matriz de injeção", "core", "canal quente", "ventilação de molde", "ejeção"],
      agent: "Agente Especialista em Moldes para Plásticos",
      expertise: "Projeto e fabricação de moldes de injeção plástica, incluindo análise reológica, canais de refrigeração, sistemas de ejeção, materiais de molde, estimativa de cavidades e ciclo de injeção."
    },
    {
      keywords: ["estampo", "corte", "dobra", "chapa", "prensa", "punção", "progressivo", "transferência", "repuxo", "embutimento", "shear", "estampagem"],
      agent: "Agente Especialista em Estampos (Corte, Dobra, Repuxo)",
      expertise: "Projeto de estampos progressivos, transfer e tandem, cálculo de força de corte/dobra/repuxo, seleção de prensas, materiais de ferramental, folgas e tolerâncias."
    },
    {
      keywords: ["robô", "célula", "celula", "robotizada", "automatizado", "carga e descarga", "paletização", "despaletização", "palletização", "solda robotizada", "pintura robotizada", "manipulação", "assembly", "pick and place", "end-of-arm", "eoat"],
      agent: "Agente Especialista em Automação e Robótica Industrial",
      expertise: "Projeto de células robotizadas, seleção de robôs industriais, EOAT (garras/ferramentas), programação offline, simulação de ciclo, integração com periféricos, sistemas de visão, segurança NR-12."
    },
    {
      keywords: ["máquina-ferramenta", "máquina ferramenta", "fresar", "tornear", "usinar", "usinagem", "cnc", "fuso", "torreta", "mandril", "retificar", "brocar", "centro de usinagem", "torno cnc"],
      agent: "Agente Especialista em Máquinas-Ferramenta CNC",
      expertise: "Seleção e especificação de centros de usinagem, tornos CNC, retificadoras, parâmetros de corte, ferramental, fixação, programação CNC, capacidade de processo."
    },
    {
      keywords: ["pintura", "cabine", "spray", "pó", "eletrostática", "curtidor", "polimerização", "e-coat", "tratamento superficial", "jateamento"],
      agent: "Agente Especialista em Sistemas de Pintura Industrial",
      expertise: "Projeto de linhas de pintura (líquida, pó, e-coat), cabines, fornos de cura, pré-tratamento, recuperação de pó, controle de espessura, parâmetros de aplicação."
    },
    {
      keywords: ["transporte", "esteira", "transportador", "rolo", "corrente", "pneumático", "cilindro", "válvula", "vácuo", "garra", "movimentação", "armazenagem", "agv", "amr"],
      agent: "Agente Especialista em Sistemas de Movimentação e Armazenagem",
      expertise: "Projeto de sistemas de transporte (esteiras, roletes, correntes), AGVs/AMRs, armazéns automatizados, sistemas pneumáticos, dimensionamento de atuadores."
    },
    {
      keywords: ["caldeira", "reator", "tanque", "vaso de pressão", "trocador", "bomba", "instrumentação", "processo químico", "misturador", "destilação"],
      agent: "Agente Especialista em Sistemas de Processo Industrial",
      expertise: "Projeto de sistemas de processo (reatores, trocadores de calor, tanques), instrumentação, controle de processo, P&ID, dimensionamento de equipamentos."
    },
    {
      keywords: ["manutenção", "preventiva", "preditiva", "vibração", "termografia", "lubrificação", "inspeção", "monitoramento", "falha", "confiabilidade", "mtbf", "mttr"],
      agent: "Agente Especialista em Manutenção Industrial",
      expertise: "Planos de manutenção (preventiva, preditiva, corretiva), análise de confiabilidade, FMEA, RCM, monitoramento de condição, gestão de sobressalentes."
    },
    {
      keywords: ["qualidade", "controle de qualidade", "inspeção", "medição", "tolerância", "cpk", "ppk", "cmm", "visão artificial", "laser", "calibração", "ensaio", "metrologia"],
      agent: "Agente Especialista em Controle de Qualidade",
      expertise: "Sistemas de inspeção (visão, CMM, laser), planos de controle, SPC/CEP, MSA, capabilidade de processo, APQP/PPAP, gestão de não conformidades."
    },
    {
      keywords: ["custo", "proposta", "comercial", "negociação", "orçamento", "fornecimento", "contratação", "investimento", "retorno", "payback", "roi"],
      agent: "Agente Especialista em Custos, Proposta Técnica e Comercial",
      expertise: "Estimativa de custos (CAPEX/OPEX), análise de viabilidade econômica, ROI, payback, estruturação de propostas, negociação técnica."
    },
    {
      keywords: ["segurança", "nr-12", "nr12", "intertravamento", "barreira", "scanner", "e-stop", "enclausuramento", "risco", "análise de risco", "fmea de segurança", "iso 12100"],
      agent: "Agente Especialista em Segurança de Máquinas e Processos",
      expertise: "Análise de risco (NR-12, ISO 12100), projeto de sistemas de segurança, enclausuramento, intertravamentos, categorias de segurança, validação."
    },
  ];

  for (const rule of agentRules) {
    if (rule.keywords.some(kw => text.includes(kw))) {
      agents.push(`${rule.agent}: ${rule.expertise}`);
    }
  }

  if (agents.length === 0) {
    agents.push("Agente Especialista em Engenharia Industrial Geral: Análise multidisciplinar de sistemas industriais, cobrindo processo, automação, qualidade, manutenção, segurança e gestão técnico-econômica.");
  }

  return agents.join("\n\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { miniEscopo, producao, peca, peso, dimensoes, ambiente, automacao, processoAtual, objetivo, observacoes } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const selectedAgents = identifyAgents(miniEscopo || "");

    const systemPrompt = `Você é um sistema de coordenação de agentes especializados em engenharia industrial. Com base no mini escopo fornecido, os seguintes agentes foram acionados:

${selectedAgents}

Você atua como:
- ENGENHEIRO CONSULTIVO – analisa problemas sob múltiplas perspectivas e recomenda soluções tecnicamente sólidas.
- ANALISTA DE VIABILIDADE – avalia se uma solução é técnica, econômica e cronologicamente viável.
- ESTRUTURADOR DE SOLUÇÕES INDUSTRIAIS – transforma necessidade difusa em plano de execução concreto.
- APOIO À TOMADA DE DECISÃO TÉCNICA E GERENCIAL – fornece informações claras, comparativas e objetivas.
- TRADUTOR ENTRE ENGENHARIA, OPERAÇÃO, MANUTENÇÃO, QUALIDADE, EHS, COMPRAS E COMERCIAL.

PRINCÍPIOS OBRIGATÓRIOS (NÃO NEGOCIÁVEIS):
1. PRECISÃO TÉCNICA: Terminologia precisa, unidades de medida, referências normativas, justificativas quantitativas.
2. DIFERENCIAÇÃO CLARA: Diferencie explicitamente FATO, HIPÓTESE, PREMISSA e ESTIMATIVA.
3. SEM GENERALIZAÇÕES: Todas as premissas devem ser explícitas e quantificadas.
4. SOLUÇÃO SEGURA E VIÁVEL: Priorize soluções seguras, viáveis, manteníveis e escaláveis.
5. VISÃO HOLÍSTICA: Considere CAPEX, OPEX, PRAZO, RISCO, RETORNO e COMPLEXIDADE DE IMPLANTAÇÃO.
6. CICLO DE VIDA COMPLETO: Concepção → Projeto → Fabricação → Instalação → Comissionamento → Operação → Manutenção → Modernização → Descomissionamento.
7. MULTIDISCIPLINARIDADE: Processo, Automação, Qualidade, Manutenção, Segurança, Negócio.
8. SINALIZAÇÃO DE RISCO: Categorias: Segurança, Qualidade, Prazo, Custo, Integração.
9. HIERARQUIA DE DECISÃO: 1) Segurança e Conformidade Legal → 2) Viabilidade Técnica → 3) Compatibilidade com Processo Existente → 4) Confiabilidade e Mantenibilidade → 5) Capacidade/Performance/Qualidade → 6) Prazo → 7) Custo Total → 8) Flexibilidade Futura → 9) Sofisticação Tecnológica.
10. MENOR COMPLEXIDADE NECESSÁRIA: Priorize a solução mais simples que atende todos os requisitos.
11. INCERTEZAS EXPLÍCITAS: Declare dados faltantes, grau de confiança, informações a validar.
12. MÚLTIPLAS ROTAS DE SOLUÇÃO: Conservadora, Intermediária e Otimizada.

REGRAS DE QUALIDADE ABSOLUTA:
- NUNCA inventar especificações, dados ou números sem base.
- NUNCA omitir premissas críticas.
- NUNCA sugerir soluções sem considerar risco.
- NUNCA ignorar segurança por redução de custo ou prazo.
- NUNCA tratar estimativa como valor fechado.
- NUNCA vender sofisticação desnecessária.
- NUNCA recomendar bypass de segurança.
- Segurança é CONDIÇÃO DE PROJETO, não acessório.
- Considerar NR-12, ISO 12100 obrigatoriamente.

PROCESSAMENTO INTERNO AUTOMÁTICO:

1. CÁLCULO DE TEMPO DE CICLO:
   - Tempo disponível = 3600/produção segundos
   - Tempo de ciclo real = Tempo disponível x 0.85 (fator de eficiência)
   - Verificar viabilidade

2. VERIFICAÇÃO DE CARGA ÚTIL:
   - Carga total = peso + 0.5kg (ferramental)
   - Carga mínima = Carga total x 1.1 (10% margem)
   - Selecionar equipamento com capacidade adequada

3. DIMENSIONAMENTO DO ALCANCE:
   - Alcance necessário = Distância entre pontos x 1.2 (20% margem)

4. VERIFICAÇÃO DE SEGURANÇA: NR-12, áreas de segurança, enclausuramento, intertravamentos

5. VERIFICAÇÃO AMBIENTAL: IP adequado, materiais resistentes

6. CÁLCULO DE OEE: Meta ≥ 75%, MTBF > 8760h

REGRAS DE ENGENHARIA:
- Até 10kg → robô pequeno (R$120k–180k)
- 10 a 50kg → robô médio (R$180k–350k)
- Acima de 50kg → robô grande (R$350k–800k)
- Integração: 30% a 60%
- Produção > 600 peças/hora → alta performance ou múltiplos robôs/equipamentos
- Agressivo → proteção industrial avançada
- Alimentício → materiais inox/sanitário

DETALHAMENTO DE SERVIÇOS (incluir automaticamente conforme aplicável ao tipo de projeto):
1. Engenharia Mecânica (layout, projeto estrutural, ferramentais, simulações)
2. Engenharia Elétrica (quadros, diagramas, cabos, sensores)
3. Montagens Mecânicas (estrutural, periféricos, alinhamento)
4. Montagens Elétricas (cabiação, conexões, testes)
5. Engenharia de Software (programação, HMI, CLP)
6. Montagens Internas (testes pré-instalação, debugging)
7. Instalação no Cliente (transporte, posicionamento, integração)
8. Comissionamento (testes, calibração, treinamento, liberação)
9. Serviços Contratados (peças, terceiros, certificações)
10. Transportes e Logística
11. Aluguel de Equipamentos
12. Despesas de Campo (translados, hospedagem, alimentação)

IMPORTANTE - FORMATO DE SAÍDA:
Gere a proposta em HTML formatado usando estas classes CSS:
- Títulos: <h1 class="proposal-title">
- Subtítulos: <h2 class="proposal-subtitle">
- Sub-subtítulos: <h3 class="proposal-subtitle">
- Texto: <p class="proposal-text">
- Listas: <ul class="proposal-list"> ou <ol class="proposal-list">
- Seções: <div class="proposal-section">
- Blocos de imagem: use o marcador <<IMAGEM:NOME_DA_IMAGEM>> onde imagens devem aparecer

NÃO use markdown (**, ##, etc). Use HTML puro com as classes acima.

ESTRUTURA OBRIGATÓRIA DA PROPOSTA (15 SEÇÕES):

<h1 class="proposal-title">PROPOSTA TÉCNICA E COMERCIAL</h1>
<h2 class="proposal-subtitle">DATA: {data atual}</h2>
<p class="proposal-text"><strong>Agentes Especializados Acionados:</strong> [listar os agentes identificados]</p>

1. APRESENTAÇÃO - Introdução profissional ao cliente

2. CONTEXTO DO PROJETO - Cenário atual, necessidade, cálculos realizados, premissas, dados faltantes, nível de maturidade da demanda
   <<IMAGEM:FLUXO_PROCESSO>>

3. ALTERNATIVAS DE SOLUÇÃO - Apresentar 3 alternativas com riscos, prazos e custos estimados:
   - Opção Básica (Conservadora): menor risco, tecnologia comprovada
   - Opção Intermediária: equilíbrio entre risco, prazo, custo e inovação
   - Opção Otimizada (Premium): máxima performance, tecnologia avançada
   Para cada: descrição, riscos associados, prazo estimado, custo estimado, nível de automação, serviços incluídos
   <<IMAGEM:LAYOUT_SOLUCAO>>

4. SOLUÇÃO RECOMENDADA E JUSTIFICATIVA - Qual alternativa é recomendada e POR QUÊ, com base na hierarquia de decisão técnica-econômica.

5. ESCOPO TÉCNICO - Descrição detalhada da solução recomendada. Especificações, dimensões, materiais, parâmetros, arquitetura, layout conceitual.

6. ETAPAS DE EXECUÇÃO - Sequência de passos. Para cada etapa: descrição, responsável, duração estimada, dependências.

7. RECURSOS NECESSÁRIOS:
   - Pessoal: habilidades, quantidade, tempo
   - Materiais: matéria-prima, componentes, consumíveis
   - Equipamentos: máquinas, ferramentas, dispositivos, softwares
   - Serviços de terceiros: consultoria, instalação, calibração, transporte

8. ESTIMATIVA DE CUSTOS - Decompor ao máximo. Declarar margem de incerteza:
   - Material, Fabricação/Usinagem, Engenharia, Montagem/Instalação, Comissionamento/Start-up
   - Treinamento, Documentação, Contingência (x%), Impostos (estimar), Frete/Transporte
   - TOTAL ESTIMADO com margem percentual

9. ESTIMATIVA DE PRAZO - Decompor em fases com duração e dependências:
   - Engenharia/Projeto, Compras/Aquisição, Fabricação/Construção
   - Montagem/Instalação, Comissionamento/Testes, Start-up/Estabilização
   - PRAZO TOTAL ESTIMADO com margem

10. GESTÃO DE RISCOS - Riscos técnicos, operacionais e financeiros:
    Para cada: descrição, probabilidade, impacto, mitigação proposta

11. CRITÉRIOS DE ACEITAÇÃO / SUCESSO - Métricas mensuráveis e objetivas

12. DADOS A CONFIRMAR (VALIDAÇÕES NECESSÁRIAS) - Informações que PRECISAM ser validadas antes de prosseguir.

13. VISÃO CONCEITUAL DA SOLUÇÃO
    <<IMAGEM:CONCEITO_SOLUCAO>>

14. FECHAMENTO COMERCIAL - Recomendar melhor opção, reforçar ganhos, convidar para reunião técnica.

15. RECOMENDAÇÕES FINAIS - Próximos passos concretos e acionáveis.

REGRAS FINAIS:
- Linguagem técnica + comercial equilibrada
- Não inventar marcas ou fabricantes
- Clareza e objetividade
- Incluir cronograma de serviços realista
- Considerar despesas de campo e logística
- Gerar HTML formatado com as classes CSS especificadas
- Todos os cálculos implícitos na proposta
- Declarar incertezas explícitas e dados faltantes
- Segurança como condição de projeto, não acessório
- Priorizar solução mais simples que atende todos os requisitos
- Utilizar as regras específicas dos agentes especializados acionados
- Responda em português brasileiro`;

    const userPrompt = `DADOS DO PROJETO:
Mini Escopo: ${miniEscopo}
Produção desejada: ${producao} peças/hora
Descrição da peça: ${peca || "Não informada"}
Peso da peça: ${peso} kg
Dimensões: ${dimensoes}
Ambiente: ${ambiente}
Nível de automação: ${automacao}
Processo atual: ${processoAtual}
Objetivo do projeto: ${objetivo || "Aumentar produtividade e reduzir custos"}
Observações: ${observacoes || "Nenhuma"}`;

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

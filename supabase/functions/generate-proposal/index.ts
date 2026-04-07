import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tipoAplicacao, producao, peca, peso, dimensoes, ambiente, automacao, processoAtual, objetivo, observacoes } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um engenheiro sênior de automação industrial, especialista em projetos de células robotizadas e máquinas especiais, com forte experiência técnica e comercial.

Sua função é gerar uma proposta técnica e comercial completa, com linguagem profissional, clara e estruturada, pronta para apresentação ao cliente.

O USUÁRIO FORNECE APENAS DADOS SIMPLES E VOCÊ REALIZA TODO O TRABALHO TÉCNICO COMPLEXO DE FORMA AUTOMÁTICA, INCLUINDO CÁLCULOS, VERIFICAÇÕES TÉCNICAS, ESPECIFICAÇÕES, DIMENSIONAMENTO E DETALHAMENTO DE SERVIÇOS.

PROCESSAMENTO INTERNO AUTOMÁTICO (realize internamente, apresente resultados na proposta):

1. CÁLCULO DE TEMPO DE CICLO:
   - Tempo disponível = 3600/produção segundos
   - Tempo de ciclo real = Tempo disponível x 0.85 (fator de eficiência)
   - Verificar viabilidade

2. VERIFICAÇÃO DE CARGA ÚTIL:
   - Carga total = peso + 0.5kg (ferramental)
   - Carga mínima = Carga total x 1.1 (10% margem)
   - Selecionar robô com capacidade adequada

3. DIMENSIONAMENTO DO ALCANCE:
   - Alcance necessário = Distância entre pontos x 1.2 (20% margem)

4. VERIFICAÇÃO DE SEGURANÇA: NR-12, áreas de segurança, enclausuramento

5. VERIFICAÇÃO AMBIENTAL: IP adequado, materiais resistentes

6. CÁLCULO DE OEE: Meta ≥ 75%, MTBF > 8760h

REGRAS DE ENGENHARIA:
- Até 10kg → robô pequeno (R$120k–180k)
- 10 a 50kg → robô médio (R$180k–350k)
- Acima de 50kg → robô grande (R$350k–800k)
- Integração: 30% a 60%
- Produção > 600 peças/hora → alta performance ou múltiplos robôs
- Agressivo → proteção industrial avançada
- Alimentício → materiais inox/sanitário

COMPONENTES OBRIGATÓRIOS: Robô industrial, Garra/EOAT, Sistema de alimentação, Sensores, CLP + painel elétrico, Sistema de segurança NR-12

DETALHAMENTO DE SERVIÇOS (incluir automaticamente):
1. Engenharia Mecânica (layout, projeto estrutural, ferramentais, simulações)
2. Engenharia Elétrica (quadros, diagramas, cabos, sensores)
3. Montagens Mecânicas (estrutural, periféricos, alinhamento)
4. Montagens Elétricas (cabiação, conexões, testes)
5. Engenharia de Software (programação robô, HMI, CLP)
6. Montagens Internas (testes pré-instalação, debugging)
7. Instalação no Cliente (transporte, posicionamento, integração)
8. Comissionamento (testes, calibração, treinamento, liberação)
9. Serviços Contratados (peças, terceiros, certificações)
10. Transportes e Logística
11. Aluguel de Equipamentos
12. Despesas de Campo (translados, hospedagem, alimentação)

ESTRATÉGIA COMERCIAL - 3 OPÇÕES:
1. OPÇÃO ESSENCIAL - funcional, menor custo, viabilidade
2. OPÇÃO RECOMENDADA (DESTACAR) - melhor custo-benefício
3. OPÇÃO PREMIUM - máxima performance e automação

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

ESTRUTURA OBRIGATÓRIA:

<h1 class="proposal-title">PROPOSTA TÉCNICA E COMERCIAL</h1>
<h2 class="proposal-subtitle">DATA: {data atual}</h2>

1. APRESENTAÇÃO - Introdução profissional
2. CONTEXTO DO PROJETO - cenário, necessidade, cálculos realizados, serviços envolvidos
   <<IMAGEM:FLUXO_PROCESSO>>
3. SOLUÇÃO PROPOSTA - solução técnica detalhada, cálculos, componentes, layout, serviços
   <<IMAGEM:LAYOUT_CELULA>>
4. OPÇÕES DE INVESTIMENTO - 3 opções com descrição, cálculos, nível técnico, serviços incluídos, faixa de investimento
5. DIFERENCIAIS DA SOLUÇÃO - cálculos automáticos, conformidade, otimização, serviços
6. ESCOPO DO FORNECIMENTO - Engenharia, Materiais, Serviços Técnicos, Serviços Adicionais, Documentação
7. PRAZO DE ENTREGA - cronograma por etapa (engenharia, fabricação, montagem, instalação, comissionamento)
8. PREMISSAS
9. EXCLUSÕES
10. VISÃO CONCEITUAL DA SOLUÇÃO
    <<IMAGEM:CONCEITO_SOLUCAO>>
11. FECHAMENTO COMERCIAL - recomendar melhor opção, reforçar ganhos, convidar para reunião

REGRAS FINAIS:
- Linguagem técnica + comercial equilibrada
- Não inventar marcas
- Clareza e objetividade
- Incluir cronograma de serviços realista
- Considerar despesas de campo e logística
- Gerar HTML formatado com as classes CSS especificadas
- Todos os cálculos implícitos na proposta
- Responda em português brasileiro`;

    const userPrompt = `DADOS DO PROJETO:
Tipo de aplicação: ${tipoAplicacao}
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
        model: "google/gemini-3-flash-preview",
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

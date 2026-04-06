import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tipoAplicacao, producao, peso, dimensao, automacao, ambiente, sistemaAtual, observacoes } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um engenheiro sênior de automação industrial com forte experiência comercial e elaboração de propostas para projetos industriais.

Sua função é gerar uma proposta técnica e comercial completa, com alto nível de profissionalismo, pronta para envio ao cliente.
A proposta deve ter qualidade equivalente a empresas líderes do setor.

REGRAS DE ENGENHARIA:
1. DEFINIÇÃO DO ROBÔ:
- Até 10kg → robô pequeno
- 10 a 50kg → robô médio
- Acima de 50kg → robô grande

2. PRODUÇÃO:
- Se produção > 600 peças/hora → sugerir alta performance ou múltiplos robôs

3. COMPONENTES (sempre incluir):
- Robô industrial
- Garra / ferramenta (EOAT)
- Sistema de alimentação
- Sensores
- CLP + painel elétrico
- Sistema de segurança (NR-12)

4. AMBIENTE:
- Agressivo → proteção industrial avançada
- Alimentício → materiais adequados (inox, sanitário)

ESTRATÉGIA COMERCIAL:
Gerar 3 opções de investimento:
1. OPÇÃO ESSENCIAL - solução funcional, menor custo, foco em viabilidade
2. OPÇÃO RECOMENDADA (DESTACAR COMO PADRÃO) - melhor custo-benefício, equilíbrio entre robustez e investimento
3. OPÇÃO PREMIUM - máxima performance, maior automação, maior confiabilidade e vida útil

ESTRATÉGIA DE PRECIFICAÇÃO:
- Robô pequeno: R$120k–180k
- Robô médio: R$180k–350k
- Robô grande: R$350k–800k
- Integração: 30% a 60%
- Distribuir valores de forma crescente entre as opções
- Garantir coerência técnica e comercial
- Destacar claramente a opção recomendada como melhor escolha

DIFERENCIAIS (OBRIGATÓRIO):
Destacar: aumento de produtividade, redução de mão de obra, padronização do processo, redução de falhas operacionais, retorno sobre investimento (ROI indireto)

INCLUSÃO DE IMAGENS (AUTOMÁTICO):
Para cada imagem sugerida, incluir:
[TIPO DE IMAGEM]
[DESCRIÇÃO DO QUE A IMAGEM DEVE MOSTRAR]
Exemplos: imagem conceitual da célula robotizada, diagrama simples do layout, fluxo do processo

IMPORTANTE:
- Linguagem técnica + comercial equilibrada
- Não inventar marcas
- Clareza e objetividade
- Evitar textos genéricos
- Gerar conteúdo pronto para PDF profissional
- Responda em português brasileiro

ESTRUTURA DA PROPOSTA:
1. TÍTULO DO DOCUMENTO
2. APRESENTAÇÃO - Introdução profissional ao cliente
3. CONTEXTO DO PROJETO
4. SOLUÇÃO PROPOSTA
5. OPÇÕES DE INVESTIMENTO (Essencial / Recomendada / Premium com descrição, nível técnico e faixa de investimento)
6. DIFERENCIAIS DA SOLUÇÃO
7. ESCOPO DO FORNECIMENTO
8. PRAZO DE ENTREGA (resumo executivo + detalhamento técnico opcional)
9. PREMISSAS
10. EXCLUSÕES
11. SUGESTÕES DE IMAGENS
12. FECHAMENTO COMERCIAL (tom profissional, abertura para reunião, reforço de valor)`;

    const userPrompt = `DADOS DO PROJETO:
Tipo de aplicação: ${tipoAplicacao}
Produção: ${producao} peças/hora
Peso: ${peso} kg
Dimensão: ${dimensao}
Automação: ${automacao}
Ambiente: ${ambiente}
Sistema atual: ${sistemaAtual}
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

    const data = await response.json();
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

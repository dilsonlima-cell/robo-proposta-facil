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

    const systemPrompt = `Você é um engenheiro especialista em automação industrial.
Com base nos dados fornecidos, gere uma proposta técnica estruturada para uma célula robotizada.

REGRAS TÉCNICAS:
- Até 10kg → robô pequeno
- 10 a 50kg → robô médio
- Acima de 50kg → robô grande
- Se produção > 600 peças/hora → sugerir alta velocidade ou múltiplos robôs
- Sempre incluir: robô, garra, sensores, sistema de alimentação, CLP e painel elétrico
- Se ambiente agressivo → incluir proteção industrial
- Se alimentício → considerar materiais apropriados (aço inox, grau alimentício)

ESTIMATIVA:
- Robô pequeno: R$120k–180k
- Robô médio: R$180k–350k
- Robô grande: R$350k–800k
- Integração: 30% a 60% do hardware

IMPORTANTE:
- Linguagem técnica e profissional
- Não inventar marcas
- Não ser genérico
- Responda em português brasileiro

ESTRUTURA DA RESPOSTA:
1. CONTEXTO DO PROJETO
2. SOLUÇÃO PROPOSTA
3. ESCOPO DO FORNECIMENTO
4. ESTIMATIVA DE INVESTIMENTO
5. PRAZO DE ENTREGA
6. PREMISSAS
7. EXCLUSÕES`;

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

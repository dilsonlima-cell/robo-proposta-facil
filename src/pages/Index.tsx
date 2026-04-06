import { useState } from "react";
import ProposalForm, { FormData } from "@/components/ProposalForm";
import ProposalResult from "@/components/ProposalResult";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [proposal, setProposal] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async (data: FormData) => {
    if (!data.tipoAplicacao || !data.producao || !data.peso || !data.dimensao || !data.automacao || !data.ambiente || !data.sistemaAtual) {
      toast({ title: "Campos obrigatórios", description: "Preencha todos os campos antes de gerar a proposta.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setProposal("");

    try {
      const { data: result, error } = await supabase.functions.invoke("generate-proposal", {
        body: data,
      });

      if (error) {
        // Try to parse error body for custom message
        let errorMsg = "Tente novamente.";
        try {
          const errorBody = typeof error === 'object' && error.context ? await error.context.json() : null;
          if (errorBody?.error) errorMsg = errorBody.error;
        } catch {}
        throw new Error(errorMsg);
      }
      if (!result?.proposal) throw new Error("Resposta inválida. Tente novamente.");
      setProposal(result.proposal);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erro ao gerar proposta", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <ProposalForm onGenerate={handleGenerate} isLoading={isLoading} />
        {proposal && <ProposalResult content={proposal} />}
      </div>
    </div>
  );
};

export default Index;

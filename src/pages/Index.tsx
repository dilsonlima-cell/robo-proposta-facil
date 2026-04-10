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
    if (!data.miniEscopo || !data.clientName || !data.projectTitle || !data.initialObjective) {
      toast({ title: "Campos obrigatórios", description: "Preencha Nome do Cliente, Título do Projeto, Objetivo Inicial e Mini Escopo.", variant: "destructive" });
      return;
    }

    if (data.initialObjective === "Gerar Proposta Técnica e Comercial" && !data.proposalVersion) {
      toast({ title: "Versão obrigatória", description: "Selecione a versão da proposta (Básica, Normal ou Completa).", variant: "destructive" });
      return;
    }

    const newId = "prop_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("current_proposal_id", newId);

    setIsLoading(true);
    setProposal("");

    try {
      const { data: result, error } = await supabase.functions.invoke("generate-proposal", {
        body: data,
      });

      if (error) {
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
      toast({ title: "Erro ao gerar documento", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-body">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <ProposalForm onGenerate={handleGenerate} isLoading={isLoading} />
        {proposal && <ProposalResult content={proposal} />}
      </div>
    </div>
  );
};

export default Index;

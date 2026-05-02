import { useState } from "react";
import ProposalForm, { emptyFormData, FormData } from "@/components/ProposalForm";
import ProposalResult from "@/components/ProposalResult";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "proposal_workspace_state";

const loadSavedWorkspace = (): { proposal: string; formData: FormData } => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { proposal: "", formData: emptyFormData };
    const parsed = JSON.parse(saved);
    return { proposal: parsed.proposal || "", formData: { ...emptyFormData, ...(parsed.formData || {}) } };
  } catch {
    return { proposal: "", formData: emptyFormData };
  }
};

const saveWorkspace = (formData: FormData, proposal: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ formData, proposal, updatedAt: new Date().toISOString() }));
  } catch {
    console.warn("Não foi possível salvar o rascunho localmente.");
  }
};

const Index = () => {
  const savedWorkspace = loadSavedWorkspace();
  const [proposal, setProposal] = useState<string>(savedWorkspace.proposal);
  const [formData, setFormData] = useState<FormData>(savedWorkspace.formData);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDraftChange = (data: FormData) => {
    setFormData(data);
    saveWorkspace(data, proposal);
  };

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("current_proposal_id");
    Object.keys(localStorage).filter((key) => key.startsWith("proposal_")).forEach((key) => localStorage.removeItem(key));
    setFormData(emptyFormData);
    setProposal("");
    toast({ title: "Página limpa", description: "Os dados preenchidos e a proposta foram removidos." });
  };

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
    setFormData(data);
    saveWorkspace(data, "");

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
      saveWorkspace(data, result.proposal);
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
        <ProposalForm onGenerate={handleGenerate} isLoading={isLoading} initialData={formData} onDraftChange={handleDraftChange} onClear={handleClear} hasSavedContent={Boolean(proposal || formData.clientName || formData.projectTitle || formData.miniEscopo)} />
        {proposal && <ProposalResult content={proposal} onContentChange={(content) => { setProposal(content); saveWorkspace(formData, content); }} formData={{ clientName: formData.clientName, projectTitle: formData.projectTitle, proposalVersion: formData.proposalVersion, initialObjective: formData.initialObjective }} />}
      </div>
    </div>
  );
};

export default Index;

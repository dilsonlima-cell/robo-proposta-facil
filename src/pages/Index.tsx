import { useEffect, useState } from "react";
import ProposalForm, { emptyFormData, FormData } from "@/components/ProposalForm";
import ProposalResult from "@/components/ProposalResult";
import ProposalHistory from "@/components/ProposalHistory";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "proposal_workspace_state";
const DB_NAME = "proposal_workspace_db";
const STORE_NAME = "workspace";
const PROPOSAL_KEY = "latest_proposal";

const loadSavedForm = (): FormData => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return emptyFormData;
    const parsed = JSON.parse(saved);
    return { ...emptyFormData, ...(parsed.formData || {}) };
  } catch {
    return emptyFormData;
  }
};

const openWorkspaceDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const loadSavedProposal = async (): Promise<string> => {
  const db = await openWorkspaceDb();
  return new Promise((resolve) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(PROPOSAL_KEY);
    request.onsuccess = () => resolve(request.result?.content || "");
    request.onerror = () => resolve("");
  });
};

const saveProposalContent = async (proposal: string) => {
  const db = await openWorkspaceDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).put({ id: PROPOSAL_KEY, content: proposal, updatedAt: new Date().toISOString() });
};

const clearProposalContent = async () => {
  const db = await openWorkspaceDb();
  db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(PROPOSAL_KEY);
};

const saveWorkspace = (formData: FormData, proposal: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ formData, updatedAt: new Date().toISOString() }));
  } catch {
    console.warn("Não foi possível salvar o rascunho localmente.");
  }
  saveProposalContent(proposal).catch(() => console.warn("Não foi possível salvar a proposta localmente."));
};

const Index = () => {
  const [proposal, setProposal] = useState<string>("");
  const [formData, setFormData] = useState<FormData>(() => loadSavedForm());
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSavedProposal().then((savedProposal) => {
      if (savedProposal) setProposal(savedProposal);
    }).catch(() => undefined);
  }, []);

  const handleDraftChange = (data: FormData) => {
    setFormData(data);
    saveWorkspace(data, proposal);
  };

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("current_proposal_id");
    Object.keys(localStorage).filter((key) => key.startsWith("proposal_")).forEach((key) => localStorage.removeItem(key));
    clearProposalContent().catch(() => undefined);
    setFormData(emptyFormData);
    setProposal("");
    toast({ title: "Página limpa", description: "Os dados preenchidos e a proposta foram removidos." });
  };

  const saveToHistory = async (data: FormData, content: string) => {
    try {
      await supabase.from("proposals").insert([{
        client_name: data.clientName || "N/A",
        project_title: data.projectTitle || "N/A",
        proposal_version: data.proposalVersion || null,
        objective: data.initialObjective || null,
        form_data: JSON.parse(JSON.stringify(data)),
        content,
      }]);
    } catch (err) {
      console.warn("Não foi possível salvar no histórico:", err);
    }
  };

  const handleLoadFromHistory = (content: string, histFormData: Record<string, string>) => {
    const merged: FormData = { ...emptyFormData, ...histFormData };
    setFormData(merged);
    setProposal(content);
    saveWorkspace(merged, content);
    toast({ title: "Proposta carregada", description: "A proposta foi restaurada do histórico." });
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

      // Save to database history
      await saveToHistory(data, result.proposal);

      if (result.warning) {
        toast({ title: "Aviso", description: result.warning });
      }
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
        <ProposalHistory onLoad={handleLoadFromHistory} />
        <ProposalForm onGenerate={handleGenerate} isLoading={isLoading} initialData={formData} onDraftChange={handleDraftChange} onClear={handleClear} hasSavedContent={Boolean(proposal || formData.clientName || formData.projectTitle || formData.miniEscopo)} />
        {proposal && <ProposalResult content={proposal} onContentChange={(content) => { setProposal(content); saveWorkspace(formData, content); }} formData={{ clientName: formData.clientName, projectTitle: formData.projectTitle, proposalVersion: formData.proposalVersion, initialObjective: formData.initialObjective, companyName: formData.companyName, validadeDias: formData.validadeDias, representanteName: formData.representanteName, representanteCargo: formData.representanteCargo, clientRepName: formData.clientRepName, clientRepCargo: formData.clientRepCargo }} />}
      </div>
    </div>
  );
};

export default Index;

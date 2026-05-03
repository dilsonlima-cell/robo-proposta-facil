import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Trash2, Eye, FileText } from "lucide-react";

interface Proposal {
  id: string;
  client_name: string;
  project_title: string;
  proposal_version: string | null;
  objective: string | null;
  content: string;
  template_used: string | null;
  created_at: string;
}

interface ProposalHistoryProps {
  onLoad: (content: string, formData: Record<string, string>) => void;
}

const ProposalHistory = ({ onLoad }: ProposalHistoryProps) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchProposals = async () => {
    const { data, error } = await supabase
      .from("proposals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) setProposals(data as Proposal[]);
  };

  useEffect(() => {
    if (isOpen) fetchProposals();
  }, [isOpen]);

  const handleDelete = async (id: string) => {
    await supabase.from("proposals").delete().eq("id", id);
    setProposals((prev) => prev.filter((p) => p.id !== id));
  };

  const handleLoad = (p: Proposal) => {
    onLoad(p.content, {
      clientName: p.client_name,
      projectTitle: p.project_title,
      proposalVersion: p.proposal_version || "",
      initialObjective: p.objective || "",
    });
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="mb-4">
        <History className="h-4 w-4 mr-2" />
        Histórico de Propostas ({proposals.length || "..."})
      </Button>
    );
  }

  return (
    <Card className="mb-6 border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Histórico de Propostas Geradas
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            Fechar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {proposals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma proposta salva ainda.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {proposals.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground truncate">
                    {p.project_title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.client_name} · {p.proposal_version || p.objective} ·{" "}
                    {new Date(p.created_at).toLocaleDateString("pt-BR")}{" "}
                    {new Date(p.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button variant="ghost" size="sm" onClick={() => handleLoad(p)} title="Carregar">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} title="Excluir" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProposalHistory;

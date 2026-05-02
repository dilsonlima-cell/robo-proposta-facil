import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, Trash2 } from "lucide-react";

export interface FormData {
  clientName: string;
  projectTitle: string;
  initialObjective: string;
  proposalVersion: string;
  miniEscopo: string;
  producao: string;
  peca: string;
  peso: string;
  dimensoes: string;
  ambiente: string;
  automacao: string;
  processoAtual: string;
  objetivo: string;
  observacoes: string;
}

interface ProposalFormProps {
  onGenerate: (data: FormData) => void;
  isLoading: boolean;
  initialData?: FormData;
  onDraftChange?: (data: FormData) => void;
  onClear?: () => void;
  hasSavedContent?: boolean;
}

export const emptyFormData: FormData = {
    clientName: "",
    projectTitle: "",
    initialObjective: "",
    proposalVersion: "",
    miniEscopo: "",
    producao: "",
    peca: "",
    peso: "",
    dimensoes: "",
    ambiente: "",
    automacao: "",
    processoAtual: "",
    objetivo: "",
    observacoes: "",
};

const ProposalForm = ({ onGenerate, isLoading, initialData, onDraftChange, onClear, hasSavedContent }: ProposalFormProps) => {
  const [form, setForm] = useState<FormData>(initialData || emptyFormData);

  const updateForm = (patch: Partial<FormData>) => {
    setForm((current) => {
      const next = { ...current, ...patch };
      onDraftChange?.(next);
      return next;
    });
  };

  const handleClear = () => {
    setForm(emptyFormData);
    onDraftChange?.(emptyFormData);
    onClear?.();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(form);
  };

  const showProposalVersion = form.initialObjective === "Gerar Proposta Técnica e Comercial";

  return (
    <Card className="border-border/60 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="font-heading text-2xl text-foreground">
              Plataforma de Engenharia Comercial
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              Geração Automatizada de Documentos Técnicos e Comerciais
            </CardDescription>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Preencha os dados abaixo. O sistema identificará automaticamente os agentes especializados e gerará o documento com profundidade proporcional à versão selecionada.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section A: Dados Gerais */}
          <div className="space-y-1 mb-2">
            <h3 className="text-sm font-heading font-semibold text-foreground uppercase tracking-wide">A. Dados Gerais</h3>
            <div className="h-0.5 bg-primary/20 rounded" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Nome do Cliente *</Label>
              <Input
                placeholder="Ex: Maguinistic Indústria"
                value={form.clientName}
                onChange={(e) => updateForm({ clientName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Título do Projeto *</Label>
              <Input
                placeholder="Ex: Célula Robotizada para Soldagem MIG"
                value={form.projectTitle}
                onChange={(e) => updateForm({ projectTitle: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Objetivo Inicial *</Label>
              <Select value={form.initialObjective} onValueChange={(v) => updateForm({ initialObjective: v, proposalVersion: v === "Gerar Escopo Técnico" ? "" : form.proposalVersion })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gerar Escopo Técnico">Gerar Escopo Técnico</SelectItem>
                  <SelectItem value="Gerar Proposta Técnica e Comercial">Gerar Proposta Técnica e Comercial</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Escopo Técnico: documento preliminar a partir de uma ideia. Proposta: documento completo com custos e prazos.
              </p>
            </div>

            {showProposalVersion && (
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Versão da Proposta *</Label>
                <Select value={form.proposalVersion} onValueChange={(v) => updateForm({ proposalVersion: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Basica">Básica — Análise superficial, escopo resumido</SelectItem>
                    <SelectItem value="Normal">Normal — Análise detalhada, escopo completo</SelectItem>
                    <SelectItem value="Completa">Completa — Análise profunda, máximo detalhamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-medium">Descrição da Aplicação / Mini Escopo *</Label>
            <Textarea
              placeholder="Descreva o equipamento, sistema, máquina ou serviço desejado. Ex: Célula robotizada para soldagem MIG de chassis automotivo, Molde de injeção para carcaça plástica, Estampo progressivo para corte e dobra de chapa..."
              value={form.miniEscopo}
              onChange={(e) => updateForm({ miniEscopo: e.target.value })}
              className="min-h-[100px]"
              required
            />
            <p className="text-xs text-muted-foreground">
              O sistema identificará automaticamente os agentes especializados com base na sua descrição.
            </p>
          </div>

          {/* Section B: Parâmetros Técnicos */}
          <div className="space-y-1 mb-2 mt-6">
            <h3 className="text-sm font-heading font-semibold text-foreground uppercase tracking-wide">B. Parâmetros Técnicos</h3>
            <div className="h-0.5 bg-primary/20 rounded" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Produção Desejada</Label>
              <Input
                type="number"
                placeholder="Peças por hora"
                value={form.producao}
                onChange={(e) => setForm({ ...form, producao: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium">Peso da Peça (kg)</Label>
              <Input
                type="number"
                placeholder="kg"
                value={form.peso}
                onChange={(e) => setForm({ ...form, peso: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-foreground font-medium">Descrição da Peça</Label>
              <Input
                placeholder="Ex: Caixa de papelão 400x300x200mm com 12 unidades"
                value={form.peca}
                onChange={(e) => setForm({ ...form, peca: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium">Dimensões da Peça</Label>
              <Select value={form.dimensoes} onValueChange={(v) => setForm({ ...form, dimensoes: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pequena (até 300mm)">Pequena (até 300mm)</SelectItem>
                  <SelectItem value="Média (300mm a 800mm)">Média (300mm a 800mm)</SelectItem>
                  <SelectItem value="Grande (acima de 800mm)">Grande (acima de 800mm)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium">Nível de Automação</Label>
              <Select value={form.automacao} onValueChange={(v) => setForm({ ...form, automacao: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semi-automático">Semi-automático</SelectItem>
                  <SelectItem value="Totalmente automático">Totalmente automático</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium">Ambiente</Label>
              <Select value={form.ambiente} onValueChange={(v) => setForm({ ...form, ambiente: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Industrial normal">Industrial normal</SelectItem>
                  <SelectItem value="Agressivo (poeira, umidade, químico)">Agressivo (poeira, umidade, químico)</SelectItem>
                  <SelectItem value="Alimentício">Alimentício</SelectItem>
                  <SelectItem value="Cleanroom">Cleanroom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium">Processo Atual</Label>
              <Select value={form.processoAtual} onValueChange={(v) => setForm({ ...form, processoAtual: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manual">Manual</SelectItem>
                  <SelectItem value="Semi-automático existente">Semi-automático existente</SelectItem>
                  <SelectItem value="Automático (retrofit)">Automático (retrofit)</SelectItem>
                  <SelectItem value="Não existe">Não existe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-foreground font-medium">Objetivo do Projeto</Label>
              <Input
                placeholder="Ex: Aumentar produtividade, reduzir custos, melhorar qualidade..."
                value={form.objetivo}
                onChange={(e) => setForm({ ...form, objetivo: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-medium">Observações Adicionais</Label>
            <Textarea
              placeholder="Descreva detalhes adicionais do projeto..."
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              className="min-h-[100px]"
            />
          </div>

          <Button type="submit" size="lg" className="w-full font-heading text-base" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Gerando documento...
              </>
            ) : (
              form.initialObjective === "Gerar Escopo Técnico" ? "Gerar Escopo Técnico" : "Gerar Proposta Técnica e Comercial"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProposalForm;

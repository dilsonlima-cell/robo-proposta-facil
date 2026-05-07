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
  // Signature / metadata fields
  representanteName: string;
  representanteCargo: string;
  representanteCrea: string;
  clientRepName: string;
  clientRepCargo: string;
  validadeDias: string;
  companyName: string;
  // Campos Categoria A — especificação v2.0
  numCoresProducao: string;
  tipoTinta: string;
  nivelSeguranca: string;
  integracaoMes: string;
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
  representanteName: "",
  representanteCargo: "",
  representanteCrea: "",
  clientRepName: "",
  clientRepCargo: "",
  validadeDias: "60",
  companyName: "Leve Brisa",
  // Categoria A v2.0
  numCoresProducao: "",
  tipoTinta: "",
  nivelSeguranca: "",
  integracaoMes: "",
};

const ProposalForm = ({ onGenerate, isLoading, initialData, onDraftChange, onClear, hasSavedContent }: ProposalFormProps) => {
  const [form, setForm] = useState<FormData>(initialData ? { ...emptyFormData, ...initialData } : emptyFormData);

  const updateForm = (patch: Partial<FormData>) => {
    setForm((current) => {
      const next = { ...current, ...patch };
      onDraftChange?.(next);
      return next;
    });
  };

  const handleClear = () => {
    setForm(emptyFormData);
    onClear?.();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(form);
  };

  const showProposalVersion = form.initialObjective === "Gerar Proposta Técnica e Comercial";

  // Count filled required fields
  const requiredFields = ["clientName", "projectTitle", "initialObjective", "miniEscopo"];
  if (showProposalVersion) requiredFields.push("proposalVersion");
  const filledRequired = requiredFields.filter((f) => Boolean(form[f as keyof FormData])).length;
  const totalRequired = requiredFields.length;

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
              Elaboração de Documentos Técnicos e Comerciais
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${(filledRequired / totalRequired) * 100}%` }}
            />
          </div>
          <span>{filledRequired} de {totalRequired} campos obrigatórios</span>
        </div>
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
              <Input placeholder="Ex: Maguinistic Indústria" value={form.clientName} onChange={(e) => updateForm({ clientName: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Título do Projeto *</Label>
              <Input placeholder="Ex: Célula Robotizada para Soldagem MIG" value={form.projectTitle} onChange={(e) => updateForm({ projectTitle: e.target.value })} required />
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
            </div>
            {showProposalVersion && (
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Versão da Proposta *</Label>
                <Select value={form.proposalVersion} onValueChange={(v) => updateForm({ proposalVersion: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Basica">Básica — Análise superficial</SelectItem>
                    <SelectItem value="Normal">Normal — Análise detalhada</SelectItem>
                    <SelectItem value="Completa">Completa — Máximo detalhamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-medium">Descrição da Aplicação / Mini Escopo *</Label>
            <Textarea
              placeholder="Descreva o equipamento, sistema, máquina ou serviço desejado..."
              value={form.miniEscopo}
              onChange={(e) => updateForm({ miniEscopo: e.target.value })}
              className="min-h-[100px]"
              required
            />
          </div>

          {/* Section B: Parâmetros Técnicos */}
          <div className="space-y-1 mb-2 mt-6">
            <h3 className="text-sm font-heading font-semibold text-foreground uppercase tracking-wide">B. Parâmetros Técnicos</h3>
            <div className="h-0.5 bg-primary/20 rounded" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Produção Desejada</Label>
              <Input type="number" placeholder="Peças por hora" value={form.producao} onChange={(e) => updateForm({ producao: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Peso da Peça (kg)</Label>
              <Input type="number" placeholder="kg" value={form.peso} onChange={(e) => updateForm({ peso: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-foreground font-medium">Descrição da Peça</Label>
              <Input placeholder="Ex: Caixa de papelão 400x300x200mm com 12 unidades" value={form.peca} onChange={(e) => updateForm({ peca: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Dimensões da Peça</Label>
              <Select value={form.dimensoes} onValueChange={(v) => updateForm({ dimensoes: v })}>
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
              <Select value={form.automacao} onValueChange={(v) => updateForm({ automacao: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semi-automático">Semi-automático</SelectItem>
                  <SelectItem value="Totalmente automático">Totalmente automático</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Ambiente</Label>
              <Select value={form.ambiente} onValueChange={(v) => updateForm({ ambiente: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Industrial normal">Industrial normal</SelectItem>
                  <SelectItem value="Agressivo (poeira, umidade, químico)">Agressivo</SelectItem>
                  <SelectItem value="Alimentício">Alimentício</SelectItem>
                  <SelectItem value="Cleanroom">Cleanroom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Processo Atual</Label>
              <Select value={form.processoAtual} onValueChange={(v) => updateForm({ processoAtual: v })}>
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
              <Input placeholder="Ex: Aumentar produtividade, reduzir custos, melhorar qualidade..." value={form.objetivo} onChange={(e) => updateForm({ objetivo: e.target.value })} />
            </div>
          </div>

          {/* Subseção B2: Parâmetros Categoria A (v2.0) */}
          <div className="space-y-1 mb-2 mt-4">
            <h3 className="text-sm font-heading font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
              B2. Parâmetros Específicos (Categoria A)
            </h3>
            <p className="text-xs text-muted-foreground">Para projetos de pintura industrial e processos especiais. Ausentes geram estimativas com declaração de premissa crítica.</p>
            <div className="h-0.5 bg-amber-500/20 rounded" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Número de Cores em Produção</Label>
              <Input type="number" placeholder="Ex: 4" value={form.numCoresProducao} onChange={(e) => updateForm({ numCoresProducao: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Tipo de Tinta</Label>
              <Select value={form.tipoTinta} onValueChange={(v) => updateForm({ tipoTinta: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Base solvente">Base solvente</SelectItem>
                  <SelectItem value="Base água">Base água</SelectItem>
                  <SelectItem value="Pó eletrostático">Pó eletrostático</SelectItem>
                  <SelectItem value="E-coat">E-coat (eletrodepositão)</SelectItem>
                  <SelectItem value="Bicomponente">Bicomponente</SelectItem>
                  <SelectItem value="Não definido">Não definido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Nível de Segurança Funcional</Label>
              <Select value={form.nivelSeguranca} onValueChange={(v) => updateForm({ nivelSeguranca: v })}>
                <SelectTrigger><SelectValue placeholder="NR-12 padrão" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NR-12 padrão">NR-12 padrão</SelectItem>
                  <SelectItem value="SIL 1 (ISO 13849 PLc)">SIL 1 / PLc</SelectItem>
                  <SelectItem value="SIL 2 (ISO 13849 PLd)">SIL 2 / PLd</SelectItem>
                  <SelectItem value="SIL 3 (ISO 13849 PLe)">SIL 3 / PLe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Integração MES/ERP</Label>
              <Select value={form.integracaoMes} onValueChange={(v) => updateForm({ integracaoMes: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Não requerida">Não requerida</SelectItem>
                  <SelectItem value="Interface de dados (OPC-UA)">Interface de dados (OPC-UA)</SelectItem>
                  <SelectItem value="Integração MES full">Integração MES full</SelectItem>
                  <SelectItem value="Integração ERP + MES">Integração ERP + MES</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground font-medium">Observações Adicionais</Label>
            <Textarea placeholder="Detalhes adicionais do projeto..." value={form.observacoes} onChange={(e) => updateForm({ observacoes: e.target.value })} className="min-h-[80px]" />
          </div>

          {/* Section C: Dados do Documento */}
          <div className="space-y-1 mb-2 mt-6">
            <h3 className="text-sm font-heading font-semibold text-foreground uppercase tracking-wide">C. Dados do Documento e Assinaturas</h3>
            <div className="h-0.5 bg-primary/20 rounded" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Nome da Empresa Proponente</Label>
              <Input placeholder="Ex: Leve Brisa Ltda" value={form.companyName} onChange={(e) => updateForm({ companyName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Validade (dias)</Label>
              <Input type="number" placeholder="60" value={form.validadeDias} onChange={(e) => updateForm({ validadeDias: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Nome do Representante</Label>
              <Input placeholder="Ex: João da Silva" value={form.representanteName} onChange={(e) => updateForm({ representanteName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Cargo / CREA</Label>
              <Input placeholder="Ex: Diretor de Engenharia / CREA-SP 1234567" value={form.representanteCargo} onChange={(e) => updateForm({ representanteCargo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Nome do Representante do Cliente</Label>
              <Input placeholder="Ex: Maria Souza (opcional)" value={form.clientRepName} onChange={(e) => updateForm({ clientRepName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Cargo do Representante do Cliente</Label>
              <Input placeholder="Ex: Gerente de Projetos (opcional)" value={form.clientRepCargo} onChange={(e) => updateForm({ clientRepCargo: e.target.value })} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="submit" size="lg" className="flex-1 font-heading text-base" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Gerando documento...
                </>
              ) : (
                form.initialObjective === "Gerar Escopo Técnico" ? "Gerar Escopo Técnico" : "Gerar Proposta Técnica e Comercial"
              )}
            </Button>
            {hasSavedContent && (
              <Button type="button" variant="outline" size="lg" className="font-heading text-base" onClick={handleClear} disabled={isLoading}>
                <Trash2 className="mr-2 h-5 w-5" />
                Limpar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProposalForm;

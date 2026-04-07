import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText } from "lucide-react";

export interface FormData {
  tipoAplicacao: string;
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
}

const ProposalForm = ({ onGenerate, isLoading }: ProposalFormProps) => {
  const [form, setForm] = useState<FormData>({
    tipoAplicacao: "",
    producao: "",
    peca: "",
    peso: "",
    dimensoes: "",
    ambiente: "",
    automacao: "",
    processoAtual: "",
    objetivo: "",
    observacoes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(form);
  };

  return (
    <Card className="border-border/60 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="font-heading text-2xl text-foreground">
              Gerador de Proposta Técnica
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              Célula Robotizada
            </CardDescription>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Preencha os dados abaixo para gerar uma proposta técnica automatizada
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Tipo de Aplicação</Label>
              <Select value={form.tipoAplicacao} onValueChange={(v) => setForm({ ...form, tipoAplicacao: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paletização">Paletização</SelectItem>
                  <SelectItem value="Pintura">Pintura</SelectItem>
                  <SelectItem value="Manipulação">Manipulação</SelectItem>
                  <SelectItem value="Montagem">Montagem</SelectItem>
                  <SelectItem value="Soldagem">Soldagem</SelectItem>
                  <SelectItem value="Embalagem">Embalagem</SelectItem>
                  <SelectItem value="Inspeção">Inspeção</SelectItem>
                  <SelectItem value="Alimentação de máquina">Alimentação de máquina</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground font-medium">Produção Desejada</Label>
              <Input
                type="number"
                placeholder="Peças por hora"
                value={form.producao}
                onChange={(e) => setForm({ ...form, producao: e.target.value })}
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
              <Label className="text-foreground font-medium">Peso da Peça (kg)</Label>
              <Input
                type="number"
                placeholder="kg"
                value={form.peso}
                onChange={(e) => setForm({ ...form, peso: e.target.value })}
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
                Gerando proposta...
              </>
            ) : (
              "Gerar Proposta"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProposalForm;

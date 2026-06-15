import { useState, useEffect } from 'react';
import { 
  Stepper, 
  Button, 
  Card, 
  Input, 
  TopNav,
  Badge
} from '../../components/axiz/ui';
import { TemplateSelector } from '../../components/axiz/TemplateSelector';
import { useProposalStore } from '../../store/proposalStore';
import { 
  FileText, 
  Rocket, 
  ChevronRight, 
  ChevronLeft, 
  AlertTriangle,
  History,
  Calculator,
  ShieldCheck,
  Zap,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const NewProject = () => {
  const { form, currentStep, setForm, setStep, isCorrectionMode, resetForm } = useProposalStore();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!isCorrectionMode) {
      resetForm();
    }
  }, []);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = ['Contexto', 'Briefing', 'Template', 'Finalizar'];

  const handleNext = () => setStep(currentStep + 1);
  const handleBack = () => setStep(currentStep - 1);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      // Map Axiz form to robo-proposta-facil FormData
      const mappedData = {
        clientName: form.cliente,
        projectTitle: form.titulo,
        initialObjective: "Gerar Proposta Técnica e Comercial",
        proposalVersion: form.nivel === 'completo' ? 'Completa' : form.nivel === 'intermediario' ? 'Normal' : 'Basica',
        miniEscopo: form.briefing,
        template_id: form.template_id,
        // Default values for other fields
        companyName: "Axiz Premium",
        validadeDias: "60"
      };

      // Create initial record in proposals table with 'processing' status
      const { data: proposal, error: dbError } = await supabase
        .from('proposals')
        .insert([{
          client_name: mappedData.clientName,
          project_title: mappedData.projectTitle,
          proposal_version: mappedData.proposalVersion,
          form_data: { 
            ...mappedData, 
            status: 'processing', 
            progress: 10, 
            current_stage: 'Iniciando Pipeline' 
          },
          content: ''
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      // Invoke edge function
      const { data: result, error: fnError } = await supabase.functions.invoke("generate-proposal", {
        body: mappedData,
      });

      if (fnError) {
         // Update status to failed
         await supabase.from('proposals').update({
           form_data: { ...mappedData, status: 'failed', errors: [fnError.message] }
         }).eq('id', proposal.id);
         throw fnError;
      }

      // Update proposal with result
      await supabase.from('proposals').update({
        content: result.proposal || '',
        form_data: { 
          ...mappedData, 
          status: 'awaiting_approval', 
          progress: 100, 
          current_stage: 'Revisão Técnica',
          warnings: result.warnings || []
        }
      }).eq('id', proposal.id);
      
      setIsSuccess(true);
      toast({ title: "Sucesso", description: "Proposta gerada com sucesso!" });
      
      setTimeout(() => {
        window.location.href = `/axiz/proposal/${proposal.id}`;
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro inesperado ao gerar proposta');
      setIsGenerating(false);
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex gap-6 items-center shadow-sm">
              <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-200">
                <Rocket size={32} />
              </div>
              <div>
                <h3 className="font-black text-blue-900 uppercase tracking-tight text-lg">Iniciando Nova Proposta Industrial</h3>
                <p className="text-sm text-slate-500 font-medium">Configure os dados mestre para o pipeline de 65 especialistas do Axiz Brain.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título do Projeto</label>
                <Input 
                  placeholder="Ex: Retrofitting de Prensa 500t" 
                  value={form.titulo}
                  onChange={(e) => setForm({ titulo: e.target.value })}
                  className="h-14 text-lg font-bold border-2 focus:border-blue-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente / Unidade</label>
                <Input 
                  placeholder="Ex: Volkswagen - Planta Anchieta" 
                  value={form.cliente}
                  onChange={(e) => setForm({ cliente: e.target.value })}
                  className="h-14 text-lg font-bold border-2 focus:border-blue-600"
                />
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div 
                className={`cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${form.nivel === 'completo' ? 'ring-4 ring-blue-600/20' : ''}`}
                onClick={() => setForm({ nivel: 'completo' })}
              >
                <Card className={`h-full border-2 ${form.nivel === 'completo' ? 'border-blue-600 bg-blue-50/30' : 'border-slate-100'}`}>
                  <ShieldCheck size={28} className={`mb-4 ${form.nivel === 'completo' ? 'text-blue-600' : 'text-slate-300'}`} />
                  <h4 className="font-black text-slate-900 uppercase tracking-tighter">Industrial Completo</h4>
                  <p className="text-xs text-slate-500 font-medium mt-2">Dossiê técnico premium com 16 capítulos e análise profunda de ROI.</p>
                </Card>
              </div>
              <div 
                className={`cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${form.persona === 'tecnico' ? 'ring-4 ring-slate-900/10' : ''}`}
                onClick={() => setForm({ persona: 'tecnico' })}
              >
                <Card className={`h-full border-2 ${form.persona === 'tecnico' ? 'border-slate-900 bg-slate-50' : 'border-slate-100'}`}>
                  <Calculator size={28} className={`mb-4 ${form.persona === 'tecnico' ? 'text-slate-900' : 'text-slate-300'}`} />
                  <h4 className="font-black text-slate-900 uppercase tracking-tighter">Foco Engenharia</h4>
                  <p className="text-xs text-slate-500 font-medium mt-2">Linguagem normativa (ABNT/NR) voltada para manutenção e operação.</p>
                </Card>
              </div>
              <div className="opacity-40 grayscale pointer-events-none">
                <Card className="h-full border-2 border-dashed border-slate-200 bg-slate-50">
                  <History size={28} className="mb-4 text-slate-300" />
                  <h4 className="font-black text-slate-400 uppercase tracking-tighter">DNA Mestre v0.32</h4>
                  <p className="text-xs text-slate-400 font-medium mt-2">Padrão industrial customizável disponível em breve.</p>
                </Card>
              </div>
            </div>
            
            {isCorrectionMode && (
              <div className="p-6 bg-amber-50 border-2 border-amber-100 rounded-3xl flex items-start gap-4 shadow-sm animate-pulse">
                <AlertTriangle size={24} className="text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-black text-amber-900 uppercase tracking-tighter">Modo Correção Ativo</p>
                  <p className="text-sm text-amber-700 font-medium leading-relaxed mt-1">
                    O briefing abaixo foi pré-carregado. Corrija as inconsistências e clique em "Continuar".
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <FileText size={14} className="text-blue-600" /> Briefing do Projeto / Escopo Inicial
              </label>
              <textarea 
                className="w-full h-64 p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-lg font-medium text-slate-700 focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all resize-none shadow-inner"
                placeholder="Descreva as dores do cliente, especificações técnicas, prazos e necessidades críticas..."
                value={form.briefing}
                onChange={(e) => setForm({ briefing: e.target.value })}
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                <Zap size={24} className="text-blue-600" /> Identidade Visual
              </h3>
              <Badge variant="outline" className="font-black tracking-widest text-[10px]">A4 Premium Layout</Badge>
            </div>
            <TemplateSelector 
              value={form.template_id} 
              onChange={(id) => setForm({ template_id: id })} 
            />
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col items-center justify-center py-16 space-y-8 text-center max-w-lg mx-auto animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 shadow-inner">
              <Zap size={48} className="animate-pulse" />
            </div>
            <div className="space-y-3">
              <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Pronto para Orquestrar</h3>
              <p className="text-lg text-slate-500 font-medium px-4">
                O Axiz Brain processará 65 especialistas para 
                <span className="font-black text-blue-600 italic"> "{form.titulo}"</span>.
              </p>
            </div>
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-sm border-2 border-red-100 flex gap-3 font-bold">
                <AlertTriangle size={20} className="shrink-0" />
                {error}
              </div>
            )}
            <div className="p-6 bg-slate-900 rounded-3xl flex gap-4 text-left shadow-2xl">
              <ShieldAlert size={32} className="text-blue-400 shrink-0" />
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                <strong className="text-white uppercase tracking-tighter">Aviso de Governança:</strong> Os cálculos financeiros (ROI/BOM) serão validados por algoritmos determinísticos, eliminando qualquer risco de alucinação aritmética da IA.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 font-body">
      <TopNav />
      {isGenerating ? (
        <div className="max-w-xl mx-auto flex flex-col items-center justify-center py-32 animate-in fade-in duration-700">
          {isSuccess ? (
            <div className="flex flex-col items-center text-center space-y-8">
              <div className="w-32 h-32 bg-green-50 rounded-full flex items-center justify-center text-green-600 animate-bounce shadow-2xl shadow-green-200 border-8 border-white">
                <CheckCircle2 size={64} />
              </div>
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Pipeline Disparado!</h2>
                <p className="text-xl text-slate-500 font-medium">Os 65 especialistas iniciaram a orquestração industrial.<br/>Redirecionando para o Dashboard...</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="relative mb-12">
                <div className="w-32 h-32 border-8 border-blue-100 border-t-blue-600 rounded-full animate-spin shadow-xl" />
                <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                  <Rocket size={48} className="animate-bounce" />
                </div>
              </div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Iniciando Axiz Brain...</h2>
              <p className="mt-4 text-slate-500 font-bold text-lg text-center uppercase tracking-widest opacity-60">
                Alocando Clusters de Orquestração
              </p>
              <div className="mt-8 flex gap-2">
                 {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                 ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <Stepper steps={steps} currentStep={currentStep} />
          </div>

          <Card className="shadow-2xl border-none bg-white/80 backdrop-blur-xl p-8 rounded-[3rem]">
            <div className="p-4">
              {renderStep()}
            </div>

            <div className="mt-12 flex justify-between pt-8 border-t border-slate-100">
              <Button 
                variant="ghost" 
                onClick={handleBack}
                disabled={currentStep === 0}
                className="px-8 h-14 rounded-2xl font-black uppercase tracking-widest text-slate-400 hover:text-slate-900"
              >
                <ChevronLeft size={20} className="mr-2" /> Voltar
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button 
                  variant="primary" 
                  onClick={handleNext}
                  disabled={currentStep === 0 && (!form.titulo || !form.cliente)}
                  className="px-10 h-14 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-slate-200 transition-transform active:scale-95"
                >
                  Próximo <ChevronRight size={20} className="ml-2" />
                </Button>
              ) : (
                <Button 
                  variant="primary" 
                  onClick={handleGenerate}
                  isLoading={isGenerating}
                  className="px-12 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-blue-200 animate-pulse transition-transform active:scale-95"
                >
                  <Zap size={24} className="mr-3" /> Gerar Dossiê Industrial
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

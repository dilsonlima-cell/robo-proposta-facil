import React, { useEffect, useState } from 'react';
import { 
  ChevronLeft, 
  Check, 
  FileText, 
  Zap, 
  ShieldAlert, 
  BarChart3, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  ClipboardList,
  DollarSign,
  Building2,
  CheckCircle2,
  Trash2,
  Sparkles,
  Activity,
  Target
} from 'lucide-react';
import { Button, Card, Badge, LoadingSpinner } from '../../components/axiz/ui';
import { PipelineProgressBar } from '../../components/axiz/PipelineProgressBar';
import { BOMReviewTable } from '../../components/axiz/BOMReviewTable';
import { TemplateDesigner } from '../../components/axiz/TemplateDesigner';
import { useProposalStore } from '../../store/proposalStore';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface Proposal {
  id: string;
  titulo: string;
  cliente: string;
  status: string;
  current_stage?: string;
  progress?: number;
  agentStartTime?: number;
  created_at: string;
  content: any;
  is_active?: boolean;
  warnings?: string[];
  errors?: string[];
  aggregate_score?: {
    total: number;
    status: string;
    breakdown: Record<string, number>;
  };
  deviations?: any[];
}

const SectionHeader = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
  <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4 font-display uppercase tracking-tighter">
    <span className="w-2 h-10 bg-blue-600 rounded-full" />
    {icon}
    {title}
  </h2>
);

const RiskBadge = ({ level }: { level: string }) => {
  const colors: Record<string, string> = {
    Alta: 'bg-red-100 text-red-700 border-red-200',
    Média: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Baixa: 'bg-green-100 text-green-700 border-green-200',
    Alto: 'bg-red-100 text-red-700 border-red-200',
    Médio: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Baixo: 'bg-green-100 text-green-700 border-green-200',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${colors[level] || 'bg-slate-100 text-slate-600'}`}>
      {level}
    </span>
  );
};

const TechnologicalRoutes = ({ alternativas }: { alternativas: any }) => {
  if (!alternativas) return null;

  const routes = [
    { id: 'basica', ...alternativas.basica, color: 'border-blue-100 bg-blue-50/30', icon: <Zap className="text-blue-600" size={24} />, label: 'Conservadora' },
    { id: 'intermediaria', ...alternativas.intermediaria, color: 'border-blue-600 bg-blue-50/50 shadow-2xl shadow-blue-200', icon: <TrendingUp className="text-blue-600" size={24} />, label: 'Performance', recommended: true },
    { id: 'premium', ...alternativas.premium, color: 'border-slate-900 bg-slate-50', icon: <BarChart3 className="text-slate-900" size={24} />, label: 'Indústria 4.0' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
      {routes.map((route, i) => (
        <Card key={i} className={`relative overflow-hidden transition-all hover:scale-[1.03] duration-500 border-2 rounded-[2.5rem] p-8 ${route.color}`}>
          {route.recommended && (
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black px-5 py-2 rounded-bl-3xl uppercase tracking-widest shadow-xl">
              Recomendada
            </div>
          )}
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                {route.icon}
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-xl uppercase tracking-tighter leading-tight">{route.posicionamento || route.label}</h3>
                <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{route.id === 'intermediaria' ? 'Melhor ROI' : route.id === 'basica' ? 'Menor CAPEX' : 'Estratégico'}</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed min-h-[80px]">
              {route.descricao}
            </p>

            <div className="space-y-4 pt-6 border-t border-slate-200/50">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Investimento</span>
                <span className="text-lg font-black text-slate-900 uppercase tracking-tighter">{route.investimento}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prazo</span>
                <span className="text-sm font-black text-blue-600 uppercase tracking-tighter">{route.prazo}</span>
              </div>
            </div>

            <div className="space-y-3 pt-6">
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Diferenciais</p>
              {(route.pros || []).slice(0, 3).map((pro: string, idx: number) => (
                <div key={idx} className="flex items-start gap-3 text-[11px] text-slate-600 font-medium leading-tight">
                  <CheckCircle2 size={14} className="text-green-600 mt-0.5 shrink-0" />
                  <span>{pro}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export const ProposalDetails = () => {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [viewMode, setViewMode] = useState<'details' | 'designer'>('details');
  const { toast } = useToast();
  
  const proposalId = window.location.pathname.split('/').pop();

  useEffect(() => {
    fetchProposal();
    
    const pollInterval = setInterval(() => {
      if (proposal?.status === 'processing' || proposal?.status === 'awaiting_approval') {
        fetchProposal();
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [proposalId, proposal?.status]);

  const fetchProposal = async () => {
    if (!proposalId) return;
    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', proposalId)
        .single();

      if (error) throw error;

      let content = {};
      try {
        content = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
      } catch (e) {
        console.warn('Falha ao parsear conteúdo como JSON, usando texto puro.');
        content = { rawText: data.content };
      }

      const formData = (data.form_data as any) || {};
      
      setProposal({
        id: data.id,
        titulo: data.project_title,
        cliente: data.client_name,
        status: formData.status || 'draft',
        current_stage: formData.current_stage,
        progress: formData.progress,
        created_at: data.created_at,
        content: content,
        warnings: formData.warnings,
        errors: formData.errors,
        aggregate_score: formData.aggregate_score,
        deviations: formData.deviations
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  const handleExportPDF = async () => {
    setIsDownloading(true);
    try {
      const iframe = document.querySelector('iframe') as HTMLIFrameElement;
      if (!iframe) {
          toast({ title: "Erro", description: "Preview do template não encontrado.", variant: "destructive" });
          return;
      }

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

      const element = iframeDoc.body;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Axiz_Proposta_${proposal?.titulo.replace(/\s+/g, '_')}.pdf`);
      
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({ title: "Erro", description: "Falha ao gerar PDF.", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleApproveBOM = async (finalBom: any, imposto: number) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('proposals')
        .update({
          form_data: { 
            ...proposal?.content, // Assuming content in form_data too or merge
            status: 'completed',
            progress: 100,
            current_stage: 'Concluído',
            final_bom: finalBom,
            tax_rate: imposto
          }
        })
        .eq('id', proposalId);
      
      if (error) throw error;
      
      await fetchProposal();
      setViewMode('designer');
      toast({ title: "BOM Aprovada", description: "Documento pronto para exportação." });
    } catch (error) {
      console.error('Erro ao aprovar BOM:', error);
      toast({ title: "Erro", description: "Falha ao aprovar BOM.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDesign = async (templateId: string, colors: { primary: string; secondary: string }) => {
    try {
      await supabase.from('proposals').update({
        template_used: templateId,
        form_data: { 
            ...(proposal?.content as any), 
            template_colors: colors 
        }
      }).eq('id', proposalId);
    } catch (error) {
      console.error('Erro ao salvar design:', error);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <LoadingSpinner label="Carregando dossiê técnico industrial..." />
    </div>
  );

  if (!proposal) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <p className="text-slate-900 font-black text-2xl uppercase tracking-tighter">Proposta não encontrada.</p>
        <button 
          onClick={() => window.location.href = '/axiz/dashboard'}
          className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-200"
        >
          Voltar ao Dashboard
        </button>
      </div>
    </div>
  );

  const doc = proposal.content;
  const isFailed = proposal.status === 'failed';

  if (isFailed) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
        <div className="max-w-2xl w-full bg-white border-2 border-red-100 rounded-[3rem] p-12 shadow-2xl">
          <div className="flex items-center gap-6 mb-10">
            <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center text-red-600 shadow-sm">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-tight">Bloqueio de Integridade</h2>
              <p className="text-slate-500 font-medium">O pipeline foi interrompido por inconsistências críticas.</p>
            </div>
          </div>

          <div className="space-y-4 mb-10">
            {proposal.errors && proposal.errors.length > 0 ? (
              proposal.errors.map((err: string, i: number) => (
                <div key={i} className="p-5 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-xs font-bold font-mono leading-relaxed">
                  {err}
                </div>
              ))
            ) : (
              <div className="p-5 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-xs italic font-bold">
                Ocorreu um erro inesperado durante a orquestração industrial.
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => window.location.href = '/axiz/dashboard'}
              className="flex-1 px-8 py-4 bg-slate-50 text-slate-500 border-2 border-slate-100 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all"
            >
              Dashboard
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="flex-1 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3"
            >
              <Zap size={20} />
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20 px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* MODO REVISÃO / APROVAÇÃO */}
        {proposal.status === 'awaiting_approval' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="bg-blue-600 rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-blue-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="w-20 h-20 bg-white/20 backdrop-blur-xl text-white rounded-3xl flex items-center justify-center shadow-inner shrink-0">
                <CheckCircle2 size={40} />
              </div>
              <div className="flex-1 text-center md:text-left relative z-10">
                <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Revisão Técnica Necessária</h2>
                <p className="text-blue-50 text-sm font-medium leading-relaxed opacity-90">
                  A Inteligência Axiz gerou os custos e especificações. Revise a Planilha de Materiais (BOM) abaixo.<br/>
                  Ajuste valores se necessário para garantir a conformidade comercial.
                </p>
              </div>
            </div>

            <BOMReviewTable 
              data={proposal.content} 
              onApprove={handleApproveBOM} 
              isLoading={loading} 
              warnings={proposal.warnings}
              deviations={proposal.deviations}
            />
          </div>
        )}

        {/* MODO PROCESSANDO */}
        {proposal.status === 'processing' && (
          <Card className="p-10 space-y-8 bg-white border-none shadow-2xl rounded-[3.5rem] overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-slate-100">
               <div className="h-full bg-blue-600 animate-shimmer w-1/3" />
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shadow-sm">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-xl uppercase tracking-tighter">Axiz Brain em Execução</h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest opacity-60">Pipeline Multi-Agente • Orquestração Industrial</p>
              </div>
            </div>

            <PipelineProgressBar
              progress={proposal.progress ?? 0}
              currentStage={proposal.current_stage}
            />
          </Card>
        )}

        {/* MODO EXIBIÇÃO FINAL */}
        {proposal.status === 'completed' && doc && (
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 p-1.5 bg-white rounded-2xl shadow-sm border border-slate-100">
                <button 
                  onClick={() => setViewMode('details')}
                  className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'details' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}
                >
                  Dossiê Técnico
                </button>
                <button 
                  onClick={() => setViewMode('designer')}
                  className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'designer' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-blue-600'}`}
                >
                  Design Studio
                </button>
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  onClick={() => window.location.href = '/axiz/dashboard'}
                  className="px-6 h-12 rounded-xl font-black uppercase tracking-widest text-slate-400"
                >
                  Dashboard
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleExportPDF} 
                  isLoading={isDownloading}
                  className="px-8 h-12 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-blue-200"
                >
                  <Sparkles size={18} className="mr-2" /> Exportar PDF
                </Button>
              </div>
            </div>

            {viewMode === 'designer' ? (
              <TemplateDesigner 
                initialData={{
                  client: proposal.cliente,
                  project: proposal.titulo,
                  valor: formatCurrency(proposal.content?.bom?.resumo_consolidado?.preco_total_final || 0),
                  date: new Date(proposal.created_at).toLocaleDateString('pt-BR')
                }}
                initialDesign={{
                  template_id: proposal.content?.meta?.template_id || 'classic-corporate',
                  colors: proposal.content?.meta?.template_colors || { primary: '#3b82f6', secondary: '#1e293b' }
                }}
                onExport={handleExportPDF}
                onSaveDesign={handleSaveDesign}
              />
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12">
                <div className="pb-10 border-b-2 border-slate-100">
                   <div className="flex items-center gap-4 mb-4">
                      <a href="/axiz/dashboard" className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 shadow-sm transition-all">
                        <ChevronLeft size={24} />
                      </a>
                      <Badge variant="outline" className="font-black text-[10px] uppercase tracking-widest border-blue-200 text-blue-600">ID: {proposal.id.slice(0, 8)}</Badge>
                   </div>
                   <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-tight mb-2 font-display">{proposal.titulo}</h1>
                   <div className="flex items-center gap-4 text-slate-400 font-black text-xs uppercase tracking-widest">
                      <span className="text-blue-600">{proposal.cliente}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span>{new Date(proposal.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                   </div>
                </div>

                {/* ══ 1. RESUMO EXECUTIVO ══════════════════════════════════════════ */}
                <section id="resumo">
                  <SectionHeader title="Resumo Executivo" icon={<Zap size={28} className="text-blue-600" />} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {doc?.resumo_executivo?.investimento_resumo && (
                      <Card className="bg-blue-600 p-8 rounded-[2.5rem] border-none shadow-2xl shadow-blue-200">
                        <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-2">Investimento Estimado</p>
                        <p className="text-3xl font-black text-white uppercase tracking-tighter">{doc.resumo_executivo.investimento_resumo}</p>
                      </Card>
                    )}
                    {doc?.resumo_executivo?.prazo_resumo && (
                      <Card className="bg-slate-900 p-8 rounded-[2.5rem] border-none shadow-2xl shadow-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Prazo de Entrega</p>
                        <p className="text-3xl font-black text-white uppercase tracking-tighter">{doc.resumo_executivo.prazo_resumo}</p>
                      </Card>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {doc?.resumo_executivo?.contexto && (
                      <Card className="p-8 border-none bg-white shadow-sm rounded-3xl">
                        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Contexto Operacional</h4>
                        <p className="text-slate-600 font-medium leading-relaxed">{doc.resumo_executivo.contexto}</p>
                      </Card>
                    )}
                    
                    {doc?.resumo_executivo?.diagnostico_tecnico && (
                      <Card className="border-none bg-slate-900 rounded-[3rem] overflow-hidden p-0 shadow-2xl">
                        <div className="bg-blue-600 text-white p-8 flex items-center gap-4">
                          <Activity size={32} />
                          <div>
                            <h4 className="text-xl font-black uppercase tracking-tighter">Diagnóstico Axiz Expert</h4>
                            <p className="text-xs font-bold text-blue-100 uppercase tracking-widest opacity-80">Análise de Causa Raiz e Impactos</p>
                          </div>
                        </div>
                        <div className="p-10 space-y-10">
                          <div className="p-8 bg-white/5 border border-white/10 rounded-[2rem]">
                            <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <Target size={14} /> Causa Raiz Identificada
                            </h5>
                            <p className="text-white text-lg font-bold leading-relaxed">{doc.resumo_executivo.diagnostico_tecnico.causa_raiz}</p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div>
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Parecer Técnico</h5>
                                <p className="text-slate-300 text-sm font-medium leading-relaxed">{doc.resumo_executivo.diagnostico_tecnico.descricao}</p>
                             </div>
                             <div>
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Matriz de Impactos</h5>
                                <div className="space-y-3">
                                   {doc.resumo_executivo.diagnostico_tecnico.impactos?.map((impacto: any, i: number) => (
                                     <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <span className="text-xs text-white font-bold">{impacto.descricao}</span>
                                        <RiskBadge level={impacto.gravidade} />
                                     </div>
                                   ))}
                                </div>
                             </div>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                </section>

                {/* ══ 2. ROTAS TECNOLÓGICAS ════════════════════════════════════════ */}
                {doc?.alternativas && (
                  <section id="alternativas">
                    <SectionHeader title="Alternativas Tecnológicas" icon={<BarChart3 size={28} className="text-blue-600" />} />
                    <TechnologicalRoutes alternativas={doc.alternativas} />
                  </section>
                )}

                {/* ══ 3. ANÁLISE TÉCNICA ════════════════════════════════════════════ */}
                {doc?.analise_tecnica && (
                  <section id="tecnico">
                    <SectionHeader title="Especificação da Solução" icon={<FileText size={28} className="text-blue-600" />} />
                    <div className="grid grid-cols-1 gap-8">
                      <Card className="p-10 bg-white border-none shadow-sm rounded-[3rem]">
                        <p className="text-slate-600 font-medium text-lg leading-relaxed">{doc.analise_tecnica.descricao_solucao}</p>
                      </Card>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="p-10 bg-white border-none shadow-sm rounded-[3rem]">
                          <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-6">Normas Técnicas de Referência</h4>
                          <div className="flex flex-wrap gap-3">
                            {(doc.analise_tecnica.normas_aplicaveis || []).map((norma: string, i: number) => (
                              <span key={i} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                                {norma}
                              </span>
                            ))}
                          </div>
                        </Card>
                        
                        <Card className="p-10 bg-white border-none shadow-sm rounded-[3rem]">
                          <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-6">Tecnologias Embarcadas</h4>
                          <div className="space-y-4">
                            {(doc.analise_tecnica.tecnologias_utilizadas || []).map((tec: string, i: number) => (
                              <div key={i} className="flex items-center gap-4">
                                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                                <span className="text-slate-700 font-bold text-sm uppercase tracking-tight">{tec}</span>
                              </div>
                            ))}
                          </div>
                        </Card>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

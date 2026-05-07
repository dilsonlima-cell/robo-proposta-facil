import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Trash2, ExternalLink, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { PipelineProgressBar } from '../../components/axiz/PipelineProgressBar';

interface Proposal {
  id: string;
  titulo: string;
  cliente: string;
  status: string;
  created_at: string;
  template_id?: string;
  progress?: number;
  current_stage?: string;
  errors?: string[];
}

export const Dashboard = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProposals();
    
    const interval = setInterval(() => {
      const hasActive = proposals.some(p => p.status === 'processing' || p.status === 'awaiting_approval');
      if (hasActive) {
        fetchProposals();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [proposals.length]);

  const fetchProposals = async () => {
    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: Proposal[] = data.map(p => {
        const formData = (p.form_data as any) || {};
        return {
          id: p.id,
          titulo: p.project_title,
          cliente: p.client_name,
          status: formData.status || 'draft',
          created_at: p.created_at,
          template_id: p.template_used || undefined,
          progress: formData.progress,
          current_stage: formData.current_stage,
          errors: formData.errors
        };
      });

      setProposals(mapped);
    } catch (error) {
      console.error('Erro ao buscar propostas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta proposta?')) return;
    
    try {
      const { error } = await supabase
        .from('proposals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setProposals(prev => prev.filter(p => p.id !== id));
    } catch (error: any) {
      console.error('Falha ao excluir:', error);
      alert('Falha ao excluir proposta: ' + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold border border-green-200">
            <CheckCircle2 size={12} /> Concluída
          </span>
        );
      case 'processing':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 animate-pulse">
            <Clock size={12} /> Processando
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">
            <AlertCircle size={12} /> Falha
          </span>
        );
      case 'awaiting_approval':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold border border-yellow-200">
            <Clock size={12} /> Aprovação pendente
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200">
            Rascunho
          </span>
        );
    }
  };

  const filteredProposals = proposals.filter(p => 
    p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cliente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase font-display">Meus Projetos</h1>
          <p className="text-slate-500 font-medium">Gerencie suas propostas técnicas geradas pelo Axiz Brain.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Buscar projetos..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all w-64 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <a href="/axiz/new" className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 hover:scale-105 transition-all shadow-lg shadow-blue-200">
            <Plus size={18} /> Novo Projeto
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-3xl bg-white animate-pulse border border-slate-100 shadow-sm" />
            ))}
          </div>
        ) : filteredProposals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProposals.map(proposal => (
              <div key={proposal.id} className="group relative overflow-hidden bg-white rounded-3xl border border-slate-100 hover:border-blue-200 transition-all hover:shadow-2xl hover:shadow-blue-900/5 flex flex-col">
                <div className="h-1.5 w-full bg-blue-600 opacity-10 group-hover:opacity-100 transition-opacity" />
                
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
                      <FileText size={24} />
                    </div>
                    {getStatusBadge(proposal.status)}
                  </div>

                  {proposal.status === 'processing' && proposal.progress !== undefined && (
                    <div className="mb-6">
                      <PipelineProgressBar 
                        progress={proposal.progress} 
                        currentStage={proposal.current_stage} 
                      />
                    </div>
                  )}

                  {proposal.status === 'failed' && proposal.errors && proposal.errors.length > 0 && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl">
                      <div className="flex items-center gap-2 text-red-600 font-black text-[10px] uppercase mb-1">
                        <AlertCircle size={10} /> Falha no Pipeline {proposal.current_stage ? `(${proposal.current_stage})` : ''}
                      </div>
                      <p className="text-[10px] text-red-600/80 line-clamp-2 leading-tight font-medium">
                        {proposal.errors[0]}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2 mb-8">
                    {proposal.current_stage && proposal.status === 'processing' && (
                        <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest">{proposal.current_stage}</p>
                    )}
                    <h3 className="text-xl font-black text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-tight">
                      {proposal.titulo}
                    </h3>
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px]">Cliente</span>
                      {proposal.cliente}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-50 mt-auto">
                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                      {new Date(proposal.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleDelete(proposal.id)}
                        className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                      <a 
                        href={`/axiz/proposal/${proposal.id}`}
                        className="p-2.5 bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all shadow-sm"
                        title="Abrir Proposta"
                      >
                        <ExternalLink size={18} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 shadow-sm">
              <Plus size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Nenhuma proposta encontrada</h3>
              <p className="text-slate-500 font-medium max-w-xs mx-auto">Comece criando seu primeiro dossiê técnico industrial agora mesmo com o Axiz Brain.</p>
            </div>
            <a href="/axiz/new" className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200">
               Criar Nova Proposta
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Card, Button } from './ui';
import { Check, Calculator, AlertCircle, Loader2, ShieldAlert } from 'lucide-react';

interface BOMItem {
  id: string;
  item?: string;
  atividade?: string;
  especificacao?: string;
  profissional?: string;
  qtd?: number;
  horas?: number;
  unidade?: string;
  valor_unitario?: number;
  valor_hora?: number;
  total: number;
}

interface BOMData {
  bom: {
    categoria1_mao_obra_engenharia?: BOMItem[];
    categoria2_materiais_fabricacao?: BOMItem[];
    categoria3_componentes_adquiridos?: BOMItem[];
    categoria4_mao_obra_fabricacao?: BOMItem[];
    categoria5_servicos_terceiros?: BOMItem[];
    categoria6_mao_obra_instalacao?: BOMItem[];
    categoria7_despesas_campo?: BOMItem[];
    resumo_consolidado: {
      subtotal_cat1: number;
      subtotal_cat2: number;
      subtotal_cat3: number;
      subtotal_cat4: number;
      subtotal_cat5: number;
      subtotal_cat6: number;
      subtotal_cat7: number;
      custo_direto_total: number;
      contingencia_percentual: number;
      contingencia_valor: number;
      base_de_custo: number;
      margem_percentual: number;
      margem_valor: number;
      subtotal_antes_impostos: number;
      impostos_percentual: number;
      impostos_valor: number;
      preco_total_final: number;
      preco_total_formatado: string;
    };
  };
}

interface Props {
  data: BOMData;
  onApprove: (finalBom: any, imposto: number) => void;
  isLoading: boolean;
  warnings?: string[];
  deviations?: any[];
}

const DiagnosticPanel = ({ warnings, deviations }: { warnings?: string[], deviations?: any[] }) => {
  if (!warnings?.length && !deviations?.length) return null;

  return (
    <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 mb-10 shadow-sm animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-200">
          <ShieldAlert size={24} />
        </div>
        <div>
          <h3 className="text-xl font-display font-black text-amber-900">Análise do Consultor (Insights de IA)</h3>
          <p className="text-xs text-amber-700 font-bold uppercase tracking-widest">Auditoria Técnica Automática</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {deviations && deviations.length > 0 && (
          <div className="space-y-4">
            <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest opacity-60">Filtros de Benchmark Industrial</p>
            {deviations.map((d, i) => (
              <div key={i} className={`p-4 rounded-2xl border flex gap-3 shadow-sm ${
                d.severity === 'critico' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white/80 border-amber-200 text-amber-800'
              }`}>
                <div className="mt-0.5 shrink-0">
                   {d.severity === 'critico' ? <AlertCircle size={18} className="text-red-500" /> : <ShieldAlert size={18} className="text-amber-500" />}
                </div>
                <div className="text-xs leading-relaxed">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black uppercase tracking-tighter text-[10px]">{d.param}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase ${d.severity === 'critico' ? 'bg-red-200 text-red-700' : 'bg-amber-200 text-amber-700'}`}>
                        {d.severity}
                    </span>
                  </div>
                  <p className="font-medium">{d.message}</p>
                  {d.justification && (
                    <div className="mt-2 pl-3 border-l-2 border-amber-300 py-1 opacity-80 italic text-[11px]">
                        "{d.justification}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {warnings && warnings.length > 0 && (
          <div className="space-y-4">
            <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest opacity-60">Observações de Conformidade</p>
            <div className="bg-white/60 rounded-2xl p-5 border border-amber-200 space-y-3">
              {warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-3 text-[11px] text-amber-900 leading-relaxed font-medium">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const BOMReviewTable: React.FC<Props> = ({ data, onApprove, isLoading, warnings, deviations }) => {
  const bomRoot = data?.bom;
  const rc = bomRoot?.resumo_consolidado;

  const initialTaxRate = rc?.impostos_percentual ?? 9.25;
  const [taxRate, setTaxRate] = useState(initialTaxRate);

  if (!rc) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center space-y-6 min-h-[400px] border-dashed border-2">
        <div className="p-4 bg-secondary/10 rounded-full animate-pulse">
          <Loader2 className="w-10 h-10 text-secondary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-primary">Sincronizando Cálculos Industriais...</h3>
          <p className="text-sm text-on-surface-variant max-w-md">
            Estamos processando os dados de alta fidelidade. Se esta tela persistir por mais de 30 segundos, pode ter ocorrido uma falha na comunicação com os especialistas de IA.
          </p>
        </div>
        <Button 
          variant="ghost" 
          onClick={() => window.location.href = '/axiz/novo-projeto'}
          leftIcon={<AlertCircle size={18} />}
        >
          Reiniciar Geração
        </Button>
      </Card>
    );
  }

  const updatedImpostosValor = (rc?.subtotal_antes_impostos ?? 0) * (taxRate / 100);
  const updatedTotalFinal = (rc?.subtotal_antes_impostos ?? 0) + updatedImpostosValor;

  const categories = [
    { name: '1. Mão de Obra Engenharia', items: bomRoot?.categoria1_mao_obra_engenharia, subtotal: rc?.subtotal_cat1 },
    { name: '2. Matéria-Prima / Fabricação', items: bomRoot?.categoria2_materiais_fabricacao, subtotal: rc?.subtotal_cat2 },
    { name: '3. Componentes Adquiridos', items: bomRoot?.categoria3_componentes_adquiridos, subtotal: rc?.subtotal_cat3 },
    { name: '4. Mão de Obra Fabricação', items: bomRoot?.categoria4_mao_obra_fabricacao, subtotal: rc?.subtotal_cat4 },
    { name: '5. Serviços de Terceiros', items: bomRoot?.categoria5_servicos_terceiros, subtotal: rc?.subtotal_cat5 },
    { name: '6. Mão de Obra Instalação', items: bomRoot?.categoria6_mao_obra_instalacao, subtotal: rc?.subtotal_cat6 },
    { name: '7. Despesas de Campo', items: bomRoot?.categoria7_despesas_campo, subtotal: rc?.subtotal_cat7 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <DiagnosticPanel warnings={warnings} deviations={deviations} />

      <div className="flex items-center justify-between">
        <div className="text-left">
          <h2 className="text-2xl font-display font-bold text-primary">Revisão de Custos e BOM</h2>
          <p className="text-on-surface-variant">Valide os cálculos da IA antes de gerar o dossiê final.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-secondary/10 px-4 py-2 rounded-xl flex items-center gap-2 border border-secondary/20">
            <Calculator className="w-4 h-4 text-secondary" />
            <span className="text-sm font-bold text-secondary">Aritmética Industrial V0.13</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
          {categories.map((cat, idx) => (
            <Card key={idx} className="p-0 overflow-hidden border-outline/50">
              <div className="bg-background px-4 py-3 flex justify-between items-center border-b border-outline/30">
                <h3 className="font-bold text-sm text-primary uppercase tracking-wider">{cat.name}</h3>
                <span className="font-display font-bold text-secondary">
                  R$ {(cat.subtotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-0">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-variant/30 text-on-surface-variant">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Descrição</th>
                      <th className="px-4 py-2 font-semibold text-right">Qtd/Hrs</th>
                      <th className="px-4 py-2 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/10">
                    {cat.items?.map((item, i) => (
                      <tr key={i} className="hover:bg-secondary/5 transition-colors">
                        <td className="px-4 py-2 text-on-surface font-medium">{item.item || item.atividade}</td>
                        <td className="px-4 py-2 text-right text-on-surface-variant">{item.qtd || item.horas}</td>
                        <td className="px-4 py-2 text-right font-semibold">R$ {(item.total ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card className="bg-primary text-white border-none shadow-xl shadow-primary/20 sticky top-0">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Calculator className="w-5 h-5 opacity-80" />
              Resumo Consolidado
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm opacity-90">
                <span>Custo Direto Total</span>
                <span className="font-mono">R$ {(rc?.custo_direto_total ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm opacity-90">
                <span>Contingência ({(rc?.contingencia_percentual ?? 5)}%)</span>
                <span className="font-mono">R$ {(rc?.contingencia_valor ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="pt-2 border-t border-white/20 flex justify-between font-bold">
                <span>Base de Custo</span>
                <span className="font-mono">R$ {(rc?.base_de_custo ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm opacity-90">
                <span>Margem Bruta ({(rc?.margem_percentual ?? 15)}%)</span>
                <span className="font-mono">R$ {(rc?.margem_valor ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div className="pt-4 border-t border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase opacity-80">Imposto Configurável (%)</label>
                  <div className="w-24">
                    <input 
                      type="number"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-right text-sm outline-none focus:bg-white/20 transition-all"
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm opacity-90">
                  <span>Valor Impostos</span>
                  <span className="font-mono">R$ {(updatedImpostosValor ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="pt-6 border-t border-white/30">
                <div className="text-xs uppercase opacity-70 mb-1">Preço Total de Venda</div>
                <div className="text-3xl font-display font-bold">
                  R$ {(updatedTotalFinal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <Button 
              variant="secondary" 
              className="w-full mt-8 shadow-lg shadow-black/20"
              onClick={() => onApprove(data.bom, taxRate)}
              isLoading={isLoading}
              leftIcon={<Check size={20} />}
            >
              Aprovar e Gerar Dossiê
            </Button>
            
            <p className="text-[10px] text-center mt-4 opacity-60 leading-tight">
              Ao aprovar, o sistema irá renderizar as 15 seções do dossiê técnico industrial com base nestes valores.
            </p>
          </Card>

          <div className="bg-secondary/5 border border-secondary/20 p-4 rounded-2xl flex gap-3">
            <AlertCircle className="w-5 h-5 text-secondary shrink-0" />
            <p className="text-xs text-on-surface-variant leading-relaxed">
              <span className="font-bold text-secondary">Atenção:</span> A engine Axiz aplica arredondamentos automáticos para garantir conformidade com normas contábeis brasileiras.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

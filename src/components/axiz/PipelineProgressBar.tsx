import React from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface PipelineProgressBarProps {
  progress: number;
  currentStage?: string;
}

const STAGES = [
  { id: 'dominio',      label: 'Domínio',     threshold: 5,  color: 'bg-violet-500' },
  { id: 'skills',       label: 'Skills',      threshold: 8,  color: 'bg-violet-500' },
  { id: 'perfil',       label: 'Perfil',      threshold: 13, color: 'bg-blue-500' },
  { id: 'diagnostico',  label: 'Diagnóstico', threshold: 18, color: 'bg-blue-500' },
  { id: 'parametros',   label: 'Parâmetros',  threshold: 22, color: 'bg-blue-500' },
  { id: 'alt_basica',   label: 'Alt. Básica', threshold: 26, color: 'bg-cyan-500' },
  { id: 'alt_rec',      label: 'Alt. Rec.',   threshold: 30, color: 'bg-cyan-500' },
  { id: 'alt_premium',  label: 'Alt. Premium',threshold: 35, color: 'bg-cyan-500' },
  { id: 'normas',       label: 'Normas',      threshold: 40, color: 'bg-teal-500' },
  { id: 'escopo',       label: 'Escopo',      threshold: 44, color: 'bg-teal-500' },
  { id: 'riscos',       label: 'Riscos',      threshold: 48, color: 'bg-teal-500' },
  { id: 'bom1',         label: 'BOM 1/3',     threshold: 56, color: 'bg-amber-500' },
  { id: 'bom2',         label: 'BOM 2/3',     threshold: 62, color: 'bg-amber-500' },
  { id: 'bom3',         label: 'BOM 3/3',     threshold: 68, color: 'bg-amber-500' },
  { id: 'roi',          label: 'ROI',         threshold: 74, color: 'bg-orange-500' },
  { id: 'auditoria',    label: 'Auditoria',   threshold: 78, color: 'bg-red-500' },
  { id: 'redacao',      label: 'Redação',     threshold: 92, color: 'bg-emerald-500' },
  { id: 'revisao',      label: 'Revisão',     threshold: 97, color: 'bg-emerald-500' },
  { id: 'finalizar',    label: 'Finalizar',   threshold: 100, color: 'bg-green-500' },
];

function getStageTitle(currentStage?: string): string {
  if (!currentStage) return 'Iniciando orquestração...';
  const s = currentStage.toLowerCase();

  if (s.includes('v0a') || s.includes('domínio') || s.includes('dominio')) return 'Classificando Domínio Técnico...';
  if (s.includes('v0b') || s.includes('skills')) return 'Identificando Skills Necessárias...';
  if (s.includes('e1a') || s.includes('perfil do cliente')) return 'Analisando Perfil do Cliente...';
  if (s.includes('e1b') || s.includes('diagnóstico') || s.includes('dores')) return 'Diagnóstico Profundo de Dores e Riscos...';
  if (s.includes('e1c') || s.includes('parâmetros') || s.includes('parametros') || s.includes('infraestrutura')) return 'Extraindo Parâmetros Técnicos...';
  if (s.includes('e2a') || s.includes('básica') || s.includes('basica')) return 'Projetando Alternativa Básica...';
  if (s.includes('e2b') || s.includes('intermediária') || s.includes('intermediaria')) return 'Projetando Alternativa Intermediária (Recomendada)...';
  if (s.includes('e2c') || s.includes('premium')) return 'Projetando Alternativa Premium e Recomendação...';
  if (s.includes('e3') || s.includes('norma')) return 'Mapeando Normas Técnicas Aplicáveis...';
  if (s.includes('e4') || s.includes('escopo')) return 'Definindo Escopo Técnico do Projeto...';
  if (s.includes('e5') || s.includes('risco')) return 'Analisando Riscos e Mitigações...';
  if (s.includes('e6') || s.includes('pendência') || s.includes('pendencia')) return 'Levantando Pendências e Pré-requisitos...';
  if (s.includes('e7a') || s.includes('mão de obra de engenharia')) return 'Orçando: Engenharia de Projeto (1/6)...';
  if (s.includes('e7b') || s.includes('materiais')) return 'Orçando: Materiais e Componentes (2/6)...';
  if (s.includes('e7c') || s.includes('fabricação') || s.includes('fabricacao')) return 'Orçando: Mão de Obra de Fabricação (3/6)...';
  if (s.includes('e8a') || s.includes('terceiros')) return 'Orçando: Serviços de Terceiros (4/6)...';
  if (s.includes('e8b') || s.includes('instalação') || s.includes('instalacao')) return 'Orçando: Mão de Obra de Instalação (5/6)...';
  if (s.includes('e8c') || s.includes('despesas de campo')) return 'Orçando: Despesas de Campo e Logística (6/6)...';
  if (s.includes('e9a') || s.includes('premissas') || s.includes('benefícios')) return 'Calculando Benefícios e Premissas do ROI...';
  if (s.includes('e9b') || s.includes('payback') || s.includes('vpl')) return 'Projetando Cenários de Payback e VPL...';
  if (s.includes('v1') || s.includes('auditoria')) return 'Auditoria de Qualidade e Integridade...';
  if (s.includes('e10a') || s.includes('resumo executivo')) return 'Redigindo: Resumo Executivo (1/4)...';
  if (s.includes('e10b') || s.includes('análise técnica') || s.includes('analise tecnica')) return 'Redigindo: Análise Técnica (2/4)...';
  if (s.includes('e10c') || s.includes('alternativas') || s.includes('escopo técnico')) return 'Redigindo: Alternativas e Escopo (3/4)...';
  if (s.includes('e10d') || s.includes('termos comerciais')) return 'Redigindo: Termos Comerciais (4/4)...';
  if (s.includes('v2') || s.includes('validando') || s.includes('sanitiz')) return 'Validação Final de Linguagem...';
  if (s.includes('finalizando') || s.includes('aguardando')) return 'Finalizando Dossiê Técnico...';
  return currentStage;
}

function getActiveStageIndex(progress: number): number {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (progress >= STAGES[i].threshold) return i;
  }
  return 0;
}

export const PipelineProgressBar: React.FC<PipelineProgressBarProps> = ({ progress, currentStage }) => {
  const activeStageIndex = getActiveStageIndex(progress);
  const stageTitle = getStageTitle(currentStage);

  return (
    <div className="w-full bg-surface border border-outline rounded-2xl p-6 shadow-sm flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="shrink-0 w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
            <Loader2 className="w-4 h-4 text-secondary animate-spin" />
          </div>
          <p className="text-on-surface font-semibold text-[14px] leading-tight truncate">
            {stageTitle}
          </p>
        </div>
        <span className="shrink-0 text-secondary font-black text-lg tabular-nums">
          {progress}%
        </span>
      </div>

      <div className="h-2.5 w-full bg-outline/30 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-in-out"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #7c3aed, #0ea5e9, #10b981)'
          }}
        />
      </div>

      <div className="flex gap-[3px] w-full">
        {STAGES.map((stage, index) => {
          const isCompleted = index < activeStageIndex;
          const isActive = index === activeStageIndex;
          const isPending = index > activeStageIndex;

          return (
            <div
              key={stage.id}
              title={stage.label}
              className={`
                flex-1 h-1.5 rounded-full transition-all duration-500
                ${isCompleted ? 'bg-secondary opacity-90' : ''}
                ${isActive ? 'bg-secondary/60 animate-pulse' : ''}
                ${isPending ? 'bg-outline/30' : ''}
              `}
            />
          );
        })}
      </div>

      <div className="flex justify-between text-[10px] font-semibold text-on-surface-variant/60 px-0.5">
        <span className={progress >= 5 ? 'text-secondary' : ''}>Diagnóstico</span>
        <span className={progress >= 22 ? 'text-secondary' : ''}>Análise</span>
        <span className={progress >= 35 ? 'text-secondary' : ''}>Engenharia</span>
        <span className={progress >= 62 ? 'text-secondary' : ''}>BOM</span>
        <span className={progress >= 78 ? 'text-secondary' : ''}>Auditoria</span>
        <span className={progress >= 85 ? 'text-secondary' : ''}>Redação</span>
        <span className={progress >= 97 ? 'text-secondary' : ''}>Final</span>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-on-surface-variant/70">
        <CheckCircle2 size={12} className="text-secondary shrink-0" />
        <span>
          {activeStageIndex} de {STAGES.length} etapas concluídas
        </span>
      </div>
    </div>
  );
};

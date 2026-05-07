import { useState, useEffect } from 'react';
import { Check, Info, LayoutGrid, Type, Briefcase, Zap } from 'lucide-react';
import { Card, Badge, Button } from './ui';

interface ProposalTemplate {
  id: string;
  name: string;
  category: 'industrial' | 'tech' | 'corporate' | 'modern';
  tone: 'premium' | 'bold' | 'clean' | 'formal';
  description: string;
  suitable_for: string[];
  tags: string[];
  colors: {
    primary: string;
    accent: string;
    text_light: string;
    text_dark: string;
    cover_style: 'dark' | 'light' | 'split';
  };
}

// Mocked templates data for the selector
const MOCK_TEMPLATES: ProposalTemplate[] = [
  {
    id: 'classic-corporate',
    name: 'Classic Corporate',
    category: 'corporate',
    tone: 'premium',
    description: 'Design formal e estruturado para grandes corporações.',
    suitable_for: ['Indústrias', 'Bancos', 'Governo'],
    tags: ['Sério', 'Estruturado', 'Elegante'],
    colors: {
      primary: '#1e293b',
      accent: '#3b82f6',
      text_light: '#ffffff',
      text_dark: '#1e293b',
      cover_style: 'split'
    }
  },
  {
    id: 'modern-web',
    name: 'Modern Web',
    category: 'tech',
    tone: 'bold',
    description: 'Estética moderna e vibrante para projetos de tecnologia.',
    suitable_for: ['SaaS', 'Agências', 'Startups'],
    tags: ['Vibrante', 'Digital', 'Futurista'],
    colors: {
      primary: '#7c3aed',
      accent: '#0ea5e9',
      text_light: '#ffffff',
      text_dark: '#1e293b',
      cover_style: 'dark'
    }
  },
  {
    id: 'minimalist-gray',
    name: 'Minimalist Gray',
    category: 'modern',
    tone: 'clean',
    description: 'Foco total no conteúdo com design minimalista.',
    suitable_for: ['Consultoria', 'Arquitetura', 'Design'],
    tags: ['Limpo', 'Minimalista', 'Leve'],
    colors: {
      primary: '#334155',
      accent: '#64748b',
      text_light: '#ffffff',
      text_dark: '#334155',
      cover_style: 'light'
    }
  }
];

interface TemplateSelectorProps {
  value: string;
  onChange: (templateId: string) => void;
}

export const TemplateSelector = ({ value, onChange }: TemplateSelectorProps) => {
  const [templates, setTemplates] = useState<ProposalTemplate[]>(MOCK_TEMPLATES);
  const [filter, setFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const categories = [
    { id: 'all', label: 'Todos', icon: LayoutGrid },
    { id: 'industrial', label: 'Industrial', icon: Briefcase },
    { id: 'tech', label: 'Tech', icon: Zap },
    { id: 'corporate', label: 'Corporativo', icon: Type },
    { id: 'modern', label: 'Moderno', icon: LayoutGrid },
  ];

  const filteredTemplates = templates.filter(t => filter === 'all' || t.category === filter);

  if (loading) return <div className="p-12 text-center animate-pulse">Carregando catálogo de templates...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
              ${filter === cat.id ? 'bg-secondary text-white shadow-md' : 'bg-surface border border-outline hover:bg-background'}
            `}
          >
            <cat.icon className="w-4 h-4" />
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => {
          const isSelected = value === template.id;
          return (
            <div
              key={template.id}
              onClick={() => {
                onChange(template.id);
                setExpandedId(template.id);
              }}
              className="cursor-pointer group"
            >
              <Card
                className={`
                  p-0 relative border-2 transition-all
                  ${isSelected ? 'border-secondary ring-1 ring-secondary' : 'border-outline hover:border-on-surface-variant'}
                `}
              >
              <div 
                className="h-32 p-4 flex flex-col justify-end relative overflow-hidden"
                style={{ backgroundColor: template.colors.primary }}
              >
                <div 
                  className="absolute top-0 right-0 w-24 h-full opacity-10"
                  style={{ borderLeft: `20px solid ${template.colors.accent}` }}
                />
                
                <div className="relative z-10">
                  <span className="text-[10px] uppercase tracking-widest opacity-70" style={{ color: template.colors.text_light }}>Template</span>
                  <p className="font-display font-bold leading-tight" style={{ color: template.colors.text_light }}>{template.name}</p>
                </div>

                <div className="absolute top-4 right-4 flex gap-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: template.colors.accent }} />
                  ))}
                </div>
              </div>

              <div className="p-4 bg-surface">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="default" className="text-[10px]">{template.category.toUpperCase()}</Badge>
                  {isSelected && <Check className="w-5 h-5 text-secondary animate-in zoom-in" />}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {template.tags.map(tag => (
                    <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-background rounded text-on-surface-variant">#{tag}</span>
                  ))}
                </div>
              </div>

              {isSelected && (
                <div className="absolute -top-2 -right-2 bg-secondary text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 border-surface">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </Card>
          </div>
          );
        })}
      </div>

      {expandedId && (
        <Card className="bg-surface-variant/50 animate-in slide-in-from-top duration-300">
          {templates.filter(t => t.id === expandedId).map(t => (
            <div key={t.id} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div 
                className="aspect-[3/4] rounded-lg shadow-xl overflow-hidden relative p-8 flex flex-col justify-between"
                style={{ backgroundColor: t.colors.primary }}
              >
                {t.colors.cover_style === 'split' && (
                  <div className="absolute inset-y-0 left-0 w-1/3 bg-black/20" />
                )}
                {t.colors.cover_style === 'light' && (
                  <div className="absolute top-0 inset-x-0 h-4" style={{ backgroundColor: t.colors.accent }} />
                )}
                <div className="relative z-10">
                  <div className="w-12 h-1 bg-secondary mb-4" />
                  <h4 className="text-2xl font-display font-bold" style={{ color: t.colors.text_light }}>{t.name}</h4>
                  <p className="text-sm opacity-80 mt-2" style={{ color: t.colors.text_light }}>Proposta Comercial</p>
                </div>
                <div className="relative z-10 flex gap-4">
                  {[100, 85, 92].map(v => (
                    <div key={v} className="flex flex-col">
                      <span className="text-xl font-bold" style={{ color: t.colors.accent }}>{v}%</span>
                      <span className="text-[8px] uppercase" style={{ color: t.colors.text_light }}>KPI {v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <div>
                  <h4 className="text-lg font-bold text-primary mb-1">{t.name}</h4>
                  <p className="text-sm text-on-surface-variant font-medium">{t.tone.toUpperCase()} — {t.description}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                    <Info className="w-3 h-3" /> Indicado para:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {t.suitable_for.map(item => (
                      <span key={item} className="px-3 py-1 bg-white border border-outline rounded-lg text-xs font-medium">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-outline">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full border border-outline" style={{ backgroundColor: t.colors.primary }} />
                      <span className="text-[8px] mt-1">Capa</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full border border-outline" style={{ backgroundColor: t.colors.accent }} />
                      <span className="text-[8px] mt-1">Destaque</span>
                    </div>
                  </div>
                  <Button variant="secondary" onClick={() => setExpandedId(null)}>Confirmar Estilo</Button>
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

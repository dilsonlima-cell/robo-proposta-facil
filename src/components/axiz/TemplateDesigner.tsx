import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Input } from './ui';
import { 
  Palette, 
  Layout as LayoutIcon, 
  FileEdit, 
  Download, 
  Sparkles,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { TEMPLATES_UI } from '../../data/axiz/templates_ui';

interface Props {
  initialData: {
    client: string;
    project: string;
    valor: string;
    date: string;
    dossieContent?: string;
    id?: string;
    year?: string;
  };
  initialDesign?: {
    template_id: string;
    colors: { primary: string; secondary: string };
  };
  onExport: (templateId: string, colors: { primary: string; secondary: string }) => void;
  onSaveDesign: (templateId: string, colors: { primary: string; secondary: string }) => void;
}

export const TemplateDesigner: React.FC<Props> = ({ initialData, initialDesign, onExport, onSaveDesign }) => {
  const initialIndex = initialDesign 
    ? TEMPLATES_UI.findIndex(t => t.id === initialDesign.template_id)
    : 0;
  
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [primaryColor, setPrimaryColor] = useState(initialDesign?.colors?.primary || '#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState(initialDesign?.colors?.secondary || '#1e293b');
  const [client, setClient] = useState(initialData.client);
  const [project, setProject] = useState(initialData.project);
  const [valor, setValor] = useState(initialData.valor);
  const [date, setDate] = useState(initialData.date);
  
  const previewRef = useRef<HTMLIFrameElement>(null);

  const currentTemplate = TEMPLATES_UI[currentTemplateIndex];

  useEffect(() => {
    updatePreview();
    const timeout = setTimeout(() => {
        onSaveDesign(currentTemplate.id, { primary: primaryColor, secondary: secondaryColor });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [currentTemplateIndex, primaryColor, secondaryColor, client, project, valor, date]);

  const updatePreview = () => {
    if (!previewRef.current) return;
    
    let html = currentTemplate.html;
    html = html.replace(/{{client}}/g, client);
    html = html.replace(/{{project}}/g, project);
    html = html.replace(/{{valor}}/g, valor);
    html = html.replace(/{{date}}/g, date);
    html = html.replace(/{{primary}}/g, primaryColor);
    html = html.replace(/{{secondary}}/g, secondaryColor);
    html = html.replace(/{{id}}/g, (initialData as any).id || '');
    html = html.replace(/{{year}}/g, (initialData as any).year || new Date().getFullYear().toString());
    html = html.replace(/{{content}}/g, initialData.dossieContent || '<div style="padding: 40px; text-align: center; color: #999;">Aguardando geração do conteúdo técnico...</div>');

    const doc = previewRef.current.contentDocument || previewRef.current.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="lg:col-span-4 space-y-6">
        <Card className="p-6 space-y-8 border-2 border-primary/10 shadow-xl bg-surface/50 backdrop-blur-sm">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <LayoutIcon className="text-primary" size={20} />
              <h3 className="font-display font-black text-primary uppercase tracking-tighter">Escolha o Template</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES_UI.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setCurrentTemplateIndex(i)}
                  className={`p-3 text-[10px] font-bold rounded-xl border-2 transition-all ${
                    currentTemplateIndex === i 
                      ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                      : 'border-outline/20 hover:border-primary/50 text-on-surface-variant bg-white'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-outline/10">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="text-primary" size={20} />
              <h3 className="font-display font-black text-primary uppercase tracking-tighter">Identidade Visual</h3>
            </div>
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Primária</label>
                <div className="flex gap-2 p-2 bg-white rounded-xl border-2 border-outline/10">
                  <input 
                    type="color" 
                    value={primaryColor} 
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-none"
                  />
                  <input 
                    type="text" 
                    value={primaryColor} 
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 bg-transparent text-xs font-mono font-bold border-none focus:ring-0"
                  />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Secundária</label>
                <div className="flex gap-2 p-2 bg-white rounded-xl border-2 border-outline/10">
                  <input 
                    type="color" 
                    value={secondaryColor} 
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border-none"
                  />
                  <input 
                    type="text" 
                    value={secondaryColor} 
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 bg-transparent text-xs font-mono font-bold border-none focus:ring-0"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-outline/10 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <FileEdit className="text-primary" size={20} />
              <h3 className="font-display font-black text-primary uppercase tracking-tighter">Dados de Capa</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-on-surface-variant uppercase">Cliente</label>
                <Input value={client} onChange={(e) => setClient(e.target.value)} className="h-10 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-on-surface-variant uppercase">Título do Projeto</label>
                <Input value={project} onChange={(e) => setProject(e.target.value)} className="h-10 text-xs" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] font-black text-on-surface-variant uppercase">Valor</label>
                  <Input value={valor} onChange={(e) => setValor(e.target.value)} className="h-10 text-xs" />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[9px] font-black text-on-surface-variant uppercase">Data</label>
                  <Input value={date} onChange={(e) => setDate(e.target.value)} className="h-10 text-xs" />
                </div>
              </div>
            </div>
          </div>

          <Button 
            className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-lg shadow-green-200 flex items-center justify-center gap-3 transition-transform active:scale-95"
            onClick={() => onExport(currentTemplate.id, { primary: primaryColor, secondary: secondaryColor })}
          >
            <Download size={20} />
            <span className="font-display font-black uppercase tracking-tighter">Gerar PDF de Alta Qualidade</span>
          </Button>
        </Card>
      </div>

      <div className="lg:col-span-8 flex flex-col gap-4">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Live Preview · Escala 1:1</span>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-surface rounded-lg text-primary transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button className="p-2 hover:bg-surface rounded-lg text-primary transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-surface border-4 border-outline/10 rounded-[2.5rem] p-8 shadow-2xl shadow-primary/5 min-h-[600px] relative overflow-hidden group">
          <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] -z-10" />
          <iframe 
            ref={previewRef}
            className="w-full h-full border-none rounded-2xl shadow-2xl shadow-black/20 bg-white"
            title="Proposal Preview"
          />
          <div className="absolute top-12 right-12 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
             <div className="bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-white/50 shadow-xl flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                  <Sparkles size={16} />
                </div>
                <span className="text-[10px] font-black text-primary uppercase">Design Pixel Perfect</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

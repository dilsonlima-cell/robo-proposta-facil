import { useState, useRef, useEffect } from "react";
import { TEMPLATES, renderTemplate, type ProposalData } from "@/lib/premiumTemplates";
import { exportPremiumPDF } from "@/lib/premiumPdfExport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Palette, Loader2 } from "lucide-react";

interface TemplatePickerProps {
  proposalContent: string;
  formData: {
    clientName?: string;
    projectTitle?: string;
    proposalVersion?: string;
    initialObjective?: string;
    companyName?: string;
    validadeDias?: string;
    representanteName?: string;
    representanteCargo?: string;
    clientRepName?: string;
    clientRepCargo?: string;
  };
}

const TemplatePicker = ({ proposalContent, formData }: TemplatePickerProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState("classic");
  const [primaryColor, setPrimaryColor] = useState("#1a3a5c");
  const [secondaryColor, setSecondaryColor] = useState("#3B82F6");
  const [isExporting, setIsExporting] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const updatePreview = () => {
    if (!iframeRef.current) return;
    const data: ProposalData = {
      client: formData.clientName || "Cliente",
      project: formData.projectTitle || "Projeto",
      value: "Conforme proposta",
      date: new Date().toLocaleDateString("pt-BR"),
      company: "Leve Brisa",
      version: formData.proposalVersion || "Normal",
      docNumber: `PROP-${Date.now().toString().slice(-6)}`,
      content: proposalContent,
    };
    const html = renderTemplate(selectedTemplate, data, primaryColor, secondaryColor);
    const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:0;background:white;}</style></head><body>${html}</body></html>`);
      doc.close();
    }
  };

  useEffect(() => {
    updatePreview();
  }, [selectedTemplate, primaryColor, secondaryColor, proposalContent]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportPremiumPDF(proposalContent, selectedTemplate, primaryColor, secondaryColor, formData);
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const template = TEMPLATES.find((t) => t.id === selectedTemplate) || TEMPLATES[0];

  return (
    <div className="mt-6 space-y-4">
      {/* Template selector */}
      <div className="flex flex-wrap gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTemplate(t.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
              selectedTemplate === t.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Color customization */}
      <div className="flex flex-wrap items-end gap-4 p-3 rounded-lg bg-muted/30 border border-border">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <Label className="text-xs text-muted-foreground">Primária</Label>
          <Input
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="w-10 h-8 p-0.5 cursor-pointer"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Secundária</Label>
          <Input
            type="color"
            value={secondaryColor}
            onChange={(e) => setSecondaryColor(e.target.value)}
            className="w-10 h-8 p-0.5 cursor-pointer"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {template.description} · {template.orientation === "landscape" ? "Paisagem" : "Retrato"}
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-xl border border-border bg-muted/20 p-3 overflow-hidden">
        <div className="text-xs text-muted-foreground mb-2">🔍 Pré-visualização · {template.name}</div>
        <iframe
          ref={iframeRef}
          className="w-full rounded-lg bg-white shadow-inner"
          style={{ height: "500px", border: "none" }}
          title="Preview"
        />
      </div>

      {/* Export button */}
      <Button
        onClick={handleExportPDF}
        size="lg"
        className="w-full font-heading text-base"
        disabled={isExporting}
      >
        {isExporting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Gerando PDF...
          </>
        ) : (
          <>
            <Download className="mr-2 h-5 w-5" />
            Exportar PDF Premium · {template.name}
          </>
        )}
      </Button>
    </div>
  );
};

export default TemplatePicker;

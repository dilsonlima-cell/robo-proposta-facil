import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileCheck } from "lucide-react";
import { generatePDF } from "@/lib/pdfGenerator";

interface ProposalResultProps {
  content: string;
}

const ProposalResult = ({ content }: ProposalResultProps) => {
  const sections = content.split(/\n(?=\d+\.\s|#{1,3}\s)/).filter(Boolean);

  const handleDownload = () => {
    generatePDF(content);
  };

  return (
    <Card className="border-border/60 shadow-lg mt-8">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileCheck className="h-6 w-6 text-primary" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-foreground">
            Proposta Técnica Gerada
          </h2>
        </div>

        <div className="prose prose-sm max-w-none text-foreground/90 font-body space-y-4">
          {content.split("\n").map((line, i) => {
            if (/^#{1,3}\s/.test(line) || /^\d+\.\s[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]+$/.test(line.trim())) {
              return (
                <h3 key={i} className="font-heading text-lg font-semibold text-foreground mt-6 mb-2 border-l-4 border-primary pl-3">
                  {line.replace(/^#{1,3}\s/, "").replace(/^\d+\.\s/, "")}
                </h3>
              );
            }
            if (line.trim() === "") return <br key={i} />;
            if (line.startsWith("- ") || line.startsWith("• ")) {
              return (
                <p key={i} className="ml-4 text-foreground/80 leading-relaxed">
                  <span className="text-primary mr-2">▸</span>
                  {line.replace(/^[-•]\s/, "")}
                </p>
              );
            }
            return <p key={i} className="text-foreground/80 leading-relaxed">{line}</p>;
          })}
        </div>

        <div className="mt-8 pt-4 border-t border-border">
          <Button onClick={handleDownload} size="lg" className="w-full font-heading text-base">
            <Download className="mr-2 h-5 w-5" />
            Baixar PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProposalResult;

import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileCheck, Pencil, PencilOff, History, X, Upload } from "lucide-react";
import { generatePDF } from "@/lib/pdfGenerator";

interface Version {
  id: number;
  content: string;
  timestamp: string;
  versionType: "initial" | "generated" | "edited" | "manual";
  title: string;
}

interface ProposalResultProps {
  content: string;
}

const getProposalId = () => {
  let id = localStorage.getItem("current_proposal_id");
  if (!id) {
    id = "prop_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("current_proposal_id", id);
  }
  return id;
};

const ProposalResult = ({ content }: ProposalResultProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [versions, setVersions] = useState<Version[]>([]);
  const [currentHtml, setCurrentHtml] = useState(content);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const safeSetItem = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // Quota exceeded – clear old proposals and retry
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("proposal_") && !k.includes(getProposalId())) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      try {
        localStorage.setItem(key, value);
      } catch {
        // Still failing – skip storage
        console.warn("localStorage quota exceeded, skipping save");
      }
    }
  };

  // Save initial version on first render
  useEffect(() => {
    setCurrentHtml(content);
    const proposalId = getProposalId();
    const versionsKey = `proposal_${proposalId}_versions`;
    const existing = JSON.parse(localStorage.getItem(versionsKey) || "[]");
    const newVersion: Version = {
      id: Date.now(),
      content,
      timestamp: new Date().toISOString(),
      versionType: "generated",
      title: `Gerada ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`,
    };
    existing.unshift(newVersion);
    if (existing.length > 5) existing.splice(5);
    safeSetItem(versionsKey, JSON.stringify(existing));
    setVersions(existing);
  }, [content]);

  const saveCurrentState = useCallback(() => {
    if (!contentRef.current) return;
    const html = contentRef.current.innerHTML;
    setCurrentHtml(html);
    const proposalId = getProposalId();
    localStorage.setItem(
      `proposal_${proposalId}_edited`,
      JSON.stringify({ content: html, timestamp: new Date().toISOString(), edited: true })
    );
  }, []);

  const saveVersion = useCallback((type: Version["versionType"] = "edited") => {
    if (!contentRef.current) return;
    const html = contentRef.current.innerHTML;
    const proposalId = getProposalId();
    const versionsKey = `proposal_${proposalId}_versions`;
    const existing: Version[] = JSON.parse(localStorage.getItem(versionsKey) || "[]");
    const newVersion: Version = {
      id: Date.now(),
      content: html,
      timestamp: new Date().toISOString(),
      versionType: type,
      title: `${type === "edited" ? "Editada" : "Manual"} ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`,
    };
    existing.unshift(newVersion);
    if (existing.length > 10) existing.splice(10);
    localStorage.setItem(versionsKey, JSON.stringify(existing));
    setVersions(existing);
  }, []);

  const loadVersion = (v: Version) => {
    setCurrentHtml(v.content);
    if (contentRef.current) contentRef.current.innerHTML = v.content;
    setShowHistory(false);
  };

  const handleInput = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveCurrentState(), 1000);
  };

  const toggleEdit = () => {
    if (isEditing) {
      saveVersion("edited");
    }
    setIsEditing(!isEditing);
  };

  const handleDownload = () => {
    const el = contentRef.current;
    if (el) generatePDF(el.innerText);
  };

  const handleImageUpload = (blockId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const imgContainer = document.querySelector(`[data-image-block="${blockId}"]`);
        if (imgContainer) {
          const existingImg = imgContainer.querySelector("img");
          if (existingImg) {
            existingImg.src = ev.target?.result as string;
          } else {
            const img = document.createElement("img");
            img.src = ev.target?.result as string;
            img.className = "w-full max-h-80 object-contain rounded-lg my-2";
            img.alt = blockId;
            imgContainer.querySelector(".image-placeholder")?.replaceWith(img);
          }
          saveCurrentState();
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // Process HTML content: convert image blocks to interactive placeholders
  const processContent = (html: string) => {
    return html.replace(
      /<<IMAGEM:(\w+)>>/g,
      (_, name) =>
        `<div data-image-block="${name}" class="image-block-wrapper"><div class="image-placeholder" data-name="${name}"><span class="image-placeholder-icon">🖼</span><span>Clique para inserir imagem: ${name}</span></div></div>`
    );
  };

  useEffect(() => {
    if (!contentRef.current) return;
    // Add click handlers for image placeholders
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const placeholder = target.closest(".image-placeholder");
      if (placeholder) {
        const name = placeholder.getAttribute("data-name");
        if (name) handleImageUpload(name);
      }
    };
    const el = contentRef.current;
    el.addEventListener("click", handleClick);
    return () => el.removeEventListener("click", handleClick);
  });

  return (
    <>
      <Card className="border-border/60 shadow-lg mt-8">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileCheck className="h-6 w-6 text-primary" />
            </div>
            <h2 className="font-heading text-xl font-semibold text-foreground flex-1">
              Proposta Técnica Gerada
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={toggleEdit}>
                {isEditing ? <PencilOff className="h-4 w-4 mr-1" /> : <Pencil className="h-4 w-4 mr-1" />}
                {isEditing ? "Finalizar" : "Editar"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
                <History className="h-4 w-4 mr-1" />
                Versões ({versions.length})
              </Button>
            </div>
          </div>

          <div
            ref={contentRef}
            className={`proposal-content ${isEditing ? "proposal-editing" : ""}`}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onInput={handleInput}
            dangerouslySetInnerHTML={{ __html: processContent(currentHtml) }}
          />

          <div className="mt-8 pt-4 border-t border-border flex gap-3">
            <Button onClick={handleDownload} size="lg" className="flex-1 font-heading text-base">
              <Download className="mr-2 h-5 w-5" />
              Baixar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Version History Sidebar */}
      {showHistory && (
        <div className="fixed right-0 top-0 w-80 h-screen bg-card border-l border-border shadow-xl z-50 overflow-y-auto">
          <div className="p-4 bg-primary text-primary-foreground flex justify-between items-center">
            <span className="font-heading font-semibold">Histórico de Versões</span>
            <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary/80" onClick={() => setShowHistory(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="divide-y divide-border">
            {versions.map((v, i) => (
              <button
                key={v.id}
                onClick={() => loadVersion(v)}
                className={`w-full text-left p-3 hover:bg-accent transition-colors ${i === 0 ? "bg-accent/50 border-l-4 border-primary" : ""}`}
              >
                <div className="font-medium text-foreground text-sm">{v.title}</div>
                <div className="text-xs text-muted-foreground mt-1 capitalize">{v.versionType}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(v.timestamp).toLocaleString("pt-BR")}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ProposalResult;

import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileCheck, Pencil, PencilOff } from "lucide-react";
import TemplatePicker from "@/components/TemplatePicker";

interface ProposalResultProps {
  content: string;
  onContentChange?: (content: string) => void;
  formData?: {
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

const ProposalResult = ({ content, formData, onContentChange }: ProposalResultProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentHtml, setCurrentHtml] = useState(content);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setCurrentHtml(content);
  }, [content]);

  const saveCurrentState = useCallback(() => {
    if (!contentRef.current) return;
    const html = contentRef.current.innerHTML;
    setCurrentHtml(html);
    onContentChange?.(html);
  }, [onContentChange]);

  const handleInput = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveCurrentState(), 1000);
  };

  const toggleEdit = () => {
    if (isEditing) saveCurrentState();
    setIsEditing(!isEditing);
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

  const processContent = (html: unknown) => {
    const str = typeof html === 'string' ? html : (html == null ? '' : String(html));
    return str.replace(
      /<<IMAGEM:([^>]+)>>/g,
      (_, name) =>
        `<div data-image-block="${name}" class="image-block-wrapper"><div class="image-placeholder" data-name="${name}"><span class="image-placeholder-icon">🖼</span><span>Clique para inserir imagem: ${name}</span></div></div>`
    );
  };

  useEffect(() => {
    if (!contentRef.current) return;
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
            <Button variant="outline" size="sm" onClick={toggleEdit}>
              {isEditing ? <PencilOff className="h-4 w-4 mr-1" /> : <Pencil className="h-4 w-4 mr-1" />}
              {isEditing ? "Finalizar" : "Editar"}
            </Button>
          </div>

          <div
            ref={contentRef}
            className={`proposal-content ${isEditing ? "proposal-editing" : ""}`}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onInput={handleInput}
            dangerouslySetInnerHTML={{ __html: processContent(currentHtml) }}
          />

          {/* Premium Template Picker & PDF Export */}
          <TemplatePicker proposalContent={currentHtml} formData={formData || {}} />
        </CardContent>
      </Card>
    </>
  );
};

export default ProposalResult;

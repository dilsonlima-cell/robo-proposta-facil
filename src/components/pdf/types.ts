export interface ProposalCover {
  title: string;
  subtitle: string;
  client: string;
  date: string;
  version: string;
  docNumber: string;
  validity: string;
}

export interface GanttPhase {
  name: string;
  start: number;
  end: number;
  color: string;
}

export interface GanttMilestone {
  week: number;
  label: string;
}

export interface PaybackDataPoint {
  month: number;
  investment: number;
  returnAccumulated: number;
}

export interface RiskItem {
  description: string;
  category: string;
  probability: string;
  impact: string;
  mitigation: string;
  color: string;
}

export interface CostItem {
  item: string;
  value: string;
}

export type SectionType =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "list"; ordered: boolean; items: string[] }
  | {
      type: "highlight";
      variant: "recommendation" | "risk" | "info" | "warning";
      title: string;
      content: string;
    }
  | { type: "gantt"; weeks: number; phases: GanttPhase[]; milestones: GanttMilestone[] }
  | { type: "payback"; capex: number; data: PaybackDataPoint[] }
  | { type: "costSummary"; items: CostItem[]; total: string }
  | { type: "riskMatrix"; risks: RiskItem[] }
  | { type: "cards"; items: { title: string; content: string }[] }
  | { type: "signature" }
  | { type: "pageBreak" }
  | { type: "imagePlaceholder"; name: string; description: string };

export interface ParsedProposal {
  cover: ProposalCover;
  sections: SectionType[];
}

import { create } from 'zustand';

interface ProposalForm {
  briefing: string;
  nivel: 'basico' | 'intermediario' | 'completo';
  persona: 'comercial' | 'tecnico' | 'comprador';
  cliente: string;
  titulo: string;
  template_id: string;
}

interface ProposalState {
  form: ProposalForm;
  currentStep: number;
  isCorrectionMode: boolean;
  setForm: (updates: Partial<ProposalForm>) => void;
  setStep: (step: number) => void;
  resetForm: () => void;
  setCorrectionMode: (active: boolean) => void;
}

const initialForm: ProposalForm = {
  briefing: '',
  nivel: 'intermediario',
  persona: 'tecnico',
  cliente: '',
  titulo: '',
  template_id: 'classic-corporate',
};

export const useProposalStore = create<ProposalState>((set) => ({
  form: initialForm,
  currentStep: 0,
  isCorrectionMode: false,
  setForm: (updates) => set((state) => ({
    form: { ...state.form, ...updates }
  })),
  setStep: (step) => set({ currentStep: step }),
  resetForm: () => set({ form: initialForm, currentStep: 0, isCorrectionMode: false }),
  setCorrectionMode: (active) => set({ isCorrectionMode: active }),
}));

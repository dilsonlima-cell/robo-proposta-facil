
export interface ProposalTemplate {
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

export const TEMPLATES_CATALOG: ProposalTemplate[] = [
  {
    id: 'industrial-premium',
    name: 'Industrial Elite',
    category: 'industrial',
    tone: 'premium',
    description: 'Design técnico com foco em autoridade e precisão industrial.',
    suitable_for: ['Projetos Industriais', 'Sistemas de Automação', 'Equipamentos Pesados'],
    tags: ['Sóbrio', 'Robusto', 'Engenharia'],
    colors: {
      primary: '#0f172a',
      accent: '#0284c7',
      text_light: '#ffffff',
      text_dark: '#1e293b',
      cover_style: 'split'
    }
  },
  {
    id: 'tech-modern',
    name: 'Tech Future',
    category: 'tech',
    tone: 'bold',
    description: 'Visual dinâmico e moderno para soluções tecnológicas de ponta.',
    suitable_for: ['Desenvolvimento Software', 'Soluções de IA', 'Data Centers'],
    tags: ['Vibrante', 'Digital', 'Agile'],
    colors: {
      primary: '#1e1b4b',
      accent: '#818cf8',
      text_light: '#ffffff',
      text_dark: '#1e293b',
      cover_style: 'dark'
    }
  },
  {
    id: 'corporate-clean',
    name: 'Corporate Minimal',
    category: 'corporate',
    tone: 'clean',
    description: 'Elegância e clareza para propostas corporativas de alto nível.',
    suitable_for: ['Consultoria', 'Auditoria financeira', 'Gestão Estratégica'],
    tags: ['Executivo', 'Minimalista', 'Fidúcia'],
    colors: {
      primary: '#ffffff',
      accent: '#0f172a',
      text_light: '#0f172a',
      text_dark: '#1e293b',
      cover_style: 'light'
    }
  }
];

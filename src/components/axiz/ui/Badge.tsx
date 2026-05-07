import React from 'react';

type BadgeVariant = 'rascunho' | 'em_analise' | 'aprovado' | 'erro' | 'default';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge = ({
  children,
  variant = 'default',
  className = '',
}: BadgeProps) => {
  const styles: Record<BadgeVariant, string> = {
    rascunho: 'bg-outline text-on-surface-variant border-outline',
    em_analise: 'bg-warning/20 text-warning border-warning/30',
    aprovado: 'bg-success/20 text-success border-success/30',
    erro: 'bg-error/20 text-error border-error/30',
    default: 'bg-surface-variant text-on-surface-variant border-outline',
  };

  return (
    <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold border ${styles[variant]} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {children}
    </span>
  );
};

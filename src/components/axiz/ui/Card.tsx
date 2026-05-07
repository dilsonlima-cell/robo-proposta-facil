import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = ({
  children,
  className = '',
  hoverable = true,
  padding = 'md',
}: CardProps) => {
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const baseStyles = 'bg-surface rounded-xl border border-outline shadow-premium transition-all duration-300 overflow-hidden';
  const hoverStyles = hoverable ? 'hover:shadow-premium-hover hover:-translate-y-1' : '';

  return (
    <div className={`${baseStyles} ${hoverStyles} ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
};

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

type StatusType = 'success' | 'warning' | 'error' | 'info';

interface StatusIconProps {
  type: StatusType;
  size?: number;
  className?: string;
}

export const StatusIcon = ({ type, size = 24, className = '' }: StatusIconProps) => {
  const icons: Record<StatusType, React.ElementType> = {
    success: CheckCircle2,
    warning: AlertTriangle,
    error: XCircle,
    info: Info,
  };

  const colors: Record<StatusType, string> = {
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
    info: 'text-secondary',
  };

  const Icon = icons[type];

  return <Icon size={size} className={`${colors[type]} ${className}`} />;
};

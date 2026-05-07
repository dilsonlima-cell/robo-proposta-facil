import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: ModalProps) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-primary/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className={`
        relative w-full ${sizes[size]} bg-surface rounded-xl shadow-2xl 
        animate-in fade-in zoom-in duration-300 overflow-hidden
      `}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline">
          <h3 className="text-xl font-display font-semibold text-primary">{title}</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-background transition-colors"
          >
            <X className="w-6 h-6 text-on-surface-variant" />
          </button>
        </div>
        
        <div className="px-6 py-6 max-h-[70vh] overflow-y-auto text-on-surface">
          {children}
        </div>
        
        {footer && (
          <div className="px-6 py-4 border-t border-outline bg-surface-variant flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

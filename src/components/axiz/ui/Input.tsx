import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  description?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, description, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-on-surface">
            {label}
          </label>
        )}
        
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5 bg-white border rounded-xl transition-all duration-200
            placeholder:text-gray-400
            focus:ring-2 focus:ring-secondary/20 focus:border-secondary focus:outline-none
            disabled:bg-background disabled:cursor-not-allowed
            ${error ? 'border-error ring-1 ring-error/50' : 'border-outline hover:border-on-surface-variant'}
            ${className}
          `}
          {...props}
        />
        
        {error && (
          <p className="text-xs font-medium text-error">{error}</p>
        )}
        
        {!error && description && (
          <p className="text-xs text-on-surface-variant">{description}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

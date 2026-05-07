import { Check } from 'lucide-react';

interface StepperProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export const Stepper = ({ steps, currentStep, className = '' }: StepperProps) => {
  return (
    <div className={`w-full py-4 ${className}`}>
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-outline -translate-y-1/2 z-0" />
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-secondary -translate-y-1/2 z-0 transition-all duration-500 ease-in-out" 
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          
          return (
            <div key={step} className="relative z-10 flex flex-col items-center group">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                ${isCompleted ? 'bg-secondary border-secondary text-white' : 
                  isActive ? 'bg-white border-secondary text-secondary shadow-lg shadow-secondary/20 scale-110' : 
                  'bg-white border-outline text-on-surface-variant'}
              `}>
                {isCompleted ? (
                  <Check className="w-5 h-5 font-bold" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              <span className={`
                absolute top-12 whitespace-nowrap text-xs font-semibold uppercase tracking-wider transition-colors
                ${isActive ? 'text-secondary' : isCompleted ? 'text-on-surface' : 'text-on-surface-variant'}
              `}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

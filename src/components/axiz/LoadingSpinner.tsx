
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const LoadingSpinner = ({ size = 'md', label }: LoadingSpinnerProps) => {
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-20 h-20 border-6',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`
        ${sizes[size]} rounded-full border-secondary/20 border-t-secondary 
        animate-spin transition-all duration-300
      `} />
      {label && (
        <p className="text-secondary font-display font-medium animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
};

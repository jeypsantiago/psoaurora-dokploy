import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface PublicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-psa-blue hover:bg-psa-navy text-white',
  secondary: 'border border-psa-blue text-psa-blue hover:bg-psa-blue hover:text-white bg-white dark:bg-black dark:text-blue-300 dark:border-blue-400/60',
  ghost: 'border border-psa-line dark:border-zinc-700 text-slate-700 dark:text-slate-200 hover:text-psa-blue dark:hover:text-blue-300 bg-white dark:bg-black',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3.5 py-2 text-xs sm:text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-7 py-3 text-sm sm:text-base',
};

export const PublicButton: React.FC<PublicButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}) => {
  return (
    <button
      className={`psa-elevate psa-press psa-focus-ring inline-flex items-center justify-center gap-2 rounded-lg font-semibold disabled:opacity-70 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

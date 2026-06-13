import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'google';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-xl text-xs font-semibold font-sans transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/40 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer';
    
    const variants = {
      default: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm border border-slate-900/10',
      outline: 'border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm',
      ghost: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
      link: 'text-blue-600 underline-offset-4 hover:underline p-0 bg-transparent active:scale-100',
      google: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm relative pl-10 pr-4'
    };

    const sizes = {
      sm: 'h-9 px-3 text-[11px] rounded-lg',
      default: 'h-11 px-4 py-2.5',
      lg: 'h-12 px-6 rounded-2xl text-sm',
      icon: 'h-11 w-11'
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

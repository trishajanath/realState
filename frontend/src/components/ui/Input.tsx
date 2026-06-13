import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', error = false, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={`flex w-full rounded-xl border ${
          error ? 'border-red-500 focus-visible:ring-red-500/20' : 'border-slate-200 focus-visible:ring-blue-600/20'
        } bg-white px-3.5 py-2.5 text-xs text-slate-900 font-sans shadow-sm transition-all file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

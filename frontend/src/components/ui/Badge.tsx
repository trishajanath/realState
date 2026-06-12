import React from 'react';

export const Badge: React.FC<React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'secondary' | 'outline' | 'success' | 'destructive' }> = ({
  className = '',
  variant = 'default',
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-slate-100 text-slate-800 border-transparent';
      case 'outline':
        return 'text-slate-700 border-slate-200 bg-transparent';
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/40';
      case 'destructive':
        return 'bg-rose-50 text-rose-700 border-rose-200/40';
      default:
        return 'bg-blue-600 text-white border-transparent';
    }
  };

  return (
    <div
      className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider font-bold transition-colors ${getVariantStyles()} ${className}`}
      {...props}
    />
  );
};

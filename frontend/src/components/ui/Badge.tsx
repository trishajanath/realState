import React from 'react';

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'success' | 'destructive';

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: { backgroundColor: '#1C1C1C', color: '#FFFFFF', border: '1px solid #2A2A2A' },
  secondary: { backgroundColor: '#111111', color: '#A1A1AA', border: '1px solid #1F1F1F' },
  outline: { backgroundColor: 'transparent', color: '#A1A1AA', border: '1px solid #2A2A2A' },
  success: { backgroundColor: '#111111', color: '#FFFFFF', border: '1px solid #2A2A2A' },
  destructive: { backgroundColor: '#111111', color: '#A1A1AA', border: '1px solid #2A2A2A' },
};

export const Badge: React.FC<
  React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }
> = ({ className = '', variant = 'default', style, ...props }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}
    style={{ ...variantStyles[variant], ...style }}
    {...props}
  />
);

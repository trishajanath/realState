import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'google';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  isLoading?: boolean;
}

const variants: Record<string, React.CSSProperties> = {
  default: { backgroundColor: '#FFFFFF', color: '#000000', border: 'none' },
  outline: { backgroundColor: 'transparent', color: '#FFFFFF', border: '1px solid #2A2A2A' },
  ghost: { backgroundColor: 'transparent', color: '#A1A1AA', border: 'none' },
  link: { backgroundColor: 'transparent', color: '#FFFFFF', border: 'none', padding: 0, textDecoration: 'underline' },
  google: { backgroundColor: '#0A0A0A', color: '#FFFFFF', border: '1px solid #2A2A2A' },
};

const sizes: Record<string, React.CSSProperties> = {
  sm: { height: '32px', padding: '0 12px', fontSize: '12px', borderRadius: '6px' },
  default: { height: '40px', padding: '0 16px', fontSize: '14px', borderRadius: '8px' },
  lg: { height: '44px', padding: '0 24px', fontSize: '14px', borderRadius: '8px' },
  icon: { height: '40px', width: '40px', padding: 0, fontSize: '14px', borderRadius: '8px' },
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', isLoading = false, children, disabled, style, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${className}`}
      style={{
        ...variants[variant],
        ...sizes[size],
        ...style,
      }}
      {...props}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
);

Button.displayName = 'Button';

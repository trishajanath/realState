import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', error = false, style, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={`flex w-full text-sm transition-colors outline-none placeholder:text-[#52525B] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{
        height: '40px',
        padding: '0 12px',
        backgroundColor: '#0A0A0A',
        border: `1px solid ${error ? '#71717A' : '#2A2A2A'}`,
        borderRadius: '8px',
        color: '#FFFFFF',
        ...style,
      }}
      onFocus={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '#3F3F46';
        props.onFocus?.(e as any);
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = error ? '#71717A' : '#2A2A2A';
        props.onBlur?.(e as any);
      }}
      {...props}
    />
  )
);

Input.displayName = 'Input';

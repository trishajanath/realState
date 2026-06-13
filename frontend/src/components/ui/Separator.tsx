import React from 'react';

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className = '', orientation = 'horizontal', ...props }, ref) => {
    const hasGrow = className.includes('flex-grow');
    return (
      <div
        ref={ref}
        className={`${hasGrow ? '' : 'shrink-0'} bg-slate-200/80 ${
          orientation === 'horizontal' 
            ? (hasGrow ? 'h-[1px]' : 'h-[1px] w-full') 
            : (hasGrow ? 'w-[1px]' : 'h-full w-[1px]')
        } ${className}`}
        {...props}
      />
    );
  }
);

Separator.displayName = 'Separator';

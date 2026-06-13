import React from 'react';

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className = '', ...props }, ref) => (
    <label
      ref={ref}
      className={`text-[11px] font-bold tracking-wider text-slate-400 font-mono uppercase select-none ${className}`}
      {...props}
    />
  )
);

Label.displayName = 'Label';

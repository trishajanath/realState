import React from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', checked, onCheckedChange, ...props }, ref) => {
    return (
      <div className="flex items-center">
        <input
          type="checkbox"
          ref={ref}
          className="sr-only"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <div
          onClick={() => !props.disabled && onCheckedChange?.(!checked)}
          className={`peer h-4.5 w-4.5 shrink-0 rounded-md border ${
            checked 
              ? 'border-blue-600 bg-blue-600 text-white' 
              : 'border-slate-200 bg-white hover:border-slate-300'
          } flex items-center justify-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-600/40 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        >
          {checked && <Check className="h-3 w-3 stroke-[3px]" />}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

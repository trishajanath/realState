import React from 'react';

export const Command: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white text-slate-950 ${className}`}>
      {children}
    </div>
  );
};

export const CommandInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <div className="flex items-center border-b border-slate-200/60 px-3">
      <input
        ref={ref}
        className={`flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        {...props}
      />
    </div>
  )
);
CommandInput.displayName = 'CommandInput';

export const CommandList: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`max-h-[300px] overflow-y-auto overflow-x-hidden p-1 ${className}`}>
      {children}
    </div>
  );
};

export const CommandEmpty: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="py-6 text-center text-xs text-slate-500">{children}</div>;
};

export const CommandGroup: React.FC<{ heading?: string; children: React.ReactNode; className?: string }> = ({
  heading,
  children,
  className = ''
}) => {
  return (
    <div className={`overflow-hidden p-1 text-slate-950 ${className}`}>
      {heading && (
        <div className="px-2 py-1.5 text-[10px] font-mono tracking-wider uppercase font-bold text-slate-400">
          {heading}
        </div>
      )}
      {children}
    </div>
  );
};

export const CommandItem: React.FC<{
  children: React.ReactNode;
  onSelect?: () => void;
  className?: string;
}> = ({ children, onSelect, className = '' }) => {
  return (
    <div
      onClick={onSelect}
      className={`relative flex cursor-pointer select-none items-center rounded-lg px-2.5 py-2 text-xs font-semibold outline-none hover:bg-slate-50 hover:text-slate-900 transition-colors ${className}`}
    >
      {children}
    </div>
  );
};

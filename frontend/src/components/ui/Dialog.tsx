import React, { createContext, useContext, useState } from 'react';
import { X } from 'lucide-react';

interface DialogContextProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

const DialogContext = createContext<DialogContextProps | null>(null);

export const Dialog: React.FC<{
  open?: boolean;
  onOpenChange?: (val: boolean) => void;
  children: React.ReactNode;
}> = ({ open, onOpenChange, children }) => {
  const [localOpen, setLocalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : localOpen;

  const setIsOpen = (val: boolean) => {
    if (!isControlled) setLocalOpen(val);
    onOpenChange?.(val);
  };

  return (
    <DialogContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </DialogContext.Provider>
  );
};

export const DialogTrigger: React.FC<{ children: React.ReactElement<any>; asChild?: boolean }> = ({ children }) => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('DialogTrigger must be inside Dialog');
  return React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      children.props?.onClick?.(e);
      ctx.setIsOpen(true);
    },
  });
};

export const DialogContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('DialogContent must be inside Dialog');
  if (!ctx.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
        onClick={() => ctx.setIsOpen(false)}
      />
      <div
        className={`relative w-full max-w-lg p-6 rounded-lg z-10 ${className}`}
        style={{ backgroundColor: '#0A0A0A', border: '1px solid #2A2A2A', color: '#FFFFFF' }}
      >
        {children}
        <button
          onClick={() => ctx.setIsOpen(false)}
          className="absolute right-4 top-4 p-1 rounded transition-colors"
          style={{ color: '#71717A' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#FFFFFF'; (e.currentTarget as HTMLElement).style.backgroundColor = '#111111'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#71717A'; (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export const DialogHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`flex flex-col gap-1.5 mb-4 ${className}`}>{children}</div>
);

export const DialogTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h2 className={`text-base font-semibold leading-none ${className}`} style={{ color: '#FFFFFF' }}>{children}</h2>
);

export const DialogDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`text-sm ${className}`} style={{ color: '#71717A' }}>{children}</p>
);

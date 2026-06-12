import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    if (onOpenChange) onOpenChange(val);
  };

  return (
    <DialogContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </DialogContext.Provider>
  );
};

export const DialogTrigger: React.FC<{ children: React.ReactElement<any>; asChild?: boolean }> = ({
  children,
}) => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('DialogTrigger must be used within Dialog');

  const trigger = children as React.ReactElement<any>;

  return React.cloneElement(trigger, {
    onClick: (e: React.MouseEvent) => {
      if (trigger.props && trigger.props.onClick) trigger.props.onClick(e);
      ctx.setIsOpen(true);
    }
  });
};

export const DialogContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('DialogContent must be used within Dialog');

  return (
    <AnimatePresence>
      {ctx.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => ctx.setIsOpen(false)}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className={`relative w-full max-w-lg rounded-2xl border border-slate-200/50 bg-white p-6 shadow-2xl z-10 ${className}`}
          >
            {children}
            <button
              onClick={() => ctx.setIsOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const DialogHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <div className={`flex flex-col space-y-1.5 text-left ${className}`}>{children}</div>
);

export const DialogTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <h2 className={`text-base font-bold font-display leading-none tracking-tight text-slate-900 ${className}`}>{children}</h2>
);

export const DialogDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <p className={`text-xs text-slate-500 font-sans mt-1.5 ${className}`}>{children}</p>
);

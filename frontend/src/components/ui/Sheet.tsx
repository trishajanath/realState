import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface SheetContextProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}

const SheetContext = createContext<SheetContextProps | null>(null);

export const Sheet: React.FC<{
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
    <SheetContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </SheetContext.Provider>
  );
};

export const SheetTrigger: React.FC<{ children: React.ReactElement<any> }> = ({ children }) => {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error('SheetTrigger must be used within Sheet');

  const trigger = children as React.ReactElement<any>;

  return React.cloneElement(trigger, {
    onClick: (e: React.MouseEvent) => {
      if (trigger.props && trigger.props.onClick) trigger.props.onClick(e);
      ctx.setIsOpen(true);
    }
  });
};

export const SheetContent: React.FC<{
  children: React.ReactNode;
  side?: 'left' | 'right';
  className?: string;
}> = ({ children, side = 'left', className = '' }) => {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error('SheetContent must be used within Sheet');

  const animationVariants = {
    left: {
      initial: { x: '-100%' },
      animate: { x: 0 },
      exit: { x: '-100%' }
    },
    right: {
      initial: { x: '100%' },
      animate: { x: 0 },
      exit: { x: '100%' }
    }
  };

  const placementClasses = {
    left: 'left-0 h-full border-r',
    right: 'right-0 h-full border-l'
  };

  return (
    <AnimatePresence>
      {ctx.isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => ctx.setIsOpen(false)}
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
          />

          {/* Slide panel */}
          <motion.div
            variants={animationVariants[side]}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className={`absolute top-0 w-full max-w-sm bg-white p-6 shadow-2xl border-slate-200/60 flex flex-col focus:outline-none ${placementClasses[side]} ${className}`}
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

export const SheetHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <div className={`flex flex-col space-y-2 text-left mb-6 ${className}`}>{children}</div>
);

export const SheetTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <h2 className={`text-base font-bold font-display leading-none tracking-tight text-slate-900 ${className}`}>{children}</h2>
);

export const SheetDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <p className={`text-xs text-slate-500 font-sans ${className}`}>{children}</p>
);

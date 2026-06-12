import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Accordion: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggleItem = (value: string) => {
    setOpenItem(openItem === value ? null : value);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const item = child as React.ReactElement<any>;
          return React.cloneElement(item, {
            isOpen: openItem === item.props.value,
            onToggle: () => toggleItem(item.props.value)
          } as any);
        }
        return child;
      })}
    </div>
  );
};

export const AccordionItem: React.FC<{
  value: string;
  children: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}> = ({ children, isOpen, onToggle, className = '' }) => {
  return (
    <div className={`border-b border-slate-200/60 pb-2 ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            isOpen,
            onToggle
          } as any);
        }
        return child;
      })}
    </div>
  );
};

export const AccordionTrigger: React.FC<{
  children: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}> = ({ children, isOpen, onToggle, className = '' }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center justify-between py-4 text-xs font-semibold text-slate-700 transition-all hover:underline cursor-pointer ${className}`}
    >
      <span>{children}</span>
      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  );
};

export const AccordionContent: React.FC<{
  children: React.ReactNode;
  isOpen?: boolean;
  className?: string;
}> = ({ children, isOpen, className = '' }) => {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className={`pb-4 text-xs text-slate-500 font-sans leading-relaxed ${className}`}>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Select: React.FC<{
  value?: string;
  onValueChange?: (val: string) => void;
  defaultValue?: string;
  children: React.ReactNode;
}> = ({ value, onValueChange, defaultValue, children }) => {
  const [localVal, setLocalVal] = useState(defaultValue || '');
  const [isOpen, setIsOpen] = useState(false);
  const isControlled = value !== undefined;
  const activeVal = isControlled ? value : localVal;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const selectValue = (val: string) => {
    if (!isControlled) setLocalVal(val);
    if (onValueChange) onValueChange(val);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === SelectTrigger) {
            return React.cloneElement(child, {
              isOpen,
              setIsOpen,
              value: activeVal
            } as any);
          }
          if (child.type === SelectContent) {
            return (
              <AnimatePresence>
                {isOpen && React.cloneElement(child, {
                  selectValue,
                  value: activeVal
                } as any)}
              </AnimatePresence>
            );
          }
        }
        return child;
      })}
    </div>
  );
};

export const SelectTrigger: React.FC<{
  children?: React.ReactNode;
  placeholder?: string;
  isOpen?: boolean;
  setIsOpen?: (val: boolean) => void;
  value?: string;
  className?: string;
}> = ({ placeholder = 'Select item...', isOpen, setIsOpen, value, className = '' }) => {
  return (
    <button
      type="button"
      onClick={() => setIsOpen && setIsOpen(!isOpen)}
      className={`flex h-9 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-blue-600/20 focus:border-blue-600 cursor-pointer ${className}`}
    >
      <span>{value || placeholder}</span>
      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
    </button>
  );
};

export const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  return <span>{placeholder}</span>;
};

export const SelectContent: React.FC<{
  children: React.ReactNode;
  selectValue?: (val: string) => void;
  value?: string;
  className?: string;
}> = ({ children, selectValue, value, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15 }}
      className={`absolute top-full left-0 right-0 mt-1.5 z-50 max-h-60 overflow-y-auto rounded-xl border border-slate-200/50 bg-white p-1 shadow-lg ${className}`}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const item = child as React.ReactElement<any>;
          return React.cloneElement(item, {
            onClick: () => selectValue && selectValue(item.props.value),
            isSelected: value === item.props.value
          } as any);
        }
        return child;
      })}
    </motion.div>
  );
};

export const SelectItem: React.FC<{
  value: string;
  children: React.ReactNode;
  onClick?: () => void;
  isSelected?: boolean;
  className?: string;
}> = ({ children, onClick, isSelected, className = '' }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-lg px-3 py-2 text-xs font-semibold flex items-center justify-between cursor-pointer ${
        isSelected
          ? 'bg-blue-50 text-blue-600 font-bold'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      } ${className}`}
    >
      <span>{children}</span>
    </button>
  );
};

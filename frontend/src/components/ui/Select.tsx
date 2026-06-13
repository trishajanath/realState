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

  // Find the friendly display label of the active value from SelectItem children
  let activeLabel = '';
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === SelectContent) {
      React.Children.forEach((child.props as any).children, (item) => {
        if (React.isValidElement(item) && (item.props as any).value === activeVal) {
          activeLabel = (item.props as any).children;
        }
      });
    }
  });

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
              value: activeLabel || activeVal
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
  const hasBg = className.includes('bg-');
  const hasText = className.includes('text-');
  const hasBorder = className.includes('border-');

  const bgClass = hasBg ? '' : 'bg-white';
  const textClass = hasText ? '' : 'text-slate-700';
  const borderClass = hasBorder ? '' : 'border-slate-200';

  return (
    <button
      type="button"
      onClick={() => setIsOpen && setIsOpen(!isOpen)}
      className={`flex h-9 w-full items-center justify-between rounded-xl border shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-blue-600/20 focus:border-blue-600 cursor-pointer px-3 py-2 text-xs font-semibold ${borderClass} ${bgClass} ${textClass} ${className}`}
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
  const hasBg = className.includes('bg-');
  const hasBorder = className.includes('border-');

  const bgClass = hasBg ? '' : 'bg-white';
  const borderClass = hasBorder ? '' : 'border-slate-200/50';
  const isDark = className.includes('bg-slate') || className.includes('bg-gray') || className.includes('bg-zinc') || className.includes('bg-neutral');

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15 }}
      className={`absolute top-full left-0 right-0 mt-1.5 z-50 max-h-60 overflow-y-auto rounded-xl border p-1 shadow-lg ${borderClass} ${bgClass} ${className}`}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const item = child as React.ReactElement<any>;
          return React.cloneElement(item, {
            onClick: () => selectValue && selectValue(item.props.value),
            isSelected: value === item.props.value,
            isDark: isDark
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
  isDark?: boolean;
  className?: string;
}> = ({ children, onClick, isSelected, isDark, className = '' }) => {
  const activeClass = isSelected
    ? (isDark ? 'bg-blue-600/30 text-blue-400 font-bold' : 'bg-blue-50 text-blue-600 font-bold')
    : (isDark ? 'text-slate-300 hover:bg-slate-700/50 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900');

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-lg px-3 py-2 text-xs font-semibold flex items-center justify-between cursor-pointer ${activeClass} ${className}`}
    >
      <span>{children}</span>
    </button>
  );
};

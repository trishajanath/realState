import React, { createContext, useContext, useState } from 'react';
import { motion } from 'framer-motion';

interface TabsContextProps {
  value: string;
  onValueChange: (val: string) => void;
}

const TabsContext = createContext<TabsContextProps | null>(null);

export const Tabs: React.FC<{
  defaultValue: string;
  value?: string;
  onValueChange?: (val: string) => void;
  children: React.ReactNode;
  className?: string;
}> = ({ defaultValue, value: controlledValue, onValueChange, children, className = '' }) => {
  const [localValue, setLocalValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const activeValue = isControlled ? controlledValue : localValue;

  const handleValueChange = (val: string) => {
    if (!isControlled) setLocalValue(val);
    if (onValueChange) onValueChange(val);
  };

  return (
    <TabsContext.Provider value={{ value: activeValue, onValueChange: handleValueChange }}>
      <div className={`w-full ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`inline-flex items-center justify-center rounded-xl bg-slate-100 p-1 text-slate-500 ${className}`}>
      {children}
    </div>
  );
};

export const TabsTrigger: React.FC<{ value: string; children: React.ReactNode; className?: string }> = ({
  value,
  children,
  className = ''
}) => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabsTrigger must be used within Tabs');
  const isActive = ctx.value === value;

  return (
    <button
      type="button"
      onClick={() => ctx.onValueChange(value)}
      className={`relative rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer ${
        isActive ? 'text-slate-950 font-bold' : 'text-slate-500 hover:text-slate-900'
      } ${className}`}
    >
      {isActive && (
        <motion.div
          layoutId="activeTabIndicator"
          className="absolute inset-0 rounded-lg bg-white shadow-sm"
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

export const TabsContent: React.FC<{ value: string; children: React.ReactNode; className?: string }> = ({
  value,
  children,
  className = ''
}) => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabsContent must be used within Tabs');
  if (ctx.value !== value) return null;

  return (
    <div className={`mt-2 focus-visible:outline-none ${className}`}>
      {children}
    </div>
  );
};

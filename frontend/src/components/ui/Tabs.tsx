import React, { createContext, useContext, useState } from 'react';

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

  const handleChange = (val: string) => {
    if (!isControlled) setLocalValue(val);
    onValueChange?.(val);
  };

  return (
    <TabsContext.Provider value={{ value: activeValue, onValueChange: handleChange }}>
      <div className={`w-full ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({
  children,
  className = '',
  style,
}) => (
  <div
    className={`flex gap-0 ${className}`}
    style={{ borderBottom: '1px solid #1F1F1F', ...style }}
  >
    {children}
  </div>
);

export const TabsTrigger: React.FC<{ value: string; children: React.ReactNode; className?: string }> = ({
  value,
  children,
  className = '',
}) => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabsTrigger must be used within Tabs');
  const active = ctx.value === value;

  return (
    <button
      type="button"
      onClick={() => ctx.onValueChange(value)}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${className}`}
      style={{
        color: active ? '#FFFFFF' : '#71717A',
        borderBottom: active ? '1px solid #FFFFFF' : '1px solid transparent',
        marginBottom: '-1px',
        backgroundColor: 'transparent',
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.color = '#A1A1AA';
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.color = '#71717A';
      }}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<{ value: string; children: React.ReactNode; className?: string }> = ({
  value,
  children,
  className = '',
}) => {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabsContent must be used within Tabs');
  if (ctx.value !== value) return null;
  return <div className={`mt-6 ${className}`}>{children}</div>;
};

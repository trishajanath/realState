import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const Popover: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="relative inline-block" ref={containerRef}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === PopoverTrigger) {
            return React.cloneElement(child, {
              isOpen,
              setIsOpen
            } as any);
          }
          if (child.type === PopoverContent) {
            return (
              <AnimatePresence>
                {isOpen && React.cloneElement(child, {
                  isOpen,
                  setIsOpen
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

export const PopoverTrigger: React.FC<{
  children: React.ReactElement<any>;
  isOpen?: boolean;
  setIsOpen?: (val: boolean) => void;
}> = ({ children, isOpen, setIsOpen }) => {
  const trigger = children as React.ReactElement<any>;
  return React.cloneElement(trigger, {
    onClick: (e: React.MouseEvent) => {
      if (trigger.props && trigger.props.onClick) trigger.props.onClick(e);
      if (setIsOpen) setIsOpen(!isOpen);
    }
  });
};

export const PopoverContent: React.FC<{
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}> = ({ children, className = '', align = 'center' }) => {
  const alignClasses = {
    left: 'left-0 origin-top-left',
    right: 'right-0 origin-top-right',
    center: 'left-1/2 -translate-x-1/2 origin-top'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 4 }}
      transition={{ duration: 0.15 }}
      className={`absolute top-full mt-2 z-50 min-w-[200px] rounded-2xl border border-slate-200/50 bg-white p-4 shadow-xl focus:outline-none ${alignClasses[align]} ${className}`}
    >
      {children}
    </motion.div>
  );
};

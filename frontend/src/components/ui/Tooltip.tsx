import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const Tooltip: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  let timeout: number;

  const handleMouseEnter = () => {
    timeout = window.setTimeout(() => {
      setIsOpen(true);
    }, 150);
  };

  const handleMouseLeave = () => {
    window.clearTimeout(timeout);
    setIsOpen(false);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === TooltipTrigger) {
            return child;
          }
          if (child.type === TooltipContent) {
            return <AnimatePresence>{isOpen && child}</AnimatePresence>;
          }
        }
        return child;
      })}
    </div>
  );
};

export const TooltipTrigger: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <span className="cursor-help">{children}</span>;
};

export const TooltipContent: React.FC<{
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ children, className = '', side = 'top' }) => {
  const placementClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2 origin-bottom',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2 origin-top',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2 origin-right',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2 origin-left'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.12 }}
      className={`absolute z-[100] whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-[10px] font-semibold text-white shadow-md ${placementClasses[side]} ${className}`}
    >
      {children}
    </motion.div>
  );
};

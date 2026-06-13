import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export type ToastVariant = 'default' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  title?: string;
  description: string;
  variant?: ToastVariant;
}

interface ToastContextType {
  toast: (title: string, description: string, variant?: ToastVariant) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((title: string, description: string, variant: ToastVariant = 'default') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const icons = {
    default: <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />,
    success: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />,
    error: <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
  };

  const colors = {
    default: 'border-slate-200/80 bg-white/95 text-slate-900',
    success: 'border-emerald-200/80 bg-emerald-50/95 text-slate-900',
    warning: 'border-amber-200/80 bg-amber-50/95 text-slate-900',
    error: 'border-red-200/80 bg-red-50/95 text-slate-900'
  };

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
              layout
              className={`pointer-events-auto border p-4 rounded-2xl shadow-xl flex gap-3 items-start relative overflow-hidden backdrop-blur-md ${colors[t.variant || 'default']}`}
            >
              {icons[t.variant || 'default']}
              <div className="flex-grow space-y-1">
                {t.title && <h5 className="text-xs font-bold font-display leading-tight text-slate-800">{t.title}</h5>}
                <p className="text-[11px] text-slate-500 leading-normal font-sans">{t.description}</p>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100/50 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

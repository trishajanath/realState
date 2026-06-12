import React from 'react';
import { Link } from 'react-router-dom';
import { useCompareStore } from '../../store/useCompareStore';
import { useProperties, useLocalities } from '../../hooks/useApi';
import { PropertyComparisonTable } from '../../components/shared/PropertyComparisonTable';
import { ArrowLeftRight, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mockScores } from '../../services/mockData';

export const ComparePage: React.FC = () => {
  const { selectedIds, removeId, clear } = useCompareStore();
  const { data: properties } = useProperties();
  const { data: localities } = useLocalities();

  const comparedProperties = properties?.filter(p => selectedIds.includes(p.id)) || [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 w-full flex-grow flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200/60 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-display text-slate-900 leading-tight">
            Property Specifications Comparison
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1">COMPARE VALUE METRICS OF UP TO 4 DEVELOPER LISTINGS</p>
        </div>

        {comparedProperties.length > 0 && (
          <button
            onClick={clear}
            className="text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200/30 px-4 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {comparedProperties.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-grow flex flex-col items-center justify-center p-20 text-center"
          >
            <ArrowLeftRight className="h-16 w-16 text-slate-300 stroke-[1.5] mb-4" />
            <h3 className="text-base font-bold text-slate-900 font-display">No properties selected for comparison</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-sm">
              Browse listings on our platform and click "Compare Specs" to view their properties metrics compared side-by-side.
            </p>
            <Link
              to="/"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl mt-6 transition-all shadow-md cursor-pointer"
            >
              Browse Neighborhoods
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6 mt-4"
          >
            {/* Direct compare specifications list */}
            <PropertyComparisonTable 
              properties={comparedProperties}
              localities={localities}
              scores={mockScores}
              onRemove={removeId}
            />

            {/* Quick summary grid of card specs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {comparedProperties.map((prop) => (
                <motion.div 
                  key={prop.id}
                  layout
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white border border-slate-200/80 p-5 rounded-2xl flex flex-col justify-between shadow-sm relative group overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs font-display line-clamp-1">{prop.title}</h4>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">{prop.property_type}</p>
                    </div>
                    <button
                      onClick={() => removeId(prop.id)}
                      className="bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer border border-slate-200/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 mt-4 leading-relaxed font-sans line-clamp-3">
                    {prop.ai_description}
                  </p>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                    <Link
                      to={`/property/${prop.id}`}
                      className="w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 rounded-xl transition-all cursor-pointer"
                    >
                      View Report
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

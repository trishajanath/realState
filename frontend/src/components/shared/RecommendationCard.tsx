import React from 'react';
import { SpotlightCard } from '../react-bits/SpotlightCard';
import { Badge } from '../ui/Badge';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RecommendationItem } from '../../types';

interface RecommendationCardProps {
  item: RecommendationItem;
  className?: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ item, className = '' }) => {
  return (
    <SpotlightCard className={`border border-slate-200/60 p-5 rounded-2xl flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-bold text-slate-900 text-sm font-display">{item.name}</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">{item.city}, {item.state}</p>
          </div>
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 font-mono font-bold">
            Match: {(item.score * 100).toFixed(0)}%
          </Badge>
        </div>

        <p className="text-xs text-slate-600 mt-3 leading-relaxed font-sans">
          {item.reasoning}
        </p>

        {/* Feature contribution tags */}
        <div className="mt-4 pt-3 border-t border-slate-100/50 flex flex-wrap gap-1.5">
          {Object.entries(item.feature_contribution).map(([key, val]) => (
            <span
              key={key}
              className="bg-slate-50 text-slate-500 border border-slate-200/30 rounded-lg text-[9px] px-2 py-0.5 font-mono uppercase font-semibold"
            >
              {key.replace('_', ' ')}: {(val * 100).toFixed(0)}%
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Link
          to={`/locality/${item.id}`}
          className="inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] py-1.5 px-3 rounded-lg transition-all"
        >
          <span>Analyze Profile</span>
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </SpotlightCard>
  );
};

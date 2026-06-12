import React from 'react';
import { Link } from 'react-router-dom';
import type { Locality, LocalityScores, LocalityMetrics } from '../../types';
import { SpotlightCard } from '../react-bits/SpotlightCard';
import { ScoreBadge } from './ScoreBadge';
import { TrendingUp, BarChart } from 'lucide-react';

interface LocalityCardProps {
  locality: Locality;
  scores?: LocalityScores;
  metrics?: LocalityMetrics;
}

export const LocalityCard: React.FC<LocalityCardProps> = ({
  locality,
  scores,
  metrics
}) => {
  const investScore = scores?.investment_score || 75;
  const connectScore = scores?.connectivity_score || 70;

  return (
    <SpotlightCard className="hover:shadow-md transition-shadow">
      <Link to={`/locality/${locality.id}`} className="flex flex-col h-full">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-display">
              {locality.name}
            </h3>
            <p className="text-xs text-slate-500">{locality.city}, {locality.state}</p>
          </div>
          <div className="flex gap-2">
            <ScoreBadge score={investScore} label="Invest" size="sm" />
            <ScoreBadge score={connectScore} label="Conn" size="sm" />
          </div>
        </div>

        {/* Pricing specs summary */}
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-slate-700">
          <div>
            <span className="text-[10px] text-slate-400 font-mono block uppercase">Avg Price/Sqft</span>
            <span className="text-sm font-semibold font-mono text-slate-900">
              {metrics?.median_price_per_sqft ? `${metrics.median_price_per_sqft.toLocaleString()} INR` : '4,200 INR'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono block uppercase">Yield Estimate</span>
            <span className="text-sm font-semibold font-mono text-emerald-600 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              {metrics?.rental_yield_estimate ? `${metrics.rental_yield_estimate}%` : '4.0%'}
            </span>
          </div>
        </div>

        {/* Proximity / indicators footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <BarChart className="h-3.5 w-3.5" />
            {metrics?.property_inventory ? `${metrics.property_inventory} listings` : '120 active properties'}
          </span>
          <span className="text-blue-600 font-semibold hover:underline">
            View Analytics &rarr;
          </span>
        </div>
      </Link>
    </SpotlightCard>
  );
};

import React from 'react';
import { SpotlightCard } from '../react-bits/SpotlightCard';
import { ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/Tooltip';

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  description?: string;
  tooltipText?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  trend,
  description,
  tooltipText,
  className = ''
}) => {
  return (
    <SpotlightCard className={`relative flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{label}</span>
          {tooltipText && (
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-slate-300 hover:text-slate-500 transition-colors" />
              </TooltipTrigger>
              <TooltipContent>{tooltipText}</TooltipContent>
            </Tooltip>
          )}
        </div>
        <span className="text-2xl font-bold font-display text-slate-900 block mt-2">{value}</span>
      </div>

      {(trend || description) && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          {trend ? (
            <span
              className={`text-[10px] font-bold font-mono tracking-wider uppercase flex items-center gap-0.5 ${
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {trend.isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {trend.value}
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-mono">{description}</span>
          )}
        </div>
      )}
    </SpotlightCard>
  );
};

import React from 'react';

interface ScoreBadgeProps {
  score: number;
  label: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  label,
  className = '',
  size = 'md'
}) => {
  const getColors = (val: number) => {
    if (val >= 85) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (val >= 70) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'text-[11px] px-2 py-0.5';
      case 'lg': return 'text-sm px-3.5 py-1.5';
      default: return 'text-xs px-2.5 py-1';
    }
  };

  return (
    <div className={`inline-flex flex-col items-center justify-center rounded-xl border text-center font-medium ${getColors(score)} ${getSizeClasses()} ${className}`}>
      <span className="opacity-80 text-[10px] uppercase tracking-wider font-mono">{label}</span>
      <span className="font-display font-bold text-lg mt-0.5">{score.toFixed(1)}</span>
    </div>
  );
};

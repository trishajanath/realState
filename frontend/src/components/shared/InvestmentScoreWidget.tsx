import React from 'react';
import { CountUp } from '../react-bits/CountUp';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Shield, MapPin, GraduationCap, Utensils, Star } from 'lucide-react';

interface InvestmentScoreWidgetProps {
  investmentScore: number;
  safetyScore: number;
  connectivityScore: number;
  lifestyleScore: number;
  educationScore: number;
  className?: string;
}

export const InvestmentScoreWidget: React.FC<InvestmentScoreWidgetProps> = ({
  investmentScore,
  safetyScore,
  connectivityScore,
  lifestyleScore,
  educationScore,
  className = ''
}) => {
  const scores = [
    { name: 'Investment Index', val: investmentScore, icon: Star, color: 'text-amber-500 bg-amber-50 border-amber-100' },
    { name: 'Safety Rating', val: safetyScore, icon: Shield, color: 'text-emerald-500 bg-emerald-50 border-emerald-100' },
    { name: 'Transit & Connectivity', val: connectivityScore, icon: MapPin, color: 'text-blue-500 bg-blue-50 border-blue-100' },
    { name: 'Lifestyle & Amenity', val: lifestyleScore, icon: Utensils, color: 'text-rose-500 bg-rose-50 border-rose-100' },
    { name: 'Education Standard', val: educationScore, icon: GraduationCap, color: 'text-indigo-500 bg-indigo-50 border-indigo-100' }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Neighborhood Vital Scores</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {scores.map((score, index) => {
          const Icon = score.icon;
          return (
            <div key={index} className="flex flex-col space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center border ${score.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{score.name}</span>
                </div>
                <CountUp
                  to={score.val}
                  decimals={1}
                  suffix="%"
                  className="text-xs font-bold font-mono text-slate-900"
                />
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    score.name.includes('Investment') ? 'bg-amber-500' :
                    score.name.includes('Safety') ? 'bg-emerald-500' :
                    score.name.includes('Transit') ? 'bg-blue-500' :
                    score.name.includes('Lifestyle') ? 'bg-rose-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${score.val}%`, transition: 'width 1s ease-in-out' }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotlightCard } from '../react-bits/SpotlightCard';
import { CountUp } from '../react-bits/CountUp';
import { Sparkles, Building2, Landmark, TrendingUp, ShieldCheck } from 'lucide-react';

const INSIGHTS = [
  "Discover high-growth localities",
  "Compare investment opportunities",
  "Analyze property risks before buying",
  "Find better alternatives nearby"
];

export const AuthVisualPanel: React.FC = () => {
  const [insightIndex, setInsightIndex] = useState(0);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setInsightIndex((prev) => (prev + 1) % INSIGHTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.02;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.02;
    setMouseOffset({ x, y });
  };

  const metrics = [
    { label: 'Localities Analyzed', to: 142, suffix: '+', icon: Landmark },
    { label: 'Properties Tracked', to: 1840, suffix: '+', icon: Building2 },
    { label: 'Investment Opportunities', to: 250, suffix: '+', icon: TrendingUp },
    { label: 'Infrastructure Projects', to: 84, suffix: '+', icon: ShieldCheck }
  ];

  return (
    <div
      onMouseMove={handleMouseMove}
      className="hidden lg:flex w-[60%] bg-slate-950 text-white p-16 flex-col justify-between relative overflow-hidden select-none border-r border-slate-900"
    >
      {/* Animated gradient background mesh */}
      <motion.div
        animate={{ x: mouseOffset.x * -1.5, y: mouseOffset.y * -1.5 }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.5 }}
        className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none"
      />
      <motion.div
        animate={{ x: mouseOffset.x * 1.5, y: mouseOffset.y * 1.5 }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.5 }}
        className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] rounded-full bg-indigo-600/10 blur-[150px] pointer-events-none"
      />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Header Logo */}
      <div className="flex items-center gap-2 relative z-10">
        <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="font-display font-extrabold text-white tracking-tight text-lg">
          Coimbatore<span className="text-blue-500">REI</span>
        </span>
      </div>

      {/* Content Area */}
      <div className="my-auto relative z-10 max-w-xl">
        <span className="text-[10px] font-bold font-mono tracking-widest text-blue-500 uppercase">
          Coimbatore Property Intelligence
        </span>
        <h2 className="text-3xl md:text-5xl font-display font-extrabold leading-[1.1] mt-3">
          Institutional grade data for smart buyers.
        </h2>

        {/* Rotating Insights Slider */}
        <div className="h-12 mt-6 flex items-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={insightIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="text-slate-400 font-sans text-sm md:text-base border-l-2 border-blue-500 pl-4 py-1"
            >
              {INSIGHTS[insightIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Floating Property Intelligence Card (Parallax) */}
        <motion.div
          animate={{ x: mouseOffset.x * 0.8, y: mouseOffset.y * 0.8 }}
          transition={{ type: 'tween', ease: 'easeOut', duration: 0.5 }}
          className="mt-12"
        >
          <SpotlightCard
            spotlightColor="rgba(37, 99, 235, 0.12)"
            className="border-slate-800 bg-slate-900/60 text-white backdrop-blur-md rounded-2xl p-6 shadow-2xl max-w-md"
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[9px] font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
                  Growth Target Detected
                </span>
                <h4 className="text-base font-bold font-display mt-2">Saravanampatti Corridor</h4>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-slate-400">Yield Score</span>
                <p className="text-xl font-bold font-display text-blue-400">92.5</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mt-3 font-sans">
              Appreciation index tracks +9.2% y-o-y. Expansion of internal software parks provides stable high rental yield capacity.
            </p>
          </SpotlightCard>
        </motion.div>
      </div>

      {/* Grid of counters at the bottom */}
      <div className="grid grid-cols-2 gap-6 relative z-10 border-t border-slate-900 pt-8">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-2 text-slate-400">
                <Icon className="h-4 w-4 text-blue-500" />
                <span className="text-[10px] font-mono uppercase tracking-wider">{metric.label}</span>
              </div>
              <div className="text-2xl font-bold font-display text-white">
                <CountUp
                  to={metric.to}
                  decimals={0}
                  suffix={metric.suffix}
                  duration={1200}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

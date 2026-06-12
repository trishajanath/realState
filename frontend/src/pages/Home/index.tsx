import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchCommand } from '../../components/shared/SearchCommand';
import { SpotlightCard } from '../../components/react-bits/SpotlightCard';
import { ShinyText } from '../../components/react-bits/ShinyText';
import { TextReveal } from '../../components/react-bits/TextReveal';
import { ScrollReveal } from '../../components/react-bits/ScrollReveal';
import { useLocalities } from '../../hooks/useApi';
import { TrendingUp, Percent, ShieldCheck, MapPin, Sparkles, Star, Building2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { data: localities } = useLocalities();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const trendingNames = ['Saravanampatti', 'Peelamedu', 'Kalapatti', 'Saibaba Colony', 'Singanallur'];

  const handleMouseMove = (e: React.MouseEvent) => {
    // Parallax background offset
    setMousePosition({
      x: (e.clientX - window.innerWidth / 2) * 0.03,
      y: (e.clientY - window.innerHeight / 2) * 0.03,
    });
  };

  const handleTrendingClick = (name: string) => {
    const loc = localities?.find(l => l.name.toLowerCase() === name.toLowerCase());
    if (loc) {
      navigate(`/locality/${loc.id}`);
    } else {
      navigate(`/map?q=${name}`);
    }
  };

  // Market Insights mock cards
  const marketInsights = [
    {
      title: 'Saravanampatti',
      tag: 'Fastest Growing Locality',
      growth: '+9.2% y-o-y',
      explanation: 'High capital value appreciation driven by the expansion of the CHIL SEZ IT Park corridor and connectivity to Sathy Road.',
      investmentScore: 92.5,
      icon: TrendingUp,
      color: 'border-amber-200/50 bg-gradient-to-br from-amber-50/20 to-white'
    },
    {
      title: 'Peelamedu',
      tag: 'Highest Rental Yield',
      growth: '4.2% yield',
      explanation: 'Posh residential demand fueled by institutional student housing markets (PSG, GRD) and tech executives from Tidel Park.',
      investmentScore: 86.4,
      icon: Percent,
      color: 'border-blue-200/50 bg-gradient-to-br from-blue-50/20 to-white'
    },
    {
      title: 'RS Puram',
      tag: 'Best Family Area',
      growth: '93.7 Livability',
      explanation: 'Established, premium micro-sector featuring structured avenues, highly-rated schools, and high commercial DB Road retail indices.',
      investmentScore: 81.0,
      icon: ShieldCheck,
      color: 'border-emerald-200/50 bg-gradient-to-br from-emerald-50/20 to-white'
    },
    {
      title: 'Kalapatti',
      tag: 'Best Investment Area',
      growth: 'Grade: A',
      explanation: 'High inventory velocity near airport expansions and Codissia corridors makes it the prime target for medium-term investments.',
      investmentScore: 88.2,
      icon: Building2,
      color: 'border-indigo-200/50 bg-gradient-to-br from-indigo-50/20 to-white'
    }
  ];

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="flex-grow flex flex-col items-center bg-slate-50 px-6 py-12 md:py-20 overflow-hidden relative"
    >
      
      {/* Interactive Parallax Background Elements */}
      <motion.div 
        animate={{ x: mousePosition.x * -1, y: mousePosition.y * -1 }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.5 }}
        className="absolute top-1/4 left-1/10 h-72 w-72 rounded-full bg-blue-400/10 blur-[100px] pointer-events-none"
      />
      <motion.div 
        animate={{ x: mousePosition.x, y: mousePosition.y }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.5 }}
        className="absolute bottom-1/4 right-1/10 h-96 w-96 rounded-full bg-indigo-400/10 blur-[120px] pointer-events-none"
      />

      <div className="text-center max-w-4xl mx-auto flex flex-col items-center relative z-10">
        
        {/* Sparkles tag */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-blue-50 text-blue-700 px-3.5 py-1.5 rounded-xl text-[10px] font-bold font-mono border border-blue-100/60 flex items-center gap-1.5 shadow-sm uppercase tracking-wider"
        >
          <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
          <span>Real Estate Intelligence Engine v1.2</span>
        </motion.div>

        {/* Title */}
        <h1 className="text-4xl md:text-7xl font-display font-extrabold tracking-tight mt-6 text-slate-900 leading-[1.05]">
          <TextReveal text="Coimbatore Real Estate" className="block text-slate-900" />
          <div className="mt-1 block">
            <ShinyText text="Investment Intelligence" />
          </div>
        </h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-slate-500 font-sans text-sm md:text-base mt-6 max-w-xl leading-relaxed"
        >
          Analyse localized property indices, amenity densities, connectivity ratings, and deal values using explainable metrics.
        </motion.p>
      </div>

      {/* Search Bar section */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="w-full mt-10 md:mt-12 relative z-20"
      >
        <SearchCommand />
      </motion.div>

      {/* Trending tags */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex flex-wrap items-center justify-center gap-2 mt-6 relative z-10"
      >
        <span className="text-slate-400 font-mono text-[9px] uppercase tracking-wider font-bold">Trending Sectors:</span>
        {trendingNames.map((name) => (
          <button
            key={name}
            onClick={() => handleTrendingClick(name)}
            className="bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold px-3 py-1 rounded-xl border border-slate-200/50 shadow-sm transition-all flex items-center gap-1 cursor-pointer"
          >
            <MapPin className="h-3 w-3 text-slate-400" />
            <span>{name}</span>
          </button>
        ))}
      </motion.div>

      {/* Trending Localities Cards with Statistics Hover reveal */}
      <div className="w-full max-w-6xl mt-20 relative z-10">
        <h2 className="text-xl md:text-2xl font-bold font-display text-slate-950 text-center mb-1">
          Explore Micro-Sectors
        </h2>
        <p className="text-slate-400 text-[9px] font-mono text-center uppercase tracking-wider mb-8">Hover to reveal metrics & scores</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {localities?.slice(0, 3).map((loc) => {
            const isSaravanampatti = loc.name === 'Saravanampatti';
            const priceSqft = isSaravanampatti ? '4,500/sqft' : loc.name === 'Peelamedu' ? '6,800/sqft' : '4,200/sqft';
            const yieldRate = isSaravanampatti ? '4.2%' : loc.name === 'Peelamedu' ? '3.8%' : '4.0%';
            const overallScore = isSaravanampatti ? 92.5 : loc.name === 'Peelamedu' ? 86.4 : 88.2;

            return (
              <motion.div
                key={loc.id}
                whileHover={{ y: -4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <SpotlightCard className="group relative overflow-hidden p-6 cursor-pointer border border-slate-200/60 bg-white h-52 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg font-display">{loc.name}</h3>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">LAT: {loc.latitude?.toFixed(2)} / LON: {loc.longitude?.toFixed(2)}</p>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-100">
                      {overallScore.toFixed(0)}
                    </div>
                  </div>

                  {/* Normal view details */}
                  <div className="mt-4 group-hover:opacity-0 transition-opacity duration-200 flex flex-col">
                    <span className="text-[10px] text-slate-400 font-mono uppercase">Avg price per sqft</span>
                    <span className="text-lg font-extrabold text-slate-800">{priceSqft}</span>
                  </div>

                  {/* Hover stats overlays */}
                  <div className="absolute inset-x-6 bottom-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col space-y-2 border-t border-slate-100 pt-3 bg-white">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Rental Yield:</span>
                      <span className="font-mono text-emerald-600 font-bold">{yieldRate}</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>Investment Rating:</span>
                      <span className="font-mono text-blue-600 font-bold">Grade A</span>
                    </div>
                    <button 
                      onClick={() => navigate(`/locality/${loc.id}`)}
                      className="w-full bg-slate-900 text-white rounded-lg py-1.5 text-[10px] font-bold font-mono uppercase flex items-center justify-center gap-1 cursor-pointer mt-1"
                    >
                      <span>Analyze Profile</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </SpotlightCard>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Stripe-inspired Market Insights Section with Scroll-Reveal animations */}
      <div className="w-full max-w-6xl mt-24 pt-12 border-t border-slate-200/60 relative z-10">
        <h2 className="text-xl md:text-2xl font-bold font-display text-slate-950 text-center mb-1">
          Market Insights & Rankings
        </h2>
        <p className="text-slate-400 text-[9px] font-mono text-center uppercase tracking-wider mb-12">Anomalies and Opportunities</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {marketInsights.map((card, index) => {
            const Icon = card.icon;
            return (
              <ScrollReveal 
                key={index} 
                delay={index * 0.1}
                className="w-full"
              >
                <div className={`p-6 rounded-2xl border border-slate-200/60 bg-white flex gap-4 ${card.color} shadow-sm hover:shadow-md transition-shadow`}>
                  <div className="bg-white h-10 w-10 border border-slate-200/50 rounded-xl flex items-center justify-center text-slate-800 shadow-sm flex-shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-grow space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-blue-600 bg-blue-50/50 px-2.5 py-0.5 rounded-md">{card.tag}</span>
                      <span className="text-xs font-bold text-slate-800 font-mono">{card.growth}</span>
                    </div>
                    <h3 className="font-bold text-slate-950 text-base font-display">{card.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-sans">{card.explanation}</p>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span>Investment: <strong>{card.investmentScore}%</strong></span>
                      </div>
                      <button 
                        onClick={() => navigate('/analytics')}
                        className="text-[10px] uppercase font-mono tracking-wider font-bold text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>View analytics</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>

    </div>
  );
};

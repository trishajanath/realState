import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchBar } from '../../components/shared/SearchBar';
import { SpotlightCard } from '../../components/react-bits/SpotlightCard';
import { ShinyText } from '../../components/react-bits/ShinyText';
import { useLocalities } from '../../hooks/useApi';
import { TrendingUp, Percent, BarChart3, Building, ShieldCheck, MapPin } from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { data: localities } = useLocalities();

  const trendingNames = ['Saravanampatti', 'Peelamedu', 'Kalapatti', 'Saibaba Colony', 'Singanallur'];

  const goals = [
    { title: 'Family Home', desc: 'Prioritize proximity to top CBSE schools, hospitals, and parks.', icon: ShieldCheck, route: '/map' },
    { title: 'Rental Income', desc: 'Filter for high listing velocity and premium corporate rental yields.', icon: Percent, route: '/analytics' },
    { title: 'Investment Property', desc: 'Identify hotspots along the proposed Avinashi Road IT corridors.', icon: TrendingUp, route: '/analytics' },
    { title: 'Commercial Plot', desc: 'Posh DB Road avenues or high-growth peripheral industrial zones.', icon: Building, route: '/map' }
  ];

  const handleTrendingClick = (name: string) => {
    const loc = localities?.find(l => l.name.toLowerCase() === name.toLowerCase());
    if (loc) {
      navigate(`/locality/${loc.id}`);
    } else {
      navigate(`/map?q=${name}`);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center bg-slate-50 px-6 py-12 md:py-20">
      
      {/* Hero Header Area */}
      <div className="text-center max-w-3xl mx-auto flex flex-col items-center">
        <div className="bg-blue-50 text-blue-600 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-blue-100 flex items-center gap-1.5 shadow-sm">
          <SparklesIcon className="h-4 w-4" />
          <span>Real Estate Intelligence Engine v1.2</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight mt-6 text-slate-900 leading-none">
          Coimbatore Real Estate <br />
          <ShinyText text="Investment Intelligence" />
        </h1>

        <p className="text-slate-500 font-sans text-sm md:text-base mt-4 max-w-xl">
          Analyze localized property indices, amenity densities, connectivity ratings, and deal values using explainable metrics.
        </p>
      </div>

      {/* Search Bar section */}
      <div className="w-full mt-10 md:mt-12">
        <SearchBar />
      </div>

      {/* Trending local tags */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
        <span className="text-slate-400 font-mono text-[10px] uppercase tracking-wider">Trending Micro-sectors:</span>
        {trendingNames.map((name) => (
          <button
            key={name}
            onClick={() => handleTrendingClick(name)}
            className="bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-1 rounded-xl border border-slate-200/50 shadow-sm transition-all flex items-center gap-1"
          >
            <MapPin className="h-3 w-3 text-slate-400" />
            <span>{name}</span>
          </button>
        ))}
      </div>

      {/* Stripe-inspired Market insights */}
      <div className="w-full max-w-6xl mt-20 pt-10 border-t border-slate-200/60">
        <h2 className="text-xl md:text-2xl font-bold font-display text-slate-950 text-center mb-1">
          Coimbatore Market Intelligence Dashboard
        </h2>
        <p className="text-slate-500 text-xs font-mono text-center mb-8">COMPILING REAL-TIME ANALYTICS SNAPSHOTS</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SpotlightCard className="flex flex-col">
            <div className="bg-blue-50 h-10 w-10 rounded-xl flex items-center justify-center text-blue-600 mb-4">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm font-display uppercase tracking-wider">Highest Capital Growth</h3>
            <p className="text-xs text-slate-500 mt-1">Saravanampatti leads average annually with 9.2% capital value growth.</p>
            <span className="text-xs font-semibold text-blue-600 mt-4 cursor-pointer hover:underline" onClick={() => navigate('/analytics')}>View growth metrics &rarr;</span>
          </SpotlightCard>

          <SpotlightCard className="flex flex-col">
            <div className="bg-emerald-50 h-10 w-10 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
              <Percent className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm font-display uppercase tracking-wider">Top Rental Yields</h3>
            <p className="text-xs text-slate-500 mt-1">Peelamedu yields up to 4.2% annually on corporate student rentals.</p>
            <span className="text-xs font-semibold text-emerald-600 mt-4 cursor-pointer hover:underline" onClick={() => navigate('/analytics')}>Analyze yields list &rarr;</span>
          </SpotlightCard>

          <SpotlightCard className="flex flex-col">
            <div className="bg-amber-50 h-10 w-10 rounded-xl flex items-center justify-center text-amber-600 mb-4">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm font-display uppercase tracking-wider">Active Inventory</h3>
            <p className="text-xs text-slate-500 mt-1">Kalapatti inventory expanding with 240 active listings this quarter.</p>
            <span className="text-xs font-semibold text-amber-600 mt-4 cursor-pointer hover:underline" onClick={() => navigate('/map')}>Explore listings map &rarr;</span>
          </SpotlightCard>
        </div>
      </div>

      {/* Explore by Goals Grid */}
      <div className="w-full max-w-6xl mt-20">
        <h2 className="text-xl md:text-2xl font-bold font-display text-slate-950 text-center mb-8">
          Explore Micro-markets by Goal
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {goals.map((g, idx) => {
            const Icon = g.icon;
            return (
              <SpotlightCard
                key={idx}
                className="cursor-pointer hover:scale-[1.01] transition-all flex flex-col justify-between"
                onClick={() => navigate(g.route)}
              >
                <div>
                  <div className="bg-slate-50 h-8 w-8 rounded-lg flex items-center justify-center text-slate-600 mb-4 border border-slate-100">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm font-display">{g.title}</h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{g.desc}</p>
                </div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-blue-600 font-semibold mt-6">
                  Set Filter &rarr;
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Simple Sparkles SVG Icon
const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5 5 3Z" />
    <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" />
  </svg>
);

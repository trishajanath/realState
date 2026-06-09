import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLocalityMetrics, useLocalityScores, useLocalities, useRecommendations, useAmenities } from '../../hooks/useApi';
import { MapView } from '../../components/shared/MapView';
import { ScoreBadge } from '../../components/shared/ScoreBadge';
import { SpotlightCard } from '../../components/react-bits/SpotlightCard';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Building, GraduationCap, Heart, Utensils, Trees, Dumbbell, 
  MapPin, CheckCircle, AlertCircle, ArrowUpRight, BadgeHelp, Info
} from 'lucide-react';

export const LocalityPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const localityId = id || '';

  const { data: localities } = useLocalities();
  const { data: metrics } = useLocalityMetrics(localityId);
  const { data: scores } = useLocalityScores(localityId);
  const { data: amenities } = useAmenities(localityId);

  // Recommendations queries
  const { data: similarRecs } = useRecommendations(localityId, 'similar');
  const { data: cheaperRecs } = useRecommendations(localityId, 'CHEAPER');
  const { data: premiumRecs } = useRecommendations(localityId, 'PREMIUM');

  const [activeTab, setActiveTab] = useState<'similar' | 'cheaper' | 'premium'>('similar');

  const currentLocality = localities?.find(l => l.id === localityId) || localities?.[0];

  if (!currentLocality) {
    return (
      <div className="flex-grow flex items-center justify-center p-12 text-slate-400 text-xs font-mono">
        Loading locality intelligence profile...
      </div>
    );
  }

  // Price history mock data for charts
  const priceHistoryData = [
    { year: '2022', price: (metrics?.median_price_per_sqft || 4300) - 800 },
    { year: '2023', price: (metrics?.median_price_per_sqft || 4300) - 450 },
    { year: '2024', price: (metrics?.median_price_per_sqft || 4300) - 100 },
    { year: '2025', price: (metrics?.median_price_per_sqft || 4300) + 120 },
    { year: '2026', price: (metrics?.median_price_per_sqft || 4300) }
  ];

  const ratingSafety = scores?.healthcare_score ? (scores.healthcare_score + (scores.education_score || 70)) / 2 : 75;

  const currentRecs = activeTab === 'similar' 
    ? similarRecs 
    : activeTab === 'cheaper' 
      ? cheaperRecs 
      : premiumRecs;

  const amenityIcons: Record<string, any> = {
    school: GraduationCap,
    hospital: Heart,
    restaurant: Utensils,
    park: Trees,
    gym: Dumbbell
  };

  return (
    <div className="flex-grow flex flex-col md:flex-row bg-slate-50">
      
      {/* Left scrollable dashboard panel */}
      <div className="w-full md:w-3/5 p-6 md:p-10 md:h-[calc(100vh-68px)] md:overflow-y-auto">
        
        {/* Breadcrumb path */}
        <div className="text-[10px] font-mono tracking-wider uppercase text-slate-400 flex items-center gap-1.5 mb-3">
          <Link to="/" className="hover:underline">Coimbatore</Link>
          <span>/</span>
          <span className="text-slate-600">Localities</span>
          <span>/</span>
          <span>{currentLocality.name}</span>
        </div>

        {/* Heading title area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold font-display text-slate-900 leading-tight">
              {currentLocality.name}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              MICRO-SECTOR LATITUDE {currentLocality.latitude?.toFixed(4)}° / LONGITUDE {currentLocality.longitude?.toFixed(4)}°
            </p>
          </div>
          <div className="flex gap-2">
            <ScoreBadge score={scores?.investment_score || 85.0} label="Investment" />
            <ScoreBadge score={ratingSafety} label="Safety" />
            <ScoreBadge score={scores?.connectivity_score || 72.8} label="Connectivity" />
          </div>
        </div>

        {/* Hero split map for mobile, sticky map viewer for desktop is on the right */}
        <div className="block md:hidden mt-6">
          <MapView localityId={localityId} height="h-64" />
        </div>

        {/* Middle: Data Dashboard charts */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] text-slate-400 font-mono block uppercase">Avg Price/Sqft</span>
            <span className="text-2xl font-bold font-display text-slate-950 block mt-1">
              {metrics?.median_price_per_sqft ? `${metrics.median_price_per_sqft.toLocaleString()} INR` : '4,300 INR'}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-1">
              <ArrowUpRight className="h-3 w-3" /> +5.8% vs last year
            </span>
          </div>

          <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] text-slate-400 font-mono block uppercase">Yield Estimate</span>
            <span className="text-2xl font-bold font-display text-slate-950 block mt-1">
              {metrics?.rental_yield_estimate ? `${metrics.rental_yield_estimate}%` : '4.2%'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono block mt-1">Coimbatore Market standard is 3.5%</span>
          </div>

          <div className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] text-slate-400 font-mono block uppercase">Listing Velocity</span>
            <span className="text-2xl font-bold font-display text-slate-950 block mt-1">
              {metrics?.listing_velocity ? `${metrics.listing_velocity}/10` : '8.2/10'}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">High transaction liquidity</span>
          </div>
        </div>

        {/* Charts Section */}
        <div className="mt-8 bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 uppercase font-mono tracking-wider mb-4">Historical Pricing Trends</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceHistoryData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={['dataMin - 500', 'dataMax + 500']} />
                <Tooltip 
                  contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPrice)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Proximity / Amenities section */}
        <div className="mt-10">
          <h3 className="text-sm font-semibold text-slate-800 uppercase font-mono tracking-wider mb-6">Amenity Proximity & Densities</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {amenities && amenities.length > 0 ? (
              amenities.map((item) => {
                const Icon = amenityIcons[item.category] || Building;
                return (
                  <div key={item.id} className="bg-white border border-slate-200/50 p-4 rounded-xl flex gap-3 shadow-sm hover:border-slate-300 transition-colors">
                    <div className="bg-slate-50 h-9 w-9 rounded-lg flex items-center justify-center text-slate-600 border border-slate-100">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-xs line-clamp-1">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 capitalize mt-0.5">{item.category} &bull; Proximity: &lt; 1.2km</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 text-center text-xs text-slate-400 font-mono py-8 bg-slate-50 border border-slate-200/40 rounded-xl">
                No verified landmark coordinates in direct cache bounds.
              </div>
            )}
          </div>
        </div>

        {/* Pros & Cons Section (Notion style) */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-slate-200/60 pt-10">
          <div>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-600 flex items-center gap-1.5 mb-4">
              <CheckCircle className="h-4 w-4" />
              <span>Civic Strengths</span>
            </h4>
            <ul className="space-y-3 text-xs text-slate-600 font-medium">
              <li className="flex gap-2"><span className="text-emerald-500 font-bold">&bull;</span> Proximity to IT Parks ensures solid, stable rental payouts.</li>
              <li className="flex gap-2"><span className="text-emerald-500 font-bold">&bull;</span> Excellent coverage of CBSE secondary schools.</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-rose-600 flex items-center gap-1.5 mb-4">
              <AlertCircle className="h-4 w-4" />
              <span>Civic Constraints</span>
            </h4>
            <ul className="space-y-3 text-xs text-slate-600 font-medium">
              <li className="flex gap-2"><span className="text-rose-500 font-bold">&bull;</span> Water scarcity concerns in certain micro-sectors during summer.</li>
              <li className="flex gap-2"><span className="text-rose-500 font-bold">&bull;</span> Traffic bottlenecks during peak hours along main arterial junctions.</li>
            </ul>
          </div>
        </div>

        {/* Recommendations Section */}
        <div className="mt-12 border-t border-slate-200/60 pt-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-slate-800 uppercase font-mono tracking-wider">Similar & Alternative Recommendations</h3>
            
            {/* HUD Toggle */}
            <div className="bg-slate-200/60 p-0.5 rounded-lg flex gap-1 text-[10px] font-semibold">
              <button 
                onClick={() => setActiveTab('similar')}
                className={`px-2 py-1 rounded-md transition-all ${activeTab === 'similar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Similar
              </button>
              <button 
                onClick={() => setActiveTab('cheaper')}
                className={`px-2 py-1 rounded-md transition-all ${activeTab === 'cheaper' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Cheaper
              </button>
              <button 
                onClick={() => setActiveTab('premium')}
                className={`px-2 py-1 rounded-md transition-all ${activeTab === 'premium' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Premium
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {currentRecs && currentRecs.length > 0 ? (
              currentRecs.map((rec) => (
                <SpotlightCard key={rec.id} className="border border-slate-200/60 p-5 rounded-2xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm font-display">{rec.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{rec.city}, {rec.state}</p>
                    </div>
                    <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold font-mono">
                      Match: {(rec.score * 100).toFixed(0)}%
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {rec.reasoning}
                  </p>
                  
                  {/* Contributions parameters */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                    {Object.entries(rec.feature_contribution).map(([key, val]) => (
                      <span key={key} className="bg-slate-50 text-slate-500 border border-slate-100 rounded-lg text-[9px] px-2 py-0.5 font-mono uppercase font-semibold">
                        {key.replace('_', ' ')}: {(val * 100).toFixed(0)}%
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Link 
                      to={`/locality/${rec.id}`}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs py-1.5 px-3 rounded-lg transition-all"
                    >
                      Compare Neighborhood
                    </Link>
                  </div>
                </SpotlightCard>
              ))
            ) : (
              <div className="text-center text-xs text-slate-400 font-mono py-8 bg-slate-50 border border-slate-200/40 rounded-xl">
                No precomputed snapshots for active mode filters.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Sticky Right-side Map Viewer Panel (Desktop only) */}
      <div className="hidden md:block w-2/5 sticky top-[68px] h-[calc(100vh-68px)] border-l border-slate-200/60">
        <MapView localityId={localityId} height="h-full" />
      </div>

    </div>
  );
};

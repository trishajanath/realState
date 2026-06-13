import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLocalityMetrics, useLocalityScores, useLocalities, useAmenities } from '../../hooks/useApi';
import { MapView } from '../../components/shared/MapView';
import { ScoreBadge } from '../../components/shared/ScoreBadge';
import { MetricCard } from '../../components/shared/MetricCard';
import { InvestmentScoreWidget } from '../../components/shared/InvestmentScoreWidget';
import { RecommendationCard } from '../../components/shared/RecommendationCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/ui/Table';
import { TextReveal } from '../../components/react-bits/TextReveal';
import { CountUp } from '../../components/react-bits/CountUp';
import { ScrollReveal } from '../../components/react-bits/ScrollReveal';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Cell, Pie } from 'recharts';
import { 
  GraduationCap, Heart, Utensils, Trees, Dumbbell, Landmark,
  MapPin, CheckCircle, AlertCircle
} from 'lucide-react';
import { mockLocalities, mockRecommendations } from '../../services/mockData';

export const LocalityPage: React.FC = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const { data: localities } = useLocalities();

  // Handle both ID and slug-based routing
  const currentLocality = localities?.find(
    (l) => l.id === id || l.name.toLowerCase() === (id || slug || '').toLowerCase()
  ) || localities?.[0];
  const localityId = currentLocality?.id || '';

  const { data: metrics } = useLocalityMetrics(localityId);
  const { data: scores } = useLocalityScores(localityId);
  const { data: amenities } = useAmenities(localityId);

  const [recTab, setRecTab] = useState<'similar' | 'CHEAPER' | 'PREMIUM' | 'HIGH_GROWTH'>('similar');
  const [chartTab, setChartTab] = useState<'1y' | '3y' | 'dist' | 'type'>('1y');

  if (!currentLocality) {
    return (
      <div className="flex-grow flex items-center justify-center p-12 text-slate-400 text-xs font-mono">
        Loading locality intelligence profile...
      </div>
    );
  }

  const ratingSafety = scores?.healthcare_score ? (scores.healthcare_score + (scores.education_score || 70)) / 2 : 75;

  // Chart Mocks
  const basePrice = metrics?.median_price_per_sqft || 4300;
  const oneYearData = [
    { name: 'Q2 2025', price: basePrice - 180 },
    { name: 'Q3 2025', price: basePrice - 90 },
    { name: 'Q4 2025', price: basePrice + 40 },
    { name: 'Q1 2026', price: basePrice + 110 },
    { name: 'Q2 2026', price: basePrice }
  ];

  const threeYearData = [
    { name: '2024', price: basePrice - 750 },
    { name: '2025', price: basePrice - 200 },
    { name: '2026', price: basePrice }
  ];

  const priceDistribution = [
    { range: '3.5K - 4.5K', count: 18 },
    { range: '4.5K - 5.5K', count: 42 },
    { range: '5.5K - 6.5K', count: 28 },
    { range: '6.5K - 7.5K', count: 14 },
    { range: '7.5K+', count: 6 }
  ];

  const typeDistribution = [
    { name: 'Apartments', value: 65, color: '#3b82f6' },
    { name: 'Villas', value: 20, color: '#10b981' },
    { name: 'Plots/Land', value: 15, color: '#f59e0b' }
  ];

  // Dynamically resolve recommendations to guarantee content
  const getRecs = (type: 'similar' | 'CHEAPER' | 'PREMIUM' | 'HIGH_GROWTH') => {
    const group = mockRecommendations[localityId] || {};
    const recs = group[type] || [];
    if (recs.length > 0) return recs;

    // Generate dynamic matches for other localities
    const others = mockLocalities.filter(l => l.id !== localityId);
    return others.slice(0, 2).map((l, idx) => {
      let reasoning = '';
      let score = 0.90 - idx * 0.05;
      if (type === 'similar') {
        reasoning = `${l.name} exhibits a closely matched density index of basic schools and access transit, offering a similar growth index.`;
      } else if (type === 'CHEAPER') {
        reasoning = `${l.name} represents a cheaper residential alternative, offering a lower average pricing index while maintaining tech corridor proximity.`;
        score = 0.81;
      } else if (type === 'PREMIUM') {
        reasoning = `${l.name} is a premium residential sector offering upgraded safety ratings and higher healthcare density indicators.`;
        score = 0.88;
      } else {
        reasoning = `${l.name} is showing high capital value appreciation indexes along the upcoming transport corridors.`;
        score = 0.92;
      }
      return {
        id: l.id,
        name: l.name,
        city: l.city,
        state: l.state,
        recommendation_type: type,
        score,
        reasoning,
        feature_contribution: {
          price_index: 0.85,
          connectivity: 0.92,
          investment: 0.86
        },
        generation_timestamp: '2026-06-11T09:59:17Z'
      };
    });
  };

  const currentRecs = getRecs(recTab);

  const amenityCategories = [
    { key: 'school', label: 'Schools', icon: GraduationCap },
    { key: 'hospital', label: 'Hospitals', icon: Heart },
    { key: 'restaurant', label: 'Restaurants', icon: Utensils },
    { key: 'park', label: 'Parks', icon: Trees },
    { key: 'gym', label: 'Gyms', icon: Dumbbell },
    { key: 'bank', label: 'Banks', icon: Landmark }
  ];

  // Resolve amenities with distances
  const getAmenitiesList = (cat: string) => {
    const list = amenities?.filter(a => a.category.toLowerCase() === cat.toLowerCase()) || [];
    if (list.length > 0) {
      return list.map((a, idx) => ({
        id: a.id,
        name: a.name,
        distance: `${((idx + 1) * 0.4).toFixed(1)} km`,
        rating: (4.0 + (a.confidence_score || 0.8) * 1.0).toFixed(1),
        category: a.category,
        densityScore: `${Math.round((a.confidence_score || 0.85) * 100)}%`
      }));
    }

    // Default placeholders if data is empty
    return [
      { id: `${cat}-1`, name: `Elite ${cat === 'school' ? 'Academy' : cat === 'hospital' ? 'Specialty Care' : 'Center'}`, distance: '0.6 km', rating: '4.7', category: cat, densityScore: '92%' },
      { id: `${cat}-2`, name: `Metro ${cat === 'school' ? 'Secondary' : cat === 'hospital' ? 'General Clinic' : 'Plaza'}`, distance: '1.2 km', rating: '4.2', category: cat, densityScore: '78%' },
      { id: `${cat}-3`, name: `Central ${cat === 'school' ? 'Institution' : cat === 'hospital' ? 'Emergency Care' : 'Avenue'}`, distance: '1.9 km', rating: '4.5', category: cat, densityScore: '85%' }
    ];
  };

  return (
    <div className="flex-grow flex flex-col md:flex-row bg-slate-50 relative">
      
      {/* Left scrollable dashboard panel */}
      <div className="w-full md:w-3/5 p-6 md:p-10 md:h-[calc(100vh-68px)] md:overflow-y-auto">
        
        {/* Breadcrumb */}
        <div className="text-[10px] font-mono tracking-wider uppercase text-slate-400 flex items-center gap-1.5 mb-3">
          <Link to="/" className="hover:underline">Coimbatore</Link>
          <span>/</span>
          <span className="text-slate-600">Localities</span>
          <span>/</span>
          <span>{currentLocality.name}</span>
        </div>

        {/* Locality Header & Animated Title */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-slate-200/50 pb-8">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold font-display text-slate-900 leading-none">
              <TextReveal text={currentLocality.name} />
            </h1>
            <p className="text-[10px] text-slate-500 font-mono mt-2 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>COIMBATORE INTEL INDEX LAT {currentLocality.latitude?.toFixed(4)}° / LON {currentLocality.longitude?.toFixed(4)}°</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ScoreBadge score={scores?.investment_score || 85.0} label="Invest" />
            <ScoreBadge score={ratingSafety} label="Safety" />
            <ScoreBadge score={scores?.connectivity_score || 72.8} label="Transit" />
          </div>
        </div>

        {/* Score Counters Section */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm text-center">
            <span className="text-[9px] text-slate-400 font-mono block uppercase">Investment Score</span>
            <CountUp 
              to={scores?.investment_score || 85} 
              decimals={1} 
              suffix="%" 
              className="text-2xl font-bold font-display text-amber-600 block mt-1" 
            />
          </div>
          <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm text-center">
            <span className="text-[9px] text-slate-400 font-mono block uppercase">Safety Rating</span>
            <CountUp 
              to={ratingSafety} 
              decimals={1} 
              suffix="%" 
              className="text-2xl font-bold font-display text-emerald-600 block mt-1" 
            />
          </div>
          <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm text-center">
            <span className="text-[9px] text-slate-400 font-mono block uppercase">Connectivity Score</span>
            <CountUp 
              to={scores?.connectivity_score || 72.8} 
              decimals={1} 
              suffix="%" 
              className="text-2xl font-bold font-display text-blue-600 block mt-1" 
            />
          </div>
          <div className="bg-white border border-slate-200/60 p-4 rounded-xl shadow-sm text-center">
            <span className="text-[9px] text-slate-400 font-mono block uppercase">Lifestyle Score</span>
            <CountUp 
              to={scores?.lifestyle_score || 79} 
              decimals={1} 
              suffix="%" 
              className="text-2xl font-bold font-display text-rose-600 block mt-1" 
            />
          </div>
        </div>

        {/* Locality Overview metrics (reusable MetricCards) */}
        <div className="mt-10">
          <h3 className="text-xs font-semibold text-slate-800 uppercase font-mono tracking-wider mb-4">Locality Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <MetricCard 
              label="Avg Price/SqFt" 
              value={`${(metrics?.median_price_per_sqft || 4300).toLocaleString()} INR`} 
              trend={{ value: '+5.8% y-o-y', isPositive: true }}
              tooltipText="Average listing price normalized per build-up square foot inside active municipal boundaries."
            />
            <MetricCard 
              label="Median Property Price" 
              value={`${metrics?.avg_property_price ? (metrics.avg_property_price / 100000).toFixed(0) : '65'} L`} 
              description="Stable market values"
              tooltipText="Median value of all active, non-duplicate residential units listed this quarter."
            />
            <MetricCard 
              label="Rental Yield" 
              value={`${metrics?.rental_yield_estimate || '4.2'}%`} 
              trend={{ value: 'Above Standard', isPositive: true }}
              tooltipText="Calculated as median annual rental value divided by median acquisition cost."
            />
            <MetricCard 
              label="Property Count" 
              value={metrics?.property_inventory || 240} 
              description="Active listed inventory"
              tooltipText="Total inventory of verified projects, villas, and apartments cached."
            />
            <MetricCard 
              label="Price Growth Index" 
              value="Grade: A" 
              description="Saravanampatti corridor"
              tooltipText="Relative price appreciation velocity score calculated against Coimbatore averages."
            />
            <MetricCard 
              label="Highway Access" 
              value={`${metrics?.highway_access_score || 82}/100`} 
              description="Direct arterial outlets"
              tooltipText="Weighted travel duration to closest national highway access junctions."
            />
          </div>
        </div>

        {/* Split map for mobile */}
        <div className="block md:hidden mt-8">
          <MapView localityId={localityId} height="h-64" />
        </div>

        {/* Investment Score Detailed Progress breakdown widget */}
        <div className="mt-10">
          <InvestmentScoreWidget 
            investmentScore={scores?.investment_score || 85}
            safetyScore={ratingSafety}
            connectivityScore={scores?.connectivity_score || 72.8}
            lifestyleScore={scores?.lifestyle_score || 79}
            educationScore={scores?.education_score || 85.2}
          />
        </div>

        {/* Recharts Price Analytics Section */}
        <div className="mt-10">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Neighborhood Price Analytics</CardTitle>
              </div>
              <div className="bg-slate-100 p-0.5 rounded-lg flex gap-1 text-[10px] font-semibold">
                <button onClick={() => setChartTab('1y')} className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${chartTab === '1y' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>1 Year Trend</button>
                <button onClick={() => setChartTab('3y')} className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${chartTab === '3y' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>3 Year Trend</button>
                <button onClick={() => setChartTab('dist')} className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${chartTab === 'dist' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>Distribution</button>
                <button onClick={() => setChartTab('type')} className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${chartTab === 'type' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>Unit Types</button>
              </div>
            </CardHeader>
            <CardContent className="h-64">
              {chartTab === '1y' && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={oneYearData}>
                    <defs>
                      <linearGradient id="chartColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 300', 'dataMax + 300']} />
                    <Tooltip contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none' }} />
                    <Area type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#chartColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
              {chartTab === '3y' && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={threeYearData}>
                    <defs>
                      <linearGradient id="chartColor3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 800', 'dataMax + 800']} />
                    <Tooltip contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none' }} />
                    <Area type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#chartColor3)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
              {chartTab === 'dist' && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={priceDistribution}>
                    <XAxis dataKey="range" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '12px', border: 'none' }} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              {chartTab === 'type' && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {typeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
            {chartTab === 'type' && (
              <div className="flex justify-center gap-6 pb-6 text-xs font-semibold text-slate-600">
                {typeDistribution.map((t) => (
                  <div key={t.name} className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: t.color }} />
                    <span>{t.name} ({t.value}%)</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Amenities Section using Tabs and Table */}
        <div className="mt-10">
          <h3 className="text-xs font-semibold text-slate-800 uppercase font-mono tracking-wider mb-4">Amenity Proximity & Density index</h3>
          <Tabs defaultValue="school">
            <TabsList className="flex flex-wrap justify-start gap-1 p-1 mb-4 h-auto">
              {amenityCategories.map((c) => {
                const Icon = c.icon;
                return (
                  <TabsTrigger key={c.key} value={c.key} className="flex items-center gap-1 text-[11px] py-1">
                    <Icon className="h-3.5 w-3.5" />
                    <span>{c.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {amenityCategories.map((c) => {
              const list = getAmenitiesList(c.key);
              return (
                <TabsContent key={c.key} value={c.key}>
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Landmark Name</TableHead>
                          <TableHead>Distance</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Density Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {list.map((item) => (
                          <TableRow key={item.id} className="cursor-pointer hover:bg-blue-50/20">
                            <TableCell className="font-semibold text-slate-900">{item.name}</TableCell>
                            <TableCell className="font-mono text-slate-500">{item.distance}</TableCell>
                            <TableCell className="font-mono text-slate-800 font-bold">{item.rating} / 5.0</TableCell>
                            <TableCell className="font-mono text-emerald-600 font-bold">{item.densityScore}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>

        {/* Pros & Cons Section (Notion style) */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-slate-200/60 pt-10">
          <div>
            <h4 className="text-[10px] font-bold font-mono uppercase tracking-wider text-emerald-600 flex items-center gap-1.5 mb-4">
              <CheckCircle className="h-4 w-4" />
              <span>Neighborhood Strengths</span>
            </h4>
            <ul className="space-y-3 text-xs text-slate-600 font-medium">
              <li className="flex gap-2"><span className="text-emerald-500 font-bold">&bull;</span> Proximity to IT Parks ensures solid, stable rental payouts.</li>
              <li className="flex gap-2"><span className="text-emerald-500 font-bold">&bull;</span> Excellent coverage of CBSE secondary schools.</li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-bold font-mono uppercase tracking-wider text-rose-600 flex items-center gap-1.5 mb-4">
              <AlertCircle className="h-4 w-4" />
              <span>Zoning Constraints</span>
            </h4>
            <ul className="space-y-3 text-xs text-slate-600 font-medium">
              <li className="flex gap-2"><span className="text-rose-500 font-bold">&bull;</span> Water scarcity concerns in certain micro-sectors during summer.</li>
              <li className="flex gap-2"><span className="text-rose-500 font-bold">&bull;</span> Traffic bottlenecks during peak hours along main arterial junctions.</li>
            </ul>
          </div>
        </div>

        {/* Similar Localities Section */}
        <div className="mt-12 border-t border-slate-200/60 pt-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-xs font-semibold text-slate-800 uppercase font-mono tracking-wider">Similar & Alternative Recommendations</h3>
            
            {/* Toggle HUD */}
            <div className="bg-slate-100 p-0.5 rounded-lg flex gap-1 text-[10px] font-semibold">
              <button 
                onClick={() => setRecTab('similar')}
                className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${recTab === 'similar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Similar Areas
              </button>
              <button 
                onClick={() => setRecTab('CHEAPER')}
                className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${recTab === 'CHEAPER' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Cheaper
              </button>
              <button 
                onClick={() => setRecTab('PREMIUM')}
                className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${recTab === 'PREMIUM' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Premium
              </button>
              <button 
                onClick={() => setRecTab('HIGH_GROWTH')}
                className={`px-2.5 py-1.5 rounded-md transition-all cursor-pointer ${recTab === 'HIGH_GROWTH' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                High Growth
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {currentRecs.map((rec) => (
              <ScrollReveal key={rec.id}>
                <RecommendationCard item={rec} />
              </ScrollReveal>
            ))}
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

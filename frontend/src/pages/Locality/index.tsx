import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLocalityMetrics, useLocalityScores, useLocalities, useAmenities } from '../../hooks/useApi';
import { MapView } from '../../components/shared/MapView';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import {
  GraduationCap, Heart, Utensils, Trees, Dumbbell, Landmark,
  MapPin, ChevronRight,
} from 'lucide-react';

type ChartTab = '1y' | '3y' | 'dist';
type RecTab = 'similar' | 'CHEAPER' | 'PREMIUM' | 'HIGH_GROWTH';

const tooltipStyle = {
  background: '#FFFFFF',
  color: '#000000',
  borderRadius: '8px',
  border: '1px solid #E5E7EB',
  fontSize: '12px',
};

const amenityCategories = [
  { key: 'school', label: 'Schools', icon: GraduationCap },
  { key: 'hospital', label: 'Hospitals', icon: Heart },
  { key: 'restaurant', label: 'Restaurants', icon: Utensils },
  { key: 'park', label: 'Parks', icon: Trees },
  { key: 'gym', label: 'Gyms', icon: Dumbbell },
  { key: 'bank', label: 'Banks', icon: Landmark },
];

export const LocalityPage: React.FC = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const { data: localities } = useLocalities();

  const currentLocality = localities?.find(
    (l) => l.id === id || l.name.toLowerCase() === (id || slug || '').toLowerCase()
  ) || localities?.[0];
  const localityId = currentLocality?.id || '';

  const { data: metrics } = useLocalityMetrics(localityId);
  const { data: scores } = useLocalityScores(localityId);
  const { data: amenities } = useAmenities(localityId);

  const [chartTab, setChartTab] = useState<ChartTab>('1y');
  const [recTab, setRecTab] = useState<RecTab>('similar');
  const [amenityTab, setAmenityTab] = useState('school');

  if (!currentLocality) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-sm" style={{ color: '#9CA3AF' }}>
        Loading locality profile...
      </div>
    );
  }

  const basePrice = metrics?.median_price_per_sqft || 4300;

  const oneYearData = [
    { name: 'Q2 2025', price: basePrice - 180 },
    { name: 'Q3 2025', price: basePrice - 90 },
    { name: 'Q4 2025', price: basePrice + 40 },
    { name: 'Q1 2026', price: basePrice + 110 },
    { name: 'Q2 2026', price: basePrice },
  ];

  const threeYearData = [
    { name: '2024', price: basePrice - 750 },
    { name: '2025', price: basePrice - 200 },
    { name: '2026', price: basePrice },
  ];

  const priceDistribution = [
    { range: '3.5K–4.5K', count: 18 },
    { range: '4.5K–5.5K', count: 42 },
    { range: '5.5K–6.5K', count: 28 },
    { range: '6.5K–7.5K', count: 14 },
    { range: '7.5K+', count: 6 },
  ];

  const areaChartData = chartTab === '1y' ? oneYearData : threeYearData;

  const getRecs = (type: RecTab) => {
    return (localities || [])
      .filter((l) => l.id !== localityId)
      .slice(0, 3)
      .map((l, idx) => ({
        id: l.id,
        name: l.name,
        score: 0.9 - idx * 0.05,
        reasoning: `${l.name} offers comparable market dynamics with strong growth indicators.`,
      }));
  };

  const getAmenities = (cat: string) => {
    const list = amenities?.filter((a) => a.category.toLowerCase() === cat.toLowerCase()) || [];
    if (list.length > 0) {
      return list.map((a, idx) => ({
        name: a.name,
        distance: `${((idx + 1) * 0.4).toFixed(1)} km`,
        rating: (4.0 + (a.confidence_score || 0.8) * 1.0).toFixed(1),
      }));
    }
    return [
      { name: `Central ${cat === 'school' ? 'Academy' : cat === 'hospital' ? 'Care Centre' : 'Facility'}`, distance: '0.6 km', rating: '4.7' },
      { name: `Metro ${cat === 'school' ? 'Secondary' : cat === 'hospital' ? 'Clinic' : 'Plaza'}`, distance: '1.2 km', rating: '4.2' },
    ];
  };

  const scoreItems = [
    { label: 'Investment', value: scores?.investment_score || 75 },
    { label: 'Livability', value: scores?.overall_livability_score || 70 },
    { label: 'Connectivity', value: scores?.connectivity_score || 70 },
    { label: 'Education', value: scores?.education_score || 72 },
    { label: 'Healthcare', value: scores?.healthcare_score || 74 },
  ];

  const activeTabStyle = { color: '#000000', borderBottom: '2px solid #000000', marginBottom: '-1px' };
  const inactiveTabStyle = { color: '#6B7280', borderBottom: '2px solid transparent', marginBottom: '-1px' };

  return (
    <div className="flex-1 flex flex-col md:flex-row" style={{ minHeight: 0 }}>

      {/* Left panel */}
      <div className="flex-1 p-8 overflow-y-auto" style={{ minWidth: 0 }}>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs mb-6" style={{ color: '#9CA3AF' }}>
          <Link to="/" style={{ color: '#6B7280' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#000000')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#6B7280')}
          >Overview</Link>
          <ChevronRight className="w-3 h-3" />
          <span>Localities</span>
          <ChevronRight className="w-3 h-3" />
          <span style={{ color: '#374151' }}>{currentLocality.name}</span>
        </div>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1" style={{ color: '#000000', letterSpacing: '-0.03em' }}>
            {currentLocality.name}
          </h1>
          <div className="flex items-center gap-1.5 text-sm" style={{ color: '#6B7280' }}>
            <MapPin className="w-3.5 h-3.5" />
            {currentLocality.city}, Tamil Nadu · {currentLocality.latitude?.toFixed(4)}°N, {currentLocality.longitude?.toFixed(4)}°E
          </div>
        </div>

        {/* Score grid */}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-0 mb-8" style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
          {scoreItems.map((s, idx) => (
            <div
              key={s.label}
              className="p-4"
              style={{
                backgroundColor: '#F9FAFB',
                borderRight: idx < scoreItems.length - 1 ? '1px solid #E5E7EB' : 'none',
              }}
            >
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#9CA3AF' }}>{s.label}</div>
              <div className="text-xl font-bold" style={{ color: '#000000' }}>{s.value.toFixed(0)}</div>
            </div>
          ))}
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Median Price', value: `₹${(metrics?.median_price_per_sqft || basePrice).toLocaleString()}/sqft` },
            { label: 'Rental Yield', value: `${metrics?.rental_yield_estimate?.toFixed(1) || '3.8'}%` },
            { label: 'Listing Velocity', value: `${metrics?.listing_velocity?.toFixed(1) || '6.5'} days` },
          ].map((m) => (
            <div key={m.label} className="flex flex-col gap-0.5">
              <span className="text-xs uppercase tracking-wider" style={{ color: '#9CA3AF' }}>{m.label}</span>
              <span className="text-2xl font-semibold" style={{ color: '#000000' }}>{m.value}</span>
            </div>
          ))}
        </div>

        {/* Chart tabs */}
        <div style={{ borderBottom: '1px solid #E5E7EB', marginBottom: '24px' }}>
          <div className="flex gap-0">
            {([['1y', '1 Year'], ['3y', '3 Years'], ['dist', 'Distribution']] as [ChartTab, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setChartTab(key)}
                className="px-4 py-2.5 text-sm font-medium transition-colors"
                style={chartTab === key ? activeTabStyle : inactiveTabStyle}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: '200px', marginBottom: '32px' }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartTab === 'dist' ? (
              <BarChart data={priceDistribution} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="range" stroke="#E5E7EB" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#9CA3AF' }} />
                <YAxis stroke="#E5E7EB" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#9CA3AF' }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#F9FAFB' }} />
                <Bar dataKey="count" fill="#000000" radius={[2, 2, 0, 0]} maxBarSize={40} />
              </BarChart>
            ) : (
              <AreaChart data={areaChartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#000000" stopOpacity={0.08} />
                    <stop offset="100%" stopColor="#000000" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#E5E7EB" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#9CA3AF' }} />
                <YAxis stroke="#E5E7EB" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#9CA3AF' }} tickFormatter={(v) => `${v.toLocaleString()}`} width={60} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#E5E7EB' }} />
                <Area type="monotone" dataKey="price" stroke="#000000" strokeWidth={1.5} fill="url(#areaGrad)" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Amenities */}
        <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '32px' }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#000000' }}>Nearby Amenities</h2>
          <div className="flex gap-0 mb-6" style={{ borderBottom: '1px solid #E5E7EB' }}>
            {amenityCategories.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setAmenityTab(key)}
                className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors"
                style={amenityTab === key ? activeTabStyle : inactiveTabStyle}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
          <div className="space-y-0">
            {getAmenities(amenityTab).map((a, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-3"
                style={{ borderBottom: '1px solid #F3F4F6' }}
              >
                <span className="text-sm" style={{ color: '#000000' }}>{a.name}</span>
                <div className="flex items-center gap-4 text-xs" style={{ color: '#6B7280' }}>
                  <span>{a.distance}</span>
                  <span>{a.rating} ★</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div style={{ marginTop: '40px', borderTop: '1px solid #E5E7EB', paddingTop: '32px' }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: '#000000' }}>Similar Localities</h2>
          <div className="flex gap-0 mb-6" style={{ borderBottom: '1px solid #E5E7EB' }}>
            {([['similar', 'Similar'], ['CHEAPER', 'Budget'], ['PREMIUM', 'Premium'], ['HIGH_GROWTH', 'Growth']] as [RecTab, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setRecTab(key)}
                className="px-4 py-2.5 text-sm font-medium transition-colors"
                style={recTab === key ? activeTabStyle : inactiveTabStyle}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="space-y-0">
            {getRecs(recTab).map((rec: any) => (
              <div
                key={rec.id}
                className="py-4 cursor-pointer transition-colors rounded"
                style={{ borderBottom: '1px solid #F3F4F6' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      to={`/locality/${rec.id}`}
                      className="text-sm font-medium hover:underline"
                      style={{ color: '#000000' }}
                    >
                      {rec.name}
                    </Link>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: '#6B7280' }}>
                      {rec.reasoning}
                    </p>
                  </div>
                  <span className="text-xs font-semibold flex-shrink-0" style={{ color: '#9CA3AF' }}>
                    {rec.score ? `${(rec.score * 100).toFixed(0)}%` : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right map panel */}
      <div
        className="hidden md:flex flex-col"
        style={{ width: '420px', flexShrink: 0, borderLeft: '1px solid #E5E7EB' }}
      >
        <div className="flex-1 overflow-hidden">
          <MapView localityId={localityId} height="h-full" />
        </div>
      </div>
    </div>
  );
};

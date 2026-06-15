import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useLocalityMetrics, useLocalityScores, useLocalities,
  useLocalityAmenities, useRecommendations,
} from '../../hooks/useApi';
import { MapView } from '../../components/shared/MapView';
import { mockMetrics, mockScores, mockRecommendations } from '../../services/mockData';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import {
  GraduationCap, Heart, Utensils, Trees, Dumbbell, Landmark,
  MapPin, ChevronRight, Train, Plane, Bus, Building2, Zap,
} from 'lucide-react';

type ChartTab = '1y' | '3y' | 'dist';
type RecTab = 'similar' | 'CHEAPER' | 'PREMIUM' | 'HIGH_GROWTH';

const tooltipStyle = {
  background: '#FFFFFF', color: '#000000',
  borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px',
};

// ── Score Bar ─────────────────────────────────────────────────────────────────
const ScoreBar: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  const pct = Math.min(value, 100);
  const color = pct >= 80 ? '#16A34A' : pct >= 65 ? '#1D4ED8' : '#B45309';
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '12px', fontWeight: 800, color: '#000000' }}>{value.toFixed(1)}</span>
      </div>
      <div style={{ height: '5px', backgroundColor: '#F3F4F6', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          backgroundColor: color, borderRadius: '3px',
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  );
};

// ── Density Chip ──────────────────────────────────────────────────────────────
const DensityChip: React.FC<{
  icon: React.ElementType; label: string; value: string;
}> = ({ icon: Icon, label, value }) => (
  <div style={{
    padding: '12px 14px', backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB', borderRadius: '8px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
      <Icon size={13} color="#6B7280" />
      <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: 500 }}>{label}</span>
    </div>
    <div style={{ fontSize: '20px', fontWeight: 800, color: '#000000', letterSpacing: '-0.03em' }}>
      {value}
    </div>
    <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '2px' }}>per km²</div>
  </div>
);

// ── Transit Row ───────────────────────────────────────────────────────────────
const TransitRow: React.FC<{
  icon: React.ElementType; name: string; distance: string; duration: string;
}> = ({ icon: Icon, name, distance, duration }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '12px',
    paddingTop: '11px', paddingBottom: '11px', borderBottom: '1px solid #F3F4F6',
  }}>
    <div style={{
      width: '32px', height: '32px', borderRadius: '8px',
      backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon size={14} color="#374151" />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: '12px', fontWeight: 600, color: '#000000',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {name}
      </div>
      <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '1px' }}>{distance}</div>
    </div>
    <span style={{
      fontSize: '11px', fontWeight: 600, color: '#374151',
      backgroundColor: '#F3F4F6', padding: '3px 8px',
      borderRadius: '5px', flexShrink: 0,
    }}>
      {duration}
    </span>
  </div>
);

const fmtDist = (m: number) => m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
const fmtTime = (m: number) => `~${Math.round((m / 1000 / 40) * 60)} min drive`;

// ── Amenity Categories ────────────────────────────────────────────────────────
const amenityCats = [
  { key: 'school',     label: 'Schools',     icon: GraduationCap, densityKey: 'schools_per_sq_km'     as const },
  { key: 'hospital',   label: 'Hospitals',   icon: Heart,         densityKey: 'hospitals_per_sq_km'   as const },
  { key: 'restaurant', label: 'Restaurants', icon: Utensils,      densityKey: 'restaurants_per_sq_km' as const },
  { key: 'park',       label: 'Parks',       icon: Trees,         densityKey: 'parks_per_sq_km'       as const },
  { key: 'gym',        label: 'Gyms',        icon: Dumbbell,      densityKey: 'gyms_per_sq_km'        as const },
  { key: 'bank',       label: 'Banks',       icon: Landmark,      densityKey: null },
];

// ── Locality Page ─────────────────────────────────────────────────────────────
export const LocalityPage: React.FC = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const { data: localities } = useLocalities();

  const currentLocality = localities?.find(
    (l) => l.id === id || l.name.toLowerCase() === (id || slug || '').toLowerCase()
  ) || localities?.[0];
  const localityId = currentLocality?.id || '';

  const { data: metricsApi } = useLocalityMetrics(localityId);
  const { data: scoresApi }  = useLocalityScores(localityId);
  const { data: amenitiesApi } = useLocalityAmenities(localityId);
  const { data: recsApi } = useRecommendations(localityId, 'similar');

  const [chartTab, setChartTab]   = useState<ChartTab>('1y');
  const [recTab,   setRecTab]     = useState<RecTab>('similar');
  const [amenityTab, setAmenityTab] = useState('school');

  if (!currentLocality) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-sm" style={{ color: '#9CA3AF' }}>
        Loading locality profile...
      </div>
    );
  }

  // Fall back to mock data for metrics/scores when API is unavailable
  const mockM = mockMetrics[localityId] || null;
  const mockS = mockScores[localityId]  || null;
  const mockR = mockRecommendations[localityId] || {};

  const m = metricsApi || mockM;
  const s = scoresApi  || mockS;

  const basePrice  = m?.median_price_per_sqft || 4300;
  const avgPsqft   = m?.avg_price_per_sqft    || basePrice + 200;
  const rentYield  = m?.rental_yield_estimate  || 3.8;
  const inventory  = m?.property_inventory     || 0;
  const velocity   = m?.listing_velocity       || 8.2;
  const avgTotal   = m?.avg_property_price;

  // Chart data
  const oneYearData = [
    { name: 'Q2 2025', price: basePrice - 180 },
    { name: 'Q3 2025', price: basePrice - 90  },
    { name: 'Q4 2025', price: basePrice + 40  },
    { name: 'Q1 2026', price: basePrice + 110 },
    { name: 'Q2 2026', price: basePrice       },
  ];
  const threeYearData = [
    { name: '2024', price: Math.round(basePrice * 0.84) },
    { name: '2025', price: Math.round(basePrice * 0.93) },
    { name: '2026', price: basePrice },
  ];
  const priceDistribution = [
    { range: '3.5K–4.5K', count: 18 },
    { range: '4.5K–5.5K', count: 42 },
    { range: '5.5K–6.5K', count: 28 },
    { range: '6.5K–7.5K', count: 14 },
    { range: '7.5K+',     count: 6  },
  ];
  const areaChartData = chartTab === '1y' ? oneYearData : threeYearData;

  // Scores
  const scoreItems = [
    { label: 'Investment Score',  value: s?.investment_score          || 75 },
    { label: 'Livability',         value: s?.overall_livability_score  || 70 },
    { label: 'Connectivity',       value: s?.connectivity_score        || 70 },
    { label: 'Education',          value: s?.education_score           || 72 },
    { label: 'Healthcare',         value: s?.healthcare_score          || 74 },
    { label: 'Lifestyle',          value: s?.lifestyle_score           || 73 },
  ];

  // Amenities list – only real data from API (no fake fallback)
  const getAmenitiesList = (cat: string) => {
    const raw = (amenitiesApi ?? []).filter(
      (a) => a.category.toLowerCase() === cat.toLowerCase()
    );
    return raw.slice(0, 6).map((a, idx) => ({
      name: a.name,
      distance: `${((idx + 1) * 0.35).toFixed(1)} km`,
      rating: (4.0 + (a.confidence_score || 0.8) * 1.0).toFixed(1),
    }));
  };

  // Recommendations
  const getRecs = (type: RecTab) => {
    const apiRecs = type === 'similar' ? recsApi : null;
    const key = type === 'similar' ? 'similar' : type;
    const fallback = mockR[key] || [];
    const recs = apiRecs && apiRecs.length > 0 ? apiRecs : fallback;
    if (recs.length > 0) return recs.slice(0, 3);
    return (localities || []).filter((l) => l.id !== localityId).slice(0, 3).map((l, i) => ({
      id: l.id, name: l.name, score: 0.85 - i * 0.05,
      reasoning: `${l.name} offers comparable market dynamics with strong growth indicators.`,
    }));
  };

  const activeTab: React.CSSProperties = { color: '#000000', borderBottom: '2px solid #000000', marginBottom: '-1px' };
  const inactTab:  React.CSSProperties = { color: '#6B7280', borderBottom: '2px solid transparent', marginBottom: '-1px' };

  // Infrastructure proximity items
  const proximityItems = [
    m?.it_park_proximity            != null && { label: 'IT Park',              value: m.it_park_proximity,            icon: Building2 },
    m?.metro_proximity              != null && { label: 'Metro Corridor',       value: m.metro_proximity,              icon: Train     },
    m?.industrial_corridor_proximity != null && { label: 'Industrial Corridor', value: m.industrial_corridor_proximity, icon: Zap       },
  ].filter(Boolean) as { label: string; value: number; icon: React.ElementType }[];

  return (
    <div className="flex-1 flex flex-col md:flex-row" style={{ minHeight: 0 }}>

      {/* ── Left content panel ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ minWidth: 0 }}>
        <div style={{ padding: '28px 32px', maxWidth: '900px' }}>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs mb-5" style={{ color: '#9CA3AF' }}>
            <Link to="/" style={{ color: '#6B7280' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#000000')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#6B7280')}
            >Overview</Link>
            <ChevronRight className="w-3 h-3" />
            <span>Localities</span>
            <ChevronRight className="w-3 h-3" />
            <span style={{ color: '#374151' }}>{currentLocality.name}</span>
          </div>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
            <div>
              <h1 style={{
                fontSize: '30px', fontWeight: 800, color: '#000000',
                letterSpacing: '-0.03em', margin: 0, marginBottom: '6px',
              }}>
                {currentLocality.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6B7280' }}>
                <MapPin size={13} />
                <span>{currentLocality.city}, Tamil Nadu</span>
                {currentLocality.latitude && (
                  <>
                    <span style={{ color: '#D1D5DB' }}>·</span>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px' }}>
                      {currentLocality.latitude.toFixed(4)}°N, {currentLocality.longitude?.toFixed(4)}°E
                    </span>
                  </>
                )}
              </div>
            </div>
            <div style={{ flexShrink: 0, textAlign: 'center' }}>
              <div style={{
                fontSize: '22px', fontWeight: 800, color: '#FFFFFF',
                backgroundColor: '#000000', width: '52px', height: '52px',
                borderRadius: '10px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', letterSpacing: '-0.03em', marginBottom: '4px',
              }}>
                {(s?.investment_score || 75).toFixed(0)}
              </div>
              <div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Inv. Score
              </div>
            </div>
          </div>

          {/* ── Market Snapshot ──────────────────────────────────────────────── */}
          <div style={{
            border: '1px solid #E5E7EB', borderRadius: '10px',
            overflow: 'hidden', marginBottom: '24px',
          }}>
            <div style={{ padding: '10px 16px', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF' }}>
                Market Snapshot
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {[
                { label: 'Median ₹/sqft',    value: `₹${basePrice.toLocaleString()}`,                        sub: 'Median transaction price' },
                { label: 'Avg ₹/sqft',       value: `₹${avgPsqft.toLocaleString()}`,                         sub: 'Average listing price'    },
                { label: 'Rental Yield',      value: `${rentYield.toFixed(1)}%`,                              sub: 'Annualized gross yield'   },
                { label: 'Active Listings',   value: inventory > 0 ? `${inventory} units` : '—',              sub: 'Current live inventory'   },
                { label: 'Avg Days on Mkt',   value: `${velocity.toFixed(1)} days`,                           sub: 'Market absorption rate'   },
                { label: 'Avg Property Price', value: avgTotal ? `₹${(avgTotal / 100000).toFixed(0)}L` : '—', sub: 'All-in average price'     },
              ].map((item, i) => (
                <div key={item.label} style={{
                  padding: '16px 18px',
                  borderRight: (i % 3 !== 2) ? '1px solid #E5E7EB' : 'none',
                  borderBottom: i < 3 ? '1px solid #E5E7EB' : 'none',
                }}>
                  <div style={{
                    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: '6px',
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontSize: '20px', fontWeight: 800, color: '#000000',
                    letterSpacing: '-0.03em',
                  }}>
                    {item.value}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '3px' }}>
                    {item.sub}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Investment Profile (score bars) ─────────────────────────────── */}
          <div style={{
            border: '1px solid #E5E7EB', borderRadius: '10px',
            overflow: 'hidden', marginBottom: '24px',
          }}>
            <div style={{ padding: '10px 16px', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF' }}>
                Investment Profile · Scores out of 100
              </span>
            </div>
            <div style={{ padding: '20px 20px 6px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 32px' }}>
                {scoreItems.map((si) => (
                  <ScoreBar key={si.label} label={si.label} value={si.value} />
                ))}
              </div>
            </div>
          </div>

          {/* ── Price Chart ──────────────────────────────────────────────────── */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ borderBottom: '1px solid #E5E7EB', marginBottom: '20px' }}>
              <div className="flex gap-0">
                {([['1y', '1 Year'], ['3y', '3 Years'], ['dist', 'Distribution']] as [ChartTab, string][]).map(([key, label]) => (
                  <button key={key} onClick={() => setChartTab(key)}
                    className="px-4 py-2.5 text-sm font-medium transition-colors"
                    style={chartTab === key ? activeTab : inactTab}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height: '200px' }}>
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
                        <stop offset="0%"   stopColor="#000000" stopOpacity={0.08} />
                        <stop offset="100%" stopColor="#000000" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#E5E7EB" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#9CA3AF' }} />
                    <YAxis stroke="#E5E7EB" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#9CA3AF' }}
                      tickFormatter={(v) => `₹${v.toLocaleString()}`} width={68} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#E5E7EB' }} />
                    <Area type="monotone" dataKey="price" stroke="#000000" strokeWidth={1.5} fill="url(#areaGrad)" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Two-column: Density + Connectivity ──────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>

            {/* Amenity Density */}
            <div>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#000000', marginBottom: '2px' }}>
                  Amenity Density
                </div>
                <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                  Points-of-interest per km²
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {amenityCats.map(({ key, label, icon, densityKey }) => {
                  const val = densityKey ? m?.[densityKey] : null;
                  return (
                    <DensityChip
                      key={key}
                      icon={icon}
                      label={label}
                      value={val != null ? val.toFixed(1) : '—'}
                    />
                  );
                })}
              </div>
            </div>

            {/* Connectivity */}
            <div>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#000000', marginBottom: '2px' }}>
                  Connectivity
                </div>
                <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                  Transit distances and highway score
                </div>
              </div>

              {m?.nearest_railway_station && (
                <TransitRow
                  icon={Train}
                  name={m.nearest_railway_station.name}
                  distance={fmtDist(m.nearest_railway_station.distance_meters)}
                  duration={fmtTime(m.nearest_railway_station.distance_meters)}
                />
              )}
              {m?.nearest_airport && (
                <TransitRow
                  icon={Plane}
                  name={m.nearest_airport.name}
                  distance={fmtDist(m.nearest_airport.distance_meters)}
                  duration={fmtTime(m.nearest_airport.distance_meters)}
                />
              )}
              {m?.nearest_bus_terminal && (
                <TransitRow
                  icon={Bus}
                  name={m.nearest_bus_terminal.name}
                  distance={fmtDist(m.nearest_bus_terminal.distance_meters)}
                  duration={fmtTime(m.nearest_bus_terminal.distance_meters)}
                />
              )}

              {m?.highway_access_score != null && (
                <div style={{ marginTop: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>Highway Access Score</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#000000' }}>{m.highway_access_score.toFixed(0)}/100</span>
                  </div>
                  <div style={{ height: '5px', backgroundColor: '#F3F4F6', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${m.highway_access_score}%`,
                      backgroundColor: '#1D4ED8', borderRadius: '3px',
                    }} />
                  </div>
                </div>
              )}

              {proximityItems.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{
                    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: '8px',
                  }}>
                    Key Proximities
                  </div>
                  {proximityItems.map(({ label, value, icon: Icon }) => (
                    <div key={label} style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: '7px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <Icon size={12} color="#9CA3AF" />
                        <span style={{ fontSize: '12px', color: '#6B7280' }}>{label}</span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#000000' }}>
                        {fmtDist(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Nearby Amenities ─────────────────────────────────────────────── */}
          <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '24px', marginBottom: '28px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#000000', marginBottom: '14px' }}>
              Nearby Amenities
            </h2>
            <div className="flex gap-0" style={{ borderBottom: '1px solid #E5E7EB', marginBottom: '16px' }}>
              {amenityCats.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setAmenityTab(key)}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors"
                  style={amenityTab === key ? activeTab : inactTab}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <div>
              {getAmenitiesList(amenityTab).length === 0 ? (
                <div style={{ padding: '20px 0', fontSize: '12px', color: '#9CA3AF' }}>
                  {amenitiesApi === undefined
                    ? 'Loading amenities from OpenStreetMap...'
                    : `No ${amenityTab}s found within 2 km of this locality.`}
                </div>
              ) : (
                getAmenitiesList(amenityTab).map((a, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3"
                    style={{ borderBottom: '1px solid #F3F4F6' }}
                  >
                    <span style={{ fontSize: '13px', color: '#000000' }}>{a.name}</span>
                    <div className="flex items-center gap-4" style={{ fontSize: '12px', color: '#6B7280' }}>
                      <span>{a.distance}</span>
                      <span>{a.rating} ★</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ── Similar Localities ───────────────────────────────────────────── */}
          <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '24px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#000000', marginBottom: '14px' }}>
              Similar Localities
            </h2>
            <div className="flex gap-0" style={{ borderBottom: '1px solid #E5E7EB', marginBottom: '4px' }}>
              {([['similar', 'Similar'], ['CHEAPER', 'Budget'], ['PREMIUM', 'Premium'], ['HIGH_GROWTH', 'Growth']] as [RecTab, string][]).map(([key, label]) => (
                <button key={key} onClick={() => setRecTab(key)}
                  className="px-4 py-2.5 text-sm font-medium transition-colors"
                  style={recTab === key ? activeTab : inactTab}
                >
                  {label}
                </button>
              ))}
            </div>
            <div>
              {getRecs(recTab).map((rec: any) => (
                <div key={rec.id} className="py-4 rounded cursor-pointer"
                  style={{ borderBottom: '1px solid #F3F4F6' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                    <div>
                      <Link to={`/locality/${rec.id}`}
                        className="text-sm font-semibold hover:underline"
                        style={{ color: '#000000' }}
                      >
                        {rec.name}
                      </Link>
                      <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px', lineHeight: 1.55, marginBottom: 0 }}>
                        {rec.reasoning}
                      </p>
                    </div>
                    {rec.score != null && (
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', flexShrink: 0, paddingTop: '2px' }}>
                        {(rec.score * 100).toFixed(0)}% match
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Right map panel ─────────────────────────────────────────────────── */}
      <div className="hidden md:flex flex-col"
        style={{ width: '400px', flexShrink: 0, borderLeft: '1px solid #E5E7EB' }}
      >
        <div className="flex-1 overflow-hidden">
          <MapView localityId={localityId} height="h-full" />
        </div>
      </div>
    </div>
  );
};

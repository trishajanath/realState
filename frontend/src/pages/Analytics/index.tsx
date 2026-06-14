import React, { useState } from 'react';
import { useLocalities } from '../../hooks/useApi';
import { mockScores, mockMetrics } from '../../services/mockData';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import { TrendingUp, Percent, Landmark, Activity, MapPin, Calendar } from 'lucide-react';

type TabKey = 'trends' | 'yields' | 'infra' | 'rankings';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'trends', label: 'Price Trends', icon: TrendingUp },
  { key: 'yields', label: 'Yield Matrix', icon: Percent },
  { key: 'infra', label: 'Infrastructure', icon: Landmark },
  { key: 'rankings', label: 'Rankings', icon: Activity },
];

const tooltipStyle = {
  background: '#FFFFFF',
  color: '#000000',
  borderRadius: '8px',
  border: '1px solid #E5E7EB',
  fontSize: '12px',
};

export const AnalyticsPage: React.FC = () => {
  const { data: localities } = useLocalities();
  const [activeTab, setActiveTab] = useState<TabKey>('trends');

  const priceTrendsData = [
    { year: '2023', Saravanampatti: 3500, Peelamedu: 5500, RSPuram: 8200, Kalapatti: 3400 },
    { year: '2024', Saravanampatti: 3850, Peelamedu: 6050, RSPuram: 8850, Kalapatti: 3750 },
    { year: '2025', Saravanampatti: 4200, Peelamedu: 6480, RSPuram: 9380, Kalapatti: 4050 },
    { year: '2026', Saravanampatti: 4500, Peelamedu: 6800, RSPuram: 9800, Kalapatti: 4300 },
  ];

  const yieldData = localities?.map((l) => {
    const m = mockMetrics[l.id] || { rental_yield_estimate: 3.5 };
    return { name: l.name, yield: m.rental_yield_estimate || 3.5 };
  }) || [];

  const rankingData = localities
    ?.map((l) => {
      const s = mockScores[l.id] || { investment_score: 75, overall_livability_score: 70, connectivity_score: 70 };
      const m = mockMetrics[l.id] || { avg_price_per_sqft: 4000 };
      const safety = s.healthcare_score ? (s.healthcare_score + (s.education_score || 70)) / 2 : 75;
      return {
        id: l.id,
        name: l.name,
        invest: s.investment_score || 75,
        safety,
        connect: s.connectivity_score || 70,
        livability: s.overall_livability_score || 70,
        price: m.avg_price_per_sqft || 4200,
      };
    })
    .sort((a, b) => b.invest - a.invest) || [];

  const infraItems = [
    { title: 'Avinashi Road Flyover', phase: 'Phase 2 Completion', date: 'Q4 2026', status: 'In Progress', impact: 'Reduces peak travel by 35%, improves Peelamedu/Hopes College corridors.' },
    { title: 'Coimbatore Metro Line 1', phase: 'Zoning Approvals', date: 'Q2 2027', status: 'Approved', impact: 'Kalapatti–Saravanampatti link; +12–15% sqft near stations.' },
    { title: 'CHIL SEZ Corridor Expansion', phase: 'Development Kickoff', date: 'Q1 2027', status: 'Planning', impact: '40,000 new seats; accelerates Saravanampatti rental velocity.' },
    { title: 'DB Road Pedestrian Plaza', phase: 'Phase 1', date: 'Completed', status: 'Completed', impact: 'Improved RS Puram lifestyle scores and commercial metrics.' },
  ];

  const summaryStats = [
    { label: 'City Avg Price', value: '₹6,350/sqft', note: '+5.4% vs prev year' },
    { label: 'Rental Index Avg', value: '3.78%', note: 'Baseline: 3.5%' },
    { label: 'Appreciation Grade', value: 'A−', note: 'High liquidity' },
    { label: 'Active Inventory', value: '715 units', note: '7 active sectors' },
  ];

  const statusColor = (s: string) => {
    if (s === 'Completed') return { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' };
    if (s === 'Approved') return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
    if (s === 'In Progress') return { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' };
    return { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' };
  };

  return (
    <div className="flex-1 p-8 max-w-[1600px] mx-auto w-full">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: '#000000', letterSpacing: '-0.03em' }}>
          Analytics
        </h1>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
          Comparative price indices, yield matrices, and infrastructure timelines
        </p>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        {summaryStats.map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5">
            <span className="text-xs uppercase tracking-wider" style={{ color: '#9CA3AF' }}>{s.label}</span>
            <span className="text-2xl font-semibold" style={{ color: '#000000' }}>{s.value}</span>
            <span className="text-xs" style={{ color: '#6B7280' }}>{s.note}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-8" style={{ borderBottom: '1px solid #E5E7EB' }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative"
              style={{
                color: active ? '#000000' : '#6B7280',
                borderBottom: active ? '2px solid #000000' : '2px solid transparent',
                marginBottom: '-1px',
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.color = '#6B7280';
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Price Trends */}
      {activeTab === 'trends' && (
        <div>
          <div className="mb-4">
            <h2 className="text-sm font-medium" style={{ color: '#6B7280' }}>
              Price appreciation path (INR/sqft) · 4-year view
            </h2>
          </div>
          <div style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceTrendsData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="0" />
                <XAxis dataKey="year" stroke="#E5E7EB" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#9CA3AF' }} />
                <YAxis stroke="#E5E7EB" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#9CA3AF' }} width={60} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#E5E7EB' }} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#6B7280' }} />
                <Line type="monotone" dataKey="Saravanampatti" stroke="#2563EB" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Peelamedu" stroke="#10B981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="RSPuram" stroke="#7C3AED" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Kalapatti" stroke="#F59E0B" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab: Yields */}
      {activeTab === 'yields' && (
        <div>
          <div className="mb-4">
            <h2 className="text-sm font-medium" style={{ color: '#6B7280' }}>
              Annualized rental yield (%) by micro-sector
            </h2>
          </div>
          <div style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yieldData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="0" vertical={false} />
                <XAxis dataKey="name" stroke="#E5E7EB" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#9CA3AF' }} />
                <YAxis stroke="#E5E7EB" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#9CA3AF' }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#F9FAFB' }} />
                <Bar dataKey="yield" fill="#000000" radius={[2, 2, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab: Infrastructure */}
      {activeTab === 'infra' && (
        <div className="space-y-0">
          <div
            className="grid gap-4 px-0 py-2 text-xs uppercase tracking-wider"
            style={{
              gridTemplateColumns: '2fr 160px 100px 80px',
              color: '#9CA3AF',
              borderBottom: '1px solid #E5E7EB',
            }}
          >
            <span>Project</span>
            <span>Phase</span>
            <span>Target</span>
            <span>Status</span>
          </div>
          {infraItems.map((item, idx) => (
            <div key={idx}>
              <div
                className="grid gap-4 py-4"
                style={{ gridTemplateColumns: '2fr 160px 100px 80px' }}
              >
                <div>
                  <div className="text-sm font-medium" style={{ color: '#000000' }}>
                    {item.title}
                  </div>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: '#6B7280' }}>
                    {item.impact}
                  </p>
                </div>
                <span className="text-sm self-start pt-0.5" style={{ color: '#374151' }}>
                  {item.phase}
                </span>
                <div className="flex items-start gap-1 self-start pt-0.5">
                  <Calendar className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#9CA3AF' }} />
                  <span className="text-sm" style={{ color: '#374151' }}>{item.date}</span>
                </div>
                <div className="self-start pt-0.5">
                  {(() => {
                    const c = statusColor(item.status);
                    return (
                      <span className="text-xs px-2 py-0.5 rounded font-medium"
                        style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}
                      >
                        {item.status}
                      </span>
                    );
                  })()}
                </div>
              </div>
              {idx < infraItems.length - 1 && (
                <div style={{ height: '1px', backgroundColor: '#F3F4F6' }} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Rankings */}
      {activeTab === 'rankings' && (
        <div>
          <div
            className="grid gap-4 py-2 text-xs uppercase tracking-wider"
            style={{
              gridTemplateColumns: '24px 1fr 100px 100px 100px 100px 120px',
              color: '#9CA3AF',
              borderBottom: '1px solid #E5E7EB',
            }}
          >
            <span>#</span>
            <span>Locality</span>
            <span>Investment</span>
            <span>Safety</span>
            <span>Connectivity</span>
            <span>Livability</span>
            <span className="text-right">Avg Price</span>
          </div>

          {rankingData.map((item, idx) => (
            <div key={item.id}>
              <div
                className="grid gap-4 py-3 transition-colors duration-150 cursor-default"
                style={{
                  gridTemplateColumns: '24px 1fr 100px 100px 100px 100px 120px',
                  borderBottom: idx < rankingData.length - 1 ? '1px solid #F3F4F6' : 'none',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
              >
                <span className="text-xs" style={{ color: '#9CA3AF' }}>
                  {idx + 1}
                </span>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#9CA3AF' }} />
                  <span className="text-sm font-medium" style={{ color: '#000000' }}>
                    {item.name}
                  </span>
                </div>
                <span className="text-sm font-semibold" style={{ color: '#000000' }}>
                  {item.invest.toFixed(1)}%
                </span>
                <span className="text-sm" style={{ color: '#374151' }}>
                  {item.safety.toFixed(1)}%
                </span>
                <span className="text-sm" style={{ color: '#374151' }}>
                  {item.connect.toFixed(1)}%
                </span>
                <span className="text-sm" style={{ color: '#374151' }}>
                  {item.livability.toFixed(1)}%
                </span>
                <span className="text-sm font-medium text-right" style={{ color: '#000000' }}>
                  ₹{item.price.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

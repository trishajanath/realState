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
  background: '#0A0A0A',
  color: '#FFFFFF',
  borderRadius: '8px',
  border: '1px solid #2A2A2A',
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

  return (
    <div className="flex-1 p-8 max-w-[1600px] mx-auto w-full">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: '#FFFFFF', letterSpacing: '-0.03em' }}>
          Analytics
        </h1>
        <p className="text-sm mt-1" style={{ color: '#71717A' }}>
          Comparative price indices, yield matrices, and infrastructure timelines
        </p>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
        {summaryStats.map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5">
            <span className="text-xs uppercase tracking-wider" style={{ color: '#52525B' }}>{s.label}</span>
            <span className="text-2xl font-semibold" style={{ color: '#FFFFFF' }}>{s.value}</span>
            <span className="text-xs" style={{ color: '#71717A' }}>{s.note}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        className="flex gap-0 mb-8"
        style={{ borderBottom: '1px solid #1F1F1F' }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative"
              style={{
                color: active ? '#FFFFFF' : '#71717A',
                borderBottom: active ? '1px solid #FFFFFF' : '1px solid transparent',
                marginBottom: '-1px',
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.color = '#A1A1AA';
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.color = '#71717A';
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
            <h2 className="text-sm font-medium" style={{ color: '#A1A1AA' }}>
              Price appreciation path (INR/sqft) · 4-year view
            </h2>
          </div>
          <div style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceTrendsData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#111111" strokeDasharray="0" />
                <XAxis dataKey="year" stroke="#3F3F46" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#3F3F46" fontSize={11} tickLine={false} axisLine={false} width={60} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#2A2A2A' }} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#71717A' }} />
                <Line type="monotone" dataKey="Saravanampatti" stroke="#FFFFFF" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="Peelamedu" stroke="#A1A1AA" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="RSPuram" stroke="#71717A" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="Kalapatti" stroke="#52525B" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab: Yields */}
      {activeTab === 'yields' && (
        <div>
          <div className="mb-4">
            <h2 className="text-sm font-medium" style={{ color: '#A1A1AA' }}>
              Annualized rental yield (%) by micro-sector
            </h2>
          </div>
          <div style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yieldData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#111111" strokeDasharray="0" vertical={false} />
                <XAxis dataKey="name" stroke="#3F3F46" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#3F3F46" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#111111' }} />
                <Bar dataKey="yield" fill="#FFFFFF" radius={[2, 2, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab: Infrastructure */}
      {activeTab === 'infra' && (
        <div className="space-y-0">
          {/* Table header */}
          <div
            className="grid gap-4 px-0 py-2 text-xs uppercase tracking-wider"
            style={{
              gridTemplateColumns: '2fr 160px 100px 80px',
              color: '#52525B',
              borderBottom: '1px solid #1F1F1F',
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
                  <div className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
                    {item.title}
                  </div>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: '#71717A' }}>
                    {item.impact}
                  </p>
                </div>
                <span className="text-sm self-start pt-0.5" style={{ color: '#A1A1AA' }}>
                  {item.phase}
                </span>
                <div className="flex items-start gap-1 self-start pt-0.5">
                  <Calendar className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#52525B' }} />
                  <span className="text-sm" style={{ color: '#A1A1AA' }}>{item.date}</span>
                </div>
                <div className="self-start pt-0.5">
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: '#111111',
                      color: item.status === 'Completed' ? '#FFFFFF' : '#A1A1AA',
                      border: '1px solid #1F1F1F',
                    }}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
              {idx < infraItems.length - 1 && (
                <div style={{ height: '1px', backgroundColor: '#111111' }} />
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
              color: '#52525B',
              borderBottom: '1px solid #1F1F1F',
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
                  borderBottom: idx < rankingData.length - 1 ? '1px solid #111111' : 'none',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = '#0A0A0A')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
                }
              >
                <span className="text-xs" style={{ color: '#52525B' }}>
                  {idx + 1}
                </span>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#52525B' }} />
                  <span className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
                    {item.name}
                  </span>
                </div>
                <span className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>
                  {item.invest.toFixed(1)}%
                </span>
                <span className="text-sm" style={{ color: '#A1A1AA' }}>
                  {item.safety.toFixed(1)}%
                </span>
                <span className="text-sm" style={{ color: '#A1A1AA' }}>
                  {item.connect.toFixed(1)}%
                </span>
                <span className="text-sm" style={{ color: '#A1A1AA' }}>
                  {item.livability.toFixed(1)}%
                </span>
                <span className="text-sm font-medium text-right" style={{ color: '#FFFFFF' }}>
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

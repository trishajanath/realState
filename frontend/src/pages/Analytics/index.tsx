import React, { useState } from 'react';
import { useLocalities, useInfraProjects } from '../../hooks/useApi';
import { mockScores, mockMetrics } from '../../services/mockData';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts';
import { TrendingUp, Percent, Landmark, Activity, MapPin, Calendar } from 'lucide-react';

type TabKey = 'trends' | 'yields' | 'infra' | 'rankings';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'trends',   label: 'Price Trends',   icon: TrendingUp },
  { key: 'yields',   label: 'Yield Matrix',   icon: Percent    },
  { key: 'infra',    label: 'Infrastructure', icon: Landmark   },
  { key: 'rankings', label: 'Rankings',       icon: Activity   },
];

const tooltipStyle = {
  background: '#FFFFFF', color: '#000000',
  borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px',
};

const statusColor = (s: string) => {
  if (s === 'Completed')  return { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' };
  if (s === 'Approved')   return { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' };
  if (s === 'In Progress')return { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' };
  return                         { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' };
};

// ── Analytics Page ────────────────────────────────────────────────────────────
export const AnalyticsPage: React.FC = () => {
  const { data: localities } = useLocalities();
  const { data: infraProjects } = useInfraProjects();
  const [activeTab, setActiveTab] = useState<TabKey>('trends');

  // ── Chart data ──────────────────────────────────────────────────────────────
  const priceTrendsData = [
    { year: '2023', Saravanampatti: 3500, Peelamedu: 5500, RSPuram: 8200, Kalapatti: 3400 },
    { year: '2024', Saravanampatti: 3850, Peelamedu: 6050, RSPuram: 8850, Kalapatti: 3750 },
    { year: '2025', Saravanampatti: 4200, Peelamedu: 6480, RSPuram: 9380, Kalapatti: 4050 },
    { year: '2026', Saravanampatti: 4500, Peelamedu: 6800, RSPuram: 9800, Kalapatti: 4300 },
  ];

  const yieldData = localities?.map((l) => {
    const mq = mockMetrics[l.id] || { rental_yield_estimate: 3.5 };
    return { name: l.name, yield: mq.rental_yield_estimate || 3.5 };
  }) || [];

  // ── Rankings ────────────────────────────────────────────────────────────────
  const rankingData = localities
    ?.map((l) => {
      const s = mockScores[l.id]  || { investment_score: 75, overall_livability_score: 70, connectivity_score: 70, lifestyle_score: 72 };
      const mq = mockMetrics[l.id] || { avg_price_per_sqft: 4000, rental_yield_estimate: 3.5, property_inventory: 0, listing_velocity: 9 };
      const safety = s.healthcare_score
        ? (s.healthcare_score + (s.education_score || 70)) / 2
        : 75;
      return {
        id:         l.id,
        name:       l.name,
        invest:     s.investment_score        || 75,
        livability: s.overall_livability_score || 70,
        connect:    s.connectivity_score       || 70,
        lifestyle:  s.lifestyle_score          || 72,
        safety,
        yield_:     mq.rental_yield_estimate   || 3.5,
        inventory:  mq.property_inventory      || 0,
        price:      mq.avg_price_per_sqft      || 4200,
        velocity:   mq.listing_velocity        || 9,
      };
    })
    .sort((a, b) => b.invest - a.invest) || [];

  // ── Infrastructure – real data from API (seeded + RSS news) ──────────────────
  const infraItems = (infraProjects ?? []).map((p) => ({
    title: p.title,
    phase: p.phase ?? p.source ?? '',
    date: p.target_date ?? p.published_at ?? '',
    status: p.status ?? 'News',
    impact: p.impact ?? p.description ?? '',
    corridors: p.corridors ?? p.affected_localities ?? [],
    source_url: p.source_url ?? p.link,
  }));

  // ── Summary KPIs ────────────────────────────────────────────────────────────
  const summaryStats = [
    { label: 'City Avg Price',    value: '₹6,350/sqft', note: '+5.4% vs prev year',    delta: true  },
    { label: 'Rental Index Avg',  value: '3.78%',        note: 'Baseline: 3.5%',        delta: true  },
    { label: 'Appreciation Grade', value: 'A−',           note: 'High liquidity class',  delta: null  },
    { label: 'Active Inventory',  value: '715 units',    note: '7 active sectors',       delta: true  },
  ];

  // ── Rankings columns ─────────────────────────────────────────────────────────
  const RCOLS = '24px 1fr 82px 82px 82px 82px 70px 72px 110px';

  return (
    <div className="flex-1 p-8 max-w-[1600px] mx-auto w-full">

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '30px', fontWeight: 800, color: '#000000', letterSpacing: '-0.03em', margin: 0, marginBottom: '5px' }}>
          Analytics
        </h1>
        <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>
          Comparative price indices, yield matrices, rankings, and infrastructure timelines
        </p>
      </div>

      {/* Summary KPIs */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0', border: '1px solid #E5E7EB', borderRadius: '10px',
        overflow: 'hidden', marginBottom: '28px',
      }}>
        {summaryStats.map((s, i) => (
          <div key={s.label} style={{
            padding: '18px 20px',
            borderRight: i < summaryStats.length - 1 ? '1px solid #E5E7EB' : 'none',
          }}>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9CA3AF', marginBottom: '8px' }}>
              {s.label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '3px' }}>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#000000', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {s.value}
              </div>
            </div>
            <div style={{ fontSize: '11px', color: s.delta ? '#16A34A' : '#6B7280' }}>
              {s.note}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0" style={{ borderBottom: '1px solid #E5E7EB', marginBottom: '24px' }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors"
              style={{
                color: active ? '#000000' : '#6B7280',
                borderBottom: active ? '2px solid #000000' : '2px solid transparent',
                marginBottom: '-1px',
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = '#374151'; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = '#6B7280'; }}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Price Trends ───────────────────────────────────────────────────── */}
      {activeTab === 'trends' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#000000', marginBottom: '3px' }}>
              Price Appreciation Path · INR/sqft · 4-Year View
            </div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
              Saravanampatti and Kalapatti lead growth; RS Puram holds premium position with lower appreciation velocity
            </div>
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
                <Line type="monotone" dataKey="Peelamedu"      stroke="#10B981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="RSPuram"         stroke="#7C3AED" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Kalapatti"       stroke="#F59E0B" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{
            marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden',
          }}>
            {[
              { name: 'Saravanampatti', yoy: '+9.2%', cagr: '8.7%', color: '#2563EB' },
              { name: 'Kalapatti',      yoy: '+7.6%', cagr: '7.5%', color: '#F59E0B' },
              { name: 'Peelamedu',      yoy: '+6.5%', cagr: '7.3%', color: '#10B981' },
              { name: 'RS Puram',       yoy: '+4.8%', cagr: '5.9%', color: '#7C3AED' },
            ].map((r, i) => (
              <div key={r.name} style={{
                padding: '14px 16px',
                borderRight: i < 3 ? '1px solid #E5E7EB' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: r.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#000000' }}>{r.name}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '2px' }}>YoY</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#16A34A' }}>{r.yoy}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '2px' }}>3Y CAGR</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#000000' }}>{r.cagr}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Yield Matrix ───────────────────────────────────────────────────── */}
      {activeTab === 'yields' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#000000', marginBottom: '3px' }}>
              Annualized Rental Yield (%) · By Micro-Sector
            </div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
              Singanallur leads at 4.5% · RS Puram lowest at 3.1% due to premium pricing
            </div>
          </div>
          <div style={{ height: '300px', marginBottom: '24px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yieldData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="#F3F4F6" strokeDasharray="0" vertical={false} />
                <XAxis dataKey="name" stroke="#E5E7EB" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#9CA3AF' }} />
                <YAxis stroke="#E5E7EB" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: '#9CA3AF' }} domain={[0, 6]} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#F9FAFB' }} />
                <Bar dataKey="yield" fill="#000000" radius={[2, 2, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px',
              padding: '10px 16px', backgroundColor: '#F9FAFB',
              borderBottom: '1px solid #E5E7EB', fontSize: '10px',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF',
            }}>
              <span>Locality</span>
              <span style={{ textAlign: 'right' }}>Gross Yield</span>
              <span style={{ textAlign: 'right' }}>Net Est.</span>
              <span style={{ textAlign: 'right' }}>vs Baseline</span>
            </div>
            {yieldData.sort((a, b) => b.yield - a.yield).map((row, idx) => (
              <div key={row.name} style={{
                display: 'grid', gridTemplateColumns: '1fr 100px 100px 100px',
                padding: '12px 16px',
                borderBottom: idx < yieldData.length - 1 ? '1px solid #F3F4F6' : 'none',
                alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={12} color="#9CA3AF" />
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#000000' }}>{row.name}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#000000', textAlign: 'right', display: 'block' }}>
                  {row.yield.toFixed(1)}%
                </span>
                <span style={{ fontSize: '13px', color: '#374151', textAlign: 'right', display: 'block' }}>
                  {(row.yield * 0.82).toFixed(1)}%
                </span>
                <span style={{
                  fontSize: '12px', fontWeight: 700, textAlign: 'right', display: 'block',
                  color: row.yield >= 3.5 ? '#16A34A' : '#DC2626',
                }}>
                  {row.yield >= 3.5 ? '+' : ''}{(row.yield - 3.5).toFixed(2)}pp
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Infrastructure ─────────────────────────────────────────────────── */}
      {activeTab === 'infra' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#000000', marginBottom: '3px' }}>
              Active &amp; Approved Projects · Price Impact Forecast
            </div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
              {infraItems.length > 0
                ? `${infraItems.filter(i => i.status !== 'Completed').length} in pipeline · ${infraItems.filter(i => i.status === 'Completed').length} completed · Sources: NHAI, AAI, CHIL SEZ, The Hindu`
                : 'Loading infrastructure data...'}
            </div>
          </div>

          <div style={{ border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '2fr 160px 100px 90px',
              padding: '10px 20px', backgroundColor: '#F9FAFB',
              borderBottom: '1px solid #E5E7EB', fontSize: '10px',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF',
            }}>
              <span>Project · Impact</span>
              <span>Phase</span>
              <span>Target</span>
              <span>Status</span>
            </div>

            {infraItems.map((item, idx) => {
              const c = statusColor(item.status);
              return (
                <div key={idx}>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '2fr 160px 100px 90px',
                    padding: '18px 20px', alignItems: 'start',
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#000000' }}>
                          {item.title}
                        </div>
                        {item.source_url && (
                          <a
                            href={item.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: '10px', color: '#6B7280', textDecoration: 'underline', flexShrink: 0 }}
                          >
                            Source ↗
                          </a>
                        )}
                      </div>
                      <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 8px 0', lineHeight: 1.55 }}>
                        {item.impact}
                      </p>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600 }}>Corridors:</span>
                        {item.corridors.map((c2) => (
                          <span key={c2} style={{
                            fontSize: '10px', color: '#374151', backgroundColor: '#F3F4F6',
                            border: '1px solid #E5E7EB', padding: '2px 7px', borderRadius: '4px',
                          }}>
                            {c2}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span style={{ fontSize: '13px', color: '#374151', paddingTop: '2px' }}>
                      {item.phase}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', paddingTop: '2px' }}>
                      <Calendar className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#9CA3AF' }} />
                      <span style={{ fontSize: '13px', color: '#374151' }}>{item.date}</span>
                    </div>
                    <div style={{ paddingTop: '2px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '5px',
                        backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}`,
                        display: 'inline-block',
                      }}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                  {idx < infraItems.length - 1 && (
                    <div style={{ height: '1px', backgroundColor: '#F3F4F6', margin: '0 20px' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Rankings ───────────────────────────────────────────────────────── */}
      {activeTab === 'rankings' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#000000', marginBottom: '3px' }}>
              Full Micro-Sector Ranking · 9 Dimensions
            </div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
              Sorted by investment score · all scores out of 100
            </div>
          </div>

          <div style={{ border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: RCOLS,
              padding: '10px 16px', backgroundColor: '#F9FAFB',
              borderBottom: '1px solid #E5E7EB', fontSize: '10px',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF',
            }}>
              <span>#</span>
              <span>Locality</span>
              <span style={{ textAlign: 'right' }}>Invest.</span>
              <span style={{ textAlign: 'right' }}>Livability</span>
              <span style={{ textAlign: 'right' }}>Connect.</span>
              <span style={{ textAlign: 'right' }}>Lifestyle</span>
              <span style={{ textAlign: 'right' }}>Yield</span>
              <span style={{ textAlign: 'right' }}>Units</span>
              <span style={{ textAlign: 'right' }}>Avg ₹/sqft</span>
            </div>

            {rankingData.map((item, idx) => (
              <div key={item.id}>
                <div
                  style={{
                    display: 'grid', gridTemplateColumns: RCOLS,
                    padding: '12px 16px', cursor: 'default',
                    borderBottom: idx < rankingData.length - 1 ? '1px solid #F3F4F6' : 'none',
                    alignItems: 'center', transition: 'background-color 0.1s',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
                >
                  <span style={{ fontSize: '11px', color: '#C4C4C4', fontWeight: 500 }}>
                    {idx + 1}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <MapPin size={12} color="#9CA3AF" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#000000' }}>
                      {item.name}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '13px', fontWeight: 800, color: '#000000',
                    textAlign: 'right', display: 'block',
                  }}>
                    {item.invest.toFixed(1)}
                  </span>
                  <span style={{ fontSize: '13px', color: '#374151', textAlign: 'right', display: 'block' }}>
                    {item.livability.toFixed(1)}
                  </span>
                  <span style={{ fontSize: '13px', color: '#374151', textAlign: 'right', display: 'block' }}>
                    {item.connect.toFixed(1)}
                  </span>
                  <span style={{ fontSize: '13px', color: '#374151', textAlign: 'right', display: 'block' }}>
                    {item.lifestyle.toFixed(1)}
                  </span>
                  <span style={{
                    fontSize: '12px', fontWeight: 700, color: '#16A34A',
                    textAlign: 'right', display: 'block',
                  }}>
                    {item.yield_.toFixed(1)}%
                  </span>
                  <span style={{ fontSize: '12px', color: '#6B7280', textAlign: 'right', display: 'block' }}>
                    {item.inventory > 0 ? item.inventory : '—'}
                  </span>
                  <span style={{
                    fontSize: '12px', fontWeight: 600, color: '#000000',
                    textAlign: 'right', display: 'block',
                  }}>
                    ₹{item.price.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalityDashboard, useInfraProjects, type LocalityDashboardEntry } from '../../hooks/useApi';
import {
  MapPin, BarChart3, ArrowUpRight, Layers,
  ArrowLeftRight, Activity, TrendingUp,
} from 'lucide-react';

// ── Signal derivation ─────────────────────────────────────────────────────────
function deriveSignal(investmentScore: number): 'BUY' | 'HOLD' | 'WATCH' {
  if (investmentScore >= 87) return 'BUY';
  if (investmentScore >= 79) return 'HOLD';
  return 'WATCH';
}

function deriveTag(entry: LocalityDashboardEntry, all: LocalityDashboardEntry[]): string {
  if (!entry.metrics || !entry.scores) return 'Tracked';
  const maxInvest  = Math.max(...all.filter(e => e.scores).map(e => e.scores!.investment_score));
  const maxYield   = Math.max(...all.filter(e => e.metrics).map(e => e.metrics!.rental_yield_estimate));
  const maxLivab   = Math.max(...all.filter(e => e.scores).map(e => e.scores!.overall_livability_score));
  const minPrice   = Math.min(...all.filter(e => e.metrics).map(e => e.metrics!.avg_price_per_sqft));
  const maxConn    = Math.max(...all.filter(e => e.scores).map(e => e.scores!.connectivity_score));

  if (entry.scores.investment_score === maxInvest)  return 'Top Investment';
  if (entry.metrics.rental_yield_estimate === maxYield) return 'Highest Yield';
  if (entry.scores.overall_livability_score === maxLivab) return 'Best Livability';
  if (entry.metrics.avg_price_per_sqft === minPrice) return 'Most Affordable';
  if (entry.scores.connectivity_score === maxConn)  return 'Commercial Hub';
  if (entry.scores.investment_score >= 84)          return 'High Growth';
  if (entry.metrics.rental_yield_estimate >= 4.5)   return 'Rental Yield Play';
  return 'Stable Market';
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard = ({
  label, value, badge, badgePos, sub,
}: {
  label: string; value: string; badge?: string; badgePos?: boolean | null; sub?: string;
}) => (
  <div style={{
    backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB',
    borderRadius: '12px', padding: '18px 20px',
  }}>
    <div style={{
      fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.1em', color: '#9CA3AF', marginBottom: '8px',
    }}>
      {label}
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
      <div style={{
        fontSize: '26px', fontWeight: 800, color: '#000000',
        letterSpacing: '-0.04em', lineHeight: 1,
      }}>
        {value}
      </div>
      {badge && (
        <span style={{
          fontSize: '11px', fontWeight: 700,
          color: badgePos === null || badgePos === undefined ? '#6B7280' : badgePos ? '#16A34A' : '#DC2626',
          backgroundColor: badgePos === null || badgePos === undefined ? '#F3F4F6' : badgePos ? '#F0FDF4' : '#FEF2F2',
          padding: '2px 7px', borderRadius: '20px',
        }}>
          {badge}
        </span>
      )}
    </div>
    {sub && <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{sub}</div>}
  </div>
);

// ── Signal style ──────────────────────────────────────────────────────────────
const signalStyle = (s: string): React.CSSProperties => {
  if (s === 'BUY')  return { color: '#16A34A', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' };
  if (s === 'HOLD') return { color: '#1D4ED8', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE' };
  return                    { color: '#B45309', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' };
};

const COLS = '28px 1fr 150px 100px 72px 90px 68px 120px';

// ── Locality Table Row ────────────────────────────────────────────────────────
const LocalityTableRow: React.FC<{
  entry: LocalityDashboardEntry;
  tag: string;
  signal: 'BUY' | 'HOLD' | 'WATCH';
  navigate: (p: string) => void;
  isLast: boolean;
  rank: number;
}> = ({ entry, tag, signal, navigate, isLast, rank }) => {
  const [hovered, setHovered] = React.useState(false);
  const m = entry.metrics;
  const s = entry.scores;

  return (
    <div
      onClick={() => navigate(`/locality/${entry.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid', gridTemplateColumns: COLS,
        padding: '12px 20px', cursor: 'pointer',
        borderBottom: isLast ? 'none' : '1px solid #F3F4F6',
        backgroundColor: hovered ? '#FAFAFA' : 'transparent',
        alignItems: 'center', transition: 'background-color 0.1s',
      }}
    >
      <span style={{ fontSize: '11px', fontWeight: 500, color: '#C4C4C4' }}>{rank}</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '7px',
          backgroundColor: hovered ? '#F3F4F6' : '#F9FAFB',
          border: '1px solid #E5E7EB', display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <MapPin size={12} color="#6B7280" />
        </div>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#000000' }}>{entry.name}</span>
      </div>

      <div>
        <span style={{
          fontSize: '10px', padding: '3px 8px', borderRadius: '20px',
          backgroundColor: '#F3F4F6', color: '#374151', fontWeight: 600,
          display: 'inline-block',
        }}>
          {tag}
        </span>
      </div>

      <span style={{ fontSize: '13px', fontWeight: 700, color: '#000000', textAlign: 'right', display: 'block' }}>
        {m ? `₹${m.avg_price_per_sqft.toLocaleString()}` : '—'}
      </span>
      <span style={{ fontSize: '12px', fontWeight: 700, color: '#16A34A', textAlign: 'right', display: 'block' }}>
        {m ? `${m.rental_yield_estimate.toFixed(1)}%` : '—'}
      </span>
      <span style={{ fontSize: '12px', color: '#6B7280', textAlign: 'right', display: 'block' }}>
        {m ? m.property_inventory : '—'}
      </span>

      <div style={{ textAlign: 'right' }}>
        <span style={{
          fontSize: '11px', fontWeight: 800, color: '#FFFFFF',
          backgroundColor: '#000000', padding: '3px 8px', borderRadius: '5px',
        }}>
          {s ? s.investment_score.toFixed(1) : '—'}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{
          fontSize: '10px', fontWeight: 700,
          padding: '2px 6px', borderRadius: '4px',
          ...signalStyle(signal),
        }}>
          {signal}
        </span>
      </div>
    </div>
  );
};

// ── Quick Action Card ─────────────────────────────────────────────────────────
const QuickActionCard: React.FC<{
  label: string; sub: string; icon: React.ElementType; onClick: () => void;
}> = ({ label, sub, icon: Icon, onClick }) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
        borderRadius: '10px', textAlign: 'left',
        border: `1px solid ${hovered ? '#000000' : '#E5E7EB'}`,
        backgroundColor: hovered ? '#000000' : '#FFFFFF',
        cursor: 'pointer', transition: 'all 0.15s ease', width: '100%',
      }}
    >
      <div style={{
        width: '34px', height: '34px', borderRadius: '8px',
        backgroundColor: hovered ? 'rgba(255,255,255,0.12)' : '#F3F4F6',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={15} color={hovered ? '#FFFFFF' : '#374151'} />
      </div>
      <div style={{ textAlign: 'left', flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: hovered ? '#FFFFFF' : '#000000', transition: 'color 0.15s' }}>
          {label}
        </div>
        <div style={{ fontSize: '11px', color: hovered ? '#9CA3AF' : '#6B7280', marginTop: '1px', transition: 'color 0.15s' }}>
          {sub}
        </div>
      </div>
      <ArrowUpRight size={14} color={hovered ? 'rgba(255,255,255,0.4)' : '#D1D5DB'} style={{ flexShrink: 0 }} />
    </button>
  );
};

// ── Loading skeleton ──────────────────────────────────────────────────────────
const Skeleton = ({ width, height }: { width: string | number; height: string | number }) => (
  <div style={{
    width, height: typeof height === 'number' ? `${height}px` : height,
    backgroundColor: '#F3F4F6', borderRadius: '6px',
    animation: 'pulse 1.5s ease-in-out infinite',
  }} />
);

// ── Home Page ─────────────────────────────────────────────────────────────────
export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { data: dashboardData, isLoading: dashLoading } = useLocalityDashboard();
  const { data: infraProjects, isLoading: infraLoading } = useInfraProjects();

  // Sort localities by investment score descending
  const ranked = React.useMemo(() => {
    if (!dashboardData) return [];
    return [...dashboardData]
      .filter(e => e.scores)
      .sort((a, b) => (b.scores?.investment_score ?? 0) - (a.scores?.investment_score ?? 0));
  }, [dashboardData]);

  // Compute KPIs from real data
  const kpis = React.useMemo(() => {
    if (!dashboardData || dashboardData.length === 0) return null;
    const withMetrics = dashboardData.filter(e => e.metrics);
    const withScores  = dashboardData.filter(e => e.scores);
    const avgPrice  = Math.round(withMetrics.reduce((s, e) => s + e.metrics!.avg_price_per_sqft, 0) / withMetrics.length);
    const avgYield  = withMetrics.reduce((s, e) => s + e.metrics!.rental_yield_estimate, 0) / withMetrics.length;
    const inventory = withMetrics.reduce((s, e) => s + e.metrics!.property_inventory, 0);
    const topScore  = Math.max(...withScores.map(e => e.scores!.investment_score));
    const topLoc    = withScores.find(e => e.scores!.investment_score === topScore);
    return {
      avgPrice: `₹${avgPrice.toLocaleString()}/sqft`,
      avgYield: `${avgYield.toFixed(2)}%`,
      inventory: `${inventory.toLocaleString()} units`,
      count: dashboardData.length,
      topScore: topScore.toFixed(1),
      topLocName: topLoc?.name ?? '—',
    };
  }, [dashboardData]);

  // Top infra projects (limit to 3, prefer In Progress)
  const topInfra = React.useMemo(() => {
    if (!infraProjects) return [];
    const sorted = [...infraProjects].sort((a, b) => {
      const priority = (p: { status: string }) =>
        p.status === 'In Progress' ? 0 : p.status === 'Approved' ? 1 : 2;
      return priority(a) - priority(b);
    });
    return sorted.slice(0, 3);
  }, [infraProjects]);

  const kpiCards = kpis ? [
    { label: 'City Avg ₹/sqft',      value: kpis.avgPrice,    badge: 'Live',      badgePos: null as null, sub: `${kpis.count} localities tracked` },
    { label: 'Avg Rental Yield',      value: kpis.avgYield,    badge: 'Seeded',    badgePos: null as null, sub: 'Across all micro-sectors' },
    { label: 'Active Inventory',      value: kpis.inventory,   badge: undefined,   badgePos: undefined,    sub: `${kpis.count} micro-sectors tracked` },
    { label: 'Top Investment Score',  value: kpis.topScore,    badge: kpis.topLocName, badgePos: null as null, sub: 'Highest scoring locality' },
    { label: 'Localities Tracked',    value: String(kpis.count), badge: 'Coimbatore', badgePos: null as null, sub: 'All micro-sectors' },
    { label: 'Market Signal',         value: 'Bullish',        badge: 'Q2 2026',   badgePos: null as null, sub: 'IT expansion driving demand' },
  ] : [];

  return (
    <div style={{ flex: 1, backgroundColor: '#FFFFFF' }}>

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: '#FAFAFA' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '36px 48px 32px' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{
              fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.12em', color: '#6B7280', backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB', padding: '4px 10px', borderRadius: '20px',
            }}>
              Coimbatore
            </span>
            <span style={{ fontSize: '11px', color: '#D1D5DB' }}>·</span>
            <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500 }}>
              Indices updated daily · {dashboardData?.length ?? '—'} micro-sectors tracked
            </span>
          </div>

          <h1 style={{
            fontSize: '38px', fontWeight: 800, color: '#000000',
            letterSpacing: '-0.045em', lineHeight: 1.05, margin: 0, marginBottom: '5px',
          }}>
            Real Estate Intelligence
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
            Live market data across Coimbatore's fastest-growing micro-sectors · June 2026
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3" style={{ marginTop: '24px' }}>
            {dashLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '18px 20px' }}>
                    <Skeleton width="60%" height={12} />
                    <div style={{ marginTop: '12px' }}><Skeleton width="80%" height={28} /></div>
                    <div style={{ marginTop: '8px' }}><Skeleton width="50%" height={10} /></div>
                  </div>
                ))
              : kpiCards.map((k) => <KpiCard key={k.label} {...k} />)
            }
          </div>
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '36px 48px' }}>

        {/* Micro-Sector Rankings Table */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-end', marginBottom: '16px',
          }}>
            <div>
              <h2 style={{
                fontSize: '17px', fontWeight: 700, color: '#000000',
                letterSpacing: '-0.025em', margin: 0,
              }}>
                Micro-Sector Rankings
              </h2>
              <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '3px', marginBottom: 0 }}>
                Ranked by investment score · {ranked.length} localities · click any row to open locality profile
              </p>
            </div>
            <button
              onClick={() => navigate('/analytics')}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                fontSize: '12px', fontWeight: 600, color: '#374151',
                backgroundColor: 'transparent', border: '1px solid #E5E7EB',
                cursor: 'pointer', padding: '6px 12px', borderRadius: '8px',
                transition: 'all 0.1s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = '#000000';
                (e.currentTarget as HTMLElement).style.borderColor = '#000000';
                (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB';
                (e.currentTarget as HTMLElement).style.color = '#374151';
              }}
            >
              Full Analytics <ArrowUpRight size={13} />
            </button>
          </div>

          <div style={{
            border: '1px solid #E5E7EB', borderRadius: '12px',
            overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            {/* Column headers */}
            <div style={{
              display: 'grid', gridTemplateColumns: COLS,
              padding: '10px 20px', backgroundColor: '#F9FAFB',
              borderBottom: '1px solid #E5E7EB',
            }}>
              {[
                { h: '#',             right: false },
                { h: 'Locality',      right: false },
                { h: 'Characteristic', right: false },
                { h: '₹/sqft',        right: true  },
                { h: 'Yield',         right: true  },
                { h: 'Inventory',     right: true  },
                { h: 'Inv. Score',    right: true  },
                { h: 'Signal',        right: true  },
              ].map((col) => (
                <span key={col.h} style={{
                  fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: '#9CA3AF',
                  textAlign: col.right ? 'right' : 'left',
                  display: 'block',
                }}>
                  {col.h}
                </span>
              ))}
            </div>

            {dashLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <Skeleton width={20} height={14} />
                    <Skeleton width={120} height={14} />
                    <Skeleton width={90} height={20} />
                    <Skeleton width={60} height={14} />
                  </div>
                ))
              : ranked.map((entry, idx) => (
                  <LocalityTableRow
                    key={entry.id}
                    entry={entry}
                    tag={deriveTag(entry, dashboardData!)}
                    signal={deriveSignal(entry.scores?.investment_score ?? 0)}
                    navigate={navigate}
                    isLast={idx === ranked.length - 1}
                    rank={idx + 1}
                  />
                ))
            }
          </div>
        </section>

        {/* Two-column: Infrastructure + Market Signals */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">

          {/* Infrastructure Pipeline */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Layers size={15} color="#374151" />
              <h2 style={{
                fontSize: '17px', fontWeight: 700, color: '#000000',
                letterSpacing: '-0.025em', margin: 0,
              }}>
                Infrastructure Pipeline
              </h2>
            </div>
            <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 16px 23px' }}>
              {infraLoading ? 'Loading...' : `${topInfra.length} active/approved projects · expected price impact and affected corridors`}
            </p>

            <div style={{
              border: '1px solid #E5E7EB', borderRadius: '12px',
              overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              {infraLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} style={{ padding: '18px 22px', borderBottom: i < 2 ? '1px solid #F3F4F6' : 'none' }}>
                      <Skeleton width="40%" height={14} />
                      <div style={{ marginTop: '8px' }}><Skeleton width="70%" height={12} /></div>
                      <div style={{ marginTop: '8px' }}><Skeleton width="50%" height={10} /></div>
                    </div>
                  ))
                : topInfra.map((item, idx) => (
                    <div key={item.id} style={{
                      padding: '18px 22px',
                      borderBottom: idx < topInfra.length - 1 ? '1px solid #F3F4F6' : 'none',
                    }}>
                      <div style={{ display: 'flex', gap: '14px' }}>
                        <div style={{ flexShrink: 0, paddingTop: '2px' }}>
                          <span style={{
                            fontSize: '10px', fontWeight: 700, color: '#FFFFFF',
                            backgroundColor: item.status === 'Completed' ? '#6B7280' : '#000000',
                            padding: '3px 8px', borderRadius: '4px',
                            fontFamily: 'ui-monospace, monospace', whiteSpace: 'nowrap',
                          }}>
                            {item.target_date || item.published_at?.slice(0, 10) || '—'}
                          </span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            display: 'flex', alignItems: 'flex-start',
                            gap: '8px', flexWrap: 'wrap', marginBottom: '3px',
                          }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: '#000000' }}>
                              {item.title}
                            </div>
                            <span style={{
                              fontSize: '10px', fontWeight: 700,
                              color: item.status === 'In Progress' ? '#16A34A' : item.status === 'Completed' ? '#6B7280' : '#1D4ED8',
                              backgroundColor: item.status === 'In Progress' ? '#F0FDF4' : item.status === 'Completed' ? '#F9FAFB' : '#EFF6FF',
                              border: `1px solid ${item.status === 'In Progress' ? '#BBF7D0' : item.status === 'Completed' ? '#E5E7EB' : '#BFDBFE'}`,
                              padding: '2px 7px', borderRadius: '4px', flexShrink: 0,
                            }}>
                              {item.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '8px' }}>
                            {item.phase}
                          </div>
                          {(item.impact || item.description) && (
                            <div style={{ fontSize: '11px', color: '#374151', marginBottom: '8px', lineHeight: 1.5 }}>
                              {(item.impact || item.description || '').slice(0, 140)}{(item.impact || item.description || '').length > 140 ? '…' : ''}
                            </div>
                          )}
                          {(item.corridors?.length || item.affected_localities?.length) ? (
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                              <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600 }}>Affects:</span>
                              {(item.corridors || item.affected_localities || []).map((c) => (
                                <span key={c} style={{
                                  fontSize: '10px', color: '#374151', backgroundColor: '#F3F4F6',
                                  border: '1px solid #E5E7EB', padding: '2px 7px',
                                  borderRadius: '4px', fontWeight: 500,
                                }}>
                                  {c}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))
              }
            </div>
          </section>

          {/* Market Signals + Quick Access */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Activity size={15} color="#374151" />
              <h2 style={{
                fontSize: '17px', fontWeight: 700, color: '#000000',
                letterSpacing: '-0.025em', margin: 0,
              }}>
                Market Signals
              </h2>
            </div>
            <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 14px 23px' }}>
              Derived from seeded locality metrics · June 2026
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '22px' }}>
              {dashLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} style={{ padding: '14px 16px', borderRadius: '10px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                      <Skeleton width="50%" height={10} />
                      <div style={{ marginTop: '8px' }}><Skeleton width="90%" height={10} /></div>
                    </div>
                  ))
                : kpis ? [
                    {
                      label: 'Price Momentum',
                      value: 'Bullish',
                      detail: `City avg ₹${kpis.avgPrice} across ${kpis.count} micro-sectors. High-growth corridors (IT belt) sustaining demand.`,
                    },
                    {
                      label: 'Rental Pressure',
                      value: `${kpis.avgYield} avg yield`,
                      detail: `Saravanampatti vacancy below 3% due to CHIL SEZ expansion. Ondipudur leads at 5.2% yield near airport.`,
                    },
                    {
                      label: 'Demand / Supply',
                      value: `${kpis.inventory} listed`,
                      detail: `IT workforce expansion and airport terminal upgrade driving buyer demand in the eastern and northern corridors.`,
                    },
                  ].map((sig) => (
                    <div key={sig.label} style={{
                      padding: '14px 16px', borderRadius: '10px',
                      backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB',
                    }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', marginBottom: '4px',
                      }}>
                        <span style={{
                          fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.08em', color: '#9CA3AF',
                        }}>
                          {sig.label}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#16A34A' }}>
                          {sig.value}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>
                        {sig.detail}
                      </p>
                    </div>
                  )) : null
              }
            </div>

            <div style={{
              fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: '10px',
            }}>
              Quick Access
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {[
                { label: 'Geospatial Map',     sub: 'Browse all properties on interactive map', icon: MapPin,         path: '/map'       },
                { label: 'Analytics Board',    sub: 'Charts, yield curves, and market rankings', icon: BarChart3,     path: '/analytics' },
                { label: 'Compare Properties', sub: 'Side-by-side investment analysis',          icon: ArrowLeftRight, path: '/compare'  },
                { label: 'Top Localities',     sub: 'Ranked by investment score',                icon: TrendingUp,     path: '/locality'  },
              ].map((action) => (
                <QuickActionCard
                  key={action.path}
                  label={action.label}
                  sub={action.sub}
                  icon={action.icon}
                  onClick={() => navigate(action.path)}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Bottom stats strip */}
        {kpis && (
          <div style={{
            marginTop: '40px', paddingTop: '28px',
            borderTop: '1px solid #E5E7EB',
            display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
          }}>
            {[
              { label: 'Localities tracked',  value: String(kpis.count) },
              { label: 'Active inventory',     value: kpis.inventory.replace(' units', '') },
              { label: 'Avg rental yield',     value: kpis.avgYield },
              { label: 'Infra projects',       value: `${infraProjects?.length ?? '—'} tracked` },
              { label: 'Top invest. score',    value: kpis.topScore },
              { label: 'Market coverage',      value: '100% CBE' },
            ].map((s, i) => (
              <div key={s.label} style={{
                paddingLeft: i > 0 ? '24px' : 0,
                borderLeft: i > 0 ? '1px solid #E5E7EB' : 'none',
              }}>
                <div style={{
                  fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.09em', color: '#9CA3AF', marginBottom: '5px',
                }}>
                  {s.label}
                </div>
                <div style={{
                  fontSize: '22px', fontWeight: 800, color: '#000000',
                  letterSpacing: '-0.03em',
                }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

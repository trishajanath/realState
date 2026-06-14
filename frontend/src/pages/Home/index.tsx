import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalities } from '../../hooks/useApi';
import { MapPin, BarChart3, ArrowUpRight } from 'lucide-react';

const Divider = () => (
  <div style={{ height: '1px', backgroundColor: '#1F1F1F', margin: '32px 0' }} />
);

const MetricRow = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs uppercase tracking-wider" style={{ color: '#52525B' }}>
      {label}
    </span>
    <span className="text-2xl font-semibold" style={{ color: '#FFFFFF' }}>
      {value}
    </span>
    {sub && (
      <span className="text-xs" style={{ color: '#71717A' }}>
        {sub}
      </span>
    )}
  </div>
);

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { data: localities } = useLocalities();

  const summaryMetrics = [
    { label: 'City Avg Price', value: '₹6,350/sqft', sub: '+5.4% vs prev year' },
    { label: 'Avg Rental Yield', value: '3.78%', sub: 'Municipal baseline: 3.5%' },
    { label: 'Active Inventory', value: '715 units', sub: 'Across 7 sectors' },
    { label: 'Appreciation Grade', value: 'A−', sub: 'High liquidity transactions' },
  ];

  const trendingLocalities = [
    {
      name: 'Saravanampatti',
      tag: 'Fastest Growing',
      growth: '+9.2% y-o-y',
      price: '₹4,500/sqft',
      score: 92.5,
    },
    {
      name: 'Peelamedu',
      tag: 'Highest Yield',
      growth: '4.2% yield',
      price: '₹6,800/sqft',
      score: 86.4,
    },
    {
      name: 'RS Puram',
      tag: 'Best Livability',
      growth: '93.7 score',
      price: '₹9,800/sqft',
      score: 81.0,
    },
    {
      name: 'Kalapatti',
      tag: 'Top Investment',
      growth: 'Grade: A',
      price: '₹4,300/sqft',
      score: 88.2,
    },
  ];

  const infraUpdates = [
    {
      title: 'Avinashi Road Flyover',
      phase: 'Phase 2 · In Progress',
      date: 'Q4 2026',
      impact: 'Improves Peelamedu connectivity by 35%',
    },
    {
      title: 'Coimbatore Metro Line 1',
      phase: 'Zoning Approvals',
      date: 'Q2 2027',
      impact: 'Kalapatti–Saravanampatti corridor, +12–15% sqft bump near stations',
    },
    {
      title: 'CHIL SEZ Expansion',
      phase: 'Development Kickoff',
      date: 'Q1 2027',
      impact: '40,000 new seats, accelerating Saravanampatti rental velocity',
    },
  ];

  return (
    <div className="flex-1 p-8 max-w-[1600px] mx-auto w-full">

      {/* Page title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: '#FFFFFF', letterSpacing: '-0.03em' }}>
          Coimbatore Real Estate
        </h1>
        <p className="text-sm mt-1" style={{ color: '#71717A' }}>
          Market intelligence dashboard · Indices updated daily
        </p>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {summaryMetrics.map((m) => (
          <MetricRow key={m.label} label={m.label} value={m.value} sub={m.sub} />
        ))}
      </div>

      <Divider />

      {/* Locality rankings */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold" style={{ color: '#FFFFFF' }}>
              Micro-Sector Rankings
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#71717A' }}>
              Investment scores compiled from price, yield, and infra data
            </p>
          </div>
          <button
            onClick={() => navigate('/analytics')}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors"
            style={{ color: '#A1A1AA', border: '1px solid #2A2A2A' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#111111';
              (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLElement).style.color = '#A1A1AA';
            }}
          >
            Full Analytics
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Table header */}
        <div
          className="grid gap-4 px-4 py-2 text-xs uppercase tracking-wider mb-1"
          style={{
            gridTemplateColumns: '1fr 140px 120px 100px 80px',
            color: '#52525B',
            borderBottom: '1px solid #1F1F1F',
          }}
        >
          <span>Locality</span>
          <span>Signal</span>
          <span>Avg Price</span>
          <span>Growth</span>
          <span className="text-right">Score</span>
        </div>

        {trendingLocalities.map((loc, idx) => {
          const locality = localities?.find(
            (l) => l.name.toLowerCase() === loc.name.toLowerCase()
          );
          return (
            <div
              key={loc.name}
              onClick={() =>
                locality
                  ? navigate(`/locality/${locality.id}`)
                  : navigate(`/map?q=${loc.name}`)
              }
              className="grid gap-4 px-4 py-3 rounded cursor-pointer transition-colors duration-150"
              style={{
                gridTemplateColumns: '1fr 140px 120px 100px 80px',
                borderBottom: idx < trendingLocalities.length - 1 ? '1px solid #111111' : 'none',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = '#0A0A0A')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')
              }
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#52525B' }} />
                <span className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
                  {loc.name}
                </span>
              </div>
              <div>
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ backgroundColor: '#111111', color: '#A1A1AA', border: '1px solid #1F1F1F' }}
                >
                  {loc.tag}
                </span>
              </div>
              <span className="text-sm" style={{ color: '#A1A1AA' }}>
                {loc.price}
              </span>
              <span className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
                {loc.growth}
              </span>
              <span className="text-sm font-semibold text-right" style={{ color: '#FFFFFF' }}>
                {loc.score}
              </span>
            </div>
          );
        })}
      </div>

      <Divider />

      {/* Infrastructure timeline */}
      <div>
        <div className="mb-6">
          <h2 className="text-base font-semibold" style={{ color: '#FFFFFF' }}>
            Infrastructure Pipeline
          </h2>
          <p className="text-xs mt-0.5" style={{ color: '#71717A' }}>
            Active and approved projects affecting market values
          </p>
        </div>

        <div className="space-y-0">
          {infraUpdates.map((item, idx) => (
            <div key={idx}>
              <div className="flex gap-6 py-4">
                <div className="w-24 flex-shrink-0">
                  <div className="text-xs font-mono" style={{ color: '#52525B' }}>
                    {item.date}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
                        {item.title}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: '#71717A' }}>
                        {item.phase}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: '#71717A' }}>
                    {item.impact}
                  </p>
                </div>
              </div>
              {idx < infraUpdates.length - 1 && (
                <div style={{ height: '1px', backgroundColor: '#111111' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      <Divider />

      {/* Quick actions */}
      <div>
        <h2 className="text-base font-semibold mb-4" style={{ color: '#FFFFFF' }}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'View Geospatial Map', sub: 'Browse properties on map', icon: MapPin, path: '/map' },
            { label: 'Analytics Board', sub: 'Charts, yields, rankings', icon: BarChart3, path: '/analytics' },
            { label: 'Compare Properties', sub: 'Side-by-side analysis', icon: ArrowUpRight, path: '/compare' },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="flex items-start gap-3 p-4 rounded text-left transition-colors duration-150"
                style={{ backgroundColor: '#0A0A0A', border: '1px solid #1F1F1F' }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = '#111111')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.backgroundColor = '#0A0A0A')
                }
              >
                <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#A1A1AA' }} />
                <div>
                  <div className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
                    {action.label}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#71717A' }}>
                    {action.sub}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

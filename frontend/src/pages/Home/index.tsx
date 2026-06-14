import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalities } from '../../hooks/useApi';
import { MapPin, BarChart3, ArrowUpRight, TrendingUp, Layers } from 'lucide-react';

const StatCard = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div
    style={{
      backgroundColor: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '12px',
      padding: '20px 24px',
    }}
  >
    <div
      style={{
        fontSize: '10px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: '#9CA3AF',
        marginBottom: '10px',
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: '30px',
        fontWeight: 800,
        color: '#000000',
        letterSpacing: '-0.04em',
        lineHeight: 1,
      }}
    >
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px', fontWeight: 500 }}>
        {sub}
      </div>
    )}
  </div>
);

const LocalityRow = ({
  loc,
  locality,
  navigate,
  isLast,
}: {
  loc: { name: string; tag: string; price: string; growth: string; score: number };
  locality: { id: string } | undefined;
  navigate: (path: string) => void;
  isLast: boolean;
}) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onClick={() =>
        locality ? navigate(`/locality/${locality.id}`) : navigate(`/map?q=${loc.name}`)
      }
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 170px 140px 130px 80px',
        padding: '14px 20px',
        cursor: 'pointer',
        borderBottom: isLast ? 'none' : '1px solid #F3F4F6',
        backgroundColor: hovered ? '#FAFAFA' : 'transparent',
        transition: 'background-color 0.1s',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '9px',
            backgroundColor: hovered ? '#F3F4F6' : '#F9FAFB',
            border: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <MapPin size={14} color="#6B7280" />
        </div>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#000000' }}>{loc.name}</span>
      </div>
      <div>
        <span
          style={{
            fontSize: '11px',
            padding: '3px 10px',
            borderRadius: '20px',
            backgroundColor: '#F3F4F6',
            color: '#374151',
            fontWeight: 600,
            display: 'inline-block',
            letterSpacing: '0.01em',
          }}
        >
          {loc.tag}
        </span>
      </div>
      <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>{loc.price}</span>
      <span style={{ fontSize: '14px', fontWeight: 700, color: '#16A34A' }}>{loc.growth}</span>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <span
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: '#FFFFFF',
            backgroundColor: '#000000',
            padding: '4px 10px',
            borderRadius: '7px',
            letterSpacing: '-0.01em',
          }}
        >
          {loc.score}
        </span>
      </div>
    </div>
  );
};

const QuickActionCard = ({
  label,
  sub,
  icon: Icon,
  onClick,
}: {
  label: string;
  sub: string;
  icon: React.ElementType;
  onClick: () => void;
}) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px 20px',
        borderRadius: '12px',
        textAlign: 'left',
        border: `1px solid ${hovered ? '#000000' : '#E5E7EB'}`,
        backgroundColor: hovered ? '#000000' : '#FFFFFF',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        width: '100%',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          backgroundColor: hovered ? 'rgba(255,255,255,0.12)' : '#F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background-color 0.15s ease',
        }}
      >
        <Icon size={18} color={hovered ? '#FFFFFF' : '#374151'} />
      </div>
      <div style={{ textAlign: 'left', flex: 1 }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: hovered ? '#FFFFFF' : '#000000',
            transition: 'color 0.15s ease',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: hovered ? '#9CA3AF' : '#6B7280',
            marginTop: '2px',
            transition: 'color 0.15s ease',
          }}
        >
          {sub}
        </div>
      </div>
      <ArrowUpRight
        size={16}
        color={hovered ? 'rgba(255,255,255,0.5)' : '#D1D5DB'}
        style={{ flexShrink: 0, transition: 'color 0.15s ease' }}
      />
    </button>
  );
};

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { data: localities } = useLocalities();

  const summaryMetrics = [
    { label: 'City Avg Price', value: '₹6,350/sqft', sub: '↑ +5.4% vs prev year' },
    { label: 'Avg Rental Yield', value: '3.78%', sub: 'Municipal baseline: 3.5%' },
    { label: 'Active Inventory', value: '715 units', sub: 'Across 7 micro-sectors' },
    { label: 'Appreciation Grade', value: 'A−', sub: 'High liquidity transactions' },
  ];

  const trendingLocalities = [
    { name: 'Saravanampatti', tag: 'Fastest Growing', growth: '+9.2% y-o-y', price: '₹4,500/sqft', score: 92.5 },
    { name: 'Peelamedu', tag: 'Highest Yield', growth: '4.2% yield', price: '₹6,800/sqft', score: 86.4 },
    { name: 'RS Puram', tag: 'Best Livability', growth: '93.7 score', price: '₹9,800/sqft', score: 81.0 },
    { name: 'Kalapatti', tag: 'Top Investment', growth: 'Grade: A', price: '₹4,300/sqft', score: 88.2 },
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
    <div style={{ flex: 1, backgroundColor: '#FFFFFF' }}>

      {/* ── Page Header ───────────────────────────────────────── */}
      <div style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: '#FAFAFA' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 48px 36px' }}>

          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#6B7280',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                padding: '4px 10px',
                borderRadius: '20px',
              }}
            >
              Coimbatore
            </span>
            <span style={{ fontSize: '11px', color: '#D1D5DB' }}>·</span>
            <span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 500 }}>
              Indices updated daily
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: '42px',
              fontWeight: 800,
              color: '#000000',
              letterSpacing: '-0.045em',
              lineHeight: 1.05,
              margin: 0,
              marginBottom: '6px',
            }}
          >
            Real Estate Intelligence
          </h1>
          <p style={{ fontSize: '15px', color: '#6B7280', margin: 0, fontWeight: 400 }}>
            Live market data across Coimbatore's fastest-growing micro-sectors
          </p>

          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginTop: '28px' }}>
            {summaryMetrics.map((m) => (
              <StatCard key={m.label} label={m.label} value={m.value} sub={m.sub} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────── */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 48px' }}>

        {/* Micro-Sector Rankings */}
        <section style={{ marginBottom: '48px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              marginBottom: '20px',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#000000',
                  letterSpacing: '-0.025em',
                  margin: 0,
                }}
              >
                Micro-Sector Rankings
              </h2>
              <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px', marginBottom: 0 }}>
                Investment scores compiled from price, yield, and infra data
              </p>
            </div>
            <button
              onClick={() => navigate('/analytics')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#374151',
                backgroundColor: 'transparent',
                border: '1px solid #E5E7EB',
                cursor: 'pointer',
                padding: '7px 14px',
                borderRadius: '8px',
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
              Full Analytics
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div
            style={{
              border: '1px solid #E5E7EB',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 170px 140px 130px 80px',
                padding: '11px 20px',
                backgroundColor: '#F9FAFB',
                borderBottom: '1px solid #E5E7EB',
              }}
            >
              {['Locality', 'Signal', 'Avg Price', 'Growth', 'Score'].map((h, i) => (
                <span
                  key={h}
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#9CA3AF',
                    textAlign: i === 4 ? 'right' : 'left',
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            {trendingLocalities.map((loc, idx) => {
              const locality = localities?.find(
                (l) => l.name.toLowerCase() === loc.name.toLowerCase()
              );
              return (
                <LocalityRow
                  key={loc.name}
                  loc={loc}
                  locality={locality}
                  navigate={navigate}
                  isLast={idx === trendingLocalities.length - 1}
                />
              );
            })}
          </div>
        </section>

        {/* ── Two-column: Infrastructure + Quick Actions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">

          {/* Infrastructure Pipeline */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Layers size={16} color="#374151" />
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#000000',
                  letterSpacing: '-0.025em',
                  margin: 0,
                }}
              >
                Infrastructure Pipeline
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, marginBottom: '20px', marginLeft: '24px' }}>
              Active and approved projects affecting market values
            </p>

            <div
              style={{
                border: '1px solid #E5E7EB',
                borderRadius: '14px',
                overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              {infraUpdates.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '20px 24px',
                    borderBottom: idx < infraUpdates.length - 1 ? '1px solid #F3F4F6' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flexShrink: 0, paddingTop: '2px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#FFFFFF',
                          backgroundColor: '#000000',
                          padding: '3px 9px',
                          borderRadius: '5px',
                          fontFamily: 'ui-monospace, monospace',
                          letterSpacing: '0.01em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.date}
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#000000' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px', fontWeight: 500 }}>
                        {item.phase}
                      </div>
                      <p
                        style={{
                          fontSize: '13px',
                          color: '#374151',
                          marginTop: '8px',
                          lineHeight: 1.6,
                          margin: '8px 0 0 0',
                        }}
                      >
                        {item.impact}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <TrendingUp size={16} color="#374151" />
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#000000',
                  letterSpacing: '-0.025em',
                  margin: 0,
                }}
              >
                Quick Access
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: '#6B7280', margin: 0, marginBottom: '20px', marginLeft: '24px' }}>
              Jump into key platform tools
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                {
                  label: 'Geospatial Map',
                  sub: 'Browse all properties on an interactive map',
                  icon: MapPin,
                  path: '/map',
                },
                {
                  label: 'Analytics Board',
                  sub: 'Charts, yield curves, and market rankings',
                  icon: BarChart3,
                  path: '/analytics',
                },
                {
                  label: 'Compare Properties',
                  sub: 'Side-by-side investment analysis',
                  icon: ArrowUpRight,
                  path: '/compare',
                },
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

            {/* Bottom stat strip */}
            <div
              style={{
                marginTop: '16px',
                padding: '16px 20px',
                borderRadius: '12px',
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              {[
                { label: 'Localities tracked', value: '24' },
                { label: 'Data points/day', value: '1,400+' },
                { label: 'Properties indexed', value: '715' },
                { label: 'Infra projects', value: '3 active' },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: '3px' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#000000', letterSpacing: '-0.03em' }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

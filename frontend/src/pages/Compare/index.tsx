import React from 'react';
import { Link } from 'react-router-dom';
import { useCompareStore } from '../../store/useCompareStore';
import { useProperties, useLocalities } from '../../hooks/useApi';
import { PropertyComparisonTable } from '../../components/shared/PropertyComparisonTable';
import { ArrowLeftRight, X } from 'lucide-react';
import { mockScores } from '../../services/mockData';

export const ComparePage: React.FC = () => {
  const { selectedIds, removeId, clear } = useCompareStore();
  const { data: properties } = useProperties();
  const { data: localities } = useLocalities();

  const comparedProperties = properties?.filter((p) => selectedIds.includes(p.id)) || [];

  const formatPrice = (p: number) =>
    p >= 10000000 ? `₹${(p / 10000000).toFixed(2)} Cr` : `₹${(p / 100000).toFixed(1)} L`;

  return (
    <div className="flex-1 p-8 max-w-[1600px] mx-auto w-full">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#FFFFFF', letterSpacing: '-0.03em' }}>
            Compare
          </h1>
          <p className="text-sm mt-1" style={{ color: '#71717A' }}>
            Side-by-side property specification analysis · Up to 4 listings
          </p>
        </div>
        {comparedProperties.length > 0 && (
          <button
            onClick={clear}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors"
            style={{ color: '#71717A', border: '1px solid #1F1F1F' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#111111'; (e.currentTarget as HTMLElement).style.color = '#FFFFFF'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#71717A'; }}
          >
            <X className="w-3.5 h-3.5" />
            Clear All
          </button>
        )}
      </div>

      {comparedProperties.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div
            className="flex items-center justify-center rounded mb-6"
            style={{ width: '56px', height: '56px', backgroundColor: '#0A0A0A', border: '1px solid #1F1F1F' }}
          >
            <ArrowLeftRight className="w-6 h-6" style={{ color: '#52525B' }} />
          </div>
          <h3 className="text-base font-semibold mb-2" style={{ color: '#FFFFFF' }}>
            No properties selected
          </h3>
          <p className="text-sm mb-6 max-w-sm" style={{ color: '#71717A' }}>
            Browse listings and click "Compare" on any property card to add it here.
          </p>
          <Link
            to="/map"
            className="flex items-center gap-2 text-sm px-4 py-2 rounded font-medium transition-colors"
            style={{ backgroundColor: '#FFFFFF', color: '#000000' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#D4D4D4')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = '#FFFFFF')}
          >
            Browse Properties
          </Link>
        </div>
      ) : (
        /* Comparison table */
        <div>
          {/* Property header cards */}
          <div
            className="grid gap-4 mb-6"
            style={{ gridTemplateColumns: `200px repeat(${comparedProperties.length}, 1fr)` }}
          >
            <div />
            {comparedProperties.map((prop) => {
              const locality = localities?.find((l) => l.id === prop.locality_id);
              return (
                <div
                  key={prop.id}
                  className="p-4 rounded"
                  style={{ backgroundColor: '#0A0A0A', border: '1px solid #1F1F1F' }}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Link
                      to={`/property/${prop.id}`}
                      className="text-sm font-medium leading-snug hover:underline"
                      style={{ color: '#FFFFFF' }}
                    >
                      {prop.title}
                    </Link>
                    <button
                      onClick={() => removeId(prop.id)}
                      className="p-1 rounded flex-shrink-0 transition-colors"
                      style={{ color: '#52525B' }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#FFFFFF')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#52525B')}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {prop.images?.[0] && (
                    <div className="rounded overflow-hidden mb-3" style={{ height: '100px' }}>
                      <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="text-lg font-bold" style={{ color: '#FFFFFF' }}>
                    {formatPrice(prop.price)}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: '#71717A' }}>
                    {locality?.name} · {prop.listing_type}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Spec rows */}
          {[
            { label: 'Property Type', getValue: (p: any) => p.property_type },
            { label: 'Area (sqft)', getValue: (p: any) => `${p.area_sqft}` },
            { label: 'Bedrooms', getValue: (p: any) => p.bedrooms ? `${p.bedrooms} BHK` : '-' },
            { label: 'Bathrooms', getValue: (p: any) => p.bathrooms ? `${p.bathrooms}` : '-' },
            { label: 'Price/sqft', getValue: (p: any) => `₹${Math.round(p.price / p.area_sqft).toLocaleString()}` },
            { label: 'Source', getValue: (p: any) => p.source },
            { label: 'Investment Grade', getValue: (p: any) => p.ai_investment_rating?.split('|')[0]?.replace('Grade:', '').trim() || 'B' },
          ].map((row) => (
            <div
              key={row.label}
              className="grid gap-4"
              style={{
                gridTemplateColumns: `200px repeat(${comparedProperties.length}, 1fr)`,
                borderBottom: '1px solid #111111',
                padding: '12px 0',
              }}
            >
              <span className="text-xs self-center" style={{ color: '#52525B' }}>{row.label}</span>
              {comparedProperties.map((prop) => (
                <span key={prop.id} className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
                  {row.getValue(prop)}
                </span>
              ))}
            </div>
          ))}

          {/* Also show the PropertyComparisonTable if available */}
          {comparedProperties.length >= 2 && (
            <div className="mt-8">
              <PropertyComparisonTable
                properties={comparedProperties}
                localities={localities || []}
                scores={mockScores}
                onRemove={removeId}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

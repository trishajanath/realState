import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapView } from '../../components/shared/MapView';
import { useLocalities, useProperties } from '../../hooks/useApi';
import { useMapFilterStore } from '../../store/useMapFilterStore';
import type { Property } from '../../types';
import { Search, Filter, X, MapPin, Building2 } from 'lucide-react';

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatPrice = (p: number) =>
  p >= 10000000 ? `₹${(p / 10000000).toFixed(1)}Cr` : `₹${(p / 100000).toFixed(0)}L`;

export const MapPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const { data: localities } = useLocalities();
  const { data: properties } = useProperties();
  const store = useMapFilterStore();

  const [showFilters, setShowFilters] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  useEffect(() => {
    if (initialQuery && localities) {
      store.setFilters({ searchQuery: initialQuery });
      const matched = localities.find((l) => l.name.toLowerCase().includes(initialQuery.toLowerCase()));
      if (matched) store.setFilters({ selectedLocalityId: matched.id });
    }
  }, [initialQuery, localities]);

  const allProperties: Property[] = properties?.results ?? [];

  const filteredProperties = allProperties.filter((prop) => {
    if (store.selectedLocalityId && prop.locality_id !== store.selectedLocalityId) return false;
    if (store.propertyType !== 'All' && prop.property_type !== store.propertyType) return false;
    if (prop.price < store.priceMin || prop.price > store.priceMax) return false;
    if (store.bedrooms !== 'All' && prop.bedrooms !== store.bedrooms) return false;
    if (store.bathrooms !== 'All' && prop.bathrooms !== store.bathrooms) return false;
    if (prop.area_sqft < store.areaMin || prop.area_sqft > store.areaMax) return false;

    if (store.commuteDestination && prop.latitude && prop.longitude) {
      let dLat = 11.0254, dLon = 77.0028;
      const q = store.commuteDestination.toLowerCase();
      if (q.includes('chil')) { dLat = 11.0829; dLon = 77.0257; }
      else if (q.includes('tidel')) { dLat = 11.0276; dLon = 77.0305; }
      if (calculateDistance(prop.latitude, prop.longitude, dLat, dLon) * 2.5 > store.commuteMaxTime) return false;
    }

    if (store.searchQuery) {
      const q = store.searchQuery.toLowerCase();
      const bhk = q.match(/(\d+)\s*bhk/);
      if (bhk && prop.bedrooms !== parseInt(bhk[1])) return false;
      if ((q.includes('rent') || q.includes('lease')) && prop.listing_type?.toLowerCase() !== 'rent') return false;
      if ((q.includes('buy') || q.includes('sale')) && prop.listing_type?.toLowerCase() !== 'sale') return false;
      const loc = localities?.find((l) => q.includes(l.name.toLowerCase()));
      if (loc && prop.locality_id !== loc.id) return false;
    }

    return true;
  });

  const selectTrigger: React.CSSProperties = {
    width: '100%',
    height: '36px',
    padding: '0 10px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    color: '#374151',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <div className="flex-1 flex" style={{ minHeight: 0, height: 'calc(100vh - 64px)' }}>

      {/* Left sidebar */}
      <div
        className="flex flex-col overflow-hidden flex-shrink-0"
        style={{ width: '360px', borderRight: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}
      >
        {/* Search bar */}
        <div className="p-4" style={{ borderBottom: '1px solid #E5E7EB' }}>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
              style={{ color: '#9CA3AF' }}
            />
            <input
              type="text"
              placeholder="Search properties, localities…"
              value={store.searchQuery}
              onChange={(e) => store.setFilters({ searchQuery: e.target.value })}
              className="w-full text-sm outline-none"
              style={{
                height: '36px',
                paddingLeft: '32px',
                paddingRight: '12px',
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                color: '#000000',
              }}
            />
            {store.searchQuery && (
              <button
                onClick={() => store.setFilters({ searchQuery: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: '#9CA3AF' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter toggle */}
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #F3F4F6' }}>
          <span className="text-xs" style={{ color: '#9CA3AF' }}>
            {filteredProperties.length} properties
          </span>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded transition-colors"
            style={{
              backgroundColor: showFilters ? '#000000' : '#F3F4F6',
              color: showFilters ? '#FFFFFF' : '#374151',
              border: '1px solid #E5E7EB',
            }}
          >
            <Filter className="w-3 h-3" />
            Filters
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="p-4 space-y-4" style={{ borderBottom: '1px solid #E5E7EB' }}>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: '#6B7280' }}>Property Type</label>
              <select
                value={store.propertyType}
                onChange={(e) => store.setFilters({ propertyType: e.target.value })}
                style={selectTrigger}
              >
                {['All', 'Apartment', 'Villa', 'Independent House', 'Plot'].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs mb-1.5" style={{ color: '#6B7280' }}>Locality</label>
              <select
                value={store.selectedLocalityId || ''}
                onChange={(e) => store.setFilters({ selectedLocalityId: e.target.value || undefined })}
                style={selectTrigger}
              >
                <option value="">All Localities</option>
                {(localities ?? []).map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs mb-1.5" style={{ color: '#6B7280' }}>
                Max Price: {formatPrice(store.priceMax)}
              </label>
              <input
                type="range"
                min={500000}
                max={50000000}
                step={500000}
                value={store.priceMax}
                onChange={(e) => store.setFilters({ priceMax: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs mb-1.5" style={{ color: '#6B7280' }}>Bedrooms</label>
                <select
                  value={store.bedrooms === 'All' ? 'All' : String(store.bedrooms)}
                  onChange={(e) => store.setFilters({ bedrooms: e.target.value === 'All' ? 'All' : parseInt(e.target.value) })}
                  style={selectTrigger}
                >
                  {['All', '1', '2', '3', '4'].map((v) => (
                    <option key={v} value={v}>{v === 'All' ? 'Any' : `${v} BHK`}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1.5" style={{ color: '#6B7280' }}>Bathrooms</label>
                <select
                  value={store.bathrooms === 'All' ? 'All' : String(store.bathrooms)}
                  onChange={(e) => store.setFilters({ bathrooms: e.target.value === 'All' ? 'All' : parseInt(e.target.value) })}
                  style={selectTrigger}
                >
                  {['All', '1', '2', '3', '4'].map((v) => (
                    <option key={v} value={v}>{v === 'All' ? 'Any' : v}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => store.setFilters({ searchQuery: '', propertyType: 'All', bedrooms: 'All', bathrooms: 'All', priceMin: 0, priceMax: 50000000, areaMin: 0, areaMax: 10000, selectedLocalityId: undefined, commuteDestination: '' })}
              className="text-xs transition-colors"
              style={{ color: '#6B7280' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#000000')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#6B7280')}
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Property list */}
        <div className="flex-1 overflow-y-auto">
          {filteredProperties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <Building2 className="w-8 h-8 mb-3" style={{ color: '#D1D5DB' }} />
              <p className="text-sm" style={{ color: '#9CA3AF' }}>No properties match your filters.</p>
            </div>
          ) : (
            filteredProperties.map((prop) => {
              const locality = localities?.find((l) => l.id === prop.locality_id);
              const isSelected = selectedProperty?.id === prop.id;
              return (
                <div
                  key={prop.id}
                  onClick={() => setSelectedProperty(isSelected ? null : prop)}
                  className="p-4 cursor-pointer transition-colors"
                  style={{
                    borderBottom: '1px solid #F3F4F6',
                    backgroundColor: isSelected ? '#F3F4F6' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                >
                  {prop.images?.[0] && (
                    <div className="rounded overflow-hidden mb-3" style={{ height: '120px' }}>
                      <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={`/property/${prop.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-medium leading-snug hover:underline"
                      style={{ color: '#000000' }}
                    >
                      {prop.title}
                    </Link>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs" style={{ color: '#6B7280' }}>
                    <MapPin className="w-3 h-3" />
                    {locality?.name || 'Coimbatore'}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-semibold" style={{ color: '#000000' }}>
                      {formatPrice(prop.price)}
                    </span>
                    <div className="flex items-center gap-2 text-xs" style={{ color: '#6B7280' }}>
                      {prop.bedrooms && <span>{prop.bedrooms} BHK</span>}
                      {prop.area_sqft && <span>{prop.area_sqft} sqft</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 relative overflow-hidden">
        <MapView
          localityId={store.selectedLocalityId || (localities?.[0]?.id || '')}
          propertyId={selectedProperty?.id}
          properties={allProperties}
          localities={localities}
          height="h-full"
        />
      </div>
    </div>
  );
};

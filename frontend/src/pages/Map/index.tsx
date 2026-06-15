import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapView } from '../../components/shared/MapView';
import { useLocalities, useProperties } from '../../hooks/useApi';
import { useMapFilterStore } from '../../store/useMapFilterStore';
import { mockLocalities, mockProperties } from '../../services/mockData';
import type { Property } from '../../types';
import { Search, Filter, X, MapPin, Building2, Eye, ChevronRight, ExternalLink, LayoutGrid } from 'lucide-react';

declare const google: any;

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

// ─── Street View Modal ─────────────────────────────────────────────────────────
interface StreetViewModalProps {
  property: Property;
  apiKey: string | null;
  onClose: () => void;
}

const StreetViewModal: React.FC<StreetViewModalProps> = ({ property, apiKey, onClose }) => {
  const panoramaRef = useRef<HTMLDivElement>(null);
  const [svStatus, setSvStatus] = useState<'loading' | 'live' | 'static' | 'unavailable'>('loading');

  const lat = property.latitude ?? 11.04;
  const lng = property.longitude ?? 76.99;

  useEffect(() => {
    const win = window as any;
    if (!win.google?.maps || !panoramaRef.current) {
      setSvStatus(apiKey ? 'static' : 'unavailable');
      return;
    }

    try {
      const svService = new win.google.maps.StreetViewService();
      svService.getPanorama(
        {
          location: { lat, lng },
          radius: 150,
          preference: win.google.maps.StreetViewPreference.NEAREST,
          source: win.google.maps.StreetViewSource.OUTDOOR,
        },
        (data: any, status: string) => {
          if (status === 'OK' && data && panoramaRef.current) {
            new win.google.maps.StreetViewPanorama(panoramaRef.current, {
              position: { lat, lng },
              pov: { heading: 34, pitch: 10 },
              zoom: 1,
              addressControl: false,
              fullscreenControl: false,
              enableCloseButton: false,
              motionTrackingControl: false,
              linksControl: true,
              panControl: true,
              zoomControl: true,
            });
            setSvStatus('live');
          } else {
            setSvStatus(apiKey ? 'static' : 'unavailable');
          }
        }
      );
    } catch {
      setSvStatus(apiKey ? 'static' : 'unavailable');
    }
  }, [lat, lng, apiKey]);

  const staticUrl = apiKey
    ? `https://maps.googleapis.com/maps/api/streetview?size=860x460&location=${lat},${lng}&heading=34&pitch=10&fov=90&key=${apiKey}`
    : null;

  const mapsUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}&heading=34&pitch=10`;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative flex flex-col"
        style={{ width: '900px', maxWidth: '96vw', height: '580px', maxHeight: '92vh', backgroundColor: '#0A0A0A', border: '1px solid #2A2A2A', borderRadius: '14px', overflow: 'hidden' }}
      >
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #1F1F1F' }}>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase px-2 py-1 rounded flex items-center gap-1.5" style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', color: '#52525B' }}>
              🧭 Street View
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight" style={{ color: '#FFFFFF' }}>{property.title}</p>
              <p className="text-xs mt-0.5" style={{ color: '#71717A' }}>{lat.toFixed(5)}°N, {lng.toFixed(5)}°E</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', color: '#A1A1AA', textDecoration: 'none' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1C1C1C'; (e.currentTarget as HTMLElement).style.color = '#FFFFFF'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#111111'; (e.currentTarget as HTMLElement).style.color = '#A1A1AA'; }}
            >
              <ExternalLink className="w-3 h-3" /> Open in Google Maps
            </a>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg"
              style={{ backgroundColor: '#1C1C1C', border: '1px solid #2A2A2A', color: '#71717A' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#2A2A2A'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1C1C1C'; }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden">
          {svStatus === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ backgroundColor: '#000000' }}>
              <div className="w-10 h-10 rounded-full border-2 animate-spin mb-3" style={{ borderColor: '#1F1F1F', borderTopColor: '#FFFFFF' }} />
              <p className="text-xs font-mono" style={{ color: '#52525B' }}>Loading Street View…</p>
            </div>
          )}
          <div ref={panoramaRef} className="absolute inset-0" style={{ display: svStatus === 'live' ? 'block' : 'none' }} />
          {svStatus === 'live' && (
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded-md"
              style={{ backgroundColor: 'rgba(0,0,0,0.7)', border: '1px solid #1F1F1F', color: '#10b981' }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: '#10b981' }} /> Interactive
            </div>
          )}
          {svStatus === 'static' && staticUrl && (
            <div className="absolute inset-0 flex flex-col">
              <img src={staticUrl} alt={`Street View – ${property.title}`} className="flex-1 w-full object-cover" style={{ minHeight: 0 }} onError={() => setSvStatus('unavailable')} />
              <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 text-xs" style={{ borderTop: '1px solid #1F1F1F', backgroundColor: '#050505', color: '#52525B' }}>
                <span>Static preview — interactive panorama not available at this location</span>
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#A1A1AA' }}>Try interactive →</a>
              </div>
            </div>
          )}
          {svStatus === 'unavailable' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl" style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A' }}>🏙️</div>
              <div className="text-center">
                <p className="text-sm font-medium mb-1" style={{ color: '#A1A1AA' }}>Street View Unavailable</p>
                <p className="text-xs mb-4" style={{ color: '#52525B' }}>No imagery found within 150m of this property</p>
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-4 py-2 rounded-lg"
                  style={{ backgroundColor: '#1C1C1C', border: '1px solid #2A2A2A', color: '#A1A1AA', textDecoration: 'none' }}>
                  Open in Google Maps →
                </a>
              </div>
            </div>
          )}
          {svStatus !== 'loading' && (
            <div className="absolute bottom-3 left-3 z-20 text-[10px] font-mono px-2 py-1 rounded pointer-events-none"
              style={{ backgroundColor: 'rgba(0,0,0,0.65)', border: '1px solid #1F1F1F', color: '#52525B' }}>
              {lat.toFixed(5)}°N  {lng.toFixed(5)}°E
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex items-center gap-6 px-5 py-3 text-xs" style={{ borderTop: '1px solid #1F1F1F', backgroundColor: '#050505' }}>
          <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{formatPrice(property.price)}</span>
          {property.bedrooms && <span style={{ color: '#71717A' }}>{property.bedrooms} BHK</span>}
          {property.area_sqft && <span style={{ color: '#71717A' }}>{property.area_sqft} sqft</span>}
          {property.listing_type && (
            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono" style={{ backgroundColor: '#1C1C1C', border: '1px solid #2A2A2A', color: '#A1A1AA' }}>
              {property.listing_type}
            </span>
          )}
          <Link to={`/property/${property.id}`}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: '#FFFFFF', color: '#000000', textDecoration: 'none' }}
            onClick={onClose}>
            View Details <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

// ─── Property List Modal ───────────────────────────────────────────────────────
interface PropertyListModalProps {
  properties: Property[];
  localities: any[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const PropertyListModal: React.FC<PropertyListModalProps> = ({ properties, localities, selectedId, onSelect, onClose }) => {
  const [search, setSearch] = useState('');

  const visible = search.trim()
    ? properties.filter(p => {
        const q = search.toLowerCase();
        const localityName = localities.find(l => l.id === p.locality_id)?.name || '';
        return (
          p.title.toLowerCase().includes(q) ||
          p.property_type.toLowerCase().includes(q) ||
          (p.listing_type || '').toLowerCase().includes(q) ||
          localityName.toLowerCase().includes(q)
        );
      })
    : properties;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative flex flex-col"
        style={{ width: '860px', maxWidth: '94vw', height: '78vh', backgroundColor: '#0A0A0A', border: '1px solid #2A2A2A', borderRadius: '14px', overflow: 'hidden' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #1F1F1F' }}>
          <div className="flex items-center gap-3">
            <LayoutGrid className="w-4 h-4" style={{ color: '#71717A' }} />
            <span className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>All Properties</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ backgroundColor: '#1C1C1C', border: '1px solid #2A2A2A', color: '#71717A' }}>
              {visible.length} listing{visible.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: '#52525B' }} />
              <input
                type="text"
                placeholder="Search within results…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
                className="text-xs outline-none"
                style={{ width: '200px', height: '32px', paddingLeft: '28px', paddingRight: '10px', backgroundColor: '#111111', border: '1px solid #2A2A2A', borderRadius: '6px', color: '#FFFFFF' }}
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: '#52525B' }}>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg"
              style={{ backgroundColor: '#1C1C1C', border: '1px solid #2A2A2A', color: '#71717A' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#2A2A2A'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1C1C1C'; }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Property grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Building2 className="w-8 h-8" style={{ color: '#2A2A2A' }} />
              <p className="text-sm" style={{ color: '#52525B' }}>No properties match your search.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {visible.map(prop => {
                const locality = localities.find(l => l.id === prop.locality_id);
                const isSelected = prop.id === selectedId;

                return (
                  <div
                    key={prop.id}
                    onClick={() => { onSelect(prop.id); onClose(); }}
                    className="cursor-pointer rounded-xl overflow-hidden"
                    style={{ backgroundColor: isSelected ? '#1C1C1C' : '#111111', border: isSelected ? '1.5px solid #FFFFFF' : '1px solid #2A2A2A' }}
                    onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = '#161616'; }}
                    onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = '#111111'; }}
                  >
                    {prop.images?.[0] ? (
                      <div style={{ height: '140px', overflow: 'hidden' }}>
                        <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center" style={{ height: '100px', backgroundColor: '#0A0A0A' }}>
                        <Building2 className="w-8 h-8" style={{ color: '#2A2A2A' }} />
                      </div>
                    )}

                    <div className="p-3">
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: '#0A0A0A', border: '1px solid #2A2A2A', color: '#52525B' }}>
                          {prop.property_type}
                        </span>
                        {prop.listing_type && (
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: '#0A0A0A', border: '1px solid #2A2A2A', color: '#52525B' }}>
                            {prop.listing_type}
                          </span>
                        )}
                        {isSelected && (
                          <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: '#FFFFFF', color: '#000000' }}>
                            Pinned
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-medium leading-snug mb-1" style={{ color: '#FFFFFF' }}>{prop.title}</p>

                      <div className="flex items-center gap-1 mb-2" style={{ color: '#52525B' }}>
                        <MapPin className="w-2.5 h-2.5" />
                        <span className="text-[11px]">{locality?.name || 'Coimbatore'}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold" style={{ color: '#FFFFFF' }}>{formatPrice(prop.price)}</span>
                        <div className="flex items-center gap-2 text-[11px]" style={{ color: '#71717A' }}>
                          {prop.bedrooms && <span>{prop.bedrooms} BHK</span>}
                          {prop.area_sqft && <span>{prop.area_sqft} sqft</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-3 text-xs flex items-center justify-between" style={{ borderTop: '1px solid #1F1F1F', color: '#3F3F46' }}>
          <span>Click a property to pin it on the map</span>
          <span>{visible.length} of {properties.length} shown</span>
        </div>
      </div>
    </div>
  );
};

// ─── Map Page ──────────────────────────────────────────────────────────────────
export const MapPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const { data: localities } = useLocalities();
  const { data: propertiesResult } = useProperties({ limit: 100 });
  const store = useMapFilterStore();

  const [showFilters, setShowFilters] = useState(false);
  const [showStreetView, setShowStreetView] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);
  const [mapsApiKey, setMapsApiKey] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/auth/google/config')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { if (d.maps_api_key) setMapsApiKey(d.maps_api_key); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (initialQuery && localities) {
      store.setFilters({ searchQuery: initialQuery });
      const matched = localities.find((l) => l.name.toLowerCase().includes(initialQuery.toLowerCase()));
      if (matched) store.setFilters({ selectedLocalityId: matched.id });
    }
  }, [initialQuery, localities]);

  const allProperties = propertiesResult?.results || mockProperties;
  const allLocalities = localities || mockLocalities;

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
      const loc = allLocalities.find((l) => q.includes(l.name.toLowerCase()));
      if (loc && prop.locality_id !== loc.id) return false;
    }

    return true;
  });

  const selectedProperty = allProperties.find(p => p.id === store.selectedPropertyId) ?? null;

  const selectTrigger: React.CSSProperties = {
    width: '100%',
    height: '36px',
    padding: '0 10px',
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    color: '#374151',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <div className="flex-1 flex" style={{ minHeight: 0, height: 'calc(100vh - 64px)' }}>

      {/* ── Street View Modal ── */}
      {showStreetView && selectedProperty && (
        <StreetViewModal property={selectedProperty} apiKey={mapsApiKey} onClose={() => setShowStreetView(false)} />
      )}

      {/* ── All Properties Modal ── */}
      {showAllModal && (
        <PropertyListModal
          properties={filteredProperties}
          localities={allLocalities}
          selectedId={store.selectedPropertyId}
          onSelect={(id) => store.setFilters({ selectedPropertyId: id })}
          onClose={() => setShowAllModal(false)}
        />
      )}

      {/* ── Left Sidebar ── */}
      <div className="flex flex-col overflow-hidden flex-shrink-0" style={{ width: '300px', borderRight: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }}>

        {/* Search bar */}
        <div className="p-4" style={{ borderBottom: '1px solid #F3F4F6' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
            <input
              type="text"
              placeholder="Search properties, localities…"
              value={store.searchQuery}
              onChange={(e) => store.setFilters({ searchQuery: e.target.value })}
              className="w-full text-sm outline-none"
              style={{ height: '36px', paddingLeft: '32px', paddingRight: '12px', backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', color: '#111827' }}
            />
            {store.searchQuery && (
              <button onClick={() => store.setFilters({ searchQuery: '' })} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter toggle row */}
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #F3F4F6' }}>
          <span className="text-xs" style={{ color: '#6B7280' }}>
            {filteredProperties.length} listing{filteredProperties.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded"
            style={{ backgroundColor: showFilters ? '#000000' : '#F9FAFB', color: showFilters ? '#FFFFFF' : '#374151', border: '1px solid #E5E7EB' }}
          >
            <Filter className="w-3 h-3" />
            Filters
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="p-4 space-y-4" style={{ borderBottom: '1px solid #F3F4F6' }}>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: '#6B7280' }}>Property Type</label>
              <select value={store.propertyType} onChange={(e) => store.setFilters({ propertyType: e.target.value })} style={selectTrigger}>
                {['All', 'Apartment', 'Villa', 'Independent House', 'Plot'].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: '#6B7280' }}>Locality</label>
              <select value={store.selectedLocalityId || ''} onChange={(e) => store.setFilters({ selectedLocalityId: e.target.value || undefined })} style={selectTrigger}>
                <option value="">All Localities</option>
                {allLocalities.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: '#6B7280' }}>
                Max Price: {formatPrice(store.priceMax)}
              </label>
              <input type="range" min={500000} max={50000000} step={500000} value={store.priceMax}
                onChange={(e) => store.setFilters({ priceMax: parseInt(e.target.value) })}
                className="w-full" style={{ accentColor: '#000000' }} />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs mb-1.5" style={{ color: '#6B7280' }}>Bedrooms</label>
                <select value={store.bedrooms === 'All' ? 'All' : String(store.bedrooms)}
                  onChange={(e) => store.setFilters({ bedrooms: e.target.value === 'All' ? 'All' : parseInt(e.target.value) })} style={selectTrigger}>
                  {['All', '1', '2', '3', '4'].map((v) => (
                    <option key={v} value={v}>{v === 'All' ? 'Any' : `${v} BHK`}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1.5" style={{ color: '#6B7280' }}>Bathrooms</label>
                <select value={store.bathrooms === 'All' ? 'All' : String(store.bathrooms)}
                  onChange={(e) => store.setFilters({ bathrooms: e.target.value === 'All' ? 'All' : parseInt(e.target.value) })} style={selectTrigger}>
                  {['All', '1', '2', '3', '4'].map((v) => (
                    <option key={v} value={v}>{v === 'All' ? 'Any' : v}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={() => store.setFilters({ searchQuery: '', propertyType: 'All', bedrooms: 'All', bathrooms: 'All', priceMin: 0, priceMax: 50000000, areaMin: 0, areaMax: 10000, selectedLocalityId: undefined, commuteDestination: '' })}
              className="text-xs"
              style={{ color: '#9CA3AF' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#000000')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#9CA3AF')}
            >
              Reset filters
            </button>
          </div>
        )}

        {/* ── Show All Properties Button ── */}
        <div className="p-4" style={{ borderBottom: '1px solid #F3F4F6' }}>
          <button
            onClick={() => setShowAllModal(true)}
            className="w-full flex items-center justify-center gap-2 text-sm py-2.5 rounded-lg font-medium"
            style={{ backgroundColor: '#000000', color: '#FFFFFF' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1C1C1C'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#000000'; }}
          >
            <LayoutGrid className="w-4 h-4" />
            Show All Properties
            <span className="ml-1 text-xs font-normal px-1.5 py-0.5 rounded" style={{ backgroundColor: '#FFFFFF', color: '#000000' }}>
              {filteredProperties.length}
            </span>
          </button>
        </div>

        {/* ── Selected Property Panel / Empty State ── */}
        {selectedProperty ? (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#9CA3AF' }}>Pinned Property</span>
              <button
                onClick={() => { store.setFilters({ selectedPropertyId: undefined }); setShowStreetView(false); }}
                className="w-5 h-5 flex items-center justify-center rounded"
                style={{ color: '#9CA3AF' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#000000'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#9CA3AF'; }}
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {selectedProperty.images?.[0] && (
              <div style={{ height: '140px', overflow: 'hidden', borderRadius: '8px', marginBottom: '12px' }}>
                <img src={selectedProperty.images[0]} alt={selectedProperty.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', color: '#6B7280' }}>
                {selectedProperty.property_type}
              </span>
              {selectedProperty.listing_type && (
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', color: '#6B7280' }}>
                  {selectedProperty.listing_type}
                </span>
              )}
            </div>

            <Link to={`/property/${selectedProperty.id}`} className="block text-sm font-semibold mb-1 hover:underline leading-snug" style={{ color: '#000000' }}>
              {selectedProperty.title}
            </Link>

            <div className="flex items-center gap-1 mb-3 text-xs" style={{ color: '#6B7280' }}>
              <MapPin className="w-3 h-3" />
              {allLocalities.find(l => l.id === selectedProperty.locality_id)?.name || 'Coimbatore'}
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-base font-bold" style={{ color: '#000000' }}>{formatPrice(selectedProperty.price)}</span>
              <div className="flex items-center gap-2 text-xs" style={{ color: '#6B7280' }}>
                {selectedProperty.bedrooms && <span>{selectedProperty.bedrooms} BHK</span>}
                {selectedProperty.area_sqft && <span>{selectedProperty.area_sqft} sqft</span>}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button onClick={() => setShowStreetView(true)}
                className="w-full flex items-center justify-center gap-2 text-xs py-2 rounded-lg"
                style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', color: '#6B7280' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F3F4F6'; (e.currentTarget as HTMLElement).style.color = '#000000'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F9FAFB'; (e.currentTarget as HTMLElement).style.color = '#6B7280'; }}
              >
                <Eye className="w-3.5 h-3.5" /> Street View
              </button>
              <Link to={`/property/${selectedProperty.id}`}
                className="w-full flex items-center justify-center gap-2 text-xs py-2 rounded-lg font-semibold"
                style={{ backgroundColor: '#000000', color: '#FFFFFF', textDecoration: 'none' }}>
                View Details <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <MapPin className="w-8 h-8" style={{ color: '#D1D5DB' }} />
            <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>
              Click a marker on the map or use "Show All" to browse and pin a property.
            </p>
          </div>
        )}
      </div>

      {/* ── Map Area ── */}
      <div className="flex-1 relative overflow-hidden">
        <MapView
          localityId={store.selectedLocalityId || (localities?.[0]?.id || '')}
          propertyId={store.selectedPropertyId ?? undefined}
          height="h-full"
        />

        {/* Selected property HUD over the map */}
        {selectedProperty && (
          <div
            className="absolute bottom-5 left-4 right-4 z-20 flex items-center justify-between gap-4 px-4 py-3 rounded-xl"
            style={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid #2A2A2A', backdropFilter: 'blur(12px)' }}
          >
            <div className="flex items-center gap-3 min-w-0">
              {selectedProperty.images?.[0] && (
                <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden">
                  <img src={selectedProperty.images[0]} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#FFFFFF' }}>{selectedProperty.title}</p>
                <p className="text-xs mt-0.5" style={{ color: '#71717A' }}>
                  {formatPrice(selectedProperty.price)}
                  {selectedProperty.bedrooms ? ` · ${selectedProperty.bedrooms} BHK` : ''}
                  {selectedProperty.area_sqft ? ` · ${selectedProperty.area_sqft} sqft` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setShowStreetView(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: '#1C1C1C', border: '1px solid #2A2A2A', color: '#A1A1AA' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#2A2A2A'; (e.currentTarget as HTMLElement).style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1C1C1C'; (e.currentTarget as HTMLElement).style.color = '#A1A1AA'; }}
              >
                <Eye className="w-3.5 h-3.5" /> Street View
              </button>
              <Link to={`/property/${selectedProperty.id}`}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold"
                style={{ backgroundColor: '#FFFFFF', color: '#000000', textDecoration: 'none' }}>
                Details <ChevronRight className="w-3 h-3" />
              </Link>
              <button
                onClick={() => { store.setFilters({ selectedPropertyId: undefined }); setShowStreetView(false); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg"
                style={{ backgroundColor: '#1C1C1C', border: '1px solid #2A2A2A', color: '#71717A' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#2A2A2A'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1C1C1C'; }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

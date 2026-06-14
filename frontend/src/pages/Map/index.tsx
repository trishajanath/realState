import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapView } from '../../components/shared/MapView';
import { useLocalities, useProperties } from '../../hooks/useApi';
import { useMapFilterStore } from '../../store/useMapFilterStore';
import { mockLocalities, mockProperties } from '../../services/mockData';
import type { Property } from '../../types';
import { Search, Filter, X, MapPin, Building2, Eye, ChevronRight, ExternalLink } from 'lucide-react';

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

  const lat = property.latitude ?? 11.0168;
  const lng = property.longitude ?? 76.9558;

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

  // Static Street View image from Google API
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
        style={{
          width: '900px',
          maxWidth: '96vw',
          height: '580px',
          maxHeight: '92vh',
          backgroundColor: '#0A0A0A',
          border: '1px solid #2A2A2A',
          borderRadius: '14px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid #1F1F1F' }}
        >
          <div className="flex items-center gap-3">
            <span
              className="text-[10px] font-mono uppercase px-2 py-1 rounded flex items-center gap-1.5"
              style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A', color: '#52525B' }}
            >
              🧭 Street View
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight" style={{ color: '#FFFFFF' }}>
                {property.title}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#71717A' }}>
                {lat.toFixed(5)}°N, {lng.toFixed(5)}°E
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{
                backgroundColor: '#111111',
                border: '1px solid #2A2A2A',
                color: '#A1A1AA',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = '#1C1C1C';
                (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = '#111111';
                (e.currentTarget as HTMLElement).style.color = '#A1A1AA';
              }}
            >
              <ExternalLink className="w-3 h-3" />
              Open in Google Maps
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              style={{ backgroundColor: '#1C1C1C', border: '1px solid #2A2A2A', color: '#71717A' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#2A2A2A'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#1C1C1C'; }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Panorama / content area */}
        <div className="relative flex-1 overflow-hidden">

          {/* Loading spinner */}
          {svStatus === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ backgroundColor: '#000000' }}>
              <div
                className="w-10 h-10 rounded-full border-2 border-t-white animate-spin mb-3"
                style={{ borderColor: '#1F1F1F', borderTopColor: '#FFFFFF' }}
              />
              <p className="text-xs font-mono" style={{ color: '#52525B' }}>Loading Street View…</p>
            </div>
          )}

          {/* Live panorama container */}
          <div
            ref={panoramaRef}
            className="absolute inset-0"
            style={{ display: svStatus === 'live' ? 'block' : 'none' }}
          />

          {/* Live badge */}
          {svStatus === 'live' && (
            <div
              className="absolute top-3 right-3 z-20 flex items-center gap-1.5 text-[10px] font-mono px-2 py-1 rounded-md"
              style={{ backgroundColor: 'rgba(0,0,0,0.7)', border: '1px solid #1F1F1F', color: '#10b981' }}
            >
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: '#10b981' }} />
              Interactive
            </div>
          )}

          {/* Static Street View image fallback */}
          {svStatus === 'static' && staticUrl && (
            <div className="absolute inset-0 flex flex-col">
              <img
                src={staticUrl}
                alt={`Street View – ${property.title}`}
                className="flex-1 w-full object-cover"
                style={{ minHeight: 0 }}
                onError={() => setSvStatus('unavailable')}
              />
              <div
                className="flex-shrink-0 flex items-center justify-between px-4 py-2 text-xs"
                style={{ borderTop: '1px solid #1F1F1F', backgroundColor: '#050505', color: '#52525B' }}
              >
                <span>Static preview — interactive panorama not available at this location</span>
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#A1A1AA' }}>
                  Try interactive →
                </a>
              </div>
            </div>
          )}

          {/* Fully unavailable fallback */}
          {svStatus === 'unavailable' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                style={{ backgroundColor: '#111111', border: '1px solid #2A2A2A' }}
              >
                🏙️
              </div>
              <div className="text-center">
                <p className="text-sm font-medium mb-1" style={{ color: '#A1A1AA' }}>Street View Unavailable</p>
                <p className="text-xs mb-4" style={{ color: '#52525B' }}>
                  No imagery found within 150m of this property
                </p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-4 py-2 rounded-lg"
                  style={{ backgroundColor: '#1C1C1C', border: '1px solid #2A2A2A', color: '#A1A1AA', textDecoration: 'none' }}
                >
                  Open in Google Maps →
                </a>
              </div>
            </div>
          )}

          {/* Coordinates badge */}
          {svStatus !== 'loading' && (
            <div
              className="absolute bottom-3 left-3 z-20 text-[10px] font-mono px-2 py-1 rounded pointer-events-none"
              style={{ backgroundColor: 'rgba(0,0,0,0.65)', border: '1px solid #1F1F1F', color: '#52525B' }}
            >
              {lat.toFixed(5)}°N  {lng.toFixed(5)}°E
            </div>
          )}
        </div>

        {/* Property detail footer */}
        <div
          className="flex-shrink-0 flex items-center gap-6 px-5 py-3 text-xs"
          style={{ borderTop: '1px solid #1F1F1F', backgroundColor: '#050505' }}
        >
          <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{formatPrice(property.price)}</span>
          {property.bedrooms && <span style={{ color: '#71717A' }}>{property.bedrooms} BHK</span>}
          {property.area_sqft && <span style={{ color: '#71717A' }}>{property.area_sqft} sqft</span>}
          {property.listing_type && (
            <span
              className="px-2 py-0.5 rounded text-[10px] uppercase font-mono"
              style={{ backgroundColor: '#1C1C1C', border: '1px solid #2A2A2A', color: '#A1A1AA' }}
            >
              {property.listing_type}
            </span>
          )}
          <Link
            to={`/property/${property.id}`}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{ backgroundColor: '#FFFFFF', color: '#000000', textDecoration: 'none' }}
            onClick={onClose}
          >
            View Details <ChevronRight className="w-3 h-3" />
          </Link>
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
  const { data: properties } = useProperties();
  const store = useMapFilterStore();

  const [showFilters, setShowFilters] = useState(false);
  const [showStreetView, setShowStreetView] = useState(false);
  const [mapsApiKey, setMapsApiKey] = useState<string | null>(null);

  // Fetch Maps API key for Street View static image
  useEffect(() => {
    fetch('http://localhost:8000/api/v1/auth/google/config')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { if (d.maps_api_key) setMapsApiKey(d.maps_api_key); })
      .catch(() => {});
  }, []);

  // Set initial search query from URL params
  useEffect(() => {
    if (initialQuery && localities) {
      store.setFilters({ searchQuery: initialQuery });
      const matched = localities.find((l) => l.name.toLowerCase().includes(initialQuery.toLowerCase()));
      if (matched) store.setFilters({ selectedLocalityId: matched.id });
    }
  }, [initialQuery, localities]);

  const allProperties = properties || mockProperties;

  // Filter properties for the sidebar list
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
      const loc = (localities || mockLocalities).find((l) => q.includes(l.name.toLowerCase()));
      if (loc && prop.locality_id !== loc.id) return false;
    }

    return true;
  });

  // Derive selected property object from store state
  const selectedProperty = allProperties.find(p => p.id === store.selectedPropertyId) ?? null;

  const selectTrigger: React.CSSProperties = {
    width: '100%',
    height: '36px',
    padding: '0 10px',
    backgroundColor: '#111111',
    border: '1px solid #2A2A2A',
    borderRadius: '6px',
    color: '#A1A1AA',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
  };

  return (
    <div className="flex-1 flex" style={{ minHeight: 0, height: 'calc(100vh - 64px)' }}>

      {/* ── Street View Modal ── */}
      {showStreetView && selectedProperty && (
        <StreetViewModal
          property={selectedProperty}
          apiKey={mapsApiKey}
          onClose={() => setShowStreetView(false)}
        />
      )}

      {/* ── Left Sidebar ── */}
      <div
        className="flex flex-col overflow-hidden flex-shrink-0"
        style={{ width: '360px', borderRight: '1px solid #1F1F1F', backgroundColor: '#000000' }}
      >
        {/* Search bar */}
        <div className="p-4" style={{ borderBottom: '1px solid #1F1F1F' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#52525B' }} />
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
                backgroundColor: '#0A0A0A',
                border: '1px solid #2A2A2A',
                borderRadius: '6px',
                color: '#FFFFFF',
              }}
            />
            {store.searchQuery && (
              <button
                onClick={() => store.setFilters({ searchQuery: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: '#52525B' }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter toggle */}
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #111111' }}>
          <span className="text-xs" style={{ color: '#71717A' }}>
            {filteredProperties.length} properties
          </span>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded transition-colors"
            style={{
              backgroundColor: showFilters ? '#FFFFFF' : '#111111',
              color: showFilters ? '#000000' : '#A1A1AA',
              border: '1px solid #2A2A2A',
            }}
          >
            <Filter className="w-3 h-3" />
            Filters
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="p-4 space-y-4" style={{ borderBottom: '1px solid #1F1F1F' }}>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: '#71717A' }}>Property Type</label>
              <select
                value={store.propertyType}
                onChange={(e) => store.setFilters({ propertyType: e.target.value })}
                style={selectTrigger}
              >
                {['All', 'Apartment', 'Villa', 'Independent House', 'Plot'].map((v) => (
                  <option key={v} value={v} style={{ backgroundColor: '#111111' }}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs mb-1.5" style={{ color: '#71717A' }}>Locality</label>
              <select
                value={store.selectedLocalityId || ''}
                onChange={(e) => store.setFilters({ selectedLocalityId: e.target.value || undefined })}
                style={selectTrigger}
              >
                <option value="" style={{ backgroundColor: '#111111' }}>All Localities</option>
                {(localities || mockLocalities).map((l) => (
                  <option key={l.id} value={l.id} style={{ backgroundColor: '#111111' }}>{l.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs mb-1.5" style={{ color: '#71717A' }}>
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
                style={{ accentColor: '#FFFFFF' }}
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs mb-1.5" style={{ color: '#71717A' }}>Bedrooms</label>
                <select
                  value={store.bedrooms === 'All' ? 'All' : String(store.bedrooms)}
                  onChange={(e) => store.setFilters({ bedrooms: e.target.value === 'All' ? 'All' : parseInt(e.target.value) })}
                  style={selectTrigger}
                >
                  {['All', '1', '2', '3', '4'].map((v) => (
                    <option key={v} value={v} style={{ backgroundColor: '#111111' }}>{v === 'All' ? 'Any' : `${v} BHK`}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs mb-1.5" style={{ color: '#71717A' }}>Bathrooms</label>
                <select
                  value={store.bathrooms === 'All' ? 'All' : String(store.bathrooms)}
                  onChange={(e) => store.setFilters({ bathrooms: e.target.value === 'All' ? 'All' : parseInt(e.target.value) })}
                  style={selectTrigger}
                >
                  {['All', '1', '2', '3', '4'].map((v) => (
                    <option key={v} value={v} style={{ backgroundColor: '#111111' }}>{v === 'All' ? 'Any' : v}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => store.setFilters({
                searchQuery: '', propertyType: 'All', bedrooms: 'All', bathrooms: 'All',
                priceMin: 0, priceMax: 50000000, areaMin: 0, areaMax: 10000,
                selectedLocalityId: undefined, commuteDestination: '',
              })}
              className="text-xs transition-colors"
              style={{ color: '#71717A' }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#FFFFFF')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = '#71717A')}
            >
              Reset filters
            </button>
          </div>
        )}

        {/* ── Property List ── */}
        <div className="flex-1 overflow-y-auto">
          {filteredProperties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <Building2 className="w-8 h-8 mb-3" style={{ color: '#2A2A2A' }} />
              <p className="text-sm" style={{ color: '#52525B' }}>No properties match your filters.</p>
            </div>
          ) : (
            filteredProperties.map((prop) => {
              const locality = (localities || mockLocalities).find((l) => l.id === prop.locality_id);
              const isSelected = store.selectedPropertyId === prop.id;

              return (
                <div
                  key={prop.id}
                  id={`property-card-${prop.id}`}
                  onClick={() => {
                    // Toggle: click selected card to deselect
                    store.setFilters({ selectedPropertyId: isSelected ? undefined : prop.id });
                    if (isSelected) setShowStreetView(false);
                  }}
                  className="cursor-pointer transition-all"
                  style={{
                    borderBottom: '1px solid #111111',
                    borderLeft: isSelected ? '2px solid #FFFFFF' : '2px solid transparent',
                    backgroundColor: isSelected ? '#0D0D0D' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = '#0A0A0A';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                >
                  {/* Property image */}
                  {prop.images?.[0] && (
                    <div style={{ margin: '12px 12px 0', height: '120px', overflow: 'hidden', borderRadius: '6px' }}>
                      <img
                        src={prop.images[0]}
                        alt={prop.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-4 pt-3">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/property/${prop.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-medium leading-snug hover:underline flex-1"
                        style={{ color: '#FFFFFF' }}
                      >
                        {prop.title}
                      </Link>
                      {/* "Pinned" badge when selected */}
                      {isSelected && (
                        <span
                          className="flex-shrink-0 flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: '#1C1C1C', border: '1px solid #2A2A2A', color: '#A1A1AA' }}
                        >
                          📍 Pinned
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 text-xs" style={{ color: '#71717A' }}>
                      <MapPin className="w-3 h-3" />
                      {locality?.name || 'Coimbatore'}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>
                        {formatPrice(prop.price)}
                      </span>
                      <div className="flex items-center gap-2 text-xs" style={{ color: '#71717A' }}>
                        {prop.bedrooms && <span>{prop.bedrooms} BHK</span>}
                        {prop.area_sqft && <span>{prop.area_sqft} sqft</span>}
                      </div>
                    </div>

                    {/* Street View button — only visible on selected card */}
                    {isSelected && (
                      <button
                        id={`street-view-btn-${prop.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowStreetView(true);
                        }}
                        className="mt-3 w-full flex items-center justify-center gap-2 text-xs py-2 rounded-lg transition-all"
                        style={{
                          backgroundColor: '#111111',
                          border: '1px solid #2A2A2A',
                          color: '#A1A1AA',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = '#1C1C1C';
                          (e.currentTarget as HTMLElement).style.borderColor = '#3F3F46';
                          (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.backgroundColor = '#111111';
                          (e.currentTarget as HTMLElement).style.borderColor = '#2A2A2A';
                          (e.currentTarget as HTMLElement).style.color = '#A1A1AA';
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Street View
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
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
            style={{
              backgroundColor: 'rgba(0,0,0,0.9)',
              border: '1px solid #2A2A2A',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              {selectedProperty.images?.[0] && (
                <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden">
                  <img src={selectedProperty.images[0]} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#FFFFFF' }}>
                  {selectedProperty.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#71717A' }}>
                  {formatPrice(selectedProperty.price)}
                  {selectedProperty.bedrooms ? ` · ${selectedProperty.bedrooms} BHK` : ''}
                  {selectedProperty.area_sqft ? ` · ${selectedProperty.area_sqft} sqft` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Street View button */}
              <button
                onClick={() => setShowStreetView(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{
                  backgroundColor: '#1C1C1C',
                  border: '1px solid #2A2A2A',
                  color: '#A1A1AA',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#2A2A2A';
                  (e.currentTarget as HTMLElement).style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#1C1C1C';
                  (e.currentTarget as HTMLElement).style.color = '#A1A1AA';
                }}
              >
                <Eye className="w-3.5 h-3.5" />
                Street View
              </button>

              {/* View details */}
              <Link
                to={`/property/${selectedProperty.id}`}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#000000',
                  textDecoration: 'none',
                }}
              >
                Details <ChevronRight className="w-3 h-3" />
              </Link>

              {/* Dismiss */}
              <button
                onClick={() => { store.setFilters({ selectedPropertyId: undefined }); setShowStreetView(false); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
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

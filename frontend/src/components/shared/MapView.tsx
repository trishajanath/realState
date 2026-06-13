import React, { useEffect, useRef, useState } from 'react';
import { useMapFilterStore } from '../../store/useMapFilterStore';
import { mockLocalities, mockProperties, mockAmenities, mockScores, mockMetrics } from '../../services/mockData';
import type { Property } from '../../types';
import { Navigation, Compass, Radio, Info } from 'lucide-react';

declare const google: any;

interface MapViewProps {
  localityId?: string;
  propertyId?: string;
  height?: string;
}

// Custom Premium Google Maps styling
const silverMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "on" }, { saturation: -80 }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "administrative.land_parcel", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] }
];

export const MapView: React.FC<MapViewProps> = ({
  localityId: _localityId,
  propertyId: _propertyId,
  height = 'h-[500px]'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  
  // Zustand States
  const store = useMapFilterStore();
  
  // Loading, Fallback & Error states
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const useMockFallback = store.useMockFallback;
  
  const [mapZoom, setMapZoom] = useState(12);
  const [localityStats, setLocalityStats] = useState<any | null>(null);
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);

  // References to map elements for cleanup
  const markersRef = useRef<any[]>([]);
  const polygonsRef = useRef<any[]>([]);
  const heatmapRef = useRef<any>(null);
  const commuteCircleRef = useRef<any>(null);
  const commuteMarkerRef = useRef<any>(null);
  const amenityMarkersRef = useRef<any[]>([]);
  const directionsRendererRef = useRef<any>(null);

  // Projected coordinates dimensions for Mock SVG Canvas fallback
  const svgWidth = 800;
  const svgHeight = 500;

  const latToY = (lat: number | undefined | null) => {
    const minLat = 10.99;
    const maxLat = 11.09;
    const l = lat || 11.02;
    const y = ((maxLat - l) / (maxLat - minLat)) * svgHeight;
    return Math.max(30, Math.min(svgHeight - 30, y));
  };

  const lonToX = (lon: number | undefined | null) => {
    const minLon = 76.93;
    const maxLon = 77.05;
    const l = lon || 77.00;
    const x = ((l - minLon) / (maxLon - minLon)) * svgWidth;
    return Math.max(30, Math.min(svgWidth - 30, x));
  };

  // 1. Synchronize local loadError state when fallback is engaged globally
  useEffect(() => {
    if (useMockFallback) {
      setLoadError("Google Maps key auth failure. Running in interactive vector fallback mode.");
    }
  }, [useMockFallback]);

  // 2. Fetch Google Config (API Key) on Mount
  useEffect(() => {
    const fetchConfig = async () => {
      const startTime = performance.now();
      try {
        const res = await fetch('http://localhost:8000/api/v1/auth/google/config');
        if (!res.ok) throw new Error('API server configuration is unreachable');
        const data = await res.json();
        if (data.maps_api_key) {
          setApiKey(data.maps_api_key);
          store.setFilters({ mapsApiKey: data.maps_api_key });
          
          // Log geospatial query performance telemetry
          const latency = performance.now() - startTime;
          fetch('http://localhost:8000/api/v1/metrics/client', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ metric_name: 'geospatial_query_latency', value_ms: latency })
          }).catch(() => {});
        } else {
          throw new Error('Google Maps API key not configured on server');
        }
      } catch (err: any) {
        console.error('Error loading Google Maps configuration, loading SVG fallback:', err);
        setLoadError(err.message || 'Could not retrieve Maps configuration');
        store.setFilters({ useMockFallback: true });
      }
    };
    fetchConfig();
  }, []);

  // 3. Load Google Maps Script
  useEffect(() => {
    if (!apiKey || useMockFallback) return;

    const loadScript = () => {
      const win = window as any;
      if (win.google && win.google.maps) {
        setIsLoaded(true);
        return;
      }

      const existingScript = document.getElementById('google-maps-sdk');
      if (existingScript) {
        existingScript.addEventListener('load', () => setIsLoaded(true));
        return;
      }

      win.gm_init = () => {
        setIsLoaded(true);
      };

      const script = document.createElement('script');
      script.id = 'google-maps-sdk';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization,geometry,places&loading=async&callback=gm_init`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        setLoadError('Google Maps Script failed to load.');
        store.setFilters({ useMockFallback: true });
      };
      document.head.appendChild(script);
    };

    loadScript();
  }, [apiKey, useMockFallback]);

  // 4. Initialize Map Widget (Native Google Map)
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || mapRef.current || useMockFallback) return;

    const startTime = performance.now();
    try {
      const coimbatoreCenter = { lat: 11.0168, lng: 76.9558 };
      
      const map = new google.maps.Map(mapContainerRef.current, {
        center: coimbatoreCenter,
        zoom: mapZoom,
        styles: silverMapStyle as any,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM
        }
      });

      mapRef.current = map;

      // Track zoom level changes dynamically
      map.addListener('zoom_changed', () => {
        const currentZoom = map.getZoom();
        if (currentZoom !== undefined) {
          setMapZoom(currentZoom);
        }
      });

      // Track render time telemetry
      const renderTime = performance.now() - startTime;
      fetch('http://localhost:8000/api/v1/metrics/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metric_name: 'map_load_time', value_ms: renderTime })
      }).catch(() => {});

    } catch (e: any) {
      console.error('Failed to instantiate Google Map object, engaging SVG fallback:', e);
      store.setFilters({ useMockFallback: true });
    }
  }, [isLoaded, useMockFallback]);

  // 5. Update Map center when selection changes in Zustand store
  useEffect(() => {
    if (!mapRef.current || useMockFallback) return;

    if (store.selectedPropertyId) {
      const prop = mockProperties.find(p => p.id === store.selectedPropertyId);
      if (prop && prop.latitude && prop.longitude) {
        mapRef.current.panTo({ lat: prop.latitude, lng: prop.longitude });
        mapRef.current.setZoom(15);
      }
    } else if (store.selectedLocalityId) {
      const loc = mockLocalities.find(l => l.id === store.selectedLocalityId);
      if (loc && loc.latitude && loc.longitude) {
        mapRef.current.panTo({ lat: loc.latitude, lng: loc.longitude });
        mapRef.current.setZoom(14);
      }
    }
  }, [store.selectedPropertyId, store.selectedLocalityId, useMockFallback]);

  // 6. Generate custom styled SVG markers for Property details (Google Map pins)
  const getPropertyMarkerSvg = (type: string, state: 'default' | 'hover' | 'selected' | 'saved' | 'compared') => {
    let color = '#3b82f6'; // blue
    if (type === 'Apartment') color = '#2563eb';
    else if (type === 'Villa') color = '#9333ea';
    else if (type === 'Independent House') color = '#db2777';
    else if (type === 'Plot') color = '#059669';
    else if (type === 'Commercial Building') color = '#ea580c';
    else if (type === 'Office Space') color = '#0891b2';

    let border = '#ffffff';
    let strokeWidth = 2;
    let scale = 1;
    let iconInside = '';

    if (state === 'hover') {
      scale = 1.2;
      border = '#0f172a';
      strokeWidth = 2.5;
    } else if (state === 'selected') {
      scale = 1.35;
      border = '#eab308'; // Premium gold
      strokeWidth = 3;
    } else if (state === 'saved') {
      border = '#f43f5e';
      strokeWidth = 2.5;
    } else if (state === 'compared') {
      border = '#0284c7';
      strokeWidth = 3;
    }

    const letter = type ? type.charAt(0) : 'P';
    iconInside = `<text x="18" y="20" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">${letter}</text>`;

    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 36 42">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#000000" flood-opacity="0.25"/>
          </filter>
        </defs>
        <g filter="url(#shadow)">
          <path d="M18 2C9.16 2 2 9.16 2 18c0 10.66 16 22 16 22s16-11.34 16-22c0-8.84-7.16-16-16-16z" fill="${color}" stroke="${border}" stroke-width="${strokeWidth}"/>
          <circle cx="18" cy="17" r="9" fill="${color}" opacity="0.3"/>
          ${iconInside}
        </g>
      </svg>
    `;

    return {
      url: `data:image/svg+xml;utf-8,${encodeURIComponent(svgString)}`,
      anchor: new google.maps.Point(18 * scale, 40 * scale),
      scaledSize: new google.maps.Size(36 * scale, 42 * scale)
    };
  };

  // 7. Render property markers on Google Map
  useEffect(() => {
    if (!mapRef.current || !isLoaded || useMockFallback) return;

    const startTime = performance.now();

    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const activeProperties = mockProperties.filter(prop => {
      // 1. Price budget
      if (prop.price < store.priceMin || prop.price > store.priceMax) return false;
      
      // 2. Property Type
      if (store.propertyType !== 'All' && prop.property_type !== store.propertyType) return false;
      
      // 3. Project Status
      if (store.propertyStatus !== 'all') {
        if (store.propertyStatus === 'pre-launch' && prop.property_type !== 'Plot') return false;
        if (store.propertyStatus === 'under-construction' && prop.property_type !== 'Apartment') return false;
      } else if (store.newProjectsFilter !== 'all') {
        if (store.newProjectsFilter === 'pre-launch' && prop.property_type !== 'Plot') return false;
        if (store.newProjectsFilter === 'under-construction' && prop.property_type !== 'Apartment') return false;
      }

      // 4. Bedrooms
      if (store.bedrooms !== 'All' && prop.bedrooms !== store.bedrooms) return false;

      // 5. Bathrooms
      if (store.bathrooms !== 'All' && prop.bathrooms !== store.bathrooms) return false;

      // 6. Area bounds
      if (prop.area_sqft < store.areaMin || prop.area_sqft > store.areaMax) return false;

      // 7. Builder
      if (store.builder !== 'All') {
        const b = store.builder.toLowerCase();
        const developer = "Casagrand"; // matches Casagrand mock structures
        if (!developer.toLowerCase().includes(b)) return false;
      }

      // 8. Search query matching (including BHK intent parsing)
      if (store.searchQuery && store.searchQuery !== store.commuteDestination) {
        const query = store.searchQuery.toLowerCase();
        
        // 1. BHK check
        const hasBhkQuery = query.match(/(\d+)\s*bhk/);
        if (hasBhkQuery) {
          const bhkCount = parseInt(hasBhkQuery[1]);
          if (prop.bedrooms !== bhkCount) return false;
        }

        // 2. Rent/Sale check
        const isRentQuery = query.includes('rent') || query.includes('lease');
        const isSaleQuery = query.includes('sale') || query.includes('sell') || query.includes('buy') || query.includes('purchase');
        if (isRentQuery && prop.listing_type?.toLowerCase() !== 'rent') return false;
        if (isSaleQuery && prop.listing_type?.toLowerCase() !== 'sale' && prop.listing_type?.toLowerCase() !== 'buy') {
          return false;
        }

        // 3. Locality check
        const matchedLocality = mockLocalities.find(l => query.includes(l.name.toLowerCase()));
        if (matchedLocality && prop.locality_id !== matchedLocality.id) {
          return false;
        }

        // 4. Property Type check
        let matchedType: string | null = null;
        if (query.includes('villa')) matchedType = 'Villa';
        else if (query.includes('apartment') || query.includes('flat') || query.includes('residency') || query.includes('gated')) matchedType = 'Apartment';
        else if (query.includes('plot') || query.includes('land') || query.includes('site')) matchedType = 'Plot';
        else if (query.includes('house') || query.includes('home') || query.includes('residential')) matchedType = 'Residential';

        if (matchedType) {
          if (matchedType === 'Residential') {
            if (prop.property_type === 'Plot') return false;
          } else if (prop.property_type !== matchedType) {
            return false;
          }
        }

        // 5. Fallback word-by-word match
        if (!matchedLocality && !matchedType && !hasBhkQuery) {
          const commonWords = ['in', 'for', 'near', 'the', 'a', 'an', 'at', 'with', 'and', 'of', 'to'];
          const terms = query.split(/\s+/).filter(t => t.length > 0);
          const searchTerms = terms.filter(t => !commonWords.includes(t));
          
          if (searchTerms.length > 0) {
            const propText = `${prop.title} ${prop.property_type} ${prop.ai_description || ''} ${prop.ai_investment_rating || ''}`.toLowerCase();
            const matchesAnyTerm = searchTerms.some(term => propText.includes(term));
            if (!matchesAnyTerm) return false;
          }
        }
      }
      return true;
    });

    const map = mapRef.current;

    if (mapZoom < 13) {
      const clusters: Array<{ lat: number; lng: number; count: number; properties: Property[] }> = [];
      const threshold = 0.018;

      activeProperties.forEach(prop => {
        if (!prop.latitude || !prop.longitude) return;
        
        let added = false;
        for (const cluster of clusters) {
          const dist = Math.sqrt(Math.pow(cluster.lat - prop.latitude, 2) + Math.pow(cluster.lng - prop.longitude, 2));
          if (dist < threshold) {
            cluster.lat = (cluster.lat * cluster.count + prop.latitude) / (cluster.count + 1);
            cluster.lng = (cluster.lng * cluster.count + prop.longitude) / (cluster.count + 1);
            cluster.count++;
            cluster.properties.push(prop);
            added = true;
            break;
          }
        }

        if (!added) {
          clusters.push({ lat: prop.latitude, lng: prop.longitude, count: 1, properties: [prop] });
        }
      });

      clusters.forEach(cluster => {
        if (cluster.count > 1) {
          const m = new google.maps.Marker({
            position: { lat: cluster.lat, lng: cluster.lng },
            map,
            label: { text: String(cluster.count), color: 'white', fontWeight: 'bold', fontSize: '13px' },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#3b82f6',
              fillOpacity: 0.9,
              scale: 22,
              strokeColor: '#ffffff',
              strokeWeight: 2
            },
            title: `Cluster of ${cluster.count} properties.`
          });
          m.addListener('click', () => {
            map.setCenter({ lat: cluster.lat, lng: cluster.lng });
            map.setZoom(mapZoom + 2);
          });
          markersRef.current.push(m);
        } else {
          createPropertyMarker(cluster.properties[0]);
        }
      });
    } else {
      activeProperties.forEach(prop => {
        createPropertyMarker(prop);
      });
    }

    function createPropertyMarker(prop: Property) {
      if (!prop.latitude || !prop.longitude) return;

      let state: 'default' | 'hover' | 'selected' | 'saved' | 'compared' = 'default';
      if (prop.id === store.selectedPropertyId) state = 'selected';
      else if (store.savedPropertyIds.includes(prop.id)) state = 'saved';
      else if (store.comparedPropertyIds.includes(prop.id)) state = 'compared';

      const marker = new google.maps.Marker({
        position: { lat: prop.latitude, lng: prop.longitude },
        map,
        icon: getPropertyMarkerSvg(prop.property_type, state),
        title: prop.title
      });

      marker.addListener('click', () => {
        store.setFilters({ selectedPropertyId: prop.id });
      });

      marker.addListener('mouseover', () => {
        marker.setIcon(getPropertyMarkerSvg(prop.property_type, 'hover'));
      });
      marker.addListener('mouseout', () => {
        let originalState: 'default' | 'hover' | 'selected' | 'saved' | 'compared' = 'default';
        if (prop.id === store.selectedPropertyId) originalState = 'selected';
        else if (store.savedPropertyIds.includes(prop.id)) originalState = 'saved';
        else if (store.comparedPropertyIds.includes(prop.id)) originalState = 'compared';
        marker.setIcon(getPropertyMarkerSvg(prop.property_type, originalState));
      });

      markersRef.current.push(marker);
    }

    const elapsed = performance.now() - startTime;
    fetch('http://localhost:8000/api/v1/metrics/client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metric_name: 'marker_rendering_time', value_ms: elapsed })
    }).catch(() => {});

  }, [isLoaded, store.priceMin, store.priceMax, store.propertyType, store.searchQuery, store.newProjectsFilter, store.selectedPropertyId, store.savedPropertyIds, store.comparedPropertyIds, store.bedrooms, store.bathrooms, store.areaMin, store.areaMax, store.builder, store.propertyStatus, mapZoom, useMockFallback]);

  // 8. Locality boundaries on Google Map
  useEffect(() => {
    if (!mapRef.current || !isLoaded || useMockFallback) return;

    polygonsRef.current.forEach(p => p.setMap(null));
    polygonsRef.current = [];

    if (mapZoom < 14) {
      mockLocalities.forEach((loc) => {
        if (!loc.latitude || !loc.longitude) return;

        const points = [];
        const numSides = 12;
        const radiusMeters = 900;
        for (let i = 0; i < numSides; i++) {
          const angle = (i * 2 * Math.PI) / numSides;
          const randomFactor = 0.85 + Math.sin(i * 2.8) * 0.15;
          const dLat = (radiusMeters * randomFactor * Math.cos(angle)) / 111320;
          const dLng = (radiusMeters * randomFactor * Math.sin(angle)) / (111320 * Math.cos(loc.latitude * Math.PI / 180));
          points.push({ lat: loc.latitude + dLat, lng: loc.longitude + dLng });
        }

        const metrics = mockMetrics[loc.id] || {};
        const scores = mockScores[loc.id] || {};
        
        let color = '#3b82f6';
        if (scores.investment_score && scores.investment_score >= 88) color = '#10b981';
        else if (scores.investment_score && scores.investment_score < 80) color = '#f59e0b';

        const isLocalityHighlighted = store.selectedLocalityId === loc.id;
        const selectedProperty = mockProperties.find(p => p.id === store.selectedPropertyId);
        const isPropertyContext = selectedProperty && selectedProperty.locality_id === loc.id;
        const shouldShowBoundaries = store.showLocalityBoundaries || isLocalityHighlighted || isPropertyContext;

        const polygon = new google.maps.Polygon({
          paths: points,
          strokeColor: color,
          strokeOpacity: 0.7,
          strokeWeight: isLocalityHighlighted ? 2.5 : 1.5,
          fillColor: color,
          fillOpacity: isLocalityHighlighted ? 0.35 : 0.15,
          map: shouldShowBoundaries ? mapRef.current : null
        });

        polygon.addListener('click', () => {
          store.setFilters({ selectedLocalityId: loc.id });
        });

        polygon.addListener('mouseover', () => {
          polygon.setOptions({ fillOpacity: 0.35, strokeWeight: 3 });
          setLocalityStats({
            name: loc.name,
            price: metrics.avg_price_per_sqft || 5000,
            investment: scores.investment_score || 85,
            safety: scores.healthcare_score || 80,
            growth: metrics.listing_velocity || 8.0
          });
        });

        polygon.addListener('mouseout', () => {
          polygon.setOptions({ fillOpacity: 0.15, strokeWeight: 1.5 });
          setLocalityStats(null);
        });

        polygonsRef.current.push(polygon);
      });
    }
  }, [isLoaded, mapZoom, store.showLocalityBoundaries, store.selectedLocalityId, store.selectedPropertyId, useMockFallback]);

  // 9. Heatmap layers on Google Map
  useEffect(() => {
    if (!mapRef.current || !isLoaded || useMockFallback) return;

    const startTime = performance.now();

    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
      heatmapRef.current = null;
    }

    if (store.activeHeatmap === 'none') return;

    const points: any[] = [];

    mockProperties.forEach(prop => {
      if (!prop.latitude || !prop.longitude) return;

      let weight = 1;
      if (store.activeHeatmap === 'price') {
        weight = prop.price / 800000;
      } else if (store.activeHeatmap === 'investment') {
        const grade = prop.ai_investment_rating || '';
        weight = grade.includes('Grade: A') ? 100 : grade.includes('Grade: B') ? 60 : 30;
      } else if (store.activeHeatmap === 'safety') {
        const scores = mockScores[prop.locality_id || ''];
        weight = scores?.healthcare_score || 75;
      } else if (store.activeHeatmap === 'amenity') {
        const count = mockAmenities[prop.locality_id || '']?.length || 3;
        weight = count * 15;
      }

      points.push({
        location: new google.maps.LatLng(prop.latitude, prop.longitude),
        weight: weight
      });
    });

    mockLocalities.forEach(loc => {
      if (!loc.latitude || !loc.longitude) return;
      const scores = mockScores[loc.id] || {};
      const metrics = mockMetrics[loc.id] || {};

      let weight = 50;
      if (store.activeHeatmap === 'price') {
        weight = (metrics.avg_price_per_sqft || 4500) / 100;
      } else if (store.activeHeatmap === 'investment') {
        weight = scores.investment_score || 85;
      } else if (store.activeHeatmap === 'safety') {
        weight = scores.healthcare_score || 80;
      } else if (store.activeHeatmap === 'amenity') {
        weight = (metrics.grocery_stores_per_sq_km || 10) * 10;
      }

      points.push({
        location: new google.maps.LatLng(loc.latitude, loc.longitude),
        weight: weight
      });
    });

    const heatmap = new google.maps.visualization.HeatmapLayer({
      data: points,
      map: mapRef.current,
      radius: 40,
      opacity: 0.75
    });

    heatmapRef.current = heatmap;

    const elapsed = performance.now() - startTime;
    fetch('http://localhost:8000/api/v1/metrics/client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metric_name: 'heatmap_generation_time', value_ms: elapsed })
    }).catch(() => {});

  }, [isLoaded, store.activeHeatmap, useMockFallback]);

  // 10. Commute analysis overlays on Google Map
  useEffect(() => {
    if (!mapRef.current || !isLoaded || useMockFallback) return;

    if (commuteCircleRef.current) {
      commuteCircleRef.current.setMap(null);
      commuteCircleRef.current = null;
    }
    if (commuteMarkerRef.current) {
      commuteMarkerRef.current.setMap(null);
      commuteMarkerRef.current = null;
    }
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
    }

    if (!store.commuteDestination) return;

    const resolveCommuteCoords = () => {
      const normalized = store.commuteDestination.toLowerCase();
      if (normalized.includes('chil') || normalized.includes('sez')) return { lat: 11.0829, lng: 77.0257 };
      if (normalized.includes('psg') || normalized.includes('tech')) return { lat: 11.0254, lng: 77.0028 };
      if (normalized.includes('tidel') || normalized.includes('park')) return { lat: 11.0276, lng: 77.0305 };
      if (normalized.includes('junction') || normalized.includes('station')) return { lat: 10.9978, lng: 76.9634 };
      return { lat: 11.0254, lng: 77.0028 };
    };

    const map = mapRef.current;
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address: store.commuteDestination + ", Coimbatore" }, (results: any, status: string) => {
      let coords: any;
      if (status === 'OK' && results && results[0]) {
        coords = results[0].geometry.location;
      } else {
        const fallback = resolveCommuteCoords();
        coords = new google.maps.LatLng(fallback.lat, fallback.lng);
      }

      const marker = new google.maps.Marker({
        position: coords,
        map,
        icon: {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
          fillColor: '#ea4335',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 1.5,
          anchor: new google.maps.Point(12, 21)
        },
        title: `Commute Destination: ${store.commuteDestination}`
      });

      const radiusMeters = store.commuteMaxTime * 180; 

      const circle = new google.maps.Circle({
        strokeColor: '#ef4444',
        strokeOpacity: 0.6,
        strokeWeight: 1.5,
        fillColor: '#ef4444',
        fillOpacity: 0.08,
        map,
        center: coords,
        radius: radiusMeters
      });

      commuteMarkerRef.current = marker;
      commuteCircleRef.current = circle;
      map.panTo(coords);

      // Directions Rendering (Property to Commute Destination)
      if (store.selectedPropertyId) {
        const prop = mockProperties.find(p => p.id === store.selectedPropertyId);
        if (prop && prop.latitude && prop.longitude) {
          const origin = new google.maps.LatLng(prop.latitude, prop.longitude);
          
          if (!directionsRendererRef.current) {
            directionsRendererRef.current = new google.maps.DirectionsRenderer({
              map,
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#3b82f6',
                strokeOpacity: 0.8,
                strokeWeight: 4
              }
            });
          } else {
            directionsRendererRef.current.setMap(map);
          }

          const directionsService = new google.maps.DirectionsService();
          directionsService.route({
            origin: origin,
            destination: coords,
            travelMode: google.maps.TravelMode.DRIVING
          }, (dirResult: any, dirStatus: string) => {
            if (dirStatus === 'OK' && directionsRendererRef.current) {
              directionsRendererRef.current.setDirections(dirResult);
            }
          });
        }
      }
    });

  }, [isLoaded, store.commuteDestination, store.commuteMaxTime, store.selectedPropertyId, useMockFallback]);

  // 11. Amenities on Google Map (Places Nearby Search)
  useEffect(() => {
    if (!mapRef.current || !isLoaded || useMockFallback) return;

    amenityMarkersRef.current.forEach(m => m.setMap(null));
    amenityMarkersRef.current = [];

    if (store.amenityCategories.length === 0) return;

    const map = mapRef.current;
    
    let center = map.getCenter();
    if (store.selectedPropertyId) {
      const prop = mockProperties.find(p => p.id === store.selectedPropertyId);
      if (prop && prop.latitude && prop.longitude) {
        center = new google.maps.LatLng(prop.latitude, prop.longitude);
      }
    } else if (store.selectedLocalityId) {
      const loc = mockLocalities.find(l => l.id === store.selectedLocalityId);
      if (loc && loc.latitude && loc.longitude) {
        center = new google.maps.LatLng(loc.latitude, loc.longitude);
      }
    }

    if (!center) return;

    const placesService = new google.maps.places.PlacesService(map);
    
    const categoryToType: Record<string, string[]> = {
      school: ['school'],
      hospital: ['hospital'],
      restaurant: ['restaurant', 'cafe'],
      park: ['park'],
      gym: ['gym']
    };

    store.amenityCategories.forEach(cat => {
      const types = categoryToType[cat] || ['establishment'];
      
      placesService.nearbySearch({
        location: center,
        radius: 2000,
        type: types[0] as any
      }, (results: any, status: string) => {
        if (status === 'OK' && results) {
          results.slice(0, 8).forEach((place: any) => {
            let iconColor = '#3b82f6';
            let iconSymbol = 'A';

            if (cat === 'school') { iconColor = '#3b82f6'; iconSymbol = '🎓'; }
            else if (cat === 'hospital') { iconColor = '#ef4444'; iconSymbol = '🏥'; }
            else if (cat === 'restaurant') { iconColor = '#f59e0b'; iconSymbol = '🍽️'; }
            else if (cat === 'park') { iconColor = '#10b981'; iconSymbol = '🌳'; }
            else if (cat === 'gym') { iconColor = '#db2777'; iconSymbol = '💪'; }

            const marker = new google.maps.Marker({
              position: place.geometry.location,
              map,
              title: `${place.name} (${cat})`,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: iconColor,
                fillOpacity: 0.95,
                scale: 13,
                strokeColor: '#ffffff',
                strokeWeight: 1.5
              },
              label: { text: iconSymbol, fontSize: '9px' }
            });

            const ratingText = place.rating ? `${place.rating} / 5.0` : 'No reviews';
            const addressText = place.vicinity || '';

            const infoWindow = new google.maps.InfoWindow({
              content: `<div style="font-family: sans-serif; padding: 4px; color: #0f172a;">
                <strong style="color: ${iconColor}; text-transform: uppercase; font-size: 10px; display: block;">${cat}</strong>
                <h5 style="margin: 2px 0 0 0; font-size: 12px; font-weight: bold;">${place.name}</h5>
                <p style="margin: 2px 0 0 0; font-size: 10px; color: #475569;">${addressText}</p>
                <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">Rating: <strong>${ratingText}</strong></p>
              </div>`
            });

            marker.addListener('click', () => {
              infoWindow.open(map, marker);
            });

            amenityMarkersRef.current.push(marker);
          });
        } else {
          renderMockAmenitiesForCategory(cat);
        }
      });
    });

    function renderMockAmenitiesForCategory(cat: string) {
      Object.keys(mockAmenities).forEach(localityId => {
        const amenities = mockAmenities[localityId] || [];
        amenities.forEach(amenity => {
          if (amenity.category !== cat) return;

          let iconColor = '#3b82f6';
          let iconSymbol = 'A';

          if (amenity.category === 'school') { iconColor = '#3b82f6'; iconSymbol = '🎓'; }
          else if (amenity.category === 'hospital') { iconColor = '#ef4444'; iconSymbol = '🏥'; }
          else if (amenity.category === 'restaurant') { iconColor = '#f59e0b'; iconSymbol = '🍽️'; }
          else if (amenity.category === 'park') { iconColor = '#10b981'; iconSymbol = '🌳'; }
          else if (amenity.category === 'gym') { iconColor = '#db2777'; iconSymbol = '💪'; }

          const marker = new google.maps.Marker({
            position: { lat: amenity.latitude, lng: amenity.longitude },
            map,
            title: `${amenity.name} (${amenity.category})`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: iconColor,
              fillOpacity: 0.95,
              scale: 13,
              strokeColor: '#ffffff',
              strokeWeight: 1.5
            },
            label: { text: iconSymbol, fontSize: '9px' }
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `<div style="font-family: sans-serif; padding: 4px; color: #0f172a;">
              <strong style="color: ${iconColor}; text-transform: uppercase; font-size: 10px; display: block;">${amenity.category}</strong>
              <h5 style="margin: 2px 0 0 0; font-size: 12px; font-weight: bold;">${amenity.name}</h5>
              <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">Confidence: ${((amenity.confidence_score || 0.9) * 100).toFixed(0)}%</p>
            </div>`
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });

          amenityMarkersRef.current.push(marker);
        });
      });
    }

  }, [isLoaded, store.amenityCategories, store.selectedPropertyId, store.selectedLocalityId, useMockFallback]);

  // Clean up overlays on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(m => m.setMap(null));
      polygonsRef.current.forEach(p => p.setMap(null));
      amenityMarkersRef.current.forEach(m => m.setMap(null));
      if (heatmapRef.current) heatmapRef.current.setMap(null);
      if (commuteCircleRef.current) commuteCircleRef.current.setMap(null);
      if (commuteMarkerRef.current) commuteMarkerRef.current.setMap(null);
      if (directionsRendererRef.current) directionsRendererRef.current.setMap(null);
    };
  }, []);

  // Filter properties logic for fallback SVG rendering
  const getFilteredPropertiesForFallback = () => {
    return mockProperties.filter(prop => {
      if (prop.price < store.priceMin || prop.price > store.priceMax) return false;
      if (store.propertyType !== 'All' && prop.property_type !== store.propertyType) return false;
      if (store.newProjectsFilter !== 'all') {
        if (store.newProjectsFilter === 'pre-launch' && prop.property_type !== 'Plot') return false;
        if (store.newProjectsFilter === 'under-construction' && prop.property_type !== 'Apartment') return false;
      }
      if (store.searchQuery && store.searchQuery !== store.commuteDestination) {
        const query = store.searchQuery.toLowerCase();
        
        // 1. BHK check
        const hasBhkQuery = query.match(/(\d+)\s*bhk/);
        if (hasBhkQuery) {
          const bhkCount = parseInt(hasBhkQuery[1]);
          if (prop.bedrooms !== bhkCount) return false;
        }

        // 2. Rent/Sale check
        const isRentQuery = query.includes('rent') || query.includes('lease');
        const isSaleQuery = query.includes('sale') || query.includes('sell') || query.includes('buy') || query.includes('purchase');
        if (isRentQuery && prop.listing_type?.toLowerCase() !== 'rent') return false;
        if (isSaleQuery && prop.listing_type?.toLowerCase() !== 'sale' && prop.listing_type?.toLowerCase() !== 'buy') {
          return false;
        }

        // 3. Locality check
        const matchedLocality = mockLocalities.find(l => query.includes(l.name.toLowerCase()));
        if (matchedLocality && prop.locality_id !== matchedLocality.id) {
          return false;
        }

        // 4. Property Type check
        let matchedType: string | null = null;
        if (query.includes('villa')) matchedType = 'Villa';
        else if (query.includes('apartment') || query.includes('flat') || query.includes('residency') || query.includes('gated')) matchedType = 'Apartment';
        else if (query.includes('plot') || query.includes('land') || query.includes('site')) matchedType = 'Plot';
        else if (query.includes('house') || query.includes('home') || query.includes('residential')) matchedType = 'Residential';

        if (matchedType) {
          if (matchedType === 'Residential') {
            if (prop.property_type === 'Plot') return false;
          } else if (prop.property_type !== matchedType) {
            return false;
          }
        }

        // 5. Fallback word-by-word match
        if (!matchedLocality && !matchedType && !hasBhkQuery) {
          const commonWords = ['in', 'for', 'near', 'the', 'a', 'an', 'at', 'with', 'and', 'of', 'to'];
          const terms = query.split(/\s+/).filter(t => t.length > 0);
          const searchTerms = terms.filter(t => !commonWords.includes(t));
          
          if (searchTerms.length > 0) {
            const propText = `${prop.title} ${prop.property_type} ${prop.ai_description || ''} ${prop.ai_investment_rating || ''}`.toLowerCase();
            const matchesAnyTerm = searchTerms.some(term => propText.includes(term));
            if (!matchesAnyTerm) return false;
          }
        }
      }
      return true;
    });
  };

  const getLocalityColor = (locId: string) => {
    const scores = mockScores[locId] || {};
    if (scores.investment_score && scores.investment_score >= 88) return '#10b981'; // green
    if (scores.investment_score && scores.investment_score < 80) return '#f59e0b'; // orange
    return '#3b82f6'; // blue
  };

  const getFallbackMarkerColor = (type: string) => {
    if (type === 'Apartment') return '#2563eb';
    if (type === 'Villa') return '#9333ea';
    if (type === 'Independent House') return '#db2777';
    if (type === 'Plot') return '#059669';
    if (type === 'Commercial Building') return '#ea580c';
    return '#0891b2';
  };

  const activePropertiesForFallback = getFilteredPropertiesForFallback();

  return (
    <div className={`relative w-full ${height} bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner flex flex-col items-center justify-center`}>
      
      {/* Loading Skeleton */}
      {!isLoaded && !loadError && !useMockFallback && (
        <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center z-45 animate-pulse">
          <Radio className="h-10 w-10 text-blue-500 animate-pulse mb-3" />
          <span className="text-xs font-mono tracking-wider font-semibold text-slate-500 uppercase">Geospatial engine booting...</span>
        </div>
      )}

      {/* Interactive Fallback Map (Drawn as robust Vector SVG Canvas) */}
      {useMockFallback ? (
        <div className="w-full h-full relative z-10 bg-slate-950 flex items-center justify-center overflow-auto">
          
          {/* Fallback Banner indicator */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-mono tracking-wider font-bold text-amber-400 uppercase z-30 shadow-md backdrop-blur-sm">
            <Info className="h-3.5 w-3.5 animate-pulse" />
            <span>Maps fallback vector overlay active</span>
          </div>

          <svg 
            className="w-full h-full min-w-[800px] min-h-[500px] cursor-grab active:cursor-grabbing select-none"
            viewBox="0 0 800 500"
          >
            {/* Grid Map Background representing Coimbatore sectors */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.75" />
              </pattern>

              {/* Heatmap Gradients definitions */}
              <radialGradient id="heat-investment" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                <stop offset="60%" stopColor="#10b981" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="heat-price" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
                <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="heat-safety" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
                <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="heat-amenity" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ec4899" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#ec4899" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
              </radialGradient>
            </defs>

            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Price/Potential Heatmap layers */}
            {store.activeHeatmap !== 'none' && (
              <g opacity="0.8">
                {mockLocalities.map(loc => (
                  <circle
                    key={`fallback-heat-${loc.id}`}
                    cx={lonToX(loc.longitude)}
                    cy={latToY(loc.latitude)}
                    r="120"
                    fill={`url(#heat-${store.activeHeatmap})`}
                  />
                ))}
              </g>
            )}

            {/* Connection Highways and roads (drawn as dash lines) */}
            <g stroke="#334155" strokeWidth="1.25" strokeDasharray="3 3" fill="none" opacity="0.6">
              {mockLocalities.map((loc, idx) => {
                if (idx === mockLocalities.length - 1) return null;
                const nextLoc = mockLocalities[idx + 1];
                return (
                  <line 
                    key={`road-link-${idx}`} 
                    x1={lonToX(loc.longitude)} 
                    y1={latToY(loc.latitude)} 
                    x2={lonToX(nextLoc.longitude)} 
                    y2={latToY(nextLoc.latitude)} 
                  />
                );
              })}
            </g>

            {/* Locality polygon boundaries (visible when zoomed out slightly) */}
            <g>
              {mockLocalities.map((loc) => {
                const cx = lonToX(loc.longitude);
                const cy = latToY(loc.latitude);
                
                // Draw circular zone polygon coordinates
                const points = [];
                const numSides = 10;
                const radius = 60;
                for (let i = 0; i < numSides; i++) {
                  const angle = (i * 2 * Math.PI) / numSides;
                  const randomFactor = 0.88 + Math.sin(i * 3.5) * 0.12;
                  const x = cx + radius * randomFactor * Math.cos(angle);
                  const y = cy + radius * randomFactor * Math.sin(angle);
                  points.push(`${x},${y}`);
                }

                const color = getLocalityColor(loc.id);
                const metrics = mockMetrics[loc.id] || {};
                const scores = mockScores[loc.id] || {};

                const isLocalityHighlighted = store.selectedLocalityId === loc.id;
                const selectedProperty = mockProperties.find(p => p.id === store.selectedPropertyId);
                const isPropertyContext = selectedProperty && selectedProperty.locality_id === loc.id;
                const shouldShowBoundaries = store.showLocalityBoundaries || isLocalityHighlighted || isPropertyContext;

                if (!shouldShowBoundaries) {
                  return (
                    <g key={`fallback-loc-${loc.id}`}>
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r="3.5" 
                        fill={color} 
                        stroke="#0f172a" 
                        strokeWidth="1" 
                      />
                      <text 
                        x={cx} 
                        y={cy - 7} 
                        fontSize="8" 
                        fontWeight="bold" 
                        fill="#475569" 
                        textAnchor="middle"
                        className="pointer-events-none font-mono"
                      >
                        {loc.name}
                      </text>
                    </g>
                  );
                }

                return (
                  <g key={`fallback-loc-${loc.id}`}>
                    <polygon
                      points={points.join(' ')}
                      fill={color}
                      fillOpacity={isLocalityHighlighted ? 0.25 : 0.08}
                      stroke={color}
                      strokeWidth={isLocalityHighlighted ? 2 : 1}
                      strokeOpacity={isLocalityHighlighted ? 0.8 : 0.4}
                      className="cursor-pointer transition hover:fill-opacity-20"
                      onClick={() => store.setFilters({ selectedLocalityId: loc.id })}
                      onMouseEnter={() => setLocalityStats({
                        name: loc.name,
                        price: metrics.avg_price_per_sqft || 5000,
                        investment: scores.investment_score || 85,
                        safety: scores.healthcare_score || 80,
                        growth: metrics.listing_velocity || 8.0
                      })}
                      onMouseLeave={() => setLocalityStats(null)}
                    />
                    
                    {/* Centroid small indicator dot */}
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r="4" 
                      fill={color} 
                      stroke="#0f172a" 
                      strokeWidth="1" 
                    />
                    <text 
                      x={cx} 
                      y={cy - 8} 
                      fontSize="9" 
                      fontWeight="bold" 
                      fill="#94a3b8" 
                      textAnchor="middle"
                      className="pointer-events-none"
                    >
                      {loc.name}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Commute Destination Radius Circle Overlay */}
            {store.commuteDestination && (
              <g>
                {(() => {
                  let destLat = 11.0254;
                  let destLng = 77.0028;
                  const normDest = store.commuteDestination.toLowerCase();
                  if (normDest.includes('chil')) { destLat = 11.0829; destLng = 77.0257; }
                  else if (normDest.includes('tidel')) { destLat = 11.0276; destLng = 77.0305; }
                  else if (normDest.includes('junction')) { destLat = 10.9978; destLng = 76.9634; }
                  
                  const cx = lonToX(destLng);
                  const cy = latToY(destLat);
                  const radiusPixels = store.commuteMaxTime * 2.8;

                  return (
                    <>
                      {/* Range overlay circle */}
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r={radiusPixels} 
                        fill="#ef4444" 
                        fillOpacity="0.06" 
                        stroke="#ef4444" 
                        strokeWidth="1.25" 
                        strokeDasharray="4 3" 
                      />

                      {/* Destination Star Pin */}
                      <path 
                        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
                        fill="#ef4444" 
                        stroke="#ffffff" 
                        strokeWidth="1.5"
                        transform={`translate(${cx - 12}, ${cy - 22})`}
                      />
                      <circle cx={cx} cy={cy - 13} r="3.5" fill="#ffffff" />
                    </>
                  );
                })()}
              </g>
            )}

            {/* Amenities indicators */}
            {store.amenityCategories.length > 0 && (
              <g>
                {Object.keys(mockAmenities).map(localityId => {
                  const amenities = mockAmenities[localityId] || [];
                  return amenities.map(am => {
                    if (!store.amenityCategories.includes(am.category)) return null;
                    const cx = lonToX(am.longitude);
                    const cy = latToY(am.latitude);
                    
                    let color = '#3b82f6';
                    let label = 'A';
                    if (am.category === 'school') { color = '#3b82f6'; label = 'S'; }
                    else if (am.category === 'hospital') { color = '#ef4444'; label = 'H'; }
                    else if (am.category === 'restaurant') { color = '#f59e0b'; label = 'R'; }

                    return (
                      <g key={am.id}>
                        <circle 
                          cx={cx} 
                          cy={cy} 
                          r="10" 
                          fill={color} 
                          stroke="#0f172a" 
                          strokeWidth="1.5" 
                          className="cursor-help"
                        />
                        <text 
                          x={cx} 
                          y={cy + 3} 
                          fontSize="8" 
                          fontWeight="bold" 
                          fill="white" 
                          textAnchor="middle" 
                          className="pointer-events-none"
                        >
                          {label}
                        </text>
                      </g>
                    );
                  });
                })}
              </g>
            )}

            {/* Property Marker Pins */}
            <g>
              {activePropertiesForFallback.map((prop) => {
                if (!prop.latitude || !prop.longitude) return null;
                const cx = lonToX(prop.longitude);
                const cy = latToY(prop.latitude);

                let isSelected = prop.id === store.selectedPropertyId;
                let isSaved = store.savedPropertyIds.includes(prop.id);
                let isCompared = store.comparedPropertyIds.includes(prop.id);
                let isHovered = hoveredPropertyId === prop.id;

                let state: 'default' | 'hover' | 'selected' | 'saved' | 'compared' = 'default';
                if (isSelected) state = 'selected';
                else if (isHovered) state = 'hover';
                else if (isSaved) state = 'saved';
                else if (isCompared) state = 'compared';

                const color = getFallbackMarkerColor(prop.property_type);
                
                let scale = 1.0;
                let border = '#ffffff';
                let strokeWidth = 1.5;

                if (state === 'hover') { scale = 1.2; border = '#0f172a'; strokeWidth = 2; }
                else if (state === 'selected') { scale = 1.35; border = '#eab308'; strokeWidth = 2.5; }
                else if (state === 'saved') { border = '#f43f5e'; strokeWidth = 2; }
                else if (state === 'compared') { border = '#0284c7'; strokeWidth = 2.5; }

                return (
                  <g 
                    key={`fallback-prop-${prop.id}`} 
                    className="cursor-pointer transition"
                    onClick={() => store.setFilters({ selectedPropertyId: prop.id })}
                    onMouseEnter={() => setHoveredPropertyId(prop.id)}
                    onMouseLeave={() => setHoveredPropertyId(null)}
                  >
                    {/* Shadow drop ring */}
                    <circle cx={cx} cy={cy} r="4" fill="#000000" opacity="0.4" />
                    
                    {/* Pin shape */}
                    <path
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                      fill={color}
                      stroke={border}
                      strokeWidth={strokeWidth}
                      transform={`translate(${cx - 12}, ${cy - 22}) scale(${scale})`}
                      style={{ transformOrigin: `${cx}px ${cy}px` }}
                    />
                    
                    {/* Centered letter */}
                    <text
                      x={cx}
                      y={cy - 12}
                      fontSize="9"
                      fontWeight="bold"
                      fill="#ffffff"
                      textAnchor="middle"
                      className="pointer-events-none"
                    >
                      {prop.property_type.charAt(0)}
                    </text>
                  </g>
                );
              })}
            </g>

          </svg>
        </div>
      ) : (
        <div ref={mapContainerRef} className="w-full h-full z-10" />
      )}

      {/* Hover locality statistic panel display */}
      {localityStats && (
        <div className="absolute top-4 left-4 bg-slate-900/95 backdrop-blur px-3 py-2.5 rounded-xl border border-slate-800 shadow-lg z-30 pointer-events-none w-64 animate-in fade-in duration-200 text-white">
          <h5 className="font-extrabold text-slate-200 text-xs font-display">{localityStats.name}</h5>
          <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px] font-mono border-t border-slate-850 pt-2 text-slate-400">
            <div>Avg Price: <span className="font-bold text-slate-200">₹{localityStats.price}/SqFt</span></div>
            <div>Growth Index: <span className="font-bold text-slate-200">+{localityStats.growth}%</span></div>
            <div>Safety Score: <span className="font-bold text-slate-200">{localityStats.safety}/100</span></div>
            <div>Investment: <span className="font-bold text-emerald-400 font-sans">{localityStats.investment}/100</span></div>
          </div>
        </div>
      )}

      {/* Heatmap overlay active legend HUD */}
      {store.activeHeatmap !== 'none' && (
        <div className="absolute bottom-5 right-16 bg-slate-900/95 backdrop-blur px-3 py-2 rounded-xl border border-slate-800 shadow-md z-30 text-[9px] font-mono flex items-center gap-2 text-slate-300">
          <div className="h-3 w-24 rounded bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 to-red-500" />
          <span className="font-bold text-slate-400 text-[10px]">
            {store.activeHeatmap.toUpperCase()} DENSITY (Low &rarr; High)
          </span>
        </div>
      )}

      {/* Live tracking overlay header */}
      <div className="absolute top-4 right-4 bg-slate-900/95 backdrop-blur px-3 py-2 rounded-xl border border-slate-800 shadow flex items-center gap-2 text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-350 z-20">
        <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
        <span>GIS Vector Sensors Active</span>
      </div>

      {/* Compass calibration footer HUD */}
      <div className="absolute bottom-5 left-5 bg-slate-900/95 backdrop-blur px-3 py-2.5 rounded-2xl border border-slate-800 shadow-lg flex items-center gap-4 text-xs font-semibold text-slate-300 z-20">
        <span className="flex items-center gap-1"><Compass className="h-4 w-4 text-slate-500" /> N 11.01° | E 76.95°</span>
        <span className="h-4 w-px bg-slate-800" />
        <span className="flex items-center gap-1"><Navigation className="h-4 w-4 text-blue-500 animate-pulse" /> Coimbatore Center</span>
      </div>
    </div>
  );
};

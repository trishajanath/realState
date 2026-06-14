import React, { useEffect, useRef, useState } from 'react';
import { useMapFilterStore } from '../../store/useMapFilterStore';
import { mockAmenities, mockScores, mockMetrics } from '../../services/mockData';
import type { Property, Locality } from '../../types';
import { Navigation, Compass, Radio, Info } from 'lucide-react';

declare const google: any;

interface MapViewProps {
  localityId?: string;
  propertyId?: string;
  height?: string;
  properties?: Property[];
  localities?: Locality[];
}

export const MapView: React.FC<MapViewProps> = ({
  localityId: _localityId,
  propertyId: _propertyId,
  height = 'h-[500px]',
  properties: propProperties,
  localities: propLocalities,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  const store = useMapFilterStore();

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const useMockFallback = store.useMockFallback;

  const [mapZoom, setMapZoom] = useState(12);
  const [localityStats, setLocalityStats] = useState<any | null>(null);
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);

  const markersRef = useRef<any[]>([]);
  const polygonsRef = useRef<any[]>([]);
  const heatmapRef = useRef<any>(null);
  const commuteCircleRef = useRef<any>(null);
  const commuteMarkerRef = useRef<any>(null);
  const amenityMarkersRef = useRef<any[]>([]);
  const directionsRendererRef = useRef<any>(null);

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

  // 1. Sync load error when fallback engaged
  useEffect(() => {
    if (useMockFallback) {
      setLoadError('Google Maps key auth failure. Running in interactive vector fallback mode.');
    }
  }, [useMockFallback]);

  // 2. Fetch Google Config (API Key) on mount
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
          const latency = performance.now() - startTime;
          fetch('http://localhost:8000/api/v1/metrics/client', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ metric_name: 'geospatial_query_latency', value_ms: latency }),
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

    win.gm_init = () => setIsLoaded(true);

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
  }, [apiKey, useMockFallback]);

  // 4. Initialize Google Map (light style)
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || mapRef.current || useMockFallback) return;

    const startTime = performance.now();
    try {
      const map = new google.maps.Map(mapContainerRef.current, {
        center: { lat: 11.0168, lng: 76.9558 },
        zoom: mapZoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
      });

      mapRef.current = map;
      map.addListener('zoom_changed', () => {
        const z = map.getZoom();
        if (z !== undefined) setMapZoom(z);
      });

      const renderTime = performance.now() - startTime;
      fetch('http://localhost:8000/api/v1/metrics/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metric_name: 'map_load_time', value_ms: renderTime }),
      }).catch(() => {});
    } catch (e: any) {
      console.error('Failed to instantiate Google Map object, engaging SVG fallback:', e);
      store.setFilters({ useMockFallback: true });
    }
  }, [isLoaded, useMockFallback]);

  // 5. Pan to selected property / locality
  useEffect(() => {
    if (!mapRef.current || useMockFallback) return;

    if (store.selectedPropertyId) {
      const prop = (propProperties || []).find((p) => p.id === store.selectedPropertyId);
      if (prop && prop.latitude && prop.longitude) {
        mapRef.current.panTo({ lat: prop.latitude, lng: prop.longitude });
        mapRef.current.setZoom(15);
      }
    } else if (store.selectedLocalityId) {
      const loc = (propLocalities || []).find((l) => l.id === store.selectedLocalityId);
      if (loc && loc.latitude && loc.longitude) {
        mapRef.current.panTo({ lat: loc.latitude, lng: loc.longitude });
        mapRef.current.setZoom(14);
      }
    }
  }, [store.selectedPropertyId, store.selectedLocalityId, useMockFallback, propProperties, propLocalities]);

  // 6. Custom SVG marker icons
  const getPropertyMarkerSvg = (type: string, state: 'default' | 'hover' | 'selected' | 'saved' | 'compared') => {
    let color = '#3b82f6';
    if (type === 'Apartment') color = '#2563eb';
    else if (type === 'Villa') color = '#9333ea';
    else if (type === 'Independent House') color = '#db2777';
    else if (type === 'Plot') color = '#059669';
    else if (type === 'Commercial Building') color = '#ea580c';
    else if (type === 'Office Space') color = '#0891b2';

    let border = '#ffffff';
    let strokeWidth = 2;
    let scale = 1;

    if (state === 'hover') { scale = 1.2; border = '#1F2937'; strokeWidth = 2.5; }
    else if (state === 'selected') { scale = 1.35; border = '#eab308'; strokeWidth = 3; }
    else if (state === 'saved') { border = '#f43f5e'; strokeWidth = 2.5; }
    else if (state === 'compared') { border = '#0284c7'; strokeWidth = 3; }

    const letter = type ? type.charAt(0) : 'P';
    const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 36 42">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#000000" flood-opacity="0.20"/>
          </filter>
        </defs>
        <g filter="url(#shadow)">
          <path d="M18 2C9.16 2 2 9.16 2 18c0 10.66 16 22 16 22s16-11.34 16-22c0-8.84-7.16-16-16-16z" fill="${color}" stroke="${border}" stroke-width="${strokeWidth}"/>
          <circle cx="18" cy="17" r="9" fill="${color}" opacity="0.3"/>
          <text x="18" y="20" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">${letter}</text>
        </g>
      </svg>
    `;
    return {
      url: `data:image/svg+xml;utf-8,${encodeURIComponent(svgString)}`,
      anchor: new google.maps.Point(18 * scale, 40 * scale),
      scaledSize: new google.maps.Size(36 * scale, 42 * scale),
    };
  };

  // 7. Property markers on Google Map
  useEffect(() => {
    if (!mapRef.current || !isLoaded || useMockFallback) return;

    const startTime = performance.now();
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const sourceProperties = propProperties || [];

    const activeProperties = sourceProperties.filter((prop) => {
      if (prop.price < store.priceMin || prop.price > store.priceMax) return false;
      if (store.propertyType !== 'All' && prop.property_type !== store.propertyType) return false;
      if (store.propertyStatus !== 'all') {
        if (store.propertyStatus === 'pre-launch' && prop.property_type !== 'Plot') return false;
        if (store.propertyStatus === 'under-construction' && prop.property_type !== 'Apartment') return false;
      } else if (store.newProjectsFilter !== 'all') {
        if (store.newProjectsFilter === 'pre-launch' && prop.property_type !== 'Plot') return false;
        if (store.newProjectsFilter === 'under-construction' && prop.property_type !== 'Apartment') return false;
      }
      if (store.bedrooms !== 'All' && prop.bedrooms !== store.bedrooms) return false;
      if (store.bathrooms !== 'All' && prop.bathrooms !== store.bathrooms) return false;
      if (prop.area_sqft < store.areaMin || prop.area_sqft > store.areaMax) return false;

      if (store.searchQuery && store.searchQuery !== store.commuteDestination) {
        const query = store.searchQuery.toLowerCase();
        const hasBhkQuery = query.match(/(\d+)\s*bhk/);
        if (hasBhkQuery && prop.bedrooms !== parseInt(hasBhkQuery[1])) return false;

        const isRentQuery = query.includes('rent') || query.includes('lease');
        const isSaleQuery = query.includes('sale') || query.includes('sell') || query.includes('buy') || query.includes('purchase');
        if (isRentQuery && prop.listing_type?.toLowerCase() !== 'rent') return false;
        if (isSaleQuery && prop.listing_type?.toLowerCase() !== 'sale' && prop.listing_type?.toLowerCase() !== 'buy') return false;

        const matchedLocality = (propLocalities || []).find((l) => query.includes(l.name.toLowerCase()));
        if (matchedLocality && prop.locality_id !== matchedLocality.id) return false;

        let matchedType: string | null = null;
        if (query.includes('villa')) matchedType = 'Villa';
        else if (query.includes('apartment') || query.includes('flat')) matchedType = 'Apartment';
        else if (query.includes('plot') || query.includes('land')) matchedType = 'Plot';
        else if (query.includes('house') || query.includes('home')) matchedType = 'Residential';

        if (matchedType) {
          if (matchedType === 'Residential') { if (prop.property_type === 'Plot') return false; }
          else if (prop.property_type !== matchedType) return false;
        }

        if (!matchedLocality && !matchedType && !hasBhkQuery) {
          const commonWords = ['in', 'for', 'near', 'the', 'a', 'an', 'at', 'with', 'and', 'of', 'to'];
          const searchTerms = query.split(/\s+/).filter((t) => t.length > 0 && !commonWords.includes(t));
          if (searchTerms.length > 0) {
            const propText = `${prop.title} ${prop.property_type} ${prop.ai_description || ''}`.toLowerCase();
            if (!searchTerms.some((t) => propText.includes(t))) return false;
          }
        }
      }
      return true;
    });

    const map = mapRef.current;

    const createPropertyMarker = (prop: Property) => {
      if (!prop.latitude || !prop.longitude) return;
      let state: 'default' | 'hover' | 'selected' | 'saved' | 'compared' = 'default';
      if (prop.id === store.selectedPropertyId) state = 'selected';
      else if (store.savedPropertyIds.includes(prop.id)) state = 'saved';
      else if (store.comparedPropertyIds.includes(prop.id)) state = 'compared';

      const marker = new google.maps.Marker({
        position: { lat: prop.latitude, lng: prop.longitude },
        map,
        icon: getPropertyMarkerSvg(prop.property_type, state),
        title: prop.title,
      });

      marker.addListener('click', () => store.setFilters({ selectedPropertyId: prop.id }));
      marker.addListener('mouseover', () => marker.setIcon(getPropertyMarkerSvg(prop.property_type, 'hover')));
      marker.addListener('mouseout', () => {
        let s: 'default' | 'hover' | 'selected' | 'saved' | 'compared' = 'default';
        if (prop.id === store.selectedPropertyId) s = 'selected';
        else if (store.savedPropertyIds.includes(prop.id)) s = 'saved';
        else if (store.comparedPropertyIds.includes(prop.id)) s = 'compared';
        marker.setIcon(getPropertyMarkerSvg(prop.property_type, s));
      });
      markersRef.current.push(marker);
    };

    if (mapZoom < 13) {
      const clusters: Array<{ lat: number; lng: number; count: number; properties: Property[] }> = [];
      const threshold = 0.018;
      activeProperties.forEach((prop) => {
        if (!prop.latitude || !prop.longitude) return;
        let added = false;
        for (const cluster of clusters) {
          const dist = Math.sqrt((cluster.lat - prop.latitude) ** 2 + (cluster.lng - prop.longitude) ** 2);
          if (dist < threshold) {
            cluster.lat = (cluster.lat * cluster.count + prop.latitude) / (cluster.count + 1);
            cluster.lng = (cluster.lng * cluster.count + prop.longitude) / (cluster.count + 1);
            cluster.count++;
            cluster.properties.push(prop);
            added = true;
            break;
          }
        }
        if (!added) clusters.push({ lat: prop.latitude, lng: prop.longitude, count: 1, properties: [prop] });
      });

      clusters.forEach((cluster) => {
        if (cluster.count > 1) {
          const m = new google.maps.Marker({
            position: { lat: cluster.lat, lng: cluster.lng },
            map,
            label: { text: String(cluster.count), color: 'white', fontWeight: 'bold', fontSize: '13px' },
            icon: { path: google.maps.SymbolPath.CIRCLE, fillColor: '#3b82f6', fillOpacity: 0.9, scale: 22, strokeColor: '#ffffff', strokeWeight: 2 },
            title: `Cluster of ${cluster.count} properties.`,
          });
          m.addListener('click', () => { map.setCenter({ lat: cluster.lat, lng: cluster.lng }); map.setZoom(mapZoom + 2); });
          markersRef.current.push(m);
        } else {
          createPropertyMarker(cluster.properties[0]);
        }
      });
    } else {
      activeProperties.forEach((prop) => createPropertyMarker(prop));
    }

    const elapsed = performance.now() - startTime;
    fetch('http://localhost:8000/api/v1/metrics/client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metric_name: 'marker_rendering_time', value_ms: elapsed }),
    }).catch(() => {});
  }, [isLoaded, store.priceMin, store.priceMax, store.propertyType, store.searchQuery, store.newProjectsFilter, store.selectedPropertyId, store.savedPropertyIds, store.comparedPropertyIds, store.bedrooms, store.bathrooms, store.areaMin, store.areaMax, store.propertyStatus, mapZoom, useMockFallback, propProperties, propLocalities]);

  // 8. Locality boundaries on Google Map
  useEffect(() => {
    if (!mapRef.current || !isLoaded || useMockFallback) return;

    polygonsRef.current.forEach((p) => p.setMap(null));
    polygonsRef.current = [];

    if (mapZoom < 14) {
      (propLocalities || []).forEach((loc) => {
        if (!loc.latitude || !loc.longitude) return;

        const points = [];
        const numSides = 12;
        const radiusMeters = 900;
        for (let i = 0; i < numSides; i++) {
          const angle = (i * 2 * Math.PI) / numSides;
          const rf = 0.85 + Math.sin(i * 2.8) * 0.15;
          const dLat = (radiusMeters * rf * Math.cos(angle)) / 111320;
          const dLng = (radiusMeters * rf * Math.sin(angle)) / (111320 * Math.cos(loc.latitude * Math.PI / 180));
          points.push({ lat: loc.latitude + dLat, lng: loc.longitude + dLng });
        }

        const metrics = mockMetrics[loc.id] || {};
        const scores = mockScores[loc.id] || {};
        let color = '#3b82f6';
        if (scores.investment_score && scores.investment_score >= 88) color = '#10b981';
        else if (scores.investment_score && scores.investment_score < 80) color = '#f59e0b';

        const isLocalityHighlighted = store.selectedLocalityId === loc.id;
        const selectedProperty = (propProperties || []).find((p) => p.id === store.selectedPropertyId);
        const isPropertyContext = selectedProperty && selectedProperty.locality_id === loc.id;
        const shouldShowBoundaries = store.showLocalityBoundaries || isLocalityHighlighted || isPropertyContext;

        const polygon = new google.maps.Polygon({
          paths: points,
          strokeColor: color,
          strokeOpacity: 0.7,
          strokeWeight: isLocalityHighlighted ? 2.5 : 1.5,
          fillColor: color,
          fillOpacity: isLocalityHighlighted ? 0.35 : 0.15,
          map: shouldShowBoundaries ? mapRef.current : null,
        });

        polygon.addListener('click', () => store.setFilters({ selectedLocalityId: loc.id }));
        polygon.addListener('mouseover', () => {
          polygon.setOptions({ fillOpacity: 0.35, strokeWeight: 3 });
          setLocalityStats({
            name: loc.name,
            price: metrics.avg_price_per_sqft || 5000,
            investment: scores.investment_score || 85,
            safety: scores.healthcare_score || 80,
            growth: metrics.listing_velocity || 8.0,
          });
        });
        polygon.addListener('mouseout', () => {
          polygon.setOptions({ fillOpacity: 0.15, strokeWeight: 1.5 });
          setLocalityStats(null);
        });

        polygonsRef.current.push(polygon);
      });
    }
  }, [isLoaded, mapZoom, store.showLocalityBoundaries, store.selectedLocalityId, store.selectedPropertyId, useMockFallback, propLocalities, propProperties]);

  // 9. Heatmap layers on Google Map
  useEffect(() => {
    if (!mapRef.current || !isLoaded || useMockFallback) return;

    if (heatmapRef.current) { heatmapRef.current.setMap(null); heatmapRef.current = null; }
    if (store.activeHeatmap === 'none') return;

    const startTime = performance.now();
    const points: any[] = [];

    (propProperties || []).forEach((prop) => {
      if (!prop.latitude || !prop.longitude) return;
      let weight = 1;
      if (store.activeHeatmap === 'price') weight = prop.price / 800000;
      else if (store.activeHeatmap === 'investment') {
        const grade = prop.ai_investment_rating || '';
        weight = grade.includes('Grade: A') ? 100 : grade.includes('Grade: B') ? 60 : 30;
      } else if (store.activeHeatmap === 'safety') {
        const scores = mockScores[prop.locality_id || ''];
        weight = scores?.healthcare_score || 75;
      } else if (store.activeHeatmap === 'amenity') {
        const count = mockAmenities[prop.locality_id || '']?.length || 3;
        weight = count * 15;
      }
      points.push({ location: new google.maps.LatLng(prop.latitude, prop.longitude), weight });
    });

    (propLocalities || []).forEach((loc) => {
      if (!loc.latitude || !loc.longitude) return;
      const scores = mockScores[loc.id] || {};
      const metrics = mockMetrics[loc.id] || {};
      let weight = 50;
      if (store.activeHeatmap === 'price') weight = (metrics.avg_price_per_sqft || 4500) / 100;
      else if (store.activeHeatmap === 'investment') weight = scores.investment_score || 85;
      else if (store.activeHeatmap === 'safety') weight = scores.healthcare_score || 80;
      else if (store.activeHeatmap === 'amenity') weight = (metrics.grocery_stores_per_sq_km || 10) * 10;
      points.push({ location: new google.maps.LatLng(loc.latitude, loc.longitude), weight });
    });

    heatmapRef.current = new google.maps.visualization.HeatmapLayer({ data: points, map: mapRef.current, radius: 40, opacity: 0.75 });

    const elapsed = performance.now() - startTime;
    fetch('http://localhost:8000/api/v1/metrics/client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metric_name: 'heatmap_generation_time', value_ms: elapsed }),
    }).catch(() => {});
  }, [isLoaded, store.activeHeatmap, useMockFallback, propProperties, propLocalities]);

  // 10. Commute analysis overlays
  useEffect(() => {
    if (!mapRef.current || !isLoaded || useMockFallback) return;

    if (commuteCircleRef.current) { commuteCircleRef.current.setMap(null); commuteCircleRef.current = null; }
    if (commuteMarkerRef.current) { commuteMarkerRef.current.setMap(null); commuteMarkerRef.current = null; }
    if (directionsRendererRef.current) directionsRendererRef.current.setMap(null);
    if (!store.commuteDestination) return;

    const resolveCommuteCoords = () => {
      const n = store.commuteDestination.toLowerCase();
      if (n.includes('chil') || n.includes('sez')) return { lat: 11.0829, lng: 77.0257 };
      if (n.includes('psg') || n.includes('tech')) return { lat: 11.0254, lng: 77.0028 };
      if (n.includes('tidel') || n.includes('park')) return { lat: 11.0276, lng: 77.0305 };
      if (n.includes('junction') || n.includes('station')) return { lat: 10.9978, lng: 76.9634 };
      return { lat: 11.0254, lng: 77.0028 };
    };

    const map = mapRef.current;
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address: store.commuteDestination + ', Coimbatore' }, (results: any, status: string) => {
      let coords: any;
      if (status === 'OK' && results && results[0]) {
        coords = results[0].geometry.location;
      } else {
        const fb = resolveCommuteCoords();
        coords = new google.maps.LatLng(fb.lat, fb.lng);
      }

      commuteMarkerRef.current = new google.maps.Marker({
        position: coords,
        map,
        icon: { path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z', fillColor: '#ea4335', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2, scale: 1.5, anchor: new google.maps.Point(12, 21) },
        title: `Commute Destination: ${store.commuteDestination}`,
      });

      commuteCircleRef.current = new google.maps.Circle({
        strokeColor: '#ef4444', strokeOpacity: 0.6, strokeWeight: 1.5,
        fillColor: '#ef4444', fillOpacity: 0.08,
        map, center: coords, radius: store.commuteMaxTime * 180,
      });

      map.panTo(coords);

      if (store.selectedPropertyId) {
        const prop = (propProperties || []).find((p) => p.id === store.selectedPropertyId);
        if (prop && prop.latitude && prop.longitude) {
          const origin = new google.maps.LatLng(prop.latitude, prop.longitude);
          if (!directionsRendererRef.current) {
            directionsRendererRef.current = new google.maps.DirectionsRenderer({
              map, suppressMarkers: true,
              polylineOptions: { strokeColor: '#3b82f6', strokeOpacity: 0.8, strokeWeight: 4 },
            });
          } else {
            directionsRendererRef.current.setMap(map);
          }
          const ds = new google.maps.DirectionsService();
          ds.route({ origin, destination: coords, travelMode: google.maps.TravelMode.DRIVING }, (res: any, s: string) => {
            if (s === 'OK' && directionsRendererRef.current) directionsRendererRef.current.setDirections(res);
          });
        }
      }
    });
  }, [isLoaded, store.commuteDestination, store.commuteMaxTime, store.selectedPropertyId, useMockFallback, propProperties]);

  // 11. Amenity markers (Places API + mock fallback)
  useEffect(() => {
    if (!mapRef.current || !isLoaded || useMockFallback) return;

    amenityMarkersRef.current.forEach((m) => m.setMap(null));
    amenityMarkersRef.current = [];
    if (store.amenityCategories.length === 0) return;

    const map = mapRef.current;
    let center = map.getCenter();

    if (store.selectedPropertyId) {
      const prop = (propProperties || []).find((p) => p.id === store.selectedPropertyId);
      if (prop && prop.latitude && prop.longitude) center = new google.maps.LatLng(prop.latitude, prop.longitude);
    } else if (store.selectedLocalityId) {
      const loc = (propLocalities || []).find((l) => l.id === store.selectedLocalityId);
      if (loc && loc.latitude && loc.longitude) center = new google.maps.LatLng(loc.latitude, loc.longitude);
    }

    if (!center) return;

    const placesService = new google.maps.places.PlacesService(map);
    const categoryToType: Record<string, string> = { school: 'school', hospital: 'hospital', restaurant: 'restaurant', park: 'park', gym: 'gym' };
    const catColors: Record<string, string> = { school: '#3b82f6', hospital: '#ef4444', restaurant: '#f59e0b', park: '#10b981', gym: '#db2777' };
    const catSymbols: Record<string, string> = { school: '🎓', hospital: '🏥', restaurant: '🍽️', park: '🌳', gym: '💪' };

    store.amenityCategories.forEach((cat) => {
      placesService.nearbySearch({ location: center, radius: 2000, type: categoryToType[cat] || 'establishment' }, (results: any, status: string) => {
        const iconColor = catColors[cat] || '#3b82f6';
        const iconSymbol = catSymbols[cat] || 'A';
        if (status === 'OK' && results) {
          results.slice(0, 8).forEach((place: any) => {
            const marker = new google.maps.Marker({
              position: place.geometry.location, map, title: `${place.name} (${cat})`,
              icon: { path: google.maps.SymbolPath.CIRCLE, fillColor: iconColor, fillOpacity: 0.95, scale: 13, strokeColor: '#ffffff', strokeWeight: 1.5 },
              label: { text: iconSymbol, fontSize: '9px' },
            });
            const iw = new google.maps.InfoWindow({
              content: `<div style="font-family:sans-serif;padding:4px;color:#0f172a"><strong style="color:${iconColor};text-transform:uppercase;font-size:10px;display:block">${cat}</strong><h5 style="margin:2px 0 0 0;font-size:12px">${place.name}</h5><p style="margin:2px 0 0 0;font-size:10px;color:#475569">${place.vicinity || ''}</p></div>`,
            });
            marker.addListener('click', () => iw.open(map, marker));
            amenityMarkersRef.current.push(marker);
          });
        } else {
          Object.values(mockAmenities).flat().forEach((amenity: any) => {
            if (amenity.category !== cat) return;
            const m = new google.maps.Marker({
              position: { lat: amenity.latitude, lng: amenity.longitude }, map,
              icon: { path: google.maps.SymbolPath.CIRCLE, fillColor: iconColor, fillOpacity: 0.95, scale: 13, strokeColor: '#ffffff', strokeWeight: 1.5 },
              label: { text: iconSymbol, fontSize: '9px' }, title: amenity.name,
            });
            const iw = new google.maps.InfoWindow({
              content: `<div style="font-family:sans-serif;padding:4px;color:#0f172a"><strong style="color:${iconColor};text-transform:uppercase;font-size:10px">${cat}</strong><h5 style="margin:2px 0 0 0;font-size:12px">${amenity.name}</h5></div>`,
            });
            m.addListener('click', () => iw.open(map, m));
            amenityMarkersRef.current.push(m);
          });
        }
      });
    });
  }, [isLoaded, store.amenityCategories, store.selectedPropertyId, store.selectedLocalityId, useMockFallback, propProperties, propLocalities]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      polygonsRef.current.forEach((p) => p.setMap(null));
      amenityMarkersRef.current.forEach((m) => m.setMap(null));
      if (heatmapRef.current) heatmapRef.current.setMap(null);
      if (commuteCircleRef.current) commuteCircleRef.current.setMap(null);
      if (commuteMarkerRef.current) commuteMarkerRef.current.setMap(null);
      if (directionsRendererRef.current) directionsRendererRef.current.setMap(null);
    };
  }, []);

  // SVG fallback helpers — use real props if available
  const getFilteredPropertiesForFallback = () => {
    return (propProperties || []).filter((prop) => {
      if (prop.price < store.priceMin || prop.price > store.priceMax) return false;
      if (store.propertyType !== 'All' && prop.property_type !== store.propertyType) return false;
      if (store.newProjectsFilter !== 'all') {
        if (store.newProjectsFilter === 'pre-launch' && prop.property_type !== 'Plot') return false;
        if (store.newProjectsFilter === 'under-construction' && prop.property_type !== 'Apartment') return false;
      }
      if (store.searchQuery && store.searchQuery !== store.commuteDestination) {
        const query = store.searchQuery.toLowerCase();
        const hasBhkQuery = query.match(/(\d+)\s*bhk/);
        if (hasBhkQuery && prop.bedrooms !== parseInt(hasBhkQuery[1])) return false;
        const isRentQuery = query.includes('rent') || query.includes('lease');
        const isSaleQuery = query.includes('sale') || query.includes('buy');
        if (isRentQuery && prop.listing_type?.toLowerCase() !== 'rent') return false;
        if (isSaleQuery && prop.listing_type?.toLowerCase() !== 'sale') return false;
        const matchedLocality = (propLocalities || []).find((l) => query.includes(l.name.toLowerCase()));
        if (matchedLocality && prop.locality_id !== matchedLocality.id) return false;
      }
      return true;
    });
  };

  const getLocalityColor = (locId: string) => {
    const scores = mockScores[locId] || {};
    if (scores.investment_score && scores.investment_score >= 88) return '#10b981';
    if (scores.investment_score && scores.investment_score < 80) return '#f59e0b';
    return '#3b82f6';
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
  const svgLocalities = propLocalities || [];

  return (
    <div
      className={`relative w-full ${height} overflow-hidden`}
      style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px' }}
    >

      {/* Loading skeleton */}
      {!isLoaded && !loadError && !useMockFallback && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-40" style={{ backgroundColor: '#F9FAFB' }}>
          <Radio className="h-8 w-8 mb-3" style={{ color: '#D1D5DB' }} />
          <span className="text-xs font-mono tracking-wider uppercase" style={{ color: '#9CA3AF' }}>Initializing map…</span>
        </div>
      )}

      {/* SVG fallback */}
      {useMockFallback ? (
        <div className="w-full h-full relative z-10 flex items-center justify-center overflow-auto" style={{ backgroundColor: '#F9FAFB' }}>

          {/* Fallback banner */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 flex items-center gap-2 text-[10px] font-mono tracking-wider uppercase z-30"
            style={{ backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '6px', color: '#6B7280' }}>
            <Info className="h-3 w-3" />
            <span>Vector fallback active</span>
          </div>

          <svg className="w-full h-full min-w-[800px] min-h-[500px] cursor-grab active:cursor-grabbing select-none" viewBox="0 0 800 500">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E5E7EB" strokeWidth="0.75" />
              </pattern>
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

            {/* Heatmap blobs */}
            {store.activeHeatmap !== 'none' && (
              <g opacity="0.8">
                {svgLocalities.map((loc) => (
                  <circle key={`heat-${loc.id}`} cx={lonToX(loc.longitude)} cy={latToY(loc.latitude)} r="120" fill={`url(#heat-${store.activeHeatmap})`} />
                ))}
              </g>
            )}

            {/* Road connectors */}
            <g stroke="#D1D5DB" strokeWidth="1.25" strokeDasharray="3 3" fill="none" opacity="0.8">
              {svgLocalities.map((loc, idx) => {
                if (idx === svgLocalities.length - 1) return null;
                const next = svgLocalities[idx + 1];
                return <line key={`road-${idx}`} x1={lonToX(loc.longitude)} y1={latToY(loc.latitude)} x2={lonToX(next.longitude)} y2={latToY(next.latitude)} />;
              })}
            </g>

            {/* Locality polygons */}
            <g>
              {svgLocalities.map((loc) => {
                const cx = lonToX(loc.longitude);
                const cy = latToY(loc.latitude);
                const color = getLocalityColor(loc.id);
                const metrics = mockMetrics[loc.id] || {};
                const scores = mockScores[loc.id] || {};

                const isHighlighted = store.selectedLocalityId === loc.id;
                const selectedProp = (propProperties || []).find((p) => p.id === store.selectedPropertyId);
                const isPropertyContext = selectedProp && selectedProp.locality_id === loc.id;
                const showBoundaries = store.showLocalityBoundaries || isHighlighted || isPropertyContext;

                const points: string[] = [];
                const numSides = 10;
                const radius = 60;
                for (let i = 0; i < numSides; i++) {
                  const angle = (i * 2 * Math.PI) / numSides;
                  const rf = 0.88 + Math.sin(i * 3.5) * 0.12;
                  points.push(`${cx + radius * rf * Math.cos(angle)},${cy + radius * rf * Math.sin(angle)}`);
                }

                if (!showBoundaries) {
                  return (
                    <g key={`loc-${loc.id}`}>
                      <circle cx={cx} cy={cy} r="3.5" fill={color} stroke="#FFFFFF" strokeWidth="1" />
                      <text x={cx} y={cy - 7} fontSize="8" fontWeight="600" fill="#6B7280" textAnchor="middle" className="pointer-events-none">{loc.name}</text>
                    </g>
                  );
                }

                return (
                  <g key={`loc-${loc.id}`}>
                    <polygon
                      points={points.join(' ')}
                      fill={color}
                      fillOpacity={isHighlighted ? 0.25 : 0.08}
                      stroke={color}
                      strokeWidth={isHighlighted ? 2 : 1}
                      strokeOpacity={isHighlighted ? 0.8 : 0.4}
                      className="cursor-pointer"
                      onClick={() => store.setFilters({ selectedLocalityId: loc.id })}
                      onMouseEnter={() => setLocalityStats({ name: loc.name, price: metrics.avg_price_per_sqft || 5000, investment: scores.investment_score || 85, safety: scores.healthcare_score || 80, growth: metrics.listing_velocity || 8.0 })}
                      onMouseLeave={() => setLocalityStats(null)}
                    />
                    <circle cx={cx} cy={cy} r="4" fill={color} stroke="#FFFFFF" strokeWidth="1" />
                    <text x={cx} y={cy - 8} fontSize="9" fontWeight="600" fill="#374151" textAnchor="middle" className="pointer-events-none">{loc.name}</text>
                  </g>
                );
              })}
            </g>

            {/* Commute circle */}
            {store.commuteDestination && (() => {
              let destLat = 11.0254, destLng = 77.0028;
              const n = store.commuteDestination.toLowerCase();
              if (n.includes('chil')) { destLat = 11.0829; destLng = 77.0257; }
              else if (n.includes('tidel')) { destLat = 11.0276; destLng = 77.0305; }
              else if (n.includes('junction')) { destLat = 10.9978; destLng = 76.9634; }
              const cx = lonToX(destLng);
              const cy = latToY(destLat);
              const r = store.commuteMaxTime * 2.8;
              return (
                <g>
                  <circle cx={cx} cy={cy} r={r} fill="#ef4444" fillOpacity="0.06" stroke="#ef4444" strokeWidth="1.25" strokeDasharray="4 3" />
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" transform={`translate(${cx - 12}, ${cy - 22})`} />
                  <circle cx={cx} cy={cy - 13} r="3.5" fill="#ffffff" />
                </g>
              );
            })()}

            {/* Amenity indicators */}
            {store.amenityCategories.length > 0 && (
              <g>
                {Object.values(mockAmenities).flat().map((am: any) => {
                  if (!store.amenityCategories.includes(am.category)) return null;
                  const cx = lonToX(am.longitude);
                  const cy = latToY(am.latitude);
                  const catColors: Record<string, string> = { school: '#3b82f6', hospital: '#ef4444', restaurant: '#f59e0b' };
                  const catLabels: Record<string, string> = { school: 'S', hospital: 'H', restaurant: 'R' };
                  const color = catColors[am.category] || '#6b7280';
                  const label = catLabels[am.category] || 'A';
                  return (
                    <g key={am.id}>
                      <circle cx={cx} cy={cy} r="10" fill={color} stroke="#FFFFFF" strokeWidth="1.5" className="cursor-help" />
                      <text x={cx} y={cy + 3} fontSize="8" fontWeight="bold" fill="white" textAnchor="middle" className="pointer-events-none">{label}</text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* Property pins */}
            <g>
              {activePropertiesForFallback.map((prop) => {
                if (!prop.latitude || !prop.longitude) return null;
                const cx = lonToX(prop.longitude);
                const cy = latToY(prop.latitude);
                const isSelected = prop.id === store.selectedPropertyId;
                const isSaved = store.savedPropertyIds.includes(prop.id);
                const isCompared = store.comparedPropertyIds.includes(prop.id);
                const isHovered = hoveredPropertyId === prop.id;

                let state: 'default' | 'hover' | 'selected' | 'saved' | 'compared' = 'default';
                if (isSelected) state = 'selected';
                else if (isHovered) state = 'hover';
                else if (isSaved) state = 'saved';
                else if (isCompared) state = 'compared';

                const color = getFallbackMarkerColor(prop.property_type);
                let border = '#FFFFFF', strokeWidth = 1.5, scale = 1.0;
                if (state === 'hover') { scale = 1.2; border = '#1F2937'; strokeWidth = 2; }
                else if (state === 'selected') { scale = 1.35; border = '#eab308'; strokeWidth = 2.5; }
                else if (state === 'saved') { border = '#f43f5e'; strokeWidth = 2; }
                else if (state === 'compared') { border = '#0284c7'; strokeWidth = 2.5; }

                return (
                  <g key={`prop-${prop.id}`} className="cursor-pointer"
                    onClick={() => store.setFilters({ selectedPropertyId: prop.id })}
                    onMouseEnter={() => setHoveredPropertyId(prop.id)}
                    onMouseLeave={() => setHoveredPropertyId(null)}
                  >
                    <circle cx={cx} cy={cy} r="4" fill="#000000" opacity="0.15" />
                    <path
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                      fill={color} stroke={border} strokeWidth={strokeWidth}
                      transform={`translate(${cx - 12}, ${cy - 22}) scale(${scale})`}
                      style={{ transformOrigin: `${cx}px ${cy}px` }}
                    />
                    <text x={cx} y={cy - 12} fontSize="9" fontWeight="bold" fill="#ffffff" textAnchor="middle" className="pointer-events-none">
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

      {/* Locality stats hover panel */}
      {localityStats && (
        <div className="absolute top-4 left-4 z-30 pointer-events-none w-56"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div className="text-xs font-semibold mb-2" style={{ color: '#000000' }}>{localityStats.name}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px]" style={{ borderTop: '1px solid #F3F4F6', paddingTop: '8px' }}>
            <div style={{ color: '#9CA3AF' }}>Avg Price</div>
            <div className="font-medium" style={{ color: '#000000' }}>₹{localityStats.price}/sqft</div>
            <div style={{ color: '#9CA3AF' }}>Growth</div>
            <div className="font-medium" style={{ color: '#000000' }}>+{localityStats.growth}%</div>
            <div style={{ color: '#9CA3AF' }}>Safety</div>
            <div className="font-medium" style={{ color: '#000000' }}>{localityStats.safety}/100</div>
            <div style={{ color: '#9CA3AF' }}>Investment</div>
            <div className="font-medium" style={{ color: '#000000' }}>{localityStats.investment}/100</div>
          </div>
        </div>
      )}

      {/* Heatmap legend */}
      {store.activeHeatmap !== 'none' && (
        <div className="absolute bottom-4 right-4 z-30 flex items-center gap-2 text-[10px] font-mono uppercase"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '6px 10px', color: '#6B7280', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ height: '6px', width: '64px', borderRadius: '3px', background: 'linear-gradient(to right, #E5E7EB, #000000)' }} />
          <span>{store.activeHeatmap} density</span>
        </div>
      )}

      {/* Live badge */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 text-[10px] font-mono uppercase"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '4px 8px', color: '#6B7280', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Radio className="h-3 w-3" style={{ color: '#9CA3AF' }} />
        <span>Live</span>
      </div>

      {/* Compass footer */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-3 text-[10px]"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '5px 10px', color: '#6B7280', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <span className="flex items-center gap-1"><Compass className="h-3 w-3" /> 11.01°N 76.95°E</span>
        <span style={{ width: '1px', height: '10px', backgroundColor: '#E5E7EB' }} />
        <span className="flex items-center gap-1"><Navigation className="h-3 w-3" /> Coimbatore</span>
      </div>
    </div>
  );
};

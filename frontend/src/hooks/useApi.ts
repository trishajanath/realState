import { useQuery } from '@tanstack/react-query';
import type { Property, Locality, LocalityMetrics, LocalityScores, RecommendationItem, Amenity } from '../types';

export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

async function apiFetch<T>(path: string): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API error ${res.status}`);
  }
  return res.json();
}

// ── Localities ────────────────────────────────────────────────────────────────

export function useLocalities() {
  return useQuery<Locality[]>({
    queryKey: ['localities'],
    queryFn: () => apiFetch<Locality[]>('/localities'),
  });
}

export function useLocality(localityId: string) {
  return useQuery<Locality>({
    queryKey: ['locality', localityId],
    queryFn: () => apiFetch<Locality>(`/localities/${localityId}`),
    enabled: !!localityId,
  });
}

export function useLocalityMetrics(localityId: string) {
  return useQuery<LocalityMetrics>({
    queryKey: ['locality-metrics', localityId],
    queryFn: () => apiFetch<LocalityMetrics>(`/localities/${localityId}/metrics`),
    enabled: !!localityId,
  });
}

export function useLocalityScores(localityId: string) {
  return useQuery<LocalityScores>({
    queryKey: ['locality-scores', localityId],
    queryFn: () => apiFetch<LocalityScores>(`/localities/${localityId}/scores`),
    enabled: !!localityId,
  });
}

export function useLocalityAmenities(localityId: string, category?: string) {
  return useQuery<Amenity[]>({
    queryKey: ['locality-amenities', localityId, category],
    queryFn: () => {
      const params = category ? `?category=${encodeURIComponent(category)}` : '';
      return apiFetch<Amenity[]>(`/localities/${localityId}/amenities${params}`);
    },
    enabled: !!localityId,
  });
}

export function useRecommendations(
  localityId: string,
  type?: 'similar' | 'cheaper' | 'premium' | 'high_growth' | 'family_friendly'
) {
  return useQuery<RecommendationItem[]>({
    queryKey: ['recommendations', localityId, type],
    queryFn: () => {
      const params = type ? `?type=${encodeURIComponent(type)}` : '';
      return apiFetch<RecommendationItem[]>(`/localities/${localityId}/recommendations${params}`);
    },
    enabled: !!localityId,
  });
}

// ── Properties ────────────────────────────────────────────────────────────────

export interface PropertyFilters {
  locality_id?: string;
  property_type?: string;
  listing_type?: string;
  min_price?: number;
  max_price?: number;
  min_bedrooms?: number;
  max_bedrooms?: number;
  search?: string;
  sort_by?: 'price' | 'area_sqft' | 'bedrooms';
  sort_order?: 'asc' | 'desc';
  skip?: number;
  limit?: number;
}

export interface PropertyListResult {
  total: number;
  skip: number;
  limit: number;
  results: Property[];
}

function buildPropertyQuery(filters: PropertyFilters): string {
  const params = new URLSearchParams();
  if (filters.locality_id)  params.set('locality_id', filters.locality_id);
  if (filters.property_type) params.set('property_type', filters.property_type);
  if (filters.listing_type)  params.set('listing_type', filters.listing_type);
  if (filters.min_price != null) params.set('min_price', String(filters.min_price));
  if (filters.max_price != null) params.set('max_price', String(filters.max_price));
  if (filters.min_bedrooms != null) params.set('min_bedrooms', String(filters.min_bedrooms));
  if (filters.max_bedrooms != null) params.set('max_bedrooms', String(filters.max_bedrooms));
  if (filters.search)  params.set('search', filters.search);
  if (filters.sort_by) params.set('sort_by', filters.sort_by);
  if (filters.sort_order) params.set('sort_order', filters.sort_order);
  if (filters.skip != null) params.set('skip', String(filters.skip));
  if (filters.limit != null) params.set('limit', String(filters.limit));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useProperties(filters: PropertyFilters = {}) {
  return useQuery<PropertyListResult>({
    queryKey: ['properties', filters],
    queryFn: () => apiFetch<PropertyListResult>(`/properties${buildPropertyQuery(filters)}`),
  });
}

export function usePropertyDetails(propertyId: string) {
  return useQuery<Property>({
    queryKey: ['property', propertyId],
    queryFn: () => apiFetch<Property>(`/properties/${propertyId}`),
    enabled: !!propertyId,
  });
}

// ── Amenities (top-level) ─────────────────────────────────────────────────────

export function useAmenities(localityId?: string, category?: string) {
  return useQuery<Amenity[]>({
    queryKey: ['amenities', localityId, category],
    queryFn: () => {
      const params = new URLSearchParams();
      if (localityId) params.set('locality_id', localityId);
      if (category)   params.set('category', category);
      const qs = params.toString();
      return apiFetch<Amenity[]>(`/amenities${qs ? '?' + qs : ''}`);
    },
  });
}

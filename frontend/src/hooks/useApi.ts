import { useQuery } from '@tanstack/react-query';
import { Property, Locality, LocalityMetrics, LocalityScores, RecommendationItem, Amenity } from '../types';
import {
  mockLocalities,
  mockScores,
  mockMetrics,
  mockProperties,
  mockAmenities,
  mockRecommendations
} from '../services/mockData';

const BASE_PORTS = {
  properties: 8000,
  localities: 8001,
  amenities: 8002,
  recommendations: 8003
};

const getUrl = (service: keyof typeof BASE_PORTS, path: string) => {
  return `http://localhost:${BASE_PORTS[service]}${path}`;
};

export function useLocalities() {
  return useQuery<Locality[]>({
    queryKey: ['localities'],
    queryFn: async () => {
      try {
        const res = await fetch(getUrl('localities', '/localities'));
        if (!res.ok) throw new Error();
        return await res.json();
      } catch (e) {
        console.warn('Locality Intelligence Service API offline. Falling back to mock data.');
        return mockLocalities;
      }
    }
  });
}

export function useLocalityMetrics(localityId: string) {
  return useQuery<LocalityMetrics>({
    queryKey: ['locality-metrics', localityId],
    queryFn: async () => {
      try {
        const res = await fetch(getUrl('localities', `/localities/${localityId}/metrics`));
        if (!res.ok) throw new Error();
        return await res.json();
      } catch (e) {
        console.warn(`Metrics API offline for locality: ${localityId}. Using mock data.`);
        return mockMetrics[localityId] || mockMetrics[mockLocalities[0].id];
      }
    },
    enabled: !!localityId
  });
}

export function useLocalityScores(localityId: string) {
  return useQuery<LocalityScores>({
    queryKey: ['locality-scores', localityId],
    queryFn: async () => {
      try {
        const res = await fetch(getUrl('localities', `/localities/${localityId}/scores`));
        if (!res.ok) throw new Error();
        return await res.json();
      } catch (e) {
        console.warn(`Scores API offline for locality: ${localityId}. Using mock data.`);
        return mockScores[localityId] || mockScores[mockLocalities[0].id];
      }
    },
    enabled: !!localityId
  });
}

export function useProperties() {
  return useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: async () => {
      try {
        const res = await fetch(getUrl('properties', '/properties'));
        if (!res.ok) throw new Error();
        const data = await res.json();
        // Backend returns property items inside "items" field usually if paginated
        return data.items || data;
      } catch (e) {
        console.warn('Backend Properties API offline. Using mock properties.');
        return mockProperties;
      }
    }
  });
}

export function usePropertyDetails(propertyId: string) {
  return useQuery<Property>({
    queryKey: ['property', propertyId],
    queryFn: async () => {
      try {
        const res = await fetch(getUrl('properties', `/properties/${propertyId}`));
        if (!res.ok) throw new Error();
        return await res.json();
      } catch (e) {
        console.warn(`Properties API offline for ID: ${propertyId}. Using mock data.`);
        return mockProperties.find(p => p.id === propertyId) || mockProperties[0];
      }
    },
    enabled: !!propertyId
  });
}

export function useRecommendations(localityId: string, type: 'similar' | 'CHEAPER' | 'PREMIUM' | 'HIGH_GROWTH' | 'FAMILY_FRIENDLY' | 'SAFER' | 'BETTER_CONNECTED', useLlm: boolean = false) {
  return useQuery<RecommendationItem[]>({
    queryKey: ['recommendations', localityId, type, useLlm],
    queryFn: async () => {
      try {
        const path = type === 'similar' 
          ? `/localities/${localityId}/similar?use_llm=${useLlm}`
          : `/localities/${localityId}/alternatives?type=${type}&use_llm=${useLlm}`;
        const res = await fetch(getUrl('recommendations', path));
        if (!res.ok) throw new Error();
        return await res.json();
      } catch (e) {
        console.warn(`Recommendations API offline for locality ${localityId} [type=${type}]. Using mock data.`);
        const group = mockRecommendations[localityId] || mockRecommendations[mockLocalities[0].id] || {};
        return group[type] || [];
      }
    },
    enabled: !!localityId
  });
}

export function useAmenities(localityId: string) {
  return useQuery<Amenity[]>({
    queryKey: ['amenities', localityId],
    queryFn: async () => {
      try {
        // Query radial nearby from target coordinates if map centroid is available
        const res = await fetch(getUrl('amenities', `/amenities?locality_id=${localityId}`));
        if (!res.ok) throw new Error();
        return await res.json();
      } catch (e) {
        console.warn(`Amenities API offline for locality ${localityId}. Using mock data.`);
        return mockAmenities[localityId] || mockAmenities[mockLocalities[0].id] || [];
      }
    },
    enabled: !!localityId
  });
}

export interface Property {
  id: string;
  title: string;
  property_type: string;
  listing_type: string;
  price: number;
  area_sqft: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  locality_id?: string | null;
  locality_name?: string | null;
  city: string;
  state: string;
  source?: string | null;
  listing_url?: string | null;
  ai_description?: string | null;
  ai_investment_rating?: string | null;
  images?: string[];
  locality?: {
    id?: string | null;
    name: string;
    city: string;
    state: string;
  } | null;
}

export interface Locality {
  id: string;
  name: string;
  city: string;
  state: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface TransitMetric {
  name: string;
  distance_meters: number;
}

/** Flat metrics shape returned by GET /api/v1/localities/:id/metrics */
export interface LocalityMetrics {
  id?: string | null;
  locality_id: string;
  avg_property_price?: number | null;
  median_property_price?: number | null;
  avg_price_per_sqft?: number | null;
  median_price_per_sqft?: number | null;
  rental_yield_estimate?: number | null;
  listing_velocity?: number | null;
  property_inventory?: number | null;

  schools_per_sq_km?: number | null;
  hospitals_per_sq_km?: number | null;
  restaurants_per_sq_km?: number | null;
  grocery_stores_per_sq_km?: number | null;
  gyms_per_sq_km?: number | null;
  parks_per_sq_km?: number | null;

  nearest_railway_station?: TransitMetric | null;
  nearest_airport?: TransitMetric | null;
  nearest_bus_terminal?: TransitMetric | null;
  highway_access_score?: number | null;

  metro_proximity?: number | null;
  industrial_corridor_proximity?: number | null;
  it_park_proximity?: number | null;
}

export interface LocalityScores {
  id?: string | null;
  locality_id: string;
  education_score?: number | null;
  healthcare_score?: number | null;
  lifestyle_score?: number | null;
  connectivity_score?: number | null;
  investment_score?: number | null;
  overall_livability_score?: number | null;
}

export interface RecommendationItem {
  id: string;
  name: string;
  city: string;
  state: string;
  recommendation_type: string;
  score: number;
  reasoning: string;
  feature_contribution: Record<string, number>;
  generation_timestamp: string;
}

export interface Amenity {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  source?: string | null;
  confidence_score?: number | null;
  locality_id?: string | null;
  last_verified_at?: string | null;
}

export interface AuthUser {
  email: string;
  name: string;
}

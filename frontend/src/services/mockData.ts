import type { Property, Locality, LocalityMetrics, LocalityScores, RecommendationItem, Amenity } from '../types';

export const mockLocalities: Locality[] = [
  { id: '1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3', name: 'Saravanampatti', city: 'Coimbatore', state: 'Tamil Nadu', latitude: 11.0797, longitude: 77.0011 },
  { id: '2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4', name: 'Peelamedu', city: 'Coimbatore', state: 'Tamil Nadu', latitude: 11.0284, longitude: 77.0028 },
  { id: '3c7a2e0c-3c5f-4c0b-8534-3ea17bc521f5', name: 'Kalapatti', city: 'Coimbatore', state: 'Tamil Nadu', latitude: 11.0655, longitude: 77.0422 },
  { id: '4d7a2e0d-3d5f-4d0b-8535-3ea17bc521f6', name: 'Singanallur', city: 'Coimbatore', state: 'Tamil Nadu', latitude: 11.0016, longitude: 77.0264 },
  { id: '5e7a2e0e-3e5f-4e0b-8536-3ea17bc521f7', name: 'Saibaba Colony', city: 'Coimbatore', state: 'Tamil Nadu', latitude: 11.0213, longitude: 76.9458 },
  { id: '6f7a2e0f-3f5f-4f0b-8537-3ea17bc521f8', name: 'RS Puram', city: 'Coimbatore', state: 'Tamil Nadu', latitude: 11.0112, longitude: 76.9458 },
  { id: '7g7a2e0g-3g5f-4g0b-8538-3ea17bc521f9', name: 'Gandhipuram', city: 'Coimbatore', state: 'Tamil Nadu', latitude: 11.0183, longitude: 76.9691 }
];

export const mockScores: Record<string, LocalityScores> = {
  '1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3': {
    id: 's1', locality_id: '1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3',
    education_score: 85.2, healthcare_score: 74.5, lifestyle_score: 79.0, connectivity_score: 72.8, investment_score: 92.5, overall_livability_score: 77.88
  },
  '2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4': {
    id: 's2', locality_id: '2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4',
    education_score: 94.0, healthcare_score: 88.5, lifestyle_score: 86.2, connectivity_score: 88.0, investment_score: 86.4, overall_livability_score: 89.17
  },
  '3c7a2e0c-3c5f-4c0b-8534-3ea17bc521f5': {
    id: 's3', locality_id: '3c7a2e0c-3c5f-4c0b-8534-3ea17bc521f5',
    education_score: 76.8, healthcare_score: 68.2, lifestyle_score: 72.5, connectivity_score: 70.1, investment_score: 88.2, overall_livability_score: 71.90
  },
  '6f7a2e0f-3f5f-4f0b-8537-3ea17bc521f8': {
    id: 's6', locality_id: '6f7a2e0f-3f5f-4f0b-8537-3ea17bc521f8',
    education_score: 96.5, healthcare_score: 92.0, lifestyle_score: 95.0, connectivity_score: 91.5, investment_score: 81.0, overall_livability_score: 93.75
  }
};

export const mockMetrics: Record<string, LocalityMetrics> = {
  '1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3': {
    id: 'm1', locality_id: '1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3',
    avg_property_price: 6500000, median_property_price: 5800000, avg_price_per_sqft: 4500, median_price_per_sqft: 4300, rental_yield_estimate: 4.2, listing_velocity: 8.5, property_inventory: 240,
    schools_per_sq_km: 3.5, hospitals_per_sq_km: 2.1, restaurants_per_sq_km: 7.2, grocery_stores_per_sq_km: 12.0, gyms_per_sq_km: 4.5, parks_per_sq_km: 1.2,
    nearest_railway_station: { name: 'Coimbatore North Junction', distance_meters: 8500 },
    nearest_airport: { name: 'Coimbatore International Airport', distance_meters: 11000 },
    nearest_bus_terminal: { name: 'Gandhipuram Central Bus Stand', distance_meters: 7500 },
    highway_access_score: 82.0, metro_proximity: 1200, industrial_corridor_proximity: 6000, it_park_proximity: 500
  },
  '2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4': {
    id: 'm2', locality_id: '2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4',
    avg_property_price: 9200000, median_property_price: 8400000, avg_price_per_sqft: 6800, median_price_per_sqft: 6500, rental_yield_estimate: 3.8, listing_velocity: 9.2, property_inventory: 180,
    schools_per_sq_km: 5.8, hospitals_per_sq_km: 4.5, restaurants_per_sq_km: 15.0, grocery_stores_per_sq_km: 22.0, gyms_per_sq_km: 8.0, parks_per_sq_km: 2.5,
    nearest_railway_station: { name: 'Coimbatore Junction', distance_meters: 4200 },
    nearest_airport: { name: 'Coimbatore International Airport', distance_meters: 3500 },
    nearest_bus_terminal: { name: 'Gandhipuram Central Bus Stand', distance_meters: 3800 },
    highway_access_score: 90.0, metro_proximity: 500, industrial_corridor_proximity: 8000, it_park_proximity: 2500
  },
  '6f7a2e0f-3f5f-4f0b-8537-3ea17bc521f8': {
    id: 'm6', locality_id: '6f7a2e0f-3f5f-4f0b-8537-3ea17bc521f8',
    avg_property_price: 14500000, median_property_price: 13200000, avg_price_per_sqft: 9800, median_price_per_sqft: 9500, rental_yield_estimate: 3.1, listing_velocity: 6.8, property_inventory: 95,
    schools_per_sq_km: 8.2, hospitals_per_sq_km: 6.8, restaurants_per_sq_km: 28.0, grocery_stores_per_sq_km: 34.0, gyms_per_sq_km: 12.0, parks_per_sq_km: 4.8,
    nearest_railway_station: { name: 'Coimbatore Junction', distance_meters: 2500 },
    nearest_airport: { name: 'Coimbatore International Airport', distance_meters: 12500 },
    nearest_bus_terminal: { name: 'Gandhipuram Central Bus Stand', distance_meters: 3200 },
    highway_access_score: 75.0, metro_proximity: 2000, industrial_corridor_proximity: 14000, it_park_proximity: 9000
  }
};

export const mockProperties: Property[] = [
  {
    id: 'p101', title: 'Casagrand Amethyst 3BHK Apartment', property_type: 'Apartment', listing_type: 'Sale',
    price: 8500000, area_sqft: 1650, bedrooms: 3, bathrooms: 3, latitude: 11.0822, longitude: 77.0034,
    locality_id: '1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3', city: 'Coimbatore', state: 'Tamil Nadu', source: 'MagicBricks',
    listing_url: 'https://magicbricks.com/cbe/casagrand-amethyst',
    ai_description: 'Casagrand Amethyst is a prime residential enclave situated in Saravanampatti, the IT hub of Coimbatore. Spanning 1,650 sqft, this 3 BHK unit offers smart ventilation and proximity to CHIL SEZ IT Park, major engineering colleges, and premium schools.',
    ai_investment_rating: 'Grade: A - High Potential | Analysis: Priced at 5,150 INR/sqft which is highly competitive considering current IT expansions and Peelamedu-Saravanampatti connection corridor updates.'
  },
  {
    id: 'p102', title: 'Sreevatsa Li\'l Earth Villa in Saravanampatti', property_type: 'Villa', listing_type: 'Sale',
    price: 14200000, area_sqft: 2200, bedrooms: 3, bathrooms: 4, latitude: 11.0745, longitude: 77.0121,
    locality_id: '1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3', city: 'Coimbatore', state: 'Tamil Nadu', source: '99acres',
    listing_url: 'https://99acres.com/cbe/sreevatsa-lil-earth',
    ai_description: 'Sreevatsa Li\'l Earth is an eco-friendly villa community matching premium independent housing desires. Spanning 2,200 sqft with independent private gardens and solar water systems. Close to KCT Tech Park and Sathy Road highway access.',
    ai_investment_rating: 'Grade: B+ - Fair Value | Analysis: Price represents fair market valuation for independent luxury units in Coimbatore IT peripheral sectors.'
  },
  {
    id: 'p201', title: 'Salarpuria Sattva Navaratna Residency Peelamedu', property_type: 'Apartment', listing_type: 'Sale',
    price: 11500000, area_sqft: 1800, bedrooms: 3, bathrooms: 3, latitude: 11.0298, longitude: 77.0062,
    locality_id: '2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4', city: 'Coimbatore', state: 'Tamil Nadu', source: '99acres',
    listing_url: 'https://99acres.com/cbe/sattva-navaratna',
    ai_description: 'Salarpuria Sattva Navaratna is a premium high-rise gated community in Peelamedu, Coimbatore. Located right on Avinashi Road, it boasts state-of-the-art club facilities and unmatched connectivity to PSG Tech, GRD College, and Tidel Park.',
    ai_investment_rating: 'Grade: A- - Solid Asset | Analysis: Premium Avinashi Road visibility yields strong price appreciation (avg 8% annually). High demand for corporate rents.'
  },
  {
    id: 'p601', title: 'Luxury 4BHK Villa in RS Puram', property_type: 'Villa', listing_type: 'Sale',
    price: 32000000, area_sqft: 3800, bedrooms: 4, bathrooms: 5, latitude: 11.0123, longitude: 76.9412,
    locality_id: '6f7a2e0f-3f5f-4f0b-8537-3ea17bc521f8', city: 'Coimbatore', state: 'Tamil Nadu', source: 'Direct Broker',
    listing_url: 'https://realestateplatform.com/listings/rs-puram-luxury-villa',
    ai_description: 'This ultra-premium villa is located in the most posh avenue of RS Puram. Featuring Italian marble flooring, a private terrace patio, smart automated security systems, and walking access to DB Road shopping high-streets.',
    ai_investment_rating: 'Grade: B - Wealth Preservation | Analysis: High absolute pricing of 8,420 INR/sqft limits explosive capital returns, but RS Puram remains the most stable micro-market for wealthy preservation assets.'
  }
];

export const mockAmenities: Record<string, Amenity[]> = {
  '1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3': [
    { id: 'a1', name: 'SNS Academy School', category: 'school', latitude: 11.0821, longitude: 77.0045, address: 'Sathy Rd, Saravanampatti', confidence_score: 0.95 },
    { id: 'a2', name: 'Vimal Jyothi Convent School', category: 'school', latitude: 11.0768, longitude: 76.9958, address: 'Saravanampatti', confidence_score: 0.92 },
    { id: 'a3', name: 'Geetha Hospital', category: 'hospital', latitude: 11.0785, longitude: 77.0001, address: 'Saravanampatti Junction', confidence_score: 0.90 },
    { id: 'a4', name: 'Barbeque Nation', category: 'restaurant', latitude: 11.0805, longitude: 77.0025, address: 'Chil SEZ Road, Saravanampatti', confidence_score: 0.98 },
    { id: 'a5', name: 'Sathy Road Central Park', category: 'park', latitude: 11.0745, longitude: 76.9989, address: 'Sathy Road', confidence_score: 0.88 },
    { id: 'a6', name: 'Gold\'s Gym', category: 'gym', latitude: 11.0811, longitude: 77.0019, address: 'Saravanampatti', confidence_score: 0.94 }
  ],
  '2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4': [
    { id: 'a10', name: 'PSG Sarvajana School', category: 'school', latitude: 11.0254, longitude: 77.0012, address: 'Peelamedu', confidence_score: 0.99 },
    { id: 'a11', name: 'GRG Matriculation School', category: 'school', latitude: 11.0312, longitude: 77.0045, address: 'Avinashi Road, Peelamedu', confidence_score: 0.98 },
    { id: 'a12', name: 'PSG IMSR Hospitals', category: 'hospital', latitude: 11.0276, longitude: 77.0089, address: 'Avinashi Rd, Peelamedu', confidence_score: 0.99 },
    { id: 'a13', name: 'Hopes Cafe & Grill', category: 'restaurant', latitude: 11.0334, longitude: 77.0051, address: 'Hopes College Road', confidence_score: 0.95 },
    { id: 'a14', name: 'Codissia Park & Playground', category: 'park', latitude: 11.0398, longitude: 77.0211, address: 'Peelamedu', confidence_score: 0.97 }
  ]
};

export const mockRecommendations: Record<string, Record<string, RecommendationItem[]>> = {
  '1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3': {
    'similar': [
      {
        id: '3c7a2e0c-3c5f-4c0b-8534-3ea17bc521f5', name: 'Kalapatti', city: 'Coimbatore', state: 'Tamil Nadu',
        recommendation_type: 'SIMILAR', score: 0.9124,
        reasoning: 'Kalapatti is highly similar to Saravanampatti. It shares similar price-per-sqft margins (4,500 vs 4,200) and comparable IT sector proximity (CHIL SEZ vs Codissia corridors).',
        feature_contribution: { price_per_sqft: 0.95, connectivity_score: 0.88, investment_score: 0.92 },
        generation_timestamp: '2026-06-09T23:59:00Z'
      }
    ],
    'CHEAPER': [
      {
        id: '3c7a2e0c-3c5f-4c0b-8534-3ea17bc521f5', name: 'Kalapatti', city: 'Coimbatore', state: 'Tamil Nadu',
        recommendation_type: 'CHEAPER', score: 0.8850,
        reasoning: 'Kalapatti offers a 12% lower average pricing bracket but captures similar connectivity indicators and educational institutions index (76.8 vs 85.2).',
        feature_contribution: { price_savings: 0.85, connectivity_score: 0.89, education_score: 0.88 },
        generation_timestamp: '2026-06-09T23:59:00Z'
      }
    ],
    'PREMIUM': [
      {
        id: '2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4', name: 'Peelamedu', city: 'Coimbatore', state: 'Tamil Nadu',
        recommendation_type: 'PREMIUM', score: 0.9425,
        reasoning: 'Peelamedu is a premium step-up from Saravanampatti. It improves overall livability (89.1 vs 77.8) and healthcare density index (4.5 vs 2.1) with a 45% price per sqft premium.',
        feature_contribution: { price_premium: 0.75, healthcare_gain: 0.98, connectivity_gain: 0.92 },
        generation_timestamp: '2026-06-09T23:59:00Z'
      }
    ]
  }
};

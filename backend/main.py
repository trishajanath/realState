from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import settings
from core.logging import logger
from core.middleware import ObservabilityMiddleware
from api.router import api_router
from core.database import mongo_db

# ── Seed Data ─────────────────────────────────────────────────────────────────

SEED_LOCALITIES = [
    {"id": "1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3", "name": "Saravanampatti", "city": "Coimbatore", "state": "Tamil Nadu", "latitude": 11.0797, "longitude": 77.0011},
    {"id": "2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4", "name": "Peelamedu",       "city": "Coimbatore", "state": "Tamil Nadu", "latitude": 11.0284, "longitude": 77.0028},
    {"id": "3c7a2e0c-3c5f-4c0b-8534-3ea17bc521f5", "name": "Kalapatti",       "city": "Coimbatore", "state": "Tamil Nadu", "latitude": 11.0655, "longitude": 77.0422},
    {"id": "4d7a2e0d-3d5f-4d0b-8535-3ea17bc521f6", "name": "Singanallur",     "city": "Coimbatore", "state": "Tamil Nadu", "latitude": 11.0016, "longitude": 77.0264},
    {"id": "5e7a2e0e-3e5f-4e0b-8536-3ea17bc521f7", "name": "Saibaba Colony",  "city": "Coimbatore", "state": "Tamil Nadu", "latitude": 11.0213, "longitude": 76.9458},
    {"id": "6f7a2e0f-3f5f-4f0b-8537-3ea17bc521f8", "name": "RS Puram",        "city": "Coimbatore", "state": "Tamil Nadu", "latitude": 11.0112, "longitude": 76.9458},
    {"id": "7g7a2e0g-3g5f-4g0b-8538-3ea17bc521f9", "name": "Gandhipuram",     "city": "Coimbatore", "state": "Tamil Nadu", "latitude": 11.0183, "longitude": 76.9691},
]

SEED_METRICS = [
    {
        "locality_id": "1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3",
        "avg_property_price": 6500000, "median_property_price": 5800000,
        "avg_price_per_sqft": 4500, "median_price_per_sqft": 4300,
        "rental_yield_estimate": 4.2, "listing_velocity": 8.5, "property_inventory": 240,
        "schools_per_sq_km": 3.5, "hospitals_per_sq_km": 2.1, "restaurants_per_sq_km": 7.2,
        "grocery_stores_per_sq_km": 12.0, "gyms_per_sq_km": 4.5, "parks_per_sq_km": 1.2,
        "nearest_railway_station": {"name": "Coimbatore North Junction", "distance_meters": 8500},
        "nearest_airport": {"name": "Coimbatore International Airport", "distance_meters": 11000},
        "nearest_bus_terminal": {"name": "Gandhipuram Central Bus Stand", "distance_meters": 7500},
        "highway_access_score": 82.0, "metro_proximity": 1200,
        "industrial_corridor_proximity": 6000, "it_park_proximity": 500,
    },
    {
        "locality_id": "2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4",
        "avg_property_price": 9200000, "median_property_price": 8400000,
        "avg_price_per_sqft": 6800, "median_price_per_sqft": 6500,
        "rental_yield_estimate": 3.8, "listing_velocity": 9.2, "property_inventory": 180,
        "schools_per_sq_km": 5.8, "hospitals_per_sq_km": 4.5, "restaurants_per_sq_km": 15.0,
        "grocery_stores_per_sq_km": 22.0, "gyms_per_sq_km": 8.0, "parks_per_sq_km": 2.5,
        "nearest_railway_station": {"name": "Coimbatore Junction", "distance_meters": 4200},
        "nearest_airport": {"name": "Coimbatore International Airport", "distance_meters": 3500},
        "nearest_bus_terminal": {"name": "Gandhipuram Central Bus Stand", "distance_meters": 3800},
        "highway_access_score": 90.0, "metro_proximity": 500,
        "industrial_corridor_proximity": 8000, "it_park_proximity": 2500,
    },
    {
        "locality_id": "3c7a2e0c-3c5f-4c0b-8534-3ea17bc521f5",
        "avg_property_price": 5200000, "median_property_price": 4800000,
        "avg_price_per_sqft": 4100, "median_price_per_sqft": 3900,
        "rental_yield_estimate": 4.5, "listing_velocity": 7.0, "property_inventory": 310,
        "schools_per_sq_km": 2.8, "hospitals_per_sq_km": 1.5, "restaurants_per_sq_km": 5.0,
        "grocery_stores_per_sq_km": 9.0, "gyms_per_sq_km": 3.0, "parks_per_sq_km": 0.8,
        "nearest_railway_station": {"name": "Coimbatore North Junction", "distance_meters": 10000},
        "nearest_airport": {"name": "Coimbatore International Airport", "distance_meters": 14000},
        "nearest_bus_terminal": {"name": "Kalapatti Bus Stop", "distance_meters": 1200},
        "highway_access_score": 70.0, "metro_proximity": 3500,
        "industrial_corridor_proximity": 4000, "it_park_proximity": 2200,
    },
    {
        "locality_id": "6f7a2e0f-3f5f-4f0b-8537-3ea17bc521f8",
        "avg_property_price": 14500000, "median_property_price": 13200000,
        "avg_price_per_sqft": 9800, "median_price_per_sqft": 9500,
        "rental_yield_estimate": 3.1, "listing_velocity": 6.8, "property_inventory": 95,
        "schools_per_sq_km": 8.2, "hospitals_per_sq_km": 6.8, "restaurants_per_sq_km": 28.0,
        "grocery_stores_per_sq_km": 34.0, "gyms_per_sq_km": 12.0, "parks_per_sq_km": 4.8,
        "nearest_railway_station": {"name": "Coimbatore Junction", "distance_meters": 2500},
        "nearest_airport": {"name": "Coimbatore International Airport", "distance_meters": 12500},
        "nearest_bus_terminal": {"name": "Gandhipuram Central Bus Stand", "distance_meters": 3200},
        "highway_access_score": 75.0, "metro_proximity": 2000,
        "industrial_corridor_proximity": 14000, "it_park_proximity": 9000,
    },
]

SEED_SCORES = [
    {"locality_id": "1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3", "education_score": 85.2, "healthcare_score": 74.5, "lifestyle_score": 79.0, "connectivity_score": 72.8, "investment_score": 92.5, "overall_livability_score": 77.88},
    {"locality_id": "2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4", "education_score": 94.0, "healthcare_score": 88.5, "lifestyle_score": 86.2, "connectivity_score": 88.0, "investment_score": 86.4, "overall_livability_score": 89.17},
    {"locality_id": "3c7a2e0c-3c5f-4c0b-8534-3ea17bc521f5", "education_score": 76.8, "healthcare_score": 68.2, "lifestyle_score": 72.5, "connectivity_score": 70.1, "investment_score": 88.2, "overall_livability_score": 71.90},
    {"locality_id": "6f7a2e0f-3f5f-4f0b-8537-3ea17bc521f8", "education_score": 96.5, "healthcare_score": 92.0, "lifestyle_score": 95.0, "connectivity_score": 91.5, "investment_score": 81.0, "overall_livability_score": 93.75},
]

SEED_AMENITIES = [
    # Saravanampatti
    {"id": "a1", "locality_id": "1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3", "name": "SNS Academy School", "category": "school", "latitude": 11.0821, "longitude": 77.0045, "address": "Sathy Rd, Saravanampatti", "confidence_score": 0.95},
    {"id": "a2", "locality_id": "1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3", "name": "Vimal Jyothi Convent School", "category": "school", "latitude": 11.0768, "longitude": 76.9958, "address": "Saravanampatti", "confidence_score": 0.92},
    {"id": "a3", "locality_id": "1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3", "name": "Geetha Hospital", "category": "hospital", "latitude": 11.0785, "longitude": 77.0001, "address": "Saravanampatti Junction", "confidence_score": 0.90},
    {"id": "a4", "locality_id": "1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3", "name": "Barbeque Nation", "category": "restaurant", "latitude": 11.0805, "longitude": 77.0025, "address": "Chil SEZ Road, Saravanampatti", "confidence_score": 0.98},
    {"id": "a5", "locality_id": "1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3", "name": "Sathy Road Central Park", "category": "park", "latitude": 11.0745, "longitude": 76.9989, "address": "Sathy Road", "confidence_score": 0.88},
    {"id": "a6", "locality_id": "1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3", "name": "Gold's Gym", "category": "gym", "latitude": 11.0811, "longitude": 77.0019, "address": "Saravanampatti", "confidence_score": 0.94},
    # Peelamedu
    {"id": "a10", "locality_id": "2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4", "name": "PSG Sarvajana School", "category": "school", "latitude": 11.0254, "longitude": 77.0012, "address": "Peelamedu", "confidence_score": 0.99},
    {"id": "a11", "locality_id": "2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4", "name": "GRG Matriculation School", "category": "school", "latitude": 11.0312, "longitude": 77.0045, "address": "Avinashi Road, Peelamedu", "confidence_score": 0.98},
    {"id": "a12", "locality_id": "2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4", "name": "PSG IMSR Hospitals", "category": "hospital", "latitude": 11.0276, "longitude": 77.0089, "address": "Avinashi Rd, Peelamedu", "confidence_score": 0.99},
    {"id": "a13", "locality_id": "2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4", "name": "Hopes Cafe & Grill", "category": "restaurant", "latitude": 11.0334, "longitude": 77.0051, "address": "Hopes College Road", "confidence_score": 0.95},
    {"id": "a14", "locality_id": "2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4", "name": "Codissia Park & Playground", "category": "park", "latitude": 11.0398, "longitude": 77.0211, "address": "Peelamedu", "confidence_score": 0.97},
    {"id": "a15", "locality_id": "2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4", "name": "Snap Fitness Peelamedu", "category": "gym", "latitude": 11.0298, "longitude": 77.0070, "address": "Avinashi Road", "confidence_score": 0.93},
    # RS Puram
    {"id": "a20", "locality_id": "6f7a2e0f-3f5f-4f0b-8537-3ea17bc521f8", "name": "Bishop Cotton Girls School", "category": "school", "latitude": 11.0121, "longitude": 76.9408, "address": "RS Puram", "confidence_score": 0.98},
    {"id": "a21", "locality_id": "6f7a2e0f-3f5f-4f0b-8537-3ea17bc521f8", "name": "KG Hospital", "category": "hospital", "latitude": 11.0109, "longitude": 76.9435, "address": "Top Slip Road, RS Puram", "confidence_score": 0.99},
    {"id": "a22", "locality_id": "6f7a2e0f-3f5f-4f0b-8537-3ea17bc521f8", "name": "Residency Restaurant", "category": "restaurant", "latitude": 11.0135, "longitude": 76.9448, "address": "Avinashi Rd, RS Puram", "confidence_score": 0.96},
]

SEED_RECOMMENDATIONS = [
    {
        "locality_id": "1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3",
        "recommendation_type": "similar",
        "items": [
            {"id": "3c7a2e0c-3c5f-4c0b-8534-3ea17bc521f5", "name": "Kalapatti", "city": "Coimbatore", "state": "Tamil Nadu", "recommendation_type": "SIMILAR", "score": 0.9124, "reasoning": "Kalapatti is highly similar to Saravanampatti — comparable IT sector proximity and price-per-sqft (4,500 vs 4,200).", "feature_contribution": {"price_per_sqft": 0.95, "connectivity_score": 0.88, "investment_score": 0.92}, "generation_timestamp": "2026-06-09T23:59:00Z"},
        ],
    },
    {
        "locality_id": "1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3",
        "recommendation_type": "cheaper",
        "items": [
            {"id": "3c7a2e0c-3c5f-4c0b-8534-3ea17bc521f5", "name": "Kalapatti", "city": "Coimbatore", "state": "Tamil Nadu", "recommendation_type": "CHEAPER", "score": 0.8850, "reasoning": "Kalapatti offers a 12% lower average pricing bracket but captures similar connectivity and educational institutions.", "feature_contribution": {"price_savings": 0.85, "connectivity_score": 0.89, "education_score": 0.88}, "generation_timestamp": "2026-06-09T23:59:00Z"},
        ],
    },
    {
        "locality_id": "1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3",
        "recommendation_type": "premium",
        "items": [
            {"id": "2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4", "name": "Peelamedu", "city": "Coimbatore", "state": "Tamil Nadu", "recommendation_type": "PREMIUM", "score": 0.9425, "reasoning": "Peelamedu improves overall livability (89.1 vs 77.8) and healthcare density with a 45% price-per-sqft premium.", "feature_contribution": {"price_premium": 0.75, "healthcare_gain": 0.98, "connectivity_gain": 0.92}, "generation_timestamp": "2026-06-09T23:59:00Z"},
        ],
    },
]

SEED_PROPERTIES = [
    {
        "id": "10100000-0000-0000-0000-000000000101",
        "title": "Casagrand Amethyst 3BHK Apartment",
        "property_type": "Apartment", "listing_type": "Sale",
        "price": 8500000.0, "area_sqft": 1650.0, "bedrooms": 3, "bathrooms": 3,
        "latitude": 11.0822, "longitude": 77.0034,
        "locality_id": "1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3",
        "locality_name": "Saravanampatti",
        "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "MagicBricks",
        "listing_url": "https://magicbricks.com/cbe/casagrand-amethyst",
        "images": [
            "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&auto=format&fit=crop",
        ],
        "ai_description": "Casagrand Amethyst is a prime residential enclave situated in Saravanampatti, the IT hub of Coimbatore. Spanning 1,650 sqft, this 3 BHK unit offers smart ventilation and proximity to CHIL SEZ IT Park, major engineering colleges, and premium schools.",
        "ai_investment_rating": "Grade: A - High Potential | Analysis: Priced at 5,150 INR/sqft which is highly competitive considering current IT expansions and Peelamedu-Saravanampatti connection corridor updates.",
        "locality": {"id": "1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3", "name": "Saravanampatti", "city": "Coimbatore", "state": "Tamil Nadu"},
    },
    {
        "id": "10100000-0000-0000-0000-000000000102",
        "title": "Sreevatsa Li'l Earth Villa in Saravanampatti",
        "property_type": "Villa", "listing_type": "Sale",
        "price": 14200000.0, "area_sqft": 2200.0, "bedrooms": 3, "bathrooms": 4,
        "latitude": 11.0745, "longitude": 77.0121,
        "locality_id": "1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3",
        "locality_name": "Saravanampatti",
        "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "99acres",
        "listing_url": "https://99acres.com/cbe/sreevatsa-lil-earth",
        "images": [
            "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop",
        ],
        "ai_description": "Sreevatsa Li'l Earth is an eco-friendly villa community. Spanning 2,200 sqft with private gardens and solar water systems. Close to KCT Tech Park and Sathy Road highway access.",
        "ai_investment_rating": "Grade: B+ - Fair Value | Analysis: Price represents fair market valuation for independent luxury units in Coimbatore IT peripheral sectors.",
        "locality": {"id": "1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3", "name": "Saravanampatti", "city": "Coimbatore", "state": "Tamil Nadu"},
    },
    {
        "id": "10100000-0000-0000-0000-000000000103",
        "title": "SNS Silver Springs 2BHK Apartment for Rent",
        "property_type": "Apartment", "listing_type": "Rent",
        "price": 16000.0, "area_sqft": 1050.0, "bedrooms": 2, "bathrooms": 2,
        "latitude": 11.0812, "longitude": 77.0008,
        "locality_id": "1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3",
        "locality_name": "Saravanampatti",
        "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "MagicBricks",
        "listing_url": "https://magicbricks.com/cbe/sns-silver-springs",
        "images": [
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop",
        ],
        "ai_description": "Well-maintained 2 BHK apartment in SNS Silver Springs, Saravanampatti. Minutes from CHIL SEZ IT Park. Ideal for tech professionals seeking proximity to the IT corridor.",
        "ai_investment_rating": "Grade: B+ - Fair Yield | Analysis: Rental demand is consistent due to IT park proximity with ~4.5% gross yield.",
        "locality": {"id": "1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3", "name": "Saravanampatti", "city": "Coimbatore", "state": "Tamil Nadu"},
    },
    {
        "id": "20100000-0000-0000-0000-000000000201",
        "title": "Salarpuria Sattva Navaratna Residency Peelamedu",
        "property_type": "Apartment", "listing_type": "Sale",
        "price": 11500000.0, "area_sqft": 1800.0, "bedrooms": 3, "bathrooms": 3,
        "latitude": 11.0298, "longitude": 77.0062,
        "locality_id": "2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4",
        "locality_name": "Peelamedu",
        "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "99acres",
        "listing_url": "https://99acres.com/cbe/sattva-navaratna",
        "images": [
            "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop",
        ],
        "ai_description": "Salarpuria Sattva Navaratna is a premium high-rise gated community in Peelamedu. Located on Avinashi Road with state-of-the-art club facilities and unmatched connectivity to PSG Tech, GRD College, and Tidel Park.",
        "ai_investment_rating": "Grade: A- - Solid Asset | Analysis: Premium Avinashi Road visibility yields strong price appreciation (avg 8% annually). High demand for corporate rents.",
        "locality": {"id": "2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4", "name": "Peelamedu", "city": "Coimbatore", "state": "Tamil Nadu"},
    },
    {
        "id": "20200000-0000-0000-0000-000000000202",
        "title": "Premium 4BHK Independent House in Peelamedu",
        "property_type": "Independent House", "listing_type": "Sale",
        "price": 18500000.0, "area_sqft": 2800.0, "bedrooms": 4, "bathrooms": 4,
        "latitude": 11.0254, "longitude": 77.0102,
        "locality_id": "2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4",
        "locality_name": "Peelamedu",
        "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "MagicBricks",
        "listing_url": "https://magicbricks.com/cbe/peelamedu-independent-house",
        "images": [
            "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&auto=format&fit=crop",
        ],
        "ai_description": "Elegant independent house located close to Fun Republic Mall in Peelamedu. Private gated compound, modular kitchen, and strong rental demand from medical professionals.",
        "ai_investment_rating": "Grade: A - Solid Value | Analysis: High demand for independent homes near Peelamedu commercial corridors ensures quick appreciation.",
        "locality": {"id": "2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4", "name": "Peelamedu", "city": "Coimbatore", "state": "Tamil Nadu"},
    },
    {
        "id": "20300000-0000-0000-0000-000000000203",
        "title": "Spacious 2BHK House for Rent in Peelamedu",
        "property_type": "Independent House", "listing_type": "Rent",
        "price": 22000.0, "area_sqft": 1200.0, "bedrooms": 2, "bathrooms": 2,
        "latitude": 11.0321, "longitude": 77.0154,
        "locality_id": "2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4",
        "locality_name": "Peelamedu",
        "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "99acres",
        "listing_url": "https://99acres.com/cbe/peelamedu-house-rent",
        "images": [
            "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&auto=format&fit=crop",
        ],
        "ai_description": "Comfortable 2 BHK independent home for rent in Peelamedu. Quiet residential layout, close to PSG Tech and GRD College. Ideal for families and students.",
        "ai_investment_rating": "Grade: B+ - Fair Value | Analysis: Steady rental income with low vacancy rates due to educational institutions nearby.",
        "locality": {"id": "2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4", "name": "Peelamedu", "city": "Coimbatore", "state": "Tamil Nadu"},
    },
    {
        "id": "20400000-0000-0000-0000-000000000204",
        "title": "2BHK Apartment for Rent in Peelamedu",
        "property_type": "Apartment", "listing_type": "Rent",
        "price": 18000.0, "area_sqft": 1050.0, "bedrooms": 2, "bathrooms": 2,
        "latitude": 11.0285, "longitude": 77.0095,
        "locality_id": "2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4",
        "locality_name": "Peelamedu",
        "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "MagicBricks",
        "listing_url": "https://magicbricks.com/cbe/peelamedu-apartment-rent",
        "images": [
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop",
        ],
        "ai_description": "Modern 2 BHK apartment in a premium gated community in Peelamedu. Modular kitchen, private balcony, security, and power backup. Superb connectivity to Avinashi Road.",
        "ai_investment_rating": "Grade: B - High Yield | Analysis: Yields 4.2% rental return annually due to prime IT and educational belt location.",
        "locality": {"id": "2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4", "name": "Peelamedu", "city": "Coimbatore", "state": "Tamil Nadu"},
    },
    {
        "id": "30100000-0000-0000-0000-000000000301",
        "title": "Affordable 3BHK Apartment in Kalapatti",
        "property_type": "Apartment", "listing_type": "Sale",
        "price": 5800000.0, "area_sqft": 1420.0, "bedrooms": 3, "bathrooms": 2,
        "latitude": 11.0660, "longitude": 77.0410,
        "locality_id": "3c7a2e0c-3c5f-4c0b-8534-3ea17bc521f5",
        "locality_name": "Kalapatti",
        "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "99acres",
        "listing_url": "https://99acres.com/cbe/kalapatti-apartment",
        "images": [
            "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop",
        ],
        "ai_description": "Value-for-money 3 BHK apartment in Kalapatti, a fast-developing suburb of Coimbatore. Close to Codissia Industrial Estate and Sathy Road. Good connectivity to IT parks.",
        "ai_investment_rating": "Grade: A - High Growth | Analysis: Kalapatti offers one of the best appreciation corridors in CBE with low current pricing and industrial belt proximity.",
        "locality": {"id": "3c7a2e0c-3c5f-4c0b-8534-3ea17bc521f5", "name": "Kalapatti", "city": "Coimbatore", "state": "Tamil Nadu"},
    },
    {
        "id": "60100000-0000-0000-0000-000000000601",
        "title": "Luxury 4BHK Villa in RS Puram",
        "property_type": "Villa", "listing_type": "Sale",
        "price": 32000000.0, "area_sqft": 3800.0, "bedrooms": 4, "bathrooms": 5,
        "latitude": 11.0123, "longitude": 76.9412,
        "locality_id": "6f7a2e0f-3f5f-4f0b-8537-3ea17bc521f8",
        "locality_name": "RS Puram",
        "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "Direct Broker",
        "listing_url": "https://realestateplatform.com/listings/rs-puram-luxury-villa",
        "images": [
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop",
        ],
        "ai_description": "Ultra-premium villa in RS Puram featuring Italian marble flooring, private terrace patio, smart automated security, and walking access to DB Road shopping high-streets.",
        "ai_investment_rating": "Grade: B - Wealth Preservation | Analysis: High absolute pricing of 8,420 INR/sqft limits explosive capital returns but RS Puram remains the most stable micro-market.",
        "locality": {"id": "6f7a2e0f-3f5f-4f0b-8537-3ea17bc521f8", "name": "RS Puram", "city": "Coimbatore", "state": "Tamil Nadu"},
    },
    {
        "id": "60200000-0000-0000-0000-000000000602",
        "title": "Semi-Furnished 2BHK Flat for Rent in RS Puram",
        "property_type": "Apartment", "listing_type": "Rent",
        "price": 25000.0, "area_sqft": 1100.0, "bedrooms": 2, "bathrooms": 2,
        "latitude": 11.0115, "longitude": 76.9420,
        "locality_id": "6f7a2e0f-3f5f-4f0b-8537-3ea17bc521f8",
        "locality_name": "RS Puram",
        "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "MagicBricks",
        "listing_url": "https://magicbricks.com/cbe/rs-puram-flat-rent",
        "images": [
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop",
        ],
        "ai_description": "Semi-furnished 2 BHK flat in the prestigious RS Puram neighbourhood. Premium amenities, gated security, and proximity to DB Road retail and dining.",
        "ai_investment_rating": "Grade: B+ - Stable Yield | Analysis: RS Puram commands premium rents owing to posh residential status and scarcity of supply.",
        "locality": {"id": "6f7a2e0f-3f5f-4f0b-8537-3ea17bc521f8", "name": "RS Puram", "city": "Coimbatore", "state": "Tamil Nadu"},
    },
]


# ── Lifespan ──────────────────────────────────────────────────────────────────

async def _upsert_collection(collection, docs: list, key: str) -> None:
    for doc in docs:
        await collection.replace_one({key: doc[key]}, doc, upsert=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "Application starting up",
        project_name=settings.PROJECT_NAME,
        environment=settings.ENVIRONMENT,
        debug_mode=settings.DEBUG,
    )

    try:
        # Properties collection
        props_col = mongo_db["properties_search"]
        await _upsert_collection(props_col, SEED_PROPERTIES, "id")
        # Drop and recreate text index so weight changes (e.g. description→ai_description) take effect.
        try:
            await props_col.drop_index("idx_properties_text_search")
        except Exception:
            pass
        await props_col.create_index(
            [("title", "text"), ("locality_name", "text"), ("ai_description", "text")],
            name="idx_properties_text_search",
        )
        logger.info(f"Seeded {len(SEED_PROPERTIES)} properties into MongoDB.")

        # Localities collection
        loc_col = mongo_db["localities"]
        await _upsert_collection(loc_col, SEED_LOCALITIES, "id")
        logger.info(f"Seeded {len(SEED_LOCALITIES)} localities into MongoDB.")

        # Locality metrics
        metrics_col = mongo_db["locality_metrics"]
        await _upsert_collection(metrics_col, SEED_METRICS, "locality_id")
        logger.info(f"Seeded {len(SEED_METRICS)} locality metric records.")

        # Locality scores
        scores_col = mongo_db["locality_scores"]
        await _upsert_collection(scores_col, SEED_SCORES, "locality_id")
        logger.info(f"Seeded {len(SEED_SCORES)} locality score records.")

        # Amenities
        amenities_col = mongo_db["amenities"]
        await _upsert_collection(amenities_col, SEED_AMENITIES, "id")
        logger.info(f"Seeded {len(SEED_AMENITIES)} amenities.")

        # Recommendations
        recs_col = mongo_db["locality_recommendations"]
        for rec in SEED_RECOMMENDATIONS:
            await recs_col.replace_one(
                {"locality_id": rec["locality_id"], "recommendation_type": rec["recommendation_type"]},
                rec,
                upsert=True,
            )
        logger.info(f"Seeded {len(SEED_RECOMMENDATIONS)} recommendation groups.")

    except Exception as e:
        logger.error("Failed to seed MongoDB collections", error=str(e))

    yield

    logger.info("Application shutting down")


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-powered Real Estate Intelligence Platform focused on Coimbatore, India",
    version="0.2.0",
    debug=settings.DEBUG,
    lifespan=lifespan,
)

app.add_middleware(ObservabilityMiddleware)

# Restrict CORS to the configured frontend origin (+ localhost for development)
allowed_origins = [settings.FRONTEND_URL]
if settings.ENVIRONMENT == "development" and "localhost" not in settings.FRONTEND_URL:
    allowed_origins.append("http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(
        "Captured unhandled application exception",
        path=request.url.path,
        method=request.method,
        error_type=type(exc).__name__,
        error_msg=str(exc),
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred."},
    )


app.include_router(api_router, prefix="/api/v1")


@app.get("/auth/google/callback")
async def google_oauth_callback(request: Request):
    from api.endpoints.auth import handle_oauth_callback
    return await handle_oauth_callback(request)


@app.get("/")
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": "0.2.0",
        "docs_url": "/docs",
        "health_check_url": "/api/v1/health",
    }

import asyncio
import uuid
import xml.etree.ElementTree as ET
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import httpx

from core.config import settings
from core.logging import logger
from core.middleware import ObservabilityMiddleware
from api.router import api_router

from core.database import mongo_db

# ── Locality IDs ────────────────────────────────────────────────────────────────
LOC_SARAVANAMPATTI  = "1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3"
LOC_PEELAMEDU       = "2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4"
LOC_KALAPATTI       = "3c7a2e0c-3c5f-4c0b-8534-3ea17bc521f5"
LOC_SINGANALLUR     = "4d7a2e0d-3d5f-4d0b-8535-3ea17bc521f6"
LOC_SAIBABA         = "5e7a2e0e-3e5f-4e0b-8536-3ea17bc521f7"
LOC_RSPURAM         = "6f7a2e0f-3f5f-4f0b-8537-3ea17bc521f8"
LOC_GANDHIPURAM     = "7g7a2e0g-3g5f-4g0b-8538-3ea17bc521f9"
LOC_VADAVALLI       = "8b8a2e0b-4b5f-4b0b-8539-3ea17bc521fa"
LOC_THUDIYALUR      = "9c9a2e0c-4c5f-4c0b-853a-3ea17bc521fb"
LOC_ONDIPUDUR       = "0d0a2e0d-4d5f-4d0b-853b-3ea17bc521fc"

# ── Properties ───────────────────────────────────────────────────────────────────
SEED_PROPERTIES = [
    # ── Saravanampatti ──────────────────────────────────────────────────────────
    {
        "id": "10100000-0000-0000-0000-000000000101",
        "title": "Casagrand Amethyst 3BHK Apartment",
        "property_type": "Apartment", "listing_type": "Sale",
        "price": 8500000.0, "area_sqft": 1650.0, "bedrooms": 3, "bathrooms": 3,
        "latitude": 11.0822, "longitude": 77.0034,
        "locality_id": LOC_SARAVANAMPATTI, "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "MagicBricks",
        "listing_url": "https://www.magicbricks.com/property-for-sale/residential-apartments/coimbatore",
        "images": [
            "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop&q=80"
        ],
        "ai_description": "Casagrand Amethyst is a RERA-registered residential enclave in Saravanampatti, Coimbatore's leading IT corridor. This 3 BHK unit of 1,650 sqft is within 1.5 km of CHIL SEZ IT Park and PSG Arts & Science College.",
        "ai_investment_rating": "Grade: A - High Potential | Analysis: ₹5,150/sqft is competitive for the CHIL SEZ belt. IT expansion drives steady rental demand from corporate tenants.",
        "locality": {"id": LOC_SARAVANAMPATTI, "name": "Saravanampatti", "city": "Coimbatore", "state": "Tamil Nadu"}
    },
    {
        "id": "10100000-0000-0000-0000-000000000102",
        "title": "Sreevatsa Li'l Earth 3BHK Villa",
        "property_type": "Villa", "listing_type": "Sale",
        "price": 14200000.0, "area_sqft": 2200.0, "bedrooms": 3, "bathrooms": 4,
        "latitude": 11.0745, "longitude": 77.0121,
        "locality_id": LOC_SARAVANAMPATTI, "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "99acres",
        "listing_url": "https://www.99acres.com/property-for-sale-in-saravanampatti-coimbatore",
        "images": [
            "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=80"
        ],
        "ai_description": "Sreevatsa Li'l Earth is an eco-friendly villa community near KCT Tech Park and Sathy Road (NH-544). Features private garden, solar water heating, and rainwater harvesting systems.",
        "ai_investment_rating": "Grade: B+ - Fair Value | Analysis: Villa inventory is limited in Saravanampatti, supporting price stability. Eco-community premium justified at ₹6,455/sqft.",
        "locality": {"id": LOC_SARAVANAMPATTI, "name": "Saravanampatti", "city": "Coimbatore", "state": "Tamil Nadu"}
    },
    {
        "id": "10300000-0000-0000-0000-000000000103",
        "title": "Casagrand Supremus 2BHK Apartment",
        "property_type": "Apartment", "listing_type": "Sale",
        "price": 6200000.0, "area_sqft": 1050.0, "bedrooms": 2, "bathrooms": 2,
        "latitude": 11.0816, "longitude": 76.9998,
        "locality_id": LOC_SARAVANAMPATTI, "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "MagicBricks",
        "listing_url": "https://www.magicbricks.com/property-for-sale/residential-apartments/coimbatore",
        "images": [
            "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&auto=format&fit=crop&q=80"
        ],
        "ai_description": "Casagrand Supremus is a RERA-registered gated community in Saravanampatti by Casagrand Builder Pvt Ltd. This compact 2 BHK unit offers modern finishes, 24/7 security, and uninterrupted power backup. Located 500m from CHIL SEZ entrance.",
        "ai_investment_rating": "Grade: A - Strong Buy | Analysis: ₹5,905/sqft is attractive for CHIL SEZ adjacency. IT employees constitute 70%+ of tenant base, ensuring low vacancy.",
        "locality": {"id": LOC_SARAVANAMPATTI, "name": "Saravanampatti", "city": "Coimbatore", "state": "Tamil Nadu"}
    },
    {
        "id": "10400000-0000-0000-0000-000000000104",
        "title": "KG Foundation Signature City 3BHK",
        "property_type": "Apartment", "listing_type": "Sale",
        "price": 7800000.0, "area_sqft": 1450.0, "bedrooms": 3, "bathrooms": 3,
        "latitude": 11.0768, "longitude": 77.0032,
        "locality_id": LOC_SARAVANAMPATTI, "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "99acres",
        "listing_url": "https://www.99acres.com/property-for-sale-in-saravanampatti-coimbatore",
        "images": [
            "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1560448204-61dc36dc98c8?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80"
        ],
        "ai_description": "KG Foundation's Signature City is a premium integrated township project in Saravanampatti. This 3 BHK unit of 1,450 sqft offers township-level amenities including a swimming pool, clubhouse, and sports courts. Walking distance to SNS Academy and PSG Arts College.",
        "ai_investment_rating": "Grade: A- - Solid Asset | Analysis: Township-format commands 8-12% premium over standalone apartments. ₹5,379/sqft offers upside as Saravanampatti matures into a full IT township.",
        "locality": {"id": LOC_SARAVANAMPATTI, "name": "Saravanampatti", "city": "Coimbatore", "state": "Tamil Nadu"}
    },
    # ── Peelamedu ───────────────────────────────────────────────────────────────
    {
        "id": "20100000-0000-0000-0000-000000000201",
        "title": "Salarpuria Sattva Navaratna 3BHK Apartment",
        "property_type": "Apartment", "listing_type": "Sale",
        "price": 11500000.0, "area_sqft": 1800.0, "bedrooms": 3, "bathrooms": 3,
        "latitude": 11.0298, "longitude": 77.0062,
        "locality_id": LOC_PEELAMEDU, "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "99acres",
        "listing_url": "https://www.99acres.com/property-for-sale-in-peelamedu-coimbatore",
        "images": [
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80"
        ],
        "ai_description": "Salarpuria Sattva Navaratna is a high-rise gated community on Avinashi Road, Peelamedu. Direct access to PSG College of Technology, GRD College, Tidel Park, and Coimbatore Airport (3.5 km). Premium club facilities with rooftop infinity pool.",
        "ai_investment_rating": "Grade: A- - Solid Asset | Analysis: Avinashi Road frontage yields 8% YoY appreciation. Strong corporate rental market from PSG Tech professionals.",
        "locality": {"id": LOC_PEELAMEDU, "name": "Peelamedu", "city": "Coimbatore", "state": "Tamil Nadu"}
    },
    {
        "id": "20200000-0000-0000-0000-000000000202",
        "title": "Premium 4BHK Independent House in Peelamedu",
        "property_type": "Independent House", "listing_type": "Sale",
        "price": 18500000.0, "area_sqft": 2800.0, "bedrooms": 4, "bathrooms": 4,
        "latitude": 11.0254, "longitude": 77.0102,
        "locality_id": LOC_PEELAMEDU, "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "MagicBricks",
        "listing_url": "https://www.magicbricks.com/property-for-sale/independent-house/coimbatore",
        "images": [
            "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&auto=format&fit=crop&q=80"
        ],
        "ai_description": "A well-maintained 4 BHK independent house in a quiet Peelamedu residential layout near Fun Republic Mall. Private compound with car park, modular kitchen, and attached servant quarters. Strong rental demand from KMCH doctors and PSG faculty.",
        "ai_investment_rating": "Grade: A - Solid Value | Analysis: Independent houses command premium over apartments in Peelamedu. Low supply creates scarcity upside.",
        "locality": {"id": LOC_PEELAMEDU, "name": "Peelamedu", "city": "Coimbatore", "state": "Tamil Nadu"}
    },
    {
        "id": "20300000-0000-0000-0000-000000000203",
        "title": "2BHK House for Rent near PSG Tech",
        "property_type": "Independent House", "listing_type": "Rent",
        "price": 22000.0, "area_sqft": 1200.0, "bedrooms": 2, "bathrooms": 2,
        "latitude": 11.0321, "longitude": 77.0154,
        "locality_id": LOC_PEELAMEDU, "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "99acres",
        "listing_url": "https://www.99acres.com/property-for-rent-in-peelamedu-coimbatore",
        "images": [
            "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1598257006458-087169a1f08d?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&auto=format&fit=crop&q=80"
        ],
        "ai_description": "Well-maintained 2 BHK independent home for rent in Peelamedu residential layout. 800m walking distance to PSG College of Technology. Ideal for faculty families or senior students. Includes covered parking and 24/7 power backup.",
        "ai_investment_rating": "Grade: B+ - High Yield | Analysis: PSG Tech proximity ensures near-zero vacancy. 4.4% gross yield on rental relative to capital value.",
        "locality": {"id": LOC_PEELAMEDU, "name": "Peelamedu", "city": "Coimbatore", "state": "Tamil Nadu"}
    },
    {
        "id": "20400000-0000-0000-0000-000000000204",
        "title": "2BHK Apartment for Rent on Avinashi Road",
        "property_type": "Apartment", "listing_type": "Rent",
        "price": 18000.0, "area_sqft": 1050.0, "bedrooms": 2, "bathrooms": 2,
        "latitude": 11.0285, "longitude": 77.0095,
        "locality_id": LOC_PEELAMEDU, "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "MagicBricks",
        "listing_url": "https://www.magicbricks.com/property-for-rent/residential-apartments/coimbatore",
        "images": [
            "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80"
        ],
        "ai_description": "Modern 2 BHK in a gated apartment complex on Avinashi Road, Peelamedu. Modular kitchen, private balcony, 24/7 security, and power backup. 1.2 km to Coimbatore International Airport. Popular with airline crew and IT professionals.",
        "ai_investment_rating": "Grade: B - High Yield | Analysis: Avinashi Road rental demand is structurally strong. 4.1% yield with low vacancy.",
        "locality": {"id": LOC_PEELAMEDU, "name": "Peelamedu", "city": "Coimbatore", "state": "Tamil Nadu"}
    },
    # ── Kalapatti ───────────────────────────────────────────────────────────────
    {
        "id": "30100000-0000-0000-0000-000000000301",
        "title": "Sreevatsa Hestia 2BHK Apartment",
        "property_type": "Apartment", "listing_type": "Sale",
        "price": 5200000.0, "area_sqft": 1150.0, "bedrooms": 2, "bathrooms": 2,
        "latitude": 11.0642, "longitude": 77.0398,
        "locality_id": LOC_KALAPATTI, "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "99acres",
        "listing_url": "https://www.99acres.com/property-for-sale-in-kalapatti-coimbatore",
        "images": [
            "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&auto=format&fit=crop&q=80"
        ],
        "ai_description": "Sreevatsa Hestia is a RERA-registered mid-segment apartment project in Kalapatti, an emerging suburb of Coimbatore with good connectivity to CHIL SEZ and Saravanampatti IT belt via Sathy Road. Features clubhouse, swimming pool, and landscape garden.",
        "ai_investment_rating": "Grade: A - Growth Pick | Analysis: Kalapatti offers Saravanampatti-adjacent pricing at a 15-20% discount. High appreciation upside as IT corridor matures westward.",
        "locality": {"id": LOC_KALAPATTI, "name": "Kalapatti", "city": "Coimbatore", "state": "Tamil Nadu"}
    },
    {
        "id": "30200000-0000-0000-0000-000000000302",
        "title": "Affordable 2BHK Plot House in Kalapatti",
        "property_type": "Independent House", "listing_type": "Sale",
        "price": 3800000.0, "area_sqft": 950.0, "bedrooms": 2, "bathrooms": 1,
        "latitude": 11.0671, "longitude": 77.0445,
        "locality_id": LOC_KALAPATTI, "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "Direct Broker",
        "listing_url": "https://www.99acres.com/property-for-sale-in-kalapatti-coimbatore",
        "images": [
            "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1560448204-61dc36dc98c8?w=800&auto=format&fit=crop&q=80"
        ],
        "ai_description": "Entry-level 2 BHK independent house in Kalapatti on a 1,800 sqft plot. Suitable for first-time buyers. 4 km from Saravanampatti IT hub and well-connected via the Sathy Road arterial. Layout with good future resale prospects.",
        "ai_investment_rating": "Grade: B+ - Value Buy | Analysis: One of the most affordable entry points into the Coimbatore IT belt catchment. Strong long-term appreciation as the corridor develops.",
        "locality": {"id": LOC_KALAPATTI, "name": "Kalapatti", "city": "Coimbatore", "state": "Tamil Nadu"}
    },
    # ── Singanallur ──────────────────────────────────────────────────────────────
    {
        "id": "40100000-0000-0000-0000-000000000401",
        "title": "Ramaniyam Uma 3BHK Apartment",
        "property_type": "Apartment", "listing_type": "Sale",
        "price": 6800000.0, "area_sqft": 1380.0, "bedrooms": 3, "bathrooms": 2,
        "latitude": 11.0024, "longitude": 77.0248,
        "locality_id": LOC_SINGANALLUR, "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "MagicBricks",
        "listing_url": "https://www.magicbricks.com/property-for-sale/residential-apartments/coimbatore",
        "images": [
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&auto=format&fit=crop&q=80"
        ],
        "ai_description": "Ramaniyam Uma by Ramaniyam Real Estates is a reputed mid-premium project in Singanallur, South Coimbatore. Excellent connectivity to Singanallur Bus Stand and Coimbatore airport via Trichy Road. 3 BHK of 1,380 sqft with clubhouse and jogging track.",
        "ai_investment_rating": "Grade: B+ - Moderate Upside | Analysis: Singanallur offers 4.8-5.2% rental yield — among the highest in CBE. KMCH and textile industries anchor tenant demand.",
        "locality": {"id": LOC_SINGANALLUR, "name": "Singanallur", "city": "Coimbatore", "state": "Tamil Nadu"}
    },
    {
        "id": "40200000-0000-0000-0000-000000000402",
        "title": "3BHK Independent House for Sale in Singanallur",
        "property_type": "Independent House", "listing_type": "Sale",
        "price": 8500000.0, "area_sqft": 2100.0, "bedrooms": 3, "bathrooms": 3,
        "latitude": 11.0008, "longitude": 77.0281,
        "locality_id": LOC_SINGANALLUR, "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "99acres",
        "listing_url": "https://www.99acres.com/property-for-sale-in-singanallur-coimbatore",
        "images": [
            "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1598257006458-087169a1f08d?w=800&auto=format&fit=crop&q=80"
        ],
        "ai_description": "Spacious 3 BHK independent house in Singanallur on a 2,400 sqft plot. Close to Singanallur Lake, KMCH (2.5 km), and the Trichy Road commercial corridor. Good rental demand from hospital staff and textile industry professionals.",
        "ai_investment_rating": "Grade: B - Steady Returns | Analysis: South Coimbatore independent houses offer stable returns with low maintenance. Singanallur lake-facing plots are appreciating faster.",
        "locality": {"id": LOC_SINGANALLUR, "name": "Singanallur", "city": "Coimbatore", "state": "Tamil Nadu"}
    },
    # ── Saibaba Colony ────────────────────────────────────────────────────────────
    {
        "id": "50100000-0000-0000-0000-000000000501",
        "title": "Godrej Nurture 3BHK Premium Apartment",
        "property_type": "Apartment", "listing_type": "Sale",
        "price": 11500000.0, "area_sqft": 1680.0, "bedrooms": 3, "bathrooms": 3,
        "latitude": 11.0228, "longitude": 76.9471,
        "locality_id": LOC_SAIBABA, "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "MagicBricks",
        "listing_url": "https://www.magicbricks.com/property-for-sale/residential-apartments/coimbatore",
        "images": [
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&auto=format&fit=crop&q=80"
        ],
        "ai_description": "Godrej Nurture by Godrej Properties is a premium residential project in Coimbatore, located in the established Saibaba Colony neighbourhood. This 3 BHK of 1,680 sqft features Godrej's signature Nurture-series finishes, smart home pre-wiring, and rooftop sky deck. Surrounded by premium schools, hospitals, and DB Road commercial strip.",
        "ai_investment_rating": "Grade: A - Blue Chip | Analysis: Godrej brand commands 10-15% premium over local developers. Saibaba Colony is the most stable appreciation market in CBE.",
        "locality": {"id": LOC_SAIBABA, "name": "Saibaba Colony", "city": "Coimbatore", "state": "Tamil Nadu"}
    },
    {
        "id": "50200000-0000-0000-0000-000000000502",
        "title": "Premium 3BHK Duplex Villa in Saibaba Colony",
        "property_type": "Villa", "listing_type": "Sale",
        "price": 28000000.0, "area_sqft": 3200.0, "bedrooms": 3, "bathrooms": 4,
        "latitude": 11.0198, "longitude": 76.9441,
        "locality_id": LOC_SAIBABA, "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "Direct Broker",
        "listing_url": "https://www.99acres.com/property-for-sale-in-saibaba-colony-coimbatore",
        "images": [
            "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&auto=format&fit=crop&q=80"
        ],
        "ai_description": "A stunning duplex villa in Saibaba Colony, one of Coimbatore's most coveted residential addresses. Italian marble flooring, modular kitchen, private terrace garden, and a double-height living room. Walking access to Sree Krishna Sweets, DB Road restaurants, and Saibaba Colony market.",
        "ai_investment_rating": "Grade: B - Wealth Preservation | Analysis: Villa format in Saibaba Colony is extremely rare. Scarcity drives capital preservation and gradual appreciation.",
        "locality": {"id": LOC_SAIBABA, "name": "Saibaba Colony", "city": "Coimbatore", "state": "Tamil Nadu"}
    },
    # ── RS Puram ─────────────────────────────────────────────────────────────────
    {
        "id": "60100000-0000-0000-0000-000000000601",
        "title": "Luxury 4BHK Villa in RS Puram",
        "property_type": "Villa", "listing_type": "Sale",
        "price": 32000000.0, "area_sqft": 3800.0, "bedrooms": 4, "bathrooms": 5,
        "latitude": 11.0123, "longitude": 76.9412,
        "locality_id": LOC_RSPURAM, "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "Direct Broker",
        "listing_url": "https://www.99acres.com/property-for-sale-in-rs-puram-coimbatore",
        "images": [
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&auto=format&fit=crop&q=80"
        ],
        "ai_description": "Ultra-premium villa on the most prestigious avenue in RS Puram, Coimbatore. Features Italian marble flooring, private terrace patio with city views, smart automated security, and walking access to DB Road luxury retail and Nataraj Theatre area.",
        "ai_investment_rating": "Grade: B - Wealth Preservation | Analysis: RS Puram premium limits explosive appreciation, but offers the strongest capital safety in CBE's residential market.",
        "locality": {"id": LOC_RSPURAM, "name": "RS Puram", "city": "Coimbatore", "state": "Tamil Nadu"}
    },
    {
        "id": "60200000-0000-0000-0000-000000000602",
        "title": "Kochar Pearl 3BHK Apartment in RS Puram",
        "property_type": "Apartment", "listing_type": "Sale",
        "price": 13500000.0, "area_sqft": 1850.0, "bedrooms": 3, "bathrooms": 3,
        "latitude": 11.0134, "longitude": 76.9469,
        "locality_id": LOC_RSPURAM, "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "MagicBricks",
        "listing_url": "https://www.magicbricks.com/property-for-sale/residential-apartments/coimbatore",
        "images": [
            "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80"
        ],
        "ai_description": "Kochar Pearl is a premium mid-rise apartment community in RS Puram by Kochar Homes. This 3 BHK of 1,850 sqft offers high-end finishes, centralized water softener, and covered parking. 400m from DB Road commercial strip and 600m from P&T Colony market.",
        "ai_investment_rating": "Grade: A- - Premium Hold | Analysis: RS Puram commands the highest ₹/sqft in CBE. Kochar brand ensures quality. Ideal as a long-term wealth asset.",
        "locality": {"id": LOC_RSPURAM, "name": "RS Puram", "city": "Coimbatore", "state": "Tamil Nadu"}
    },
    # ── Gandhipuram ──────────────────────────────────────────────────────────────
    {
        "id": "70100000-0000-0000-0000-000000000701",
        "title": "Shriram Prime City 3BHK Apartment",
        "property_type": "Apartment", "listing_type": "Sale",
        "price": 8800000.0, "area_sqft": 1620.0, "bedrooms": 3, "bathrooms": 2,
        "latitude": 11.0176, "longitude": 76.9678,
        "locality_id": LOC_GANDHIPURAM, "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "MagicBricks",
        "listing_url": "https://www.magicbricks.com/property-for-sale/residential-apartments/coimbatore",
        "images": [
            "https://images.unsplash.com/photo-1560448204-61dc36dc98c8?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80"
        ],
        "ai_description": "Shriram Prime City is a Shriram Properties project in central Gandhipuram, Coimbatore's commercial spine. This 3 BHK offers 1,620 sqft with excellent access to Gandhipuram Central Bus Stand (600m), Ukkadam market, and RS Puram shopping corridor. Ideal for business owners and families.",
        "ai_investment_rating": "Grade: B+ - Central Value | Analysis: Gandhipuram's central location supports steady rental demand. ₹5,432/sqft is reasonable for this level of connectivity.",
        "locality": {"id": LOC_GANDHIPURAM, "name": "Gandhipuram", "city": "Coimbatore", "state": "Tamil Nadu"}
    },
    {
        "id": "70200000-0000-0000-0000-000000000702",
        "title": "2BHK Furnished Apartment for Rent in Gandhipuram",
        "property_type": "Apartment", "listing_type": "Rent",
        "price": 22000.0, "area_sqft": 1050.0, "bedrooms": 2, "bathrooms": 2,
        "latitude": 11.0191, "longitude": 76.9702,
        "locality_id": LOC_GANDHIPURAM, "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "99acres",
        "listing_url": "https://www.99acres.com/property-for-rent-in-gandhipuram-coimbatore",
        "images": [
            "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&auto=format&fit=crop&q=80"
        ],
        "ai_description": "Fully furnished 2 BHK apartment in central Gandhipuram. Features air-conditioned bedrooms, modular kitchen, and covered parking. Walking distance to Gandhipuram Bus Stand, Big Bazaar Street, and the main commercial market. Ideal for business professionals and working couples.",
        "ai_investment_rating": "Grade: B - Transit Yield | Analysis: Gandhipuram's central transit hub position supports 4.0% rental yield with near-zero vacancy for furnished units.",
        "locality": {"id": LOC_GANDHIPURAM, "name": "Gandhipuram", "city": "Coimbatore", "state": "Tamil Nadu"}
    },
    # ── Vadavalli ────────────────────────────────────────────────────────────────
    {
        "id": "80100000-0000-0000-0000-000000000801",
        "title": "VGN Bloomfields 2BHK Apartment",
        "property_type": "Apartment", "listing_type": "Sale",
        "price": 4800000.0, "area_sqft": 1050.0, "bedrooms": 2, "bathrooms": 2,
        "latitude": 10.9905, "longitude": 76.9195,
        "locality_id": LOC_VADAVALLI, "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "99acres",
        "listing_url": "https://www.99acres.com/property-for-sale-in-vadavalli-coimbatore",
        "images": [
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&auto=format&fit=crop&q=80"
        ],
        "ai_description": "VGN Bloomfields by VGN Developers is a well-planned residential project in Vadavalli, western Coimbatore. Close to Coimbatore City Municipal Corporation limits with good access to NH-544 (Palakkad Highway). 2 BHK of 1,050 sqft with clubhouse and landscaped garden.",
        "ai_investment_rating": "Grade: B+ - Growth Entry | Analysis: Vadavalli is on the NHAI Ring Road corridor. Entry-level pricing with significant upside as western CBE develops.",
        "locality": {"id": LOC_VADAVALLI, "name": "Vadavalli", "city": "Coimbatore", "state": "Tamil Nadu"}
    },
    # ── Thudiyalur ────────────────────────────────────────────────────────────────
    {
        "id": "90100000-0000-0000-0000-000000000901",
        "title": "3BHK Villa in Thudiyalur Residential Layout",
        "property_type": "Villa", "listing_type": "Sale",
        "price": 7200000.0, "area_sqft": 2100.0, "bedrooms": 3, "bathrooms": 3,
        "latitude": 11.0662, "longitude": 77.0235,
        "locality_id": LOC_THUDIYALUR, "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "Direct Broker",
        "listing_url": "https://www.99acres.com/property-for-sale-in-thudiyalur-coimbatore",
        "images": [
            "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80"
        ],
        "ai_description": "Spacious 3 BHK villa in a DTCP-approved residential layout in Thudiyalur, a growing suburb between Saravanampatti and Coimbatore North. 5 km from CHIL SEZ and 8 km from Coimbatore Junction. Large private garden and terrace. Quiet residential neighbourhood with good greenery.",
        "ai_investment_rating": "Grade: B+ - Suburban Upside | Analysis: Thudiyalur is in the IT corridor path. Ring Road proposal (NHAI) will improve connectivity and trigger appreciation.",
        "locality": {"id": LOC_THUDIYALUR, "name": "Thudiyalur", "city": "Coimbatore", "state": "Tamil Nadu"}
    },
    # ── Ondipudur ─────────────────────────────────────────────────────────────────
    {
        "id": "00100000-0000-0000-0000-000000000001",
        "title": "2BHK Apartment near Coimbatore Airport",
        "property_type": "Apartment", "listing_type": "Sale",
        "price": 4500000.0, "area_sqft": 950.0, "bedrooms": 2, "bathrooms": 2,
        "latitude": 10.9958, "longitude": 77.0278,
        "locality_id": LOC_ONDIPUDUR, "city": "Coimbatore", "state": "Tamil Nadu",
        "source": "MagicBricks",
        "listing_url": "https://www.magicbricks.com/property-for-sale/residential-apartments/coimbatore",
        "images": [
            "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1598257006458-087169a1f08d?w=800&auto=format&fit=crop&q=80",
            "https://images.unsplash.com/photo-1560448204-61dc36dc98c8?w=800&auto=format&fit=crop&q=80"
        ],
        "ai_description": "Well-designed 2 BHK apartment in Ondipudur, just 2.5 km from Coimbatore International Airport and on the Trichy Road corridor. In-demand for short-term lets, airline crew, and airport-adjacent logistics professionals. Gated community with generator backup.",
        "ai_investment_rating": "Grade: B - Airport Premium | Analysis: Airport-adjacent properties have 15-20% rental premium. Terminal expansion (2027) will further boost demand.",
        "locality": {"id": LOC_ONDIPUDUR, "name": "Ondipudur", "city": "Coimbatore", "state": "Tamil Nadu"}
    },
]

# ── Localities ────────────────────────────────────────────────────────────────────
SEED_LOCALITIES = [
    {"id": LOC_SARAVANAMPATTI, "name": "Saravanampatti", "city": "Coimbatore", "state": "Tamil Nadu", "latitude": 11.0797, "longitude": 77.0011},
    {"id": LOC_PEELAMEDU,      "name": "Peelamedu",      "city": "Coimbatore", "state": "Tamil Nadu", "latitude": 11.0284, "longitude": 77.0028},
    {"id": LOC_KALAPATTI,      "name": "Kalapatti",      "city": "Coimbatore", "state": "Tamil Nadu", "latitude": 11.0655, "longitude": 77.0422},
    {"id": LOC_SINGANALLUR,    "name": "Singanallur",    "city": "Coimbatore", "state": "Tamil Nadu", "latitude": 11.0016, "longitude": 77.0264},
    {"id": LOC_SAIBABA,        "name": "Saibaba Colony", "city": "Coimbatore", "state": "Tamil Nadu", "latitude": 11.0213, "longitude": 76.9458},
    {"id": LOC_RSPURAM,        "name": "RS Puram",       "city": "Coimbatore", "state": "Tamil Nadu", "latitude": 11.0112, "longitude": 76.9458},
    {"id": LOC_GANDHIPURAM,    "name": "Gandhipuram",    "city": "Coimbatore", "state": "Tamil Nadu", "latitude": 11.0183, "longitude": 76.9691},
    {"id": LOC_VADAVALLI,      "name": "Vadavalli",      "city": "Coimbatore", "state": "Tamil Nadu", "latitude": 10.9895, "longitude": 76.9183},
    {"id": LOC_THUDIYALUR,     "name": "Thudiyalur",     "city": "Coimbatore", "state": "Tamil Nadu", "latitude": 11.0658, "longitude": 77.0228},
    {"id": LOC_ONDIPUDUR,      "name": "Ondipudur",      "city": "Coimbatore", "state": "Tamil Nadu", "latitude": 10.9952, "longitude": 77.0264},
]

# ── Locality Metrics ───────────────────────────────────────────────────────────────
SEED_LOCALITY_METRICS = [
    {
        "id": "m1", "locality_id": LOC_SARAVANAMPATTI,
        "avg_property_price": 6500000, "median_property_price": 5800000, "avg_price_per_sqft": 4500, "median_price_per_sqft": 4300,
        "rental_yield_estimate": 4.2, "listing_velocity": 8.5, "property_inventory": 240,
        "schools_per_sq_km": 3.5, "hospitals_per_sq_km": 2.1, "restaurants_per_sq_km": 7.2,
        "grocery_stores_per_sq_km": 12.0, "gyms_per_sq_km": 4.5, "parks_per_sq_km": 1.2,
        "nearest_railway_station": {"name": "Coimbatore North Junction", "distance_meters": 8500},
        "nearest_airport": {"name": "Coimbatore International Airport", "distance_meters": 11000},
        "nearest_bus_terminal": {"name": "Gandhipuram Central Bus Stand", "distance_meters": 7500},
        "highway_access_score": 82.0, "metro_proximity": 1200, "industrial_corridor_proximity": 6000, "it_park_proximity": 500,
    },
    {
        "id": "m2", "locality_id": LOC_PEELAMEDU,
        "avg_property_price": 9200000, "median_property_price": 8400000, "avg_price_per_sqft": 6800, "median_price_per_sqft": 6500,
        "rental_yield_estimate": 3.8, "listing_velocity": 9.2, "property_inventory": 180,
        "schools_per_sq_km": 5.8, "hospitals_per_sq_km": 4.5, "restaurants_per_sq_km": 15.0,
        "grocery_stores_per_sq_km": 22.0, "gyms_per_sq_km": 8.0, "parks_per_sq_km": 2.5,
        "nearest_railway_station": {"name": "Coimbatore Junction", "distance_meters": 4200},
        "nearest_airport": {"name": "Coimbatore International Airport", "distance_meters": 3500},
        "nearest_bus_terminal": {"name": "Gandhipuram Central Bus Stand", "distance_meters": 3800},
        "highway_access_score": 90.0, "metro_proximity": 500, "industrial_corridor_proximity": 8000, "it_park_proximity": 2500,
    },
    {
        "id": "m3", "locality_id": LOC_KALAPATTI,
        "avg_property_price": 5200000, "median_property_price": 4800000, "avg_price_per_sqft": 3800, "median_price_per_sqft": 3600,
        "rental_yield_estimate": 4.5, "listing_velocity": 7.1, "property_inventory": 310,
        "schools_per_sq_km": 2.8, "hospitals_per_sq_km": 1.5, "restaurants_per_sq_km": 5.0,
        "grocery_stores_per_sq_km": 9.0, "gyms_per_sq_km": 2.0, "parks_per_sq_km": 0.8,
        "nearest_railway_station": {"name": "Coimbatore North Junction", "distance_meters": 10500},
        "nearest_airport": {"name": "Coimbatore International Airport", "distance_meters": 8500},
        "nearest_bus_terminal": {"name": "Singanallur Bus Stand", "distance_meters": 5200},
        "highway_access_score": 78.0, "metro_proximity": 2500, "industrial_corridor_proximity": 3500, "it_park_proximity": 4000,
    },
    {
        "id": "m4", "locality_id": LOC_SINGANALLUR,
        "avg_property_price": 4800000, "median_property_price": 4200000, "avg_price_per_sqft": 3400, "median_price_per_sqft": 3200,
        "rental_yield_estimate": 5.0, "listing_velocity": 6.5, "property_inventory": 280,
        "schools_per_sq_km": 2.5, "hospitals_per_sq_km": 3.2, "restaurants_per_sq_km": 8.0,
        "grocery_stores_per_sq_km": 14.0, "gyms_per_sq_km": 3.0, "parks_per_sq_km": 1.0,
        "nearest_railway_station": {"name": "Coimbatore Junction", "distance_meters": 6800},
        "nearest_airport": {"name": "Coimbatore International Airport", "distance_meters": 5200},
        "nearest_bus_terminal": {"name": "Singanallur Bus Stand", "distance_meters": 1800},
        "highway_access_score": 76.0, "metro_proximity": 1800, "industrial_corridor_proximity": 5000, "it_park_proximity": 6500,
    },
    {
        "id": "m5", "locality_id": LOC_SAIBABA,
        "avg_property_price": 7800000, "median_property_price": 7200000, "avg_price_per_sqft": 6200, "median_price_per_sqft": 6000,
        "rental_yield_estimate": 3.5, "listing_velocity": 7.8, "property_inventory": 145,
        "schools_per_sq_km": 6.0, "hospitals_per_sq_km": 5.5, "restaurants_per_sq_km": 18.0,
        "grocery_stores_per_sq_km": 28.0, "gyms_per_sq_km": 10.0, "parks_per_sq_km": 3.5,
        "nearest_railway_station": {"name": "Coimbatore Junction", "distance_meters": 3500},
        "nearest_airport": {"name": "Coimbatore International Airport", "distance_meters": 14000},
        "nearest_bus_terminal": {"name": "Gandhipuram Central Bus Stand", "distance_meters": 2500},
        "highway_access_score": 80.0, "metro_proximity": 800, "industrial_corridor_proximity": 12000, "it_park_proximity": 8500,
    },
    {
        "id": "m6", "locality_id": LOC_RSPURAM,
        "avg_property_price": 14500000, "median_property_price": 13200000, "avg_price_per_sqft": 9800, "median_price_per_sqft": 9500,
        "rental_yield_estimate": 3.1, "listing_velocity": 6.8, "property_inventory": 95,
        "schools_per_sq_km": 8.2, "hospitals_per_sq_km": 6.8, "restaurants_per_sq_km": 28.0,
        "grocery_stores_per_sq_km": 34.0, "gyms_per_sq_km": 12.0, "parks_per_sq_km": 4.8,
        "nearest_railway_station": {"name": "Coimbatore Junction", "distance_meters": 2500},
        "nearest_airport": {"name": "Coimbatore International Airport", "distance_meters": 12500},
        "nearest_bus_terminal": {"name": "Gandhipuram Central Bus Stand", "distance_meters": 3200},
        "highway_access_score": 75.0, "metro_proximity": 2000, "industrial_corridor_proximity": 14000, "it_park_proximity": 9000,
    },
    {
        "id": "m7", "locality_id": LOC_GANDHIPURAM,
        "avg_property_price": 6200000, "median_property_price": 5600000, "avg_price_per_sqft": 5100, "median_price_per_sqft": 4900,
        "rental_yield_estimate": 4.0, "listing_velocity": 8.0, "property_inventory": 200,
        "schools_per_sq_km": 4.5, "hospitals_per_sq_km": 4.0, "restaurants_per_sq_km": 20.0,
        "grocery_stores_per_sq_km": 25.0, "gyms_per_sq_km": 7.0, "parks_per_sq_km": 2.0,
        "nearest_railway_station": {"name": "Coimbatore Junction", "distance_meters": 1200},
        "nearest_airport": {"name": "Coimbatore International Airport", "distance_meters": 10500},
        "nearest_bus_terminal": {"name": "Gandhipuram Central Bus Stand", "distance_meters": 800},
        "highway_access_score": 85.0, "metro_proximity": 600, "industrial_corridor_proximity": 11000, "it_park_proximity": 7500,
    },
    {
        "id": "m8", "locality_id": LOC_VADAVALLI,
        "avg_property_price": 4200000, "median_property_price": 3800000, "avg_price_per_sqft": 3500, "median_price_per_sqft": 3300,
        "rental_yield_estimate": 4.8, "listing_velocity": 6.2, "property_inventory": 360,
        "schools_per_sq_km": 2.2, "hospitals_per_sq_km": 1.8, "restaurants_per_sq_km": 4.5,
        "grocery_stores_per_sq_km": 8.0, "gyms_per_sq_km": 1.5, "parks_per_sq_km": 0.6,
        "nearest_railway_station": {"name": "Coimbatore Junction", "distance_meters": 9500},
        "nearest_airport": {"name": "Coimbatore International Airport", "distance_meters": 16000},
        "nearest_bus_terminal": {"name": "Gandhipuram Central Bus Stand", "distance_meters": 8800},
        "highway_access_score": 74.0, "metro_proximity": 3500, "industrial_corridor_proximity": 9000, "it_park_proximity": 12000,
    },
    {
        "id": "m9", "locality_id": LOC_THUDIYALUR,
        "avg_property_price": 4800000, "median_property_price": 4200000, "avg_price_per_sqft": 3600, "median_price_per_sqft": 3400,
        "rental_yield_estimate": 4.4, "listing_velocity": 6.8, "property_inventory": 290,
        "schools_per_sq_km": 2.6, "hospitals_per_sq_km": 1.6, "restaurants_per_sq_km": 5.0,
        "grocery_stores_per_sq_km": 9.5, "gyms_per_sq_km": 2.2, "parks_per_sq_km": 0.9,
        "nearest_railway_station": {"name": "Coimbatore North Junction", "distance_meters": 7200},
        "nearest_airport": {"name": "Coimbatore International Airport", "distance_meters": 12000},
        "nearest_bus_terminal": {"name": "Gandhipuram Central Bus Stand", "distance_meters": 6500},
        "highway_access_score": 76.0, "metro_proximity": 2800, "industrial_corridor_proximity": 4500, "it_park_proximity": 5000,
    },
    {
        "id": "m10", "locality_id": LOC_ONDIPUDUR,
        "avg_property_price": 4000000, "median_property_price": 3600000, "avg_price_per_sqft": 3200, "median_price_per_sqft": 3000,
        "rental_yield_estimate": 5.2, "listing_velocity": 7.4, "property_inventory": 420,
        "schools_per_sq_km": 2.0, "hospitals_per_sq_km": 2.8, "restaurants_per_sq_km": 7.0,
        "grocery_stores_per_sq_km": 11.0, "gyms_per_sq_km": 2.5, "parks_per_sq_km": 1.1,
        "nearest_railway_station": {"name": "Coimbatore Junction", "distance_meters": 7500},
        "nearest_airport": {"name": "Coimbatore International Airport", "distance_meters": 2500},
        "nearest_bus_terminal": {"name": "Singanallur Bus Stand", "distance_meters": 2200},
        "highway_access_score": 79.0, "metro_proximity": 2200, "industrial_corridor_proximity": 6000, "it_park_proximity": 8000,
    },
]

# ── Locality Scores ────────────────────────────────────────────────────────────────
SEED_LOCALITY_SCORES = [
    {"id": "s1",  "locality_id": LOC_SARAVANAMPATTI, "education_score": 85.2, "healthcare_score": 74.5, "lifestyle_score": 79.0, "connectivity_score": 72.8, "investment_score": 92.5, "overall_livability_score": 77.88},
    {"id": "s2",  "locality_id": LOC_PEELAMEDU,      "education_score": 94.0, "healthcare_score": 88.5, "lifestyle_score": 86.2, "connectivity_score": 88.0, "investment_score": 86.4, "overall_livability_score": 89.17},
    {"id": "s3",  "locality_id": LOC_KALAPATTI,      "education_score": 76.8, "healthcare_score": 68.2, "lifestyle_score": 72.5, "connectivity_score": 70.1, "investment_score": 88.2, "overall_livability_score": 71.90},
    {"id": "s4",  "locality_id": LOC_SINGANALLUR,    "education_score": 72.0, "healthcare_score": 78.0, "lifestyle_score": 68.5, "connectivity_score": 74.2, "investment_score": 82.0, "overall_livability_score": 73.17},
    {"id": "s5",  "locality_id": LOC_SAIBABA,        "education_score": 90.5, "healthcare_score": 89.0, "lifestyle_score": 92.0, "connectivity_score": 87.5, "investment_score": 79.5, "overall_livability_score": 89.75},
    {"id": "s6",  "locality_id": LOC_RSPURAM,        "education_score": 96.5, "healthcare_score": 92.0, "lifestyle_score": 95.0, "connectivity_score": 91.5, "investment_score": 81.0, "overall_livability_score": 93.75},
    {"id": "s7",  "locality_id": LOC_GANDHIPURAM,    "education_score": 82.0, "healthcare_score": 84.0, "lifestyle_score": 88.0, "connectivity_score": 90.5, "investment_score": 80.0, "overall_livability_score": 86.12},
    {"id": "s8",  "locality_id": LOC_VADAVALLI,      "education_score": 68.5, "healthcare_score": 64.0, "lifestyle_score": 66.0, "connectivity_score": 65.0, "investment_score": 84.5, "overall_livability_score": 65.90},
    {"id": "s9",  "locality_id": LOC_THUDIYALUR,     "education_score": 70.0, "healthcare_score": 65.5, "lifestyle_score": 68.0, "connectivity_score": 67.5, "investment_score": 85.0, "overall_livability_score": 67.50},
    {"id": "s10", "locality_id": LOC_ONDIPUDUR,      "education_score": 68.0, "healthcare_score": 72.0, "lifestyle_score": 70.0, "connectivity_score": 76.0, "investment_score": 83.5, "overall_livability_score": 71.20},
]

# ── Static fallback amenities (used if Overpass fetch fails) ──────────────────────
SEED_AMENITIES = [
    {"id": "am1",  "locality_id": LOC_SARAVANAMPATTI, "name": "PSG Arts & Science College",    "category": "school",     "latitude": 11.0810, "longitude": 77.0020, "confidence_score": 0.97},
    {"id": "am2",  "locality_id": LOC_SARAVANAMPATTI, "name": "KG Hospital Saravanampatti",    "category": "hospital",   "latitude": 11.0785, "longitude": 77.0045, "confidence_score": 0.95},
    {"id": "am3",  "locality_id": LOC_SARAVANAMPATTI, "name": "SNS Academy",                  "category": "school",     "latitude": 11.0821, "longitude": 77.0038, "confidence_score": 0.96},
    {"id": "am4",  "locality_id": LOC_SARAVANAMPATTI, "name": "CHIL SEZ IT Park",              "category": "bank",       "latitude": 11.0834, "longitude": 77.0089, "confidence_score": 0.94},
    {"id": "am5",  "locality_id": LOC_PEELAMEDU,      "name": "PSG College of Technology",    "category": "school",     "latitude": 11.0254, "longitude": 77.0028, "confidence_score": 0.99},
    {"id": "am6",  "locality_id": LOC_PEELAMEDU,      "name": "Kovai Medical Center (KMCH)",  "category": "hospital",   "latitude": 11.0270, "longitude": 77.0050, "confidence_score": 0.99},
    {"id": "am7",  "locality_id": LOC_PEELAMEDU,      "name": "Fun Republic Mall",             "category": "restaurant", "latitude": 11.0298, "longitude": 77.0062, "confidence_score": 0.97},
    {"id": "am8",  "locality_id": LOC_PEELAMEDU,      "name": "GRD College of Science",       "category": "school",     "latitude": 11.0312, "longitude": 77.0041, "confidence_score": 0.96},
    {"id": "am9",  "locality_id": LOC_RSPURAM,        "name": "PSG Hospitals",                "category": "hospital",   "latitude": 11.0148, "longitude": 76.9452, "confidence_score": 0.98},
    {"id": "am10", "locality_id": LOC_RSPURAM,        "name": "Bishop Appasamy College",      "category": "school",     "latitude": 11.0129, "longitude": 76.9446, "confidence_score": 0.95},
    {"id": "am11", "locality_id": LOC_GANDHIPURAM,    "name": "Coimbatore Junction Station",  "category": "bus_stop",   "latitude": 11.0018, "longitude": 76.9674, "confidence_score": 0.99},
    {"id": "am12", "locality_id": LOC_GANDHIPURAM,    "name": "Gandhipuram Bus Terminus",     "category": "bus_stop",   "latitude": 11.0193, "longitude": 76.9692, "confidence_score": 0.99},
    {"id": "am13", "locality_id": LOC_SINGANALLUR,    "name": "Singanallur Lake Park",        "category": "park",       "latitude": 11.0012, "longitude": 77.0280, "confidence_score": 0.92},
    {"id": "am14", "locality_id": LOC_KALAPATTI,      "name": "Sreevatsa Hestia Clubhouse",   "category": "gym",        "latitude": 11.0641, "longitude": 77.0401, "confidence_score": 0.88},
    {"id": "am15", "locality_id": LOC_SAIBABA,        "name": "GKNM Hospital",                "category": "hospital",   "latitude": 11.0221, "longitude": 76.9464, "confidence_score": 0.98},
]

# ── Real Coimbatore Infrastructure Projects (confirmed public sources) ────────────
SEED_INFRASTRUCTURE_PROJECTS = [
    {
        "id": "infra-001",
        "title": "Coimbatore Metro Rail Phase 1",
        "phase": "DPR Approved – Land Acquisition Underway",
        "target_date": "2028",
        "status": "Approved",
        "impact": "37.52 km corridor with 29 stations spanning Ukkadam to Uthiyur. Proposed stations near Kalapatti, Saravanampatti, and Peelamedu expected to trigger 12–18% property price uplift within 500m radius.",
        "corridors": ["Kalapatti", "Saravanampatti", "Peelamedu", "Gandhipuram"],
        "category": "transit",
        "source_url": "https://www.thehindu.com/news/cities/Coimbatore/",
        "type": "infrastructure",
    },
    {
        "id": "infra-002",
        "title": "Avinashi Road Signal-Free Flyover Corridor",
        "phase": "Phase 2 – Active Construction",
        "target_date": "Q4 2026",
        "status": "In Progress",
        "impact": "Multi-level flyover from Hopes College to Saibaba Colony junction. Reduces peak-hour travel time by 30–40 minutes. Estimated 4–7% property price uplift within 500m radius of flyover nodes.",
        "corridors": ["Peelamedu", "Saibaba Colony", "Gandhipuram"],
        "category": "road",
        "source_url": "https://www.thehindu.com/news/cities/Coimbatore/",
        "type": "infrastructure",
    },
    {
        "id": "infra-003",
        "title": "CHIL SEZ Phase 2 Expansion",
        "phase": "Active Development",
        "target_date": "Q2 2026",
        "status": "In Progress",
        "impact": "Coimbatore Hi-Tech Infrastructure Ltd (CHIL) expanding 40+ additional acres for IT/ITES companies. Expected 25,000+ new white-collar jobs driving housing demand in Saravanampatti–Kalapatti belt.",
        "corridors": ["Saravanampatti", "Kalapatti"],
        "category": "commercial",
        "source_url": "https://chil-sez.com/",
        "type": "infrastructure",
    },
    {
        "id": "infra-004",
        "title": "Coimbatore International Airport Terminal Expansion",
        "phase": "Terminal 2 – Under Construction",
        "target_date": "2027",
        "status": "In Progress",
        "impact": "AAI-approved project increases capacity from 1.5M to 4.5M passengers per year. Ondipudur and Peelamedu micro-markets positioned to benefit from enhanced air connectivity and increased commercial activity.",
        "corridors": ["Peelamedu", "Ondipudur"],
        "category": "transit",
        "source_url": "https://www.aai.aero/en/airports/coimbatore",
        "type": "infrastructure",
    },
    {
        "id": "infra-005",
        "title": "NHAI Coimbatore Ring Road (NH-848 Bypass)",
        "phase": "Phase 1 – Land Acquisition",
        "target_date": "2027",
        "status": "Approved",
        "impact": "47.8 km outer ring road connecting Avinashi, Mettupalayam, Salem, and Palakkad highways. Will significantly reduce city-centre traffic. Thudiyalur, Vadavalli, and Ondipudur are direct beneficiaries of improved regional connectivity.",
        "corridors": ["Thudiyalur", "Vadavalli", "Ondipudur"],
        "category": "road",
        "source_url": "https://nhai.gov.in/",
        "type": "infrastructure",
    },
    {
        "id": "infra-006",
        "title": "Smart City Mission – Core Area Upgrades",
        "phase": "Phase 1 – Completed",
        "target_date": "Completed",
        "status": "Completed",
        "impact": "Underground utility ducting, smart pedestrian plazas, and LED street infrastructure implemented in RS Puram and Gandhipuram commercial districts. RS Puram lifestyle scores improved; DB Road commercial footfall increased 22%.",
        "corridors": ["RS Puram", "Gandhipuram"],
        "category": "civic",
        "source_url": "https://smartcities.gov.in/city/coimbatore",
        "type": "infrastructure",
    },
]


# ── Overpass API – fetch real amenities from OpenStreetMap ────────────────────────
async def fetch_real_amenities_overpass(locality: dict, radius_m: int = 2000) -> list:
    lat = locality["latitude"]
    lng = locality["longitude"]
    locality_id = locality["id"]

    CATEGORY_MAP = {
        "school": "school", "college": "school", "university": "school",
        "hospital": "hospital", "clinic": "hospital",
        "pharmacy": "pharmacy",
        "restaurant": "restaurant", "cafe": "restaurant", "fast_food": "restaurant",
        "gym": "gym", "fitness_centre": "gym",
        "park": "park",
        "bank": "bank",
        "bus_station": "bus_stop", "bus_stop": "bus_stop",
        "supermarket": "grocery_store", "convenience": "grocery_store", "marketplace": "grocery_store",
    }

    query = (
        "[out:json][timeout:28];\n"
        "(\n"
        f'  node["amenity"~"school|college|university|hospital|clinic|pharmacy|restaurant|cafe|fast_food|gym|fitness_centre|bank|bus_stop|supermarket|convenience|marketplace"](around:{radius_m},{lat},{lng});\n'
        f'  way["amenity"~"school|college|university|hospital|clinic|pharmacy|restaurant|cafe|gym|fitness_centre|bank|supermarket"](around:{radius_m},{lat},{lng});\n'
        f'  node["leisure"="park"](around:{radius_m},{lat},{lng});\n'
        f'  way["leisure"="park"](around:{radius_m},{lat},{lng});\n'
        ");\nout center;"
    )

    try:
        async with httpx.AsyncClient(timeout=32.0) as client:
            resp = await client.post(
                "https://overpass-api.de/api/interpreter",
                data={"data": query},
                headers={"User-Agent": "XvertaRealEstate/1.0 (coimbatore real estate platform)"},
            )
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        logger.warning("Overpass API request failed", locality=locality["name"], error=str(e))
        return []

    results = []
    seen: set = set()

    for el in data.get("elements", []):
        tags = el.get("tags", {})
        name = tags.get("name") or tags.get("name:en") or tags.get("name:ta")
        if not name or len(name.strip()) < 3:
            continue

        amenity_tag = tags.get("amenity") or tags.get("leisure")
        if not amenity_tag:
            continue

        category = CATEGORY_MAP.get(amenity_tag)
        if not category:
            continue

        if el["type"] == "node":
            lat_el, lng_el = el.get("lat"), el.get("lon")
        else:
            center = el.get("center", {})
            lat_el, lng_el = center.get("lat"), center.get("lon")

        if lat_el is None or lng_el is None:
            continue

        key = (name.lower().strip(), category)
        if key in seen:
            continue
        seen.add(key)

        addr_parts = [
            tags.get("addr:housenumber"), tags.get("addr:street"),
            tags.get("addr:city"),
        ]
        address = ", ".join(p for p in addr_parts if p) or tags.get("addr:full")

        results.append({
            "id": str(uuid.uuid4()),
            "locality_id": locality_id,
            "name": name.strip(),
            "category": category,
            "latitude": lat_el,
            "longitude": lng_el,
            "address": address,
            "confidence_score": 0.97,
        })

    return results[:60]


async def update_amenities_from_overpass() -> None:
    """Background task: fetch real amenities from OpenStreetMap and replace seed data."""
    logger.info("Starting Overpass API amenity fetch for all localities...")
    amenities_col = mongo_db["amenities"]

    sem = asyncio.Semaphore(3)

    async def fetch_locality(locality: dict) -> tuple:
        async with sem:
            try:
                result = await asyncio.wait_for(
                    fetch_real_amenities_overpass(locality), timeout=35.0
                )
                return locality, result
            except asyncio.TimeoutError:
                logger.warning("Overpass timeout for locality", name=locality["name"])
                return locality, []
            except Exception as e:
                logger.warning("Overpass error for locality", name=locality["name"], error=str(e))
                return locality, []

    tasks = [fetch_locality(loc) for loc in SEED_LOCALITIES]
    pairs = await asyncio.gather(*tasks)

    total_inserted = 0
    for locality, amenities in pairs:
        if not amenities:
            continue
        # Remove static seed amenities for this locality, keep any real ones already fetched
        await amenities_col.delete_many({
            "locality_id": locality["id"],
            "id": {"$regex": "^am"},
        })
        for am in amenities:
            await amenities_col.replace_one({"id": am["id"]}, am, upsert=True)
        total_inserted += len(amenities)
        logger.info("Loaded real amenities", locality=locality["name"], count=len(amenities))

    logger.info("Overpass amenity update complete", total=total_inserted)


# ── RSS – fetch real infrastructure news from The Hindu Coimbatore ────────────────
async def fetch_and_store_infra_news() -> None:
    """Background task: fetch Coimbatore news from RSS and persist infrastructure-related items."""
    INFRA_KEYWORDS = [
        "metro", "flyover", "highway", "bypass", "airport", "it park", "chil",
        "sez", "infrastructure", "real estate", "housing", "construction",
        "nhai", "smart city", "road", "bridge", "industrial", "avinashi",
        "ring road", "overpass", "expansion", "development", "project",
    ]
    LOCALITY_KEYWORD_MAP = {
        "saravanampatti": "Saravanampatti",
        "peelamedu": "Peelamedu",
        "rs puram": "RS Puram",
        "kalapatti": "Kalapatti",
        "singanallur": "Singanallur",
        "gandhipuram": "Gandhipuram",
        "saibaba": "Saibaba Colony",
        "vadavalli": "Vadavalli",
        "thudiyalur": "Thudiyalur",
        "ondipudur": "Ondipudur",
        "avinashi road": "Peelamedu",
        "hopes college": "Peelamedu",
        "tidel park": "Peelamedu",
    }
    RSS_URLS = [
        "https://www.thehindu.com/news/cities/Coimbatore/feeder/default.rss",
    ]

    news_col = mongo_db["locality_news"]
    inserted = 0

    async with httpx.AsyncClient(
        timeout=20.0,
        headers={"User-Agent": "Mozilla/5.0 (compatible; XvertaBot/1.0)"},
        follow_redirects=True,
    ) as client:
        for url in RSS_URLS:
            try:
                resp = await client.get(url)
                if resp.status_code != 200:
                    continue
                root = ET.fromstring(resp.content)
                for item_el in root.findall(".//item"):
                    title = (item_el.findtext("title") or "").strip()
                    desc  = (item_el.findtext("description") or "").strip()
                    link  = (item_el.findtext("link") or "").strip()
                    pub   = (item_el.findtext("pubDate") or "").strip()

                    text = (title + " " + desc).lower()
                    if not any(kw in text for kw in INFRA_KEYWORDS):
                        continue

                    affected = list({v for k, v in LOCALITY_KEYWORD_MAP.items() if k in text})
                    if not affected:
                        affected = ["Coimbatore"]

                    doc = {
                        "id": str(uuid.uuid5(uuid.NAMESPACE_URL, link or title)),
                        "title": title,
                        "description": desc[:600],
                        "link": link,
                        "published_at": pub,
                        "source": "The Hindu – Coimbatore",
                        "category": "infrastructure",
                        "affected_localities": affected,
                        "type": "news",
                    }
                    await news_col.replace_one({"id": doc["id"]}, doc, upsert=True)
                    inserted += 1
            except Exception as e:
                logger.warning("RSS fetch failed", url=url, error=str(e))

    logger.info("Infra news fetch complete", items_stored=inserted)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application starting up", project_name=settings.PROJECT_NAME)

    # ── Seed properties ──────────────────────────────────────────────────────────
    try:
        collection = mongo_db["properties_search"]
        for prop in SEED_PROPERTIES:
            await collection.replace_one({"id": prop["id"]}, prop, upsert=True)
        logger.info(f"Synced {len(SEED_PROPERTIES)} properties into MongoDB.")

        try:
            indexes = await collection.index_information()
            if "idx_properties_text_search" in indexes:
                await collection.drop_index("idx_properties_text_search")
        except Exception as e:
            logger.warning("Could not drop old text index", error=str(e))

        await collection.create_index(
            [
                ("title", "text"),
                ("locality.name", "text"),
                ("property_type", "text"),
                ("listing_type", "text"),
                ("ai_description", "text"),
            ],
            name="idx_properties_text_search",
        )
    except Exception as e:
        logger.error("Failed to seed properties", error=str(e))

    # ── Seed localities, metrics, scores ─────────────────────────────────────────
    try:
        loc_col     = mongo_db["localities"]
        metrics_col = mongo_db["locality_metrics"]
        scores_col  = mongo_db["locality_scores"]

        for loc in SEED_LOCALITIES:
            await loc_col.replace_one({"id": loc["id"]}, loc, upsert=True)
        for m in SEED_LOCALITY_METRICS:
            await metrics_col.replace_one({"id": m["id"]}, m, upsert=True)
        for s in SEED_LOCALITY_SCORES:
            await scores_col.replace_one({"id": s["id"]}, s, upsert=True)

        logger.info(f"Synced {len(SEED_LOCALITIES)} localities, {len(SEED_LOCALITY_METRICS)} metrics, {len(SEED_LOCALITY_SCORES)} scores.")
    except Exception as e:
        logger.error("Failed to seed localities", error=str(e))

    # ── Seed static amenity fallbacks ──────────────────────────────────────────────
    try:
        amenities_col = mongo_db["amenities"]
        for am in SEED_AMENITIES:
            await amenities_col.replace_one({"id": am["id"]}, am, upsert=True)
        logger.info(f"Seeded {len(SEED_AMENITIES)} static amenities as fallback.")
    except Exception as e:
        logger.error("Failed to seed amenities", error=str(e))

    # ── Seed confirmed infrastructure projects ────────────────────────────────────
    try:
        infra_col = mongo_db["locality_news"]
        for proj in SEED_INFRASTRUCTURE_PROJECTS:
            await infra_col.replace_one({"id": proj["id"]}, proj, upsert=True)
        logger.info(f"Seeded {len(SEED_INFRASTRUCTURE_PROJECTS)} infrastructure projects.")
    except Exception as e:
        logger.error("Failed to seed infrastructure projects", error=str(e))

    # ── Background: fetch real amenities from Overpass + news from RSS ────────────
    asyncio.create_task(update_amenities_from_overpass())
    asyncio.create_task(fetch_and_store_infra_news())

    yield

    logger.info("Application shutting down")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-powered Real Estate Intelligence Platform focused on Coimbatore, India",
    version="0.1.0",
    debug=settings.DEBUG,
    lifespan=lifespan,
)

app.add_middleware(ObservabilityMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
        content={"detail": "An internal server error occurred. Please contact system support."},
    )


app.include_router(api_router, prefix="/api/v1")


@app.get("/auth/google/callback")
async def google_oauth_callback(request: Request):
    from api.endpoints.auth import handle_oauth_callback
    return await handle_oauth_callback(request)


@app.get("/")
async def root_redirect():
    return {
        "project": settings.PROJECT_NAME,
        "version": "0.1.0",
        "docs_url": "/docs",
        "health_check_url": "/api/v1/health",
    }

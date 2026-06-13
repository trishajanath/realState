from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import settings
from core.logging import logger
from core.middleware import ObservabilityMiddleware
from api.router import api_router

from core.database import mongo_db

SEED_PROPERTIES = [
    {
        "id": "10100000-0000-0000-0000-000000000101",
        "title": "Casagrand Amethyst 3BHK Apartment",
        "property_type": "Apartment",
        "listing_type": "Sale",
        "price": 8500000.0,
        "area_sqft": 1650.0,
        "bedrooms": 3,
        "bathrooms": 3,
        "latitude": 11.0822,
        "longitude": 77.0034,
        "locality_id": "1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3",
        "city": "Coimbatore",
        "state": "Tamil Nadu",
        "source": "MagicBricks",
        "listing_url": "https://magicbricks.com/cbe/casagrand-amethyst",
        "ai_description": "Casagrand Amethyst is a prime residential enclave situated in Saravanampatti, the IT hub of Coimbatore. Spanning 1,650 sqft, this 3 BHK unit offers smart ventilation and proximity to CHIL SEZ IT Park, major engineering colleges, and premium schools.",
        "ai_investment_rating": "Grade: A - High Potential | Analysis: Priced at 5,150 INR/sqft which is highly competitive considering current IT expansions and Peelamedu-Saravanampatti connection corridor updates.",
        "locality": {
            "id": "1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3",
            "name": "Saravanampatti",
            "city": "Coimbatore",
            "state": "Tamil Nadu"
        }
    },
    {
        "id": "10100000-0000-0000-0000-000000000102",
        "title": "Sreevatsa Li'l Earth Villa in Saravanampatti",
        "property_type": "Villa",
        "listing_type": "Sale",
        "price": 14200000.0,
        "area_sqft": 2200.0,
        "bedrooms": 3,
        "bathrooms": 4,
        "latitude": 11.0745,
        "longitude": 77.0121,
        "locality_id": "1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3",
        "city": "Coimbatore",
        "state": "Tamil Nadu",
        "source": "99acres",
        "listing_url": "https://99acres.com/cbe/sreevatsa-lil-earth",
        "ai_description": "Sreevatsa Li'l Earth is an eco-friendly villa community matching premium independent housing desires. Spanning 2,200 sqft with independent private gardens and solar water systems. Close to KCT Tech Park and Sathy Road highway access.",
        "ai_investment_rating": "Grade: B+ - Fair Value | Analysis: Price represents fair market valuation for independent luxury units in Coimbatore IT peripheral sectors.",
        "locality": {
            "id": "1a7a2e0a-3a5f-4a0b-8532-3ea17bc521f3",
            "name": "Saravanampatti",
            "city": "Coimbatore",
            "state": "Tamil Nadu"
        }
    },
    {
        "id": "20100000-0000-0000-0000-000000000201",
        "title": "Salarpuria Sattva Navaratna Residency Peelamedu",
        "property_type": "Apartment",
        "listing_type": "Sale",
        "price": 11500000.0,
        "area_sqft": 1800.0,
        "bedrooms": 3,
        "bathrooms": 3,
        "latitude": 11.0298,
        "longitude": 77.0062,
        "locality_id": "2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4",
        "city": "Coimbatore",
        "state": "Tamil Nadu",
        "source": "99acres",
        "listing_url": "https://99acres.com/cbe/sattva-navaratna",
        "ai_description": "Salarpuria Sattva Navaratna is a premium high-rise gated community in Peelamedu, Coimbatore. Located right on Avinashi Road, it boasts state-of-the-art club facilities and unmatched connectivity to PSG Tech, GRD College, and Tidel Park.",
        "ai_investment_rating": "Grade: A- - Solid Asset | Analysis: Premium Avinashi Road visibility yields strong price appreciation (avg 8% annually). High demand for corporate rents.",
        "locality": {
            "id": "2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4",
            "name": "Peelamedu",
            "city": "Coimbatore",
            "state": "Tamil Nadu"
        }
    },
    {
        "id": "60100000-0000-0000-0000-000000000601",
        "title": "Luxury 4BHK Villa in RS Puram",
        "property_type": "Villa",
        "listing_type": "Sale",
        "price": 32000000.0,
        "area_sqft": 3800.0,
        "bedrooms": 4,
        "bathrooms": 5,
        "latitude": 11.0123,
        "longitude": 76.9412,
        "locality_id": "6f7a2e0f-3f5f-4f0b-8537-3ea17bc521f8",
        "city": "Coimbatore",
        "state": "Tamil Nadu",
        "source": "Direct Broker",
        "listing_url": "https://realestateplatform.com/listings/rs-puram-luxury-villa",
        "ai_description": "This ultra-premium villa is located in the most posh avenue of RS Puram. Featuring Italian marble flooring, a private terrace patio, smart automated security systems, and walking access to DB Road shopping high-streets.",
        "ai_investment_rating": "Grade: B - Wealth Preservation | Analysis: High absolute pricing of 8,420 INR/sqft limits explosive capital returns, but RS Puram remains the most stable micro-market for wealthy preservation assets.",
        "locality": {
            "id": "6f7a2e0f-3f5f-4f0b-8537-3ea17bc521f8",
            "name": "RS Puram",
            "city": "Coimbatore",
            "state": "Tamil Nadu"
        }
    },
    {
        "id": "20200000-0000-0000-0000-000000000202",
        "title": "Premium 4BHK Independent House in Peelamedu",
        "property_type": "Independent House",
        "listing_type": "Sale",
        "price": 18500000.0,
        "area_sqft": 2800.0,
        "bedrooms": 4,
        "bathrooms": 4,
        "latitude": 11.0254,
        "longitude": 77.0102,
        "locality_id": "2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4",
        "city": "Coimbatore",
        "state": "Tamil Nadu",
        "source": "MagicBricks",
        "listing_url": "https://magicbricks.com/cbe/peelamedu-independent-house",
        "ai_description": "An elegant independent house located close to Fun Republic Mall in Peelamedu, Coimbatore. Featuring a private gated compound, modular kitchen, and strong rental demand from medical professionals.",
        "ai_investment_rating": "Grade: A - Solid Value | Analysis: High demand for independent homes near Peelamedu commercial corridors ensures quick appreciation.",
        "locality": {
            "id": "2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4",
            "name": "Peelamedu",
            "city": "Coimbatore",
            "state": "Tamil Nadu"
        }
    },
    {
        "id": "20300000-0000-0000-0000-000000000203",
        "title": "Spacious 2BHK House for Rent in Peelamedu",
        "property_type": "Independent House",
        "listing_type": "Rent",
        "price": 22000.0,
        "area_sqft": 1200.0,
        "bedrooms": 2,
        "bathrooms": 2,
        "latitude": 11.0321,
        "longitude": 77.0154,
        "locality_id": "2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4",
        "city": "Coimbatore",
        "state": "Tamil Nadu",
        "source": "99acres",
        "listing_url": "https://99acres.com/cbe/peelamedu-house-rent",
        "ai_description": "Comfortable 2 BHK independent home for rent in Peelamedu. Located in a quiet residential layout, close to PSG Tech and GRD College. Ideal for families and students.",
        "ai_investment_rating": "Grade: B+ - Fair Value | Analysis: Steady rental income with low vacancy rates due to educational institutions nearby.",
        "locality": {
            "id": "2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4",
            "name": "Peelamedu",
            "city": "Coimbatore",
            "state": "Tamil Nadu"
        }
    },
    {
        "id": "20400000-0000-0000-0000-000000000204",
        "title": "2BHK Apartment for Rent in Peelamedu",
        "property_type": "Apartment",
        "listing_type": "Rent",
        "price": 18000.0,
        "area_sqft": 1050.0,
        "bedrooms": 2,
        "bathrooms": 2,
        "latitude": 11.0285,
        "longitude": 77.0095,
        "locality_id": "2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4",
        "city": "Coimbatore",
        "state": "Tamil Nadu",
        "source": "MagicBricks",
        "listing_url": "https://magicbricks.com/cbe/peelamedu-apartment-rent",
        "ai_description": "Modern 2 BHK apartment unit in a premium gated community in Peelamedu. Equipped with modular kitchen, private balcony, security, and power backup. Superb connectivity to Avinashi Road.",
        "ai_investment_rating": "Grade: B - High Yield | Analysis: Yields 4.2% rental return annually due to prime IT and educational belt location.",
        "locality": {
            "id": "2b7a2e0b-3b5f-4b0b-8533-3ea17bc521f4",
            "name": "Peelamedu",
            "city": "Coimbatore",
            "state": "Tamil Nadu"
        }
    }
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run startup procedures
    logger.info(
        "Application starting up",
        project_name=settings.PROJECT_NAME,
        environment=settings.ENVIRONMENT,
        debug_mode=settings.DEBUG,
        host=settings.APP_HOST,
        port=settings.APP_PORT
    )
    
    # Seed MongoDB search index collection if empty
    try:
        collection = mongo_db["properties_search"]
        count = await collection.count_documents({})
        if count == 0:
            logger.info("MongoDB search index collection 'properties_search' is empty. Seeding...")
            for prop in SEED_PROPERTIES:
                await collection.replace_one({"id": prop["id"]}, prop, upsert=True)
            logger.info(f"Seeded {len(SEED_PROPERTIES)} properties into MongoDB search index.")
            
            # Ensure text index is created
            await collection.create_index(
                [
                    ("title", "text"),
                    ("locality_name", "text"),
                    ("description", "text")
                ],
                name="idx_properties_text_search"
            )
            logger.info("MongoDB text indexes verified successfully on startup.")
    except Exception as e:
        logger.error("Failed to seed MongoDB collections", error=str(e))
        
    yield
    
    # Run shutdown procedures
    logger.info("Application shutting down")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-powered Real Estate Intelligence Platform focused on Coimbatore, India",
    version="0.1.0",
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# Custom Observability middleware (runs request logging & Prometheus latency metrics)
app.add_middleware(ObservabilityMiddleware)

# CORS configuration
# Restrict origins in production as needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global unhandled exception handler to protect backend internals
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(
        "Captured unhandled application exception",
        path=request.url.path,
        method=request.method,
        error_type=type(exc).__name__,
        error_msg=str(exc)
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please contact system support."}
    )

# Mount API version 1 router
app.include_router(api_router, prefix="/api/v1")

@app.get("/auth/google/callback")
async def google_oauth_callback(request: Request):
    from api.endpoints.auth import handle_oauth_callback
    return await handle_oauth_callback(request)

@app.get("/")
async def root_redirect():
    """
    Root redirect to check health or project meta.
    """
    return {
        "project": settings.PROJECT_NAME,
        "version": "0.1.0",
        "docs_url": "/docs",
        "health_check_url": "/api/v1/health"
    }

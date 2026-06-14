# Backend — FastAPI Service

The primary API server for the Coimbatore Real Estate Intelligence Platform. Runs on **port 8000** and serves all data: properties, localities, amenities, recommendations, and authentication.

---

## Tech Stack

| Concern | Library |
|---|---|
| API framework | FastAPI (async) |
| Primary database | MongoDB via Motor (async) |
| Relational DB (schema only) | PostgreSQL + PostGIS via SQLAlchemy + asyncpg |
| Migrations | Alembic |
| AI enrichment | Google Gemini 1.5 Flash |
| Auth | PyJWT (HS256 signed tokens) |
| Observability | structlog + Prometheus client |
| HTTP client | httpx (async) |

---

## Folder Structure

```
backend/
├── api/
│   ├── endpoints/
│   │   ├── auth.py           # POST /auth/login, GET /auth/google/config, OAuth callback
│   │   ├── properties.py     # CRUD for property listings
│   │   ├── localities.py     # Localities, metrics, scores, recommendations, amenities
│   │   ├── amenities_ep.py   # Top-level amenity listing
│   │   ├── health.py         # GET /health
│   │   └── metrics.py        # Prometheus metrics
│   └── router.py             # Aggregates all routers under /api/v1
├── core/
│   ├── config.py             # Pydantic Settings (loads from .env)
│   ├── database.py           # Motor (MongoDB) + SQLAlchemy (PostgreSQL) engines
│   ├── logging.py            # structlog setup
│   └── middleware.py         # Prometheus request latency middleware
├── models/
│   └── models.py             # SQLAlchemy ORM models (Locality, Property, Amenity, etc.)
├── schemas/
│   ├── property.py           # Pydantic schemas for property CRUD
│   └── locality.py           # Pydantic schemas for locality, metrics, scores, amenities
├── services/
│   ├── property.py           # Property business logic (MongoDB CRUD + AI enrichment)
│   ├── locality_service.py   # Locality data from MongoDB
│   └── ai.py                 # Google Gemini integration
├── repositories/
│   └── mongo_search.py       # MongoDB text-search collection management
├── migrations/               # Alembic migration history (PostgreSQL)
├── tests/
│   └── test_properties.py    # Unit tests (currently against stale PostgreSQL mocks)
├── main.py                   # App entry point, seed data, lifespan, CORS
├── requirements.txt
├── Dockerfile
└── entrypoint.sh
```

---

## API Reference

All endpoints are prefixed with `/api/v1`.

### Authentication

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/login` | Email + password login. Returns signed JWT. |
| `GET` | `/auth/google/config` | Returns Google OAuth client_id and callback_url. |
| `GET` | `/auth/google/callback` | OAuth code exchange; redirects to frontend with JWT. |

**Login request body:**
```json
{ "email": "user@example.com", "password": "anypassword" }
```
**Login response:**
```json
{
  "access_token": "<signed-jwt>",
  "token_type": "bearer",
  "user": { "email": "user@example.com", "name": "user" }
}
```

> Currently any valid email + non-empty password is accepted. A real user database is a planned future addition.

---

### Properties

| Method | Path | Description |
|---|---|---|
| `GET` | `/properties` | List/search properties with filters |
| `POST` | `/properties` | Create a new property (triggers Gemini AI enrichment) |
| `GET` | `/properties/{id}` | Get single property by UUID |
| `PUT` | `/properties/{id}` | Update property |
| `DELETE` | `/properties/{id}` | Delete property |

**`GET /properties` query parameters:**

| Param | Type | Description |
|---|---|---|
| `locality_id` | UUID | Filter by locality |
| `property_type` | string | `Apartment`, `Villa`, `Independent House`, `Plot` |
| `listing_type` | string | `Sale` or `Rent` |
| `min_price` | decimal | Minimum price in INR |
| `max_price` | decimal | Maximum price in INR |
| `min_bedrooms` | int | Minimum bedroom count |
| `max_bedrooms` | int | Maximum bedroom count |
| `search` | string | Full-text search (title, locality name, AI description) |
| `sort_by` | string | `price`, `area_sqft`, or `bedrooms` |
| `sort_order` | string | `asc` (default) or `desc` |
| `skip` | int | Pagination offset (default 0) |
| `limit` | int | Page size 1–100 (default 20) |

---

### Localities

| Method | Path | Description |
|---|---|---|
| `GET` | `/localities` | List all localities |
| `GET` | `/localities/{id}` | Get locality by UUID |
| `GET` | `/localities/{id}/metrics` | Property price stats, amenity density, transit distances |
| `GET` | `/localities/{id}/scores` | Education, healthcare, lifestyle, connectivity, investment scores |
| `GET` | `/localities/{id}/recommendations` | Similar/cheaper/premium locality recommendations |
| `GET` | `/localities/{id}/amenities` | POIs near this locality (optional `?category=school`) |

---

### Amenities

| Method | Path | Description |
|---|---|---|
| `GET` | `/amenities` | List all amenities with optional `?locality_id=` and `?category=` filters |

---

### System

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | MongoDB connectivity + uptime |
| `GET` | `/metrics` | Prometheus metrics |
| `POST` | `/metrics/client` | Ingest client-side latency samples |

---

## Environment Variables

Set these in the root `.env` file.

```env
# MongoDB
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=realstate_mongo

# PostgreSQL (schema/migration use only)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=realstate_db
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Gemini AI (optional — descriptions fall back to template if blank)
GEMINI_API_KEY=

# Auth
JWT_SECRET_KEY=change_this_to_a_long_random_string
JWT_EXPIRE_HOURS=24

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:8000/auth/google/callback

# App
FRONTEND_URL=http://localhost:5173
ENVIRONMENT=development
DEBUG=true
```

---

## Running Locally

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Seed Data

On every startup, `main.py` upserts the following into MongoDB:

| Collection | Records |
|---|---|
| `properties_search` | 10 properties across Saravanampatti, Peelamedu, Kalapatti, RS Puram |
| `localities` | 7 Coimbatore localities |
| `locality_metrics` | 4 localities with full pricing + amenity + transit metrics |
| `locality_scores` | 4 localities with 5-component scores |
| `amenities` | 15 POIs across Saravanampatti, Peelamedu, RS Puram |
| `locality_recommendations` | 3 recommendation groups for Saravanampatti |

All upserts use `replace_one(..., upsert=True)` so restarts are idempotent.

---

## Database Architecture Note

PostgreSQL models exist (`models/models.py`) and have Alembic migrations but are **not actively queried** — the application uses MongoDB as its primary store. The PostgreSQL schema is retained for the standalone `locality_intelligence` and `amenity_intelligence` microservices that run independently.

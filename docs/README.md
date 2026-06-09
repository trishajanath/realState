# Real Estate Intelligence Platform (Coimbatore) - System Architecture & Startup Instructions

This document describes the initial folder structure, Docker container setups, database configurations, and startup guidelines for the AI-powered Real Estate Platform.

---

## 1. Folder Structure

The repository is structured as a multi-service monorepo:

```
realState/
├── backend/                  # FastAPI backend application
│   ├── api/                  # API routes and endpoints
│   │   ├── endpoints/        # Endpoint resource routes (e.g. health.py)
│   │   └── router.py         # Main api router (aggregates endpoints under /api/v1)
│   ├── core/                 # Shared core settings, DB engines, and logging config
│   │   ├── config.py         # Pydantic Settings configuration (loads from .env)
│   │   ├── database.py       # Asynchronous engines for Postgres/PostGIS and MongoDB
│   │   └── logging.py        # Configures structured JSON logging via structlog
│   ├── models/               # SQLAlchemy models (PostGIS spatial geometry tables)
│   ├── schemas/              # Pydantic serialization/validation schemas
│   ├── services/             # Core business logic processing layer
│   ├── repositories/         # Abstract data access layers (repositories)
│   ├── migrations/           # Alembic database migration scripts folder
│   │   ├── env.py            # Async alembic migration runner script
│   │   ├── script.py.mako    # Alembic script template
│   │   └── versions/         # Alembic database revision files
│   ├── alembic.ini           # Alembic setup configuration
│   ├── requirements.txt      # Python package dependencies
│   ├── Dockerfile            # Multi-stage production-ready Dockerfile
│   ├── entrypoint.sh         # Migrates databases and starts FastAPI application
│   └── README.md             # Backend metadata
├── frontend/                 # Placeholders for frontend SPA application
├── services/                 # Placeholders for background scrapers, ML, and cleaners
├── docs/                     # System design documentation
├── infra/                    # Operational configs (nginx, certs, etc.)
├── docker-compose.yml        # Main Docker orchestration manifest
├── .env.example              # Configuration variables template
└── .env                      # Active environment configuration parameters
```

---

## 2. Docker Configuration

We use Docker Compose to run a local development network. The services configured in `docker-compose.yml` are:

1. **`postgres` (PostGIS Database)**:
   - **Image**: `postgis/postgis:15-3.3-alpine` (adds geographic object support to Postgres).
   - **Data Volume**: `postgres_data` mapping to `/var/lib/postgresql/data`.
   - **Ports**: Exposes port `5432` to the host system.
   - **Healthcheck**: Uses `pg_isready` to block dependent services until postgres accepts connections.

2. **`mongodb`**:
   - **Image**: `mongo:6.0` (stores unstructured scraped property records and logs).
   - **Data Volume**: `mongodb_data` mapping to `/data/db`.
   - **Ports**: Exposes port `27017` to the host system.
   - **Healthcheck**: Pings the admin database using `mongosh --eval 'db.adminCommand("ping")'`.

3. **`backend` (FastAPI Server)**:
   - **Build**: Compiles the Dockerfile in `./backend` utilizing a slim Python 3.11 builder.
   - **Dependencies**: Depends on both `postgres` and `mongodb` passing their health checks.
   - **Volume Mounts**: Mounts the `./backend` directory to `/app` inside the container to enable hot reloading.
   - **Entrypoint**: `entrypoint.sh` executes any pending migrations before launching Uvicorn.

---

## 3. Database Configuration

### PostgreSQL with PostGIS (SQLAlchemy Async)
PostgreSQL handles relational data and spatial querying.
- **Driver**: `asyncpg` via SQLAlchemy (`postgresql+asyncpg://...`).
- **Engines**: Initialized in `core/database.py` using `create_async_engine()`.
- **Spatial Queries**: Integrated with `geoalchemy2` and `shapely`. Allows geospatial models (e.g. tracking Coimbatore ward boundaries, distance radius filters).

### MongoDB (Motor Async)
MongoDB stores raw scraped real estate ads, unstructured seller details, and cache records.
- **Driver**: `motor.motor_asyncio` (non-blocking MongoDB driver).
- **Client**: Initialized in `core/database.py` with `AsyncIOMotorClient()`.

---

## 4. Startup Instructions

### Prerequisites
- Docker & Docker Compose installed.
- (Optional) Python 3.9+ installed locally for linting/compilation.

### Launching the Environment
1. Ensure your `.env` file is present in the root directory.
2. Spin up the containers using compose:
   ```bash
   docker compose up --build -d
   ```
3. Check application logs to monitor server status:
   ```bash
   docker compose logs -f backend
   ```
4. Access the API Swagger documentation at:
   - [Swagger UI](http://localhost:8000/docs)
   - [ReDoc Docs](http://localhost:8000/redoc)

### Testing Health Checks
Verify the system status by calling the health endpoint:
```bash
curl http://localhost:8000/api/v1/health
```
**Expected JSON response (status code 200)**:
```json
{
  "status": "healthy",
  "postgres": "healthy",
  "mongodb": "healthy",
  "timestamp": 1700000000.0,
  "uptime_seconds": 12.34
}
```

### Shutting Down Services
To stop services and keep database volumes intact:
```bash
docker compose down
```
To delete database volumes (resets all databases):
```bash
docker compose down -v
```

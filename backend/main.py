from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import settings
from core.logging import logger
from core.middleware import ObservabilityMiddleware
from api.router import api_router

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

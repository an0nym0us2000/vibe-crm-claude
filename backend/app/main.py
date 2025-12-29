"""
SmartCRM Builder - FastAPI Application
Main application entry point with middleware, error handlers, and routing
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
import time
from typing import Callable

from app.config import settings
from app.api import api_router

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ========================================
# Lifespan Events
# ========================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    """
    # Startup
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"📌 Environment: {settings.ENVIRONMENT}")
    logger.info(f"🔧 Debug mode: {settings.DEBUG}")
    
    # Test Supabase connection
    try:
        from supabase_config.config import supabase_config
        connection_ok = await supabase_config.test_connection()
        if connection_ok:
            logger.info("✅ Supabase connection successful")
        else:
            logger.warning("⚠️ Supabase connection failed")
    except Exception as e:
        logger.error(f"❌ Supabase connection error: {str(e)}")
    
    # Test OpenAI API (if key is set)
    if settings.OPENAI_API_KEY:
        logger.info("✅ OpenAI API key configured")
    else:
        logger.warning("⚠️ OpenAI API key not configured")
    
    logger.info(f"🌐 API available at: http://{settings.API_HOST}:{settings.API_PORT}{settings.API_PREFIX}")
    logger.info(f"📚 API docs at: http://{settings.API_HOST}:{settings.API_PORT}/docs")
    
    yield
    
    # Shutdown
    logger.info("👋 Shutting down SmartCRM Builder API")


# ========================================
# FastAPI Application
# ========================================
app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered CRM builder with dynamic entities and workflow automation",
    version=settings.APP_VERSION,
    docs_url=None,  # Disable default docs (we'll add custom)
    redoc_url=None,  # Disable default redoc
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    lifespan=lifespan,
    debug=settings.DEBUG,
)


# ========================================
# Middleware
# ========================================

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.ALLOW_CREDENTIALS,
    allow_methods=settings.ALLOW_METHODS,
    allow_headers=settings.ALLOW_HEADERS,
    expose_headers=["X-Request-ID", "X-Process-Time"],
)

# GZip Compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Trusted Host (Production only)
if settings.is_production:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*.yourdomain.com", "yourdomain.com"]
    )


# Request Timing Middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next: Callable):
    """Add processing time to response headers"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(round(process_time * 1000, 2)) + "ms"
    return response


# Request ID Middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next: Callable):
    """Add unique request ID to response headers"""
    import uuid
    request_id = str(uuid.uuid4())
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# ========================================
# Error Handlers
# ========================================

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions"""
    logger.error(f"HTTP error: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.status_code,
                "message": exc.detail,
                "type": "http_error"
            }
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    logger.error(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": 422,
                "message": "Validation error",
                "type": "validation_error",
                "details": exc.errors()
            }
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.exception(f"Unhandled exception: {str(exc)}")
    
    if settings.DEBUG:
        error_detail = str(exc)
    else:
        error_detail = "Internal server error"
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": 500,
                "message": error_detail,
                "type": "server_error"
            }
        }
    )


# ========================================
# Root Routes
# ========================================

@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - API information"""
    return {
        "success": True,
        "data": {
            "service": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
            "status": "operational",
            "docs": "/docs",
            "api": settings.API_PREFIX
        }
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint
    Returns the health status of the API and dependencies
    """
    health_status = {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }
    
    # Check Supabase connection
    try:
        from supabase_config.config import supabase_config
        db_healthy = await supabase_config.test_connection()
        health_status["database"] = "connected" if db_healthy else "disconnected"
    except Exception as e:
        health_status["database"] = f"error: {str(e)}"
        logger.error(f"Database health check failed: {e}")
    
    # Check OpenAI API
    health_status["ai_service"] = "configured" if settings.OPENAI_API_KEY else "not_configured"
    
    # Check Redis (if enabled)
    if settings.REDIS_ENABLED:
        health_status["cache"] = "enabled"
    else:
        health_status["cache"] = "disabled"
    
    # Determine overall status
    is_healthy = health_status.get("database") == "connected"
    
    return {
        "success": True,
        "data": health_status,
        "healthy": is_healthy
    }


@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    """Custom Swagger UI with custom styling"""
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=f"{settings.APP_NAME} - API Documentation",
        swagger_favicon_url="https://fastapi.tiangolo.com/img/favicon.png"
    )


# ========================================
# API Routes
# ========================================

# Include API router
app.include_router(
    api_router,
    prefix=settings.API_PREFIX
)


# ========================================
# Main Entry Point
# ========================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
        access_log=settings.DEBUG,
    )

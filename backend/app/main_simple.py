"""
SmartCRM Builder - FastAPI Application with Supabase
Main application entry point
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import logging
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Log loaded config (for debugging)
logger.info(f"Loaded Config:")
logger.info(f"  SUPABASE_URL: {SUPABASE_URL[:30]}..." if SUPABASE_URL else "  SUPABASE_URL: NOT SET")
logger.info(f"  SUPABASE_KEY: {SUPABASE_KEY[:20]}..." if SUPABASE_KEY else "  SUPABASE_KEY: NOT SET")
logger.info(f"  ENVIRONMENT: {ENVIRONMENT}")

# Create FastAPI app
app = FastAPI(
    title="SmartCRM Builder API",
    description="AI-powered CRM builder with dynamic entities and workflow automation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Starting SmartCRM Builder API")
    logger.info(f"📌 Environment: {ENVIRONMENT}")
    logger.info(f"🔧 Supabase URL: {SUPABASE_URL}")
    logger.info("✅ Application startup complete")

@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "success": True,
        "message": "SmartCRM Builder API is running!",
        "data": {
            "service": "SmartCRM Builder API",
            "version": "1.0.0",
            "environment": ENVIRONMENT,
            "status": "operational",
            "docs": "/docs",
            "api": "/api/v1",
            "supabase_configured": bool(SUPABASE_URL and SUPABASE_KEY)
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    
    # Check Supabase configuration
    database_status = "not_configured"
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            from supabase import create_client
            client = create_client(SUPABASE_URL, SUPABASE_KEY)
            # Try a simple query
            result = client.table('user_profiles').select('id').limit(1).execute()
            database_status = "connected"
        except Exception as e:
            logger.error(f"Database connection error: {e}")
            database_status = f"error: {str(e)[:50]}"
    
    return {
        "success": True,
        "data": {
            "status": "healthy",
            "version": "1.0.0",
            "environment": ENVIRONMENT,
            "database": database_status,
            "supabase_url": SUPABASE_URL if SUPABASE_URL else "not configured"
        },
        "healthy": database_status == "connected"
    }

@app.get("/api/v1/ping")
async def ping():
    """Ping endpoint for testing"""
    return {
        "success": True,
        "message": "pong",
        "data": {
            "message": "Backend is alive!",
            "timestamp": "2025-01-15T10:00:00Z"
        }
    }

# Auth endpoints (basic structure)
class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str = ""

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/v1/auth/register")
async def register(request: RegisterRequest):
    """Register a new user"""
    try:
        if not SUPABASE_URL or not SUPABASE_KEY:
            return JSONResponse(
                status_code=503,
                content={"success": False, "error": "Database not configured"}
            )
        
        from supabase import create_client
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Sign up user
        response = client.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {
                    "full_name": request.full_name or request.email.split('@')[0]
                }
            }
        })
        
        return {
            "success": True,
            "message": "User registered successfully!",
            "data": {
                "user": response.user.model_dump() if response.user else None
            }
        }
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": str(e)}
        )

@app.post("/api/v1/auth/login")
async def login(request: LoginRequest):
    """Login user"""
    try:
        if not SUPABASE_URL or not SUPABASE_KEY:
            return JSONResponse(
                status_code=503,
                content={"success": False, "error": "Database not configured"}
            )
        
        from supabase import create_client
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        # Sign in user
        response = client.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        return {
            "success": True,
            "message": "Login successful!",
            "data": {
                "user": response.user.model_dump() if response.user else None,
                "session": response.session.model_dump() if response.session else None
            }
        }
    except Exception as e:
        logger.error(f"Login error: {e}")
        return JSONResponse(
            status_code=401,
            content={"success": False, "error": "Invalid credentials"}
        )

# Error handler
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.exception(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": 500,
                "message": str(exc),
                "type": "server_error"
            }
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main_simple:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )

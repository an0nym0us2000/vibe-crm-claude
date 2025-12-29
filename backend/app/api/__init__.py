"""
API Routes package
Main API router that includes all endpoint modules
"""
from fastapi import APIRouter

# Create main API router
api_router = APIRouter()


# ========================================
# Include route modules
# ========================================

# Import routers
from app.api import examples, workspaces, ai_config, records, automations

# Include example router
api_router.include_router(
    examples.router,
    prefix="/examples",
    tags=["Examples"]
)

# Include workspaces router
api_router.include_router(
    workspaces.router,
    prefix="/workspaces",
    tags=["Workspaces"]
)

# Include records router
api_router.include_router(
    records.router,
    prefix="/workspaces",
    tags=["Records"]
)

# Include AI configuration router
api_router.include_router(
    ai_config.router,
    prefix="/ai",
    tags=["AI Configuration"]
)

# Include automations router
api_router.include_router(
    automations.router,
    tags=["Automations"]
)


# TODO: Add these routers as they are created:
# from app.api import auth, records, automation, activities

# api_router.include_router(
#     auth.router,
#     prefix="/auth",
#     tags=["Authentication"]
# )
# api_router.include_router(
#     records.router,
#     prefix="/records",
#     tags=["Records"]
# )
# api_router.include_router(
#     automation.router,
#     prefix="/automation",
#     tags=["Automation"]
# )
# api_router.include_router(
#     activities.router,
#     prefix="/activities",
#     tags=["Activities"]
# )


# ========================================
# Health check for API router
# ========================================

@api_router.get("/ping", tags=["Health"])
async def ping():
    """
    Ping endpoint for API router
    Quick health check for the API
    """
    return {
        "success": True,
        "data": {
            "message": "pong",
            "status": "API is operational"
        }
    }


# Export router
__all__ = ["api_router"]

"""
Error Handlers and Custom Exceptions
Centralized error handling for the application
"""
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any
import logging
import traceback
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Custom Exception Classes
class CRMException(Exception):
    """Base exception for CRM-specific errors"""
    
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or "CRM_ERROR"
        self.details = details or {}
        super().__init__(self.message)


class AuthenticationError(CRMException):
    """Authentication-related errors"""
    
    def __init__(self, message: str = "Authentication failed", details: Optional[Dict] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="AUTH_ERROR",
            details=details
        )


class AuthorizationError(CRMException):
    """Authorization/permission errors"""
    
    def __init__(self, message: str = "Insufficient permissions", details: Optional[Dict] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="AUTHORIZATION_ERROR",
            details=details
        )


class ResourceNotFoundError(CRMException):
    """Resource not found errors"""
    
    def __init__(self, resource: str = "Resource", resource_id: Optional[str] = None):
        message = f"{resource} not found"
        if resource_id:
            message += f": {resource_id}"
        
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="NOT_FOUND",
            details={"resource": resource, "id": resource_id}
        )


class ValidationError(CRMException):
    """Data validation errors"""
    
    def __init__(self, message: str, field: Optional[str] = None, details: Optional[Dict] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="VALIDATION_ERROR",
            details={"field": field, **(details or {})}
        )


class DatabaseError(CRMException):
    """Database operation errors"""
    
    def __init__(self, message: str = "Database operation failed", details: Optional[Dict] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="DATABASE_ERROR",
            details=details
        )


class ExternalServiceError(CRMException):
    """External service errors (OpenAI, SendGrid, etc.)"""
    
    def __init__(self, service: str, message: str, details: Optional[Dict] = None):
        super().__init__(
            message=f"{service} error: {message}",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="EXTERNAL_SERVICE_ERROR",
            details={"service": service, **(details or {})}
        )


# Error Response Formatter
def format_error_response(
    message: str,
    error_code: str = "ERROR",
    status_code: int = status.HTTP_400_BAD_REQUEST,
    details: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Format standardized error response"""
    
    return {
        "success": False,
        "error": {
            "message": message,
            "code": error_code,
            "status_code": status_code,
            "details": details or {},
            "timestamp": datetime.utcnow().isoformat()
        }
    }


# Exception Handlers
async def crm_exception_handler(request: Request, exc: CRMException) -> JSONResponse:
    """Handle custom CRM exceptions"""
    
    logger.error(
        f"CRM Error: {exc.error_code} - {exc.message}",
        extra={
            "error_code": exc.error_code,
            "status_code": exc.status_code,
            "details": exc.details,
            "path": str(request.url)
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=format_error_response(
            message=exc.message,
            error_code=exc.error_code,
            status_code=exc.status_code,
            details=exc.details
        )
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle FastAPI HTTP exceptions"""
    
    logger.warning(
        f"HTTP {exc.status_code}: {exc.detail}",
        extra={
            "status_code": exc.status_code,
            "path": str(request.url)
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=format_error_response(
            message=str(exc.detail),
            error_code="HTTP_ERROR",
            status_code=exc.status_code
        )
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unhandled exceptions"""
    
    # Log full traceback for debugging
    logger.error(
        f"Unhandled exception: {str(exc)}",
        exc_info=True,
        extra={
            "path": str(request.url),
            "traceback": traceback.format_exc()
        }
    )
    
    # Don't expose internal errors in production
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=format_error_response(
            message="An internal server error occurred. Please try again later.",
            error_code="INTERNAL_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    )


async def validation_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle Pydantic validation exceptions"""
    
    logger.warning(
        f"Validation error: {str(exc)}",
        extra={"path": str(request.url)}
    )
    
    # Extract validation errors if available
    details = {}
    if hasattr(exc, "errors"):
        details["validation_errors"] = exc.errors()
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=format_error_response(
            message="Validation error in request data",
            error_code="VALIDATION_ERROR",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details
        )
    )


# Utility functions
def log_request(request: Request):
    """Log incoming request"""
    logger.info(
        f"{request.method} {request.url.path}",
        extra={
            "method": request.method,
            "path": str(request.url.path),
            "client": request.client.host if request.client else None
        }
    )


def log_response(status_code: int, path: str):
    """Log response"""
    logger.info(
        f"Response {status_code} for {path}",
        extra={
            "status_code": status_code,
            "path": path
        }
    )


# Export all
__all__ = [
    "CRMException",
    "AuthenticationError",
    "AuthorizationError",
    "ResourceNotFoundError",
    "ValidationError",
    "DatabaseError",
    "ExternalServiceError",
    "format_error_response",
    "crm_exception_handler",
    "http_exception_handler",
    "general_exception_handler",
    "validation_exception_handler",
    "log_request",
    "log_response",
    "logger"
]

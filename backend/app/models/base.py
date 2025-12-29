"""
Base Pydantic models for API requests and responses
Provides common field types, validation rules, and response schemas
"""
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, Any, Dict, List, Generic, TypeVar
from datetime import datetime
from enum import Enum
import uuid


# ========================================
# Base Configuration
# ========================================

class BaseConfig:
    """Base configuration for all Pydantic models"""
    from_attributes = True
    populate_by_name = True
    use_enum_values = True
    json_encoders = {
        datetime: lambda v: v.isoformat() if v else None,
        uuid.UUID: lambda v: str(v) if v else None
    }


# ========================================
# Common Field Types
# ========================================

# UUID Field with validation
UUIDField = Field(..., description="UUID identifier")
OptionalUUIDField = Field(None, description="Optional UUID identifier")

# Timestamp Fields
TimestampField = Field(default_factory=datetime.utcnow, description="Timestamp")
OptionalTimestampField = Field(None, description="Optional timestamp")

# Text Fields
TitleField = Field(..., min_length=1, max_length=200, description="Title")
DescriptionField = Field(None, max_length=2000, description="Description")
SlugField = Field(..., min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$", description="URL-friendly slug")

# Email Field
EmailField = Field(..., description="Email address")

# Pagination Fields
PageField = Field(default=1, ge=1, description="Page number")
PageSizeField = Field(default=50, ge=1, le=100, description="Page size")


# ========================================
# Enums
# ========================================

class WorkspaceRole(str, Enum):
    """Workspace member roles"""
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"


class SubscriptionTier(str, Enum):
    """Subscription tiers"""
    FREE = "free"
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"


class EntityViewType(str, Enum):
    """Entity view types"""
    TABLE = "table"
    KANBAN = "kanban"
    CALENDAR = "calendar"
    LIST = "list"
    CARDS = "cards"


class ActivityType(str, Enum):
    """Activity types"""
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    TASK = "task"
    NOTE = "note"
    SMS = "sms"


class TriggerType(str, Enum):
    """Automation trigger types"""
    RECORD_CREATED = "record_created"
    RECORD_UPDATED = "record_updated"
    RECORD_DELETED = "record_deleted"
    FIELD_CHANGED = "field_changed"
    SCHEDULED = "scheduled"
    MANUAL = "manual"


class ActionType(str, Enum):
    """Automation action types"""
    SEND_EMAIL = "send_email"
    CREATE_TASK = "create_task"
    UPDATE_FIELD = "update_field"
    CREATE_RECORD = "create_record"
    WEBHOOK = "webhook"
    AI_GENERATE = "ai_generate"


class FieldType(str, Enum):
    """CRM field types"""
    TEXT = "text"
    TEXTAREA = "textarea"
    EMAIL = "email"
    PHONE = "phone"
    NUMBER = "number"
    DATE = "date"
    DATETIME = "datetime"
    SELECT = "select"
    MULTISELECT = "multiselect"
    CHECKBOX = "checkbox"
    URL = "url"
    FILE = "file"


# ========================================
# Base Models
# ========================================

class TimestampMixin(BaseModel):
    """Mixin for created/updated timestamps"""
    created_at: datetime = TimestampField
    updated_at: datetime = TimestampField
    
    model_config = ConfigDict(**BaseConfig.__dict__)


class UUIDMixin(BaseModel):
    """Mixin for UUID identifier"""
    id: uuid.UUID = UUIDField
    
    model_config = ConfigDict(**BaseConfig.__dict__)


# ========================================
# Request/Response Base Models
# ========================================

DataT = TypeVar('DataT')


class SuccessResponse(BaseModel, Generic[DataT]):
    """
    Standard success response wrapper
    
    Example:
        {
            "success": true,
            "data": {...},
            "message": "Operation successful"
        }
    """
    success: bool = Field(default=True, description="Success status")
    data: DataT = Field(..., description="Response data")
    message: Optional[str] = Field(None, description="Optional message")
    
    model_config = ConfigDict(**BaseConfig.__dict__)


class ErrorDetail(BaseModel):
    """Error detail structure"""
    code: int = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    type: str = Field(..., description="Error type")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    
    model_config = ConfigDict(**BaseConfig.__dict__)


class ErrorResponse(BaseModel):
    """
    Standard error response wrapper
    
    Example:
        {
            "success": false,
            "error": {
                "code": 404,
                "message": "Resource not found",
                "type": "not_found"
            }
        }
    """
    success: bool = Field(default=False, description="Success status")
    error: ErrorDetail = Field(..., description="Error details")
    
    model_config = ConfigDict(**BaseConfig.__dict__)


class PaginationMeta(BaseModel):
    """Pagination metadata"""
    page: int = Field(..., ge=1, description="Current page")
    page_size: int = Field(..., ge=1, le=100, description="Page size")
    total_count: int = Field(..., ge=0, description="Total number of items")
    total_pages: int = Field(..., ge=0, description="Total number of pages")
    has_next: bool = Field(..., description="Has next page")
    has_previous: bool = Field(..., description="Has previous page")
    
    model_config = ConfigDict(**BaseConfig.__dict__)


class PaginatedResponse(BaseModel, Generic[DataT]):
    """
    Paginated response wrapper
    
    Example:
        {
            "success": true,
            "data": [...],
            "meta": {
                "page": 1,
                "page_size": 50,
                "total_count": 150,
                "total_pages": 3,
                "has_next": true,
                "has_previous": false
            }
        }
    """
    success: bool = Field(default=True, description="Success status")
    data: List[DataT] = Field(..., description="Response data list")
    meta: PaginationMeta = Field(..., description="Pagination metadata")
    
    model_config = ConfigDict(**BaseConfig.__dict__)


# ========================================
# Common Request Models
# ========================================

class PaginationParams(BaseModel):
    """Pagination query parameters"""
    page: int = PageField
    page_size: int = PageSizeField
    
    model_config = ConfigDict(**BaseConfig.__dict__)
    
    @property
    def offset(self) -> int:
        """Calculate offset for database query"""
        return (self.page - 1) * self.page_size
    
    @property
    def limit(self) -> int:
        """Get limit for database query"""
        return self.page_size


class SearchParams(BaseModel):
    """Search query parameters"""
    q: Optional[str] = Field(None, min_length=1, max_length=200, description="Search query")
    fields: Optional[List[str]] = Field(None, description="Fields to search in")
    
    model_config = ConfigDict(**BaseConfig.__dict__)


class SortParams(BaseModel):
    """Sort query parameters"""
    sort_by: Optional[str] = Field(None, description="Field to sort by")
    sort_order: Optional[str] = Field("asc", pattern=r"^(asc|desc)$", description="Sort order: asc or desc")
    
    model_config = ConfigDict(**BaseConfig.__dict__)


class FilterParams(BaseModel):
    """Filter query parameters"""
    filters: Optional[Dict[str, Any]] = Field(None, description="Filter criteria as key-value pairs")
    
    model_config = ConfigDict(**BaseConfig.__dict__)


# ========================================
# Field Definition Models
# ========================================

class FieldDefinition(BaseModel):
    """
    CRM field definition
    
    Example:
        {
            "name": "email",
            "type": "email",
            "label": "Email Address",
            "required": false,
            "placeholder": "john@example.com",
            "validation": {"pattern": "email"}
        }
    """
    name: str = Field(..., min_length=1, max_length=100, description="Field name (internal)")
    type: FieldType = Field(..., description="Field type")
    label: str = Field(..., min_length=1, max_length=200, description="Field label (display)")
    required: bool = Field(default=False, description="Is field required")
    placeholder: Optional[str] = Field(None, max_length=200, description="Placeholder text")
    default: Optional[Any] = Field(None, description="Default value")
    options: Optional[List[str]] = Field(None, description="Options for select/multiselect fields")
    validation: Optional[Dict[str, Any]] = Field(None, description="Validation rules")
    help_text: Optional[str] = Field(None, max_length=500, description="Help text")
    prefix: Optional[str] = Field(None, max_length=10, description="Prefix (e.g., $ for currency)")
    suffix: Optional[str] = Field(None, max_length=10, description="Suffix (e.g., % for percent)")
    
    model_config = ConfigDict(**BaseConfig.__dict__)
    
    @field_validator("name")
    @classmethod
    def validate_field_name(cls, v: str) -> str:
        """Validate field name is lowercase with underscores"""
        if not v.replace("_", "").isalnum():
            raise ValueError("Field name must contain only letters, numbers, and underscores")
        return v.lower()


# ========================================
# Health Check Models
# ========================================

class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Health status")
    version: str = Field(..., description="API version")
    environment: str = Field(..., description="Environment")
    database: str = Field(..., description="Database status")
    ai_service: str = Field(..., description="AI service status")
    cache: Optional[str] = Field(None, description="Cache status")
    
    model_config = ConfigDict(**BaseConfig.__dict__)


# ========================================
# Validation Helpers
# ========================================

def validate_slug(slug: str) -> str:
    """
    Validate and normalize slug
    
    Args:
        slug: Slug string to validate
        
    Returns:
        Normalized slug
        
    Raises:
        ValueError: If slug is invalid
    """
    slug = slug.lower().strip()
    if not slug.replace("-", "").replace("_", "").isalnum():
        raise ValueError("Slug must contain only lowercase letters, numbers, hyphens, and underscores")
    return slug

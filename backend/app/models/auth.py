"""
Authentication and authorization models
Pydantic models for auth-related requests and responses
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Literal, Dict, Any, List
from datetime import datetime
from enum import Enum

from app.models.base import WorkspaceRole, UUIDMixin, TimestampMixin


# ========================================
# Enums
# ========================================

class AuthProvider(str, Enum):
    """Authentication providers"""
    EMAIL = "email"
    GOOGLE = "google"
    GITHUB = "github"
    AZURE = "azure"


# ========================================
# User Models
# ========================================

class UserBase(BaseModel):
    """Base user model"""
    email: EmailStr = Field(..., description="User email address")
    
    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    """User response model"""
    id: str = Field(..., description="User UUID")
    email: EmailStr = Field(..., description="User email")
    email_confirmed_at: Optional[datetime] = Field(None, description="Email confirmation timestamp")
    phone: Optional[str] = Field(None, description="Phone number")
    created_at: Optional[datetime] = Field(None, description="Account creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
    user_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="User metadata")
    
    model_config = {"from_attributes": True}


class UserProfile(BaseModel):
    """Extended user profile"""
    id: str = Field(..., description="User UUID")
    email: EmailStr
    full_name: Optional[str] = Field(None, max_length=200, description="Full name")
    company_name: Optional[str] = Field(None, max_length=200, description="Company name")
    industry: Optional[str] = Field(None, max_length=100, description="Industry")
    avatar_url: Optional[str] = Field(None, description="Avatar image URL")
    timezone: str = Field(default="UTC", description="User timezone")
    preferences: Dict[str, Any] = Field(default_factory=dict, description="User preferences")
    
    model_config = {"from_attributes": True}


# ========================================
# Workspace Member Models
# ========================================

class WorkspaceMemberBase(BaseModel):
    """Base workspace member model"""
    workspace_id: str = Field(..., description="Workspace UUID")
    user_id: str = Field(..., description="User UUID")
    role: WorkspaceRole = Field(..., description="Member role")


class WorkspaceMember(WorkspaceMemberBase):
    """Complete workspace member model"""
    permissions: List[str] = Field(default_factory=list, description="Additional permissions")
    invited_by: Optional[str] = Field(None, description="UUID of user who sent invite")
    joined_at: datetime = Field(default_factory=datetime.utcnow, description="Join timestamp")
    
    model_config = {"from_attributes": True}


class WorkspaceMemberResponse(WorkspaceMember):
    """Workspace member response with user info"""
    user: Optional[UserResponse] = Field(None, description="User information")
    workspace: Optional[Dict[str, Any]] = Field(None, description="Workspace information")
    
    model_config = {"from_attributes": True}


class WorkspaceMemberUpdate(BaseModel):
    """Update workspace member"""
    role: Optional[WorkspaceRole] = Field(None, description="New role")
    permissions: Optional[List[str]] = Field(None, description="New permissions")
    
    model_config = {"from_attributes": True}


# ========================================
# Invitation Models
# ========================================

class InviteRequest(BaseModel):
    """Request to invite user to workspace"""
    email: EmailStr = Field(..., description="Email of user to invite")
    role: Literal["admin", "member"] = Field(
        default="member",
        description="Role to assign (owner cannot be invited)"
    )
    message: Optional[str] = Field(
        None,
        max_length=500,
        description="Optional invitation message"
    )
    
    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        """Ensure owner role cannot be assigned via invitation"""
        if v == "owner":
            raise ValueError("Cannot invite user as owner. Use transfer ownership instead.")
        return v
    
    model_config = {"from_attributes": True}


class InviteResponse(BaseModel):
    """Invitation response"""
    id: str = Field(..., description="Invitation UUID")
    workspace_id: str = Field(..., description="Workspace UUID")
    email: EmailStr = Field(..., description="Invited user email")
    role: WorkspaceRole = Field(..., description="Assigned role")
    invited_by: str = Field(..., description="Inviter user UUID")
    status: Literal["pending", "accepted", "expired", "cancelled"] = Field(
        default="pending",
        description="Invitation status"
    )
    expires_at: Optional[datetime] = Field(None, description="Expiration timestamp")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {"from_attributes": True}


class AcceptInviteRequest(BaseModel):
    """Request to accept invitation"""
    invitation_id: str = Field(..., description="Invitation UUID")
    
    model_config = {"from_attributes": True}


# ========================================
# Authentication Request/Response Models
# ========================================

class LoginRequest(BaseModel):
    """Login request"""
    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., min_length=8, description="User password")
    
    model_config = {"from_attributes": True}


class SignupRequest(BaseModel):
    """Signup request"""
    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., min_length=8, description="User password")
    full_name: Optional[str] = Field(None, max_length=200, description="Full name")
    company_name: Optional[str] = Field(None, max_length=200, description="Company name")
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v
    
    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    """Authentication response"""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration in seconds")
    refresh_token: Optional[str] = Field(None, description="Refresh token")
    user: UserResponse = Field(..., description="Authenticated user")
    
    model_config = {"from_attributes": True}


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str = Field(..., description="Refresh token")
    
    model_config = {"from_attributes": True}


class PasswordResetRequest(BaseModel):
    """Password reset request"""
    email: EmailStr = Field(..., description="User email")
    
    model_config = {"from_attributes": True}


class PasswordUpdateRequest(BaseModel):
    """Password update request"""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password")
    
    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        """Validate new password strength"""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v
    
    model_config = {"from_attributes": True}


# ========================================
# Permission Models
# ========================================

class Permission(str, Enum):
    """Available permissions"""
    # Entity permissions
    CREATE_ENTITY = "create_entity"
    UPDATE_ENTITY = "update_entity"
    DELETE_ENTITY = "delete_entity"
    
    # Record permissions
    CREATE_RECORD = "create_record"
    UPDATE_RECORD = "update_record"
    DELETE_RECORD = "delete_record"
    VIEW_RECORD = "view_record"
    
    # Automation permissions
    CREATE_AUTOMATION = "create_automation"
    UPDATE_AUTOMATION = "update_automation"
    DELETE_AUTOMATION = "delete_automation"
    
    # Member management
    INVITE_MEMBER = "invite_member"
    REMOVE_MEMBER = "remove_member"
    UPDATE_MEMBER_ROLE = "update_member_role"
    
    # Workspace settings
    UPDATE_WORKSPACE = "update_workspace"
    DELETE_WORKSPACE = "delete_workspace"


class PermissionCheck(BaseModel):
    """Permission check request"""
    workspace_id: str = Field(..., description="Workspace UUID")
    permission: Permission = Field(..., description="Permission to check")
    
    model_config = {"from_attributes": True}


class PermissionCheckResponse(BaseModel):
    """Permission check response"""
    granted: bool = Field(..., description="Whether permission is granted")
    reason: Optional[str] = Field(None, description="Reason if denied")
    
    model_config = {"from_attributes": True}


# ========================================
# Export all models
# ========================================

__all__ = [
    # Enums
    "AuthProvider",
    "Permission",
    # User models
    "UserBase",
    "UserResponse",
    "UserProfile",
    # Workspace member models
    "WorkspaceMemberBase",
    "WorkspaceMember",
    "WorkspaceMemberResponse",
    "WorkspaceMemberUpdate",
    # Invitation models
    "InviteRequest",
    "InviteResponse",
    "AcceptInviteRequest",
    # Auth models
    "LoginRequest",
    "SignupRequest",
    "AuthResponse",
    "RefreshTokenRequest",
    "PasswordResetRequest",
    "PasswordUpdateRequest",
    # Permission models
    "PermissionCheck",
    "PermissionCheckResponse",
]

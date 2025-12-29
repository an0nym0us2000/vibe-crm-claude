"""
Authentication and Authorization Middleware
Handles JWT token verification, user context, and workspace access control
"""
from fastapi import Depends, HTTPException, Header, status
from typing import Optional, Dict, Any
import logging
from datetime import datetime

from app.config import settings
from app.utils.supabase_client import get_client, check_workspace_access as check_access

logger = logging.getLogger(__name__)


# ========================================
# User Authentication
# ========================================

async def get_current_user(
    authorization: Optional[str] = Header(None, description="Bearer token")
) -> Dict[str, Any]:
    """
    Extract and verify user from JWT token
    
    Args:
        authorization: Authorization header with Bearer token
        
    Returns:
        User dictionary with id, email, and metadata
        
    Raises:
        HTTPException: 401 if authentication fails
    """
    if not authorization:
        logger.warning("Missing authorization header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Authorization header required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not authorization.startswith("Bearer "):
        logger.warning("Invalid authorization header format")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials. Use Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extract token
    token = authorization.replace("Bearer ", "").strip()
    
    if not token:
        logger.warning("Empty bearer token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Empty bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Get authenticated Supabase client
        from supabase_config.config import get_authenticated_supabase_client
        supabase = get_authenticated_supabase_client(token)
        
        # Verify token and get user
        user_response = supabase.auth.get_user(token)
        
        if not user_response or not user_response.user:
            logger.warning("Invalid token - no user found")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = user_response.user
        
        # Build user context
        user_context = {
            "id": user.id,
            "email": user.email,
            "user_metadata": user.user_metadata or {},
            "app_metadata": user.app_metadata or {},
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "phone": getattr(user, 'phone', None),
        }
        
        logger.info(f"User authenticated: {user.email} ({user.id})")
        return user_context
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_optional(
    authorization: Optional[str] = Header(None)
) -> Optional[Dict[str, Any]]:
    """
    Get current user if authenticated, None otherwise
    Useful for endpoints that work with or without authentication
    
    Args:
        authorization: Optional authorization header
        
    Returns:
        User dict if authenticated, None otherwise
    """
    if not authorization:
        return None
    
    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None


# ========================================
# Workspace Access Control
# ========================================

async def check_workspace_access(
    workspace_id: str,
    user_id: str,
    required_role: Optional[str] = None,
    client = None
) -> Dict[str, Any]:
    """
    Check if user has access to workspace with optional role requirement
    
    Args:
        workspace_id: Workspace UUID
        user_id: User UUID
        required_role: Optional required role (owner, admin, member)
        client: Optional Supabase client
        
    Returns:
        Workspace member object with role information
        
    Raises:
        HTTPException: 403 if access denied, 404 if workspace not found
    """
    if not client:
        client = get_client(use_service_role=True)
    
    try:
        # Check workspace exists
        workspace_result = client.table("workspaces") \
            .select("id, name, is_active") \
            .eq("id", workspace_id) \
            .maybe_single() \
            .execute()
        
        if not workspace_result.data:
            logger.warning(f"Workspace not found: {workspace_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found"
            )
        
        workspace = workspace_result.data
        
        # Check if workspace is active
        if not workspace.get("is_active", True):
            logger.warning(f"Workspace inactive: {workspace_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Workspace is inactive"
            )
        
        # Check membership
        member_result = client.table("workspace_members") \
            .select("*") \
            .eq("workspace_id", workspace_id) \
            .eq("user_id", user_id) \
            .maybe_single() \
            .execute()
        
        if not member_result.data:
            logger.warning(f"User {user_id} has no access to workspace {workspace_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this workspace"
            )
        
        member = member_result.data
        user_role = member.get("role")
        
        # Check role requirements
        if required_role:
            role_hierarchy = {
                "owner": 3,
                "admin": 2,
                "member": 1
            }
            
            user_level = role_hierarchy.get(user_role, 0)
            required_level = role_hierarchy.get(required_role, 0)
            
            if user_level < required_level:
                logger.warning(
                    f"User {user_id} with role {user_role} lacks required role {required_role} "
                    f"for workspace {workspace_id}"
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions. {required_role} role required."
                )
        
        logger.info(
            f"Workspace access granted: user={user_id}, workspace={workspace_id}, "
            f"role={user_role}"
        )
        
        return {
            **member,
            "workspace": workspace
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking workspace access: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error verifying workspace access"
        )


# ========================================
# FastAPI Dependencies
# ========================================

async def require_workspace_access(
    workspace_id: str,
    user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Dependency to verify user has access to workspace
    
    Args:
        workspace_id: Workspace UUID
        user: Current authenticated user
        
    Returns:
        Workspace member object
        
    Raises:
        HTTPException: 401 if not authenticated, 403 if no access
        
    Usage:
        @router.get("/workspaces/{workspace_id}")
        async def get_workspace(
            workspace_id: str,
            member: dict = Depends(require_workspace_access)
        ):
            # member contains role and workspace info
            pass
    """
    return await check_workspace_access(workspace_id, user["id"])


async def require_admin_access(
    workspace_id: str,
    user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Dependency to verify user has admin or owner role in workspace
    
    Args:
        workspace_id: Workspace UUID
        user: Current authenticated user
        
    Returns:
        Workspace member object with admin+ role
        
    Raises:
        HTTPException: 401 if not authenticated, 403 if not admin/owner
        
    Usage:
        @router.post("/workspaces/{workspace_id}/entities")
        async def create_entity(
            workspace_id: str,
            member: dict = Depends(require_admin_access)
        ):
            # Only admins and owners can create entities
            pass
    """
    return await check_workspace_access(
        workspace_id, 
        user["id"], 
        required_role="admin"
    )


async def require_owner_access(
    workspace_id: str,
    user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Dependency to verify user has owner role in workspace
    
    Args:
        workspace_id: Workspace UUID
        user: Current authenticated user
        
    Returns:
        Workspace member object with owner role
        
    Raises:
        HTTPException: 401 if not authenticated, 403 if not owner
        
    Usage:
        @router.delete("/workspaces/{workspace_id}")
        async def delete_workspace(
            workspace_id: str,
            member: dict = Depends(require_owner_access)
        ):
            # Only owners can delete workspaces
            pass
    """
    return await check_workspace_access(
        workspace_id, 
        user["id"], 
        required_role="owner"
    )


# ========================================
# Utility Functions
# ========================================

def get_user_workspaces_sync(user_id: str) -> list:
    """
    Get all workspaces for a user (synchronous)
    
    Args:
        user_id: User UUID
        
    Returns:
        List of workspace memberships with workspace data
    """
    client = get_client(use_service_role=True)
    
    try:
        result = client.table("workspace_members") \
            .select("workspace_id, role, joined_at, workspaces(*)") \
            .eq("user_id", user_id) \
            .execute()
        
        return result.data if result.data else []
    except Exception as e:
        logger.error(f"Error fetching user workspaces: {str(e)}")
        return []


async def get_user_workspaces(user_id: str) -> list:
    """
    Get all workspaces for a user (async)
    
    Args:
        user_id: User UUID
        
    Returns:
        List of workspace memberships with workspace data
    """
    return get_user_workspaces_sync(user_id)


def has_permission(
    member: Dict[str, Any],
    required_role: str
) -> bool:
    """
    Check if member has sufficient permissions
    
    Args:
        member: Workspace member object
        required_role: Required role level
        
    Returns:
        True if member has sufficient permissions
    """
    role_hierarchy = {
        "owner": 3,
        "admin": 2,
        "member": 1
    }
    
    user_level = role_hierarchy.get(member.get("role"), 0)
    required_level = role_hierarchy.get(required_role, 0)
    
    return user_level >= required_level


# ========================================
# Export all functions
# ========================================

# Alias for backward compatibility
require_workspace_admin = require_admin_access
require_workspace_owner = require_owner_access

__all__ = [
    "get_current_user",
    "get_current_user_optional",
    "check_workspace_access",
    "require_workspace_access",
    "require_admin_access",
    "require_owner_access",
    "require_workspace_admin",  # Alias
    "require_workspace_owner",   # Alias
    "get_user_workspaces",
    "has_permission",
]

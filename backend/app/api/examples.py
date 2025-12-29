"""
Example API endpoint demonstrating authentication and authorization usage
This shows how to use the auth middleware in your API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any

from app.middleware import (
    get_current_user,
    require_workspace_access,
    require_admin_access,
    require_owner_access,
    get_user_workspaces
)
from app.models.base import SuccessResponse
from app.models.auth import WorkspaceMemberResponse

router = APIRouter(tags=["Examples"])


# ========================================
# Example 1: Require Authentication
# ========================================

@router.get("/examples/profile")
async def get_user_profile(
    user: Dict[str, Any] = Depends(get_current_user)
) -> SuccessResponse:
    """
    Example: Require authentication
    
    - Requires valid JWT token
    - Returns current user information
    """
    return SuccessResponse(
        data={
            "user_id": user["id"],
            "email": user["email"],
            "metadata": user.get("user_metadata", {})
        },
        message="User profile retrieved successfully"
    )


# ========================================
# Example 2: List User Workspaces
# ========================================

@router.get("/examples/workspaces")
async def list_user_workspaces(
    user: Dict[str, Any] = Depends(get_current_user)
) -> SuccessResponse:
    """
    Example: Get all workspaces user has access to
    
    - Requires authentication
    - Returns list of workspaces with roles
    """
    workspaces = await get_user_workspaces(user["id"])
    
    return SuccessResponse(
        data={
            "workspaces": workspaces,
            "count": len(workspaces)
        },
        message="Workspaces retrieved successfully"
    )


# ========================================
# Example 3: Workspace Member Access
# ========================================

@router.get("/examples/workspaces/{workspace_id}/data")
async def get_workspace_data(
    workspace_id: str,
    member: Dict[str, Any] = Depends(require_workspace_access)
) -> SuccessResponse:
    """
    Example: Require workspace membership (any role)
    
    - Requires authentication
    - Requires user to be a member of the workspace
    - Works for owner, admin, or member roles
    """
    return SuccessResponse(
        data={
            "workspace_id": workspace_id,
            "workspace_name": member["workspace"]["name"],
            "your_role": member["role"],
            "joined_at": member["joined_at"],
            "message": "You have access to this workspace!"
        },
        message="Workspace data retrieved successfully"
    )


# ========================================
# Example 4: Admin-Only Access
# ========================================

@router.post("/examples/workspaces/{workspace_id}/settings")
async def update_workspace_settings(
    workspace_id: str,
    settings: Dict[str, Any],
    member: Dict[str, Any] = Depends(require_admin_access)
) -> SuccessResponse:
    """
    Example: Require admin or owner role
    
- Requires authentication
    - Requires user to be admin OR owner
    - Members cannot access this endpoint
    """
    return SuccessResponse(
        data={
            "workspace_id": workspace_id,
            "your_role": member["role"],
            "updated_settings": settings,
            "message": "Only admins and owners can update settings"
        },
        message="Workspace settings updated"
    )


# ========================================
# Example 5: Owner-Only Access
# ========================================

@router.delete("/examples/workspaces/{workspace_id}")
async def delete_workspace(
    workspace_id: str,
    member: Dict[str, Any] = Depends(require_owner_access)
) -> SuccessResponse:
    """
    Example: Require owner role
    
    - Requires authentication
    - Requires user to be the workspace owner
    - Admins and members cannot access this endpoint
    """
    return SuccessResponse(
        data={
            "workspace_id": workspace_id,
            "deleted": True,
            "message": "Only the owner can delete a workspace"
        },
        message="Workspace deleted successfully"
    )


# ========================================
# Example 6: Combined Checks
# ========================================

@router.post("/examples/workspaces/{workspace_id}/invite")
async def invite_user_to_workspace(
    workspace_id: str,
    email: str,
    role: str,
    member: Dict[str, Any] = Depends(require_admin_access),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> SuccessResponse:
    """
    Example: Multiple dependencies
    
    - Uses both require_admin_access and get_current_user
    - Demonstrates accessing both member context and user context
    """
    # Admin check is already done by require_admin_access
    # Current user is available from get_current_user
    
    return SuccessResponse(
        data={
            "workspace_id": workspace_id,
            "invited_email": email,
            "invited_role": role,
            "invited_by": current_user["email"],
            "inviter_role": member["role"]
        },
        message=f"User {email} invited as {role}"
    )


# ========================================
# Example 7: Manual Permission Check
# ========================================

@router.put("/examples/workspaces/{workspace_id}/custom")
async def custom_permission_check(
    workspace_id: str,
    member: Dict[str, Any] = Depends(require_workspace_access)
) -> SuccessResponse:
    """
    Example: Manual role checking
    
    - Gets workspace access (any role)
    - Manually checks for specific role
    """
    from app.middleware import has_permission
    
    # Check if user has admin permissions
    is_admin = has_permission(member, "admin")
    
    if is_admin:
        message = "You are an admin or owner"
        action = "Can perform admin actions"
    else:
        message = "You are a member"
        action = "Limited to member actions"
    
    return SuccessResponse(
        data={
            "workspace_id": workspace_id,
            "your_role": member["role"],
            "is_admin": is_admin,
            "message": message,
            "allowed_action": action
        }
    )


# ========================================
# Example 8: Error Handling
# ========================================

@router.get("/examples/workspaces/{workspace_id}/restricted")
async def restricted_endpoint(
    workspace_id: str,
    member: Dict[str, Any] = Depends(require_workspace_access)
) -> SuccessResponse:
    """
    Example: Custom error handling with roles
    
    - Demonstrates raising custom errors based on role
    """
    # Custom logic: Only allow if workspace has certain property
    workspace = member["workspace"]
    
    if not workspace.get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This workspace is inactive"
        )
    
    # Only allow premium workspaces
    if workspace.get("subscription_tier") == "free":
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="This feature requires a premium subscription"
        )
    
    return SuccessResponse(
        data={
            "workspace_id": workspace_id,
            "subscription_tier": workspace.get("subscription_tier"),
            "message": "Access granted to premium feature"
        }
    )


# ========================================
# To use these examples in main app:
# ========================================

"""
In app/api/__init__.py:

from app.api.examples import router as examples_router

api_router.include_router(
    examples_router,
    prefix="/examples",
    tags=["Examples"]
)
"""

"""
Workspace API endpoints
Manage workspaces, entities, and team members
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, EmailStr
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime

from app.models.base import SuccessResponse, PaginatedResponse, PaginationMeta
from app.models.auth import InviteRequest, WorkspaceMemberResponse
from app.middleware import (
    get_current_user,
    require_workspace_access,
    require_admin_access,
    require_owner_access
)
from app.services.ai_config_generator import generate_crm_config, CRMConfig
from app.utils.supabase_client import get_client
from app.config import settings

router = APIRouter(tags=["Workspaces"])
logger = logging.getLogger(__name__)


# ========================================
# Request/Response Models
# ========================================

class GenerateWorkspaceRequest(BaseModel):
    """Request to generate new workspace with AI"""
    workspace_name: str = Field(..., min_length=1, max_length=100, description="Workspace name")
    business_description: str = Field(..., min_length=10, max_length=1000, description="Business description")
    industry: Optional[str] = Field(None, description="Industry type")
    num_entities: Optional[int] = Field(None, ge=2, le=10, description="Number of entities to generate")
    
    model_config = {"from_attributes": True}


class CreateWorkspaceRequest(BaseModel):
    """Request to create workspace manually"""
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    description: Optional[str] = Field(None, max_length=500)
    subscription_tier: str = Field(default="free", pattern=r"^(free|starter|professional|enterprise)$")
    
    model_config = {"from_attributes": True}


class UpdateWorkspaceRequest(BaseModel):
    """Request to update workspace"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    
    model_config = {"from_attributes": True}


class CreateEntityRequest(BaseModel):
    """Request to create entity"""
    entity_name: str = Field(..., min_length=1, max_length=100)
    display_name: str = Field(..., min_length=1, max_length=200)
    display_name_singular: str = Field(..., min_length=1, max_length=200)
    icon: str = Field(default="DatabaseIcon", max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    fields: List[Dict[str, Any]] = Field(..., min_items=1)
    views_config: Optional[Dict[str, Any]] = Field(default_factory=dict)
    
    model_config = {"from_attributes": True}


class UpdateEntityRequest(BaseModel):
    """Request to update entity"""
    display_name: Optional[str] = Field(None, min_length=1, max_length=200)
    display_name_singular: Optional[str] = Field(None, min_length=1, max_length=200)
    icon: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    fields: Optional[List[Dict[str, Any]]] = None
    views_config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    
    model_config = {"from_attributes": True}


class UpdateMemberRoleRequest(BaseModel):
    """Request to update member role"""
    role: str = Field(..., pattern=r"^(admin|member)$")
    
    model_config = {"from_attributes": True}


# ========================================
# Workspace Endpoints
# ========================================

@router.post("/generate", response_model=SuccessResponse[Dict[str, Any]])
async def generate_workspace_with_ai(
    request: GenerateWorkspaceRequest,
    user: Dict[str, Any] = Depends(get_current_user)
) -> SuccessResponse:
    """
    Generate new workspace with AI-powered configuration
    
    **Requires:** Authentication
    
    **Process:**
    1. Generate CRM config using OpenAI GPT-4
    2. Create workspace in database
    3. Add creator as owner
    4. Create all entities and fields
    5. Create suggested automation rules
    
    **Example:**
    ```json
    {
      "workspace_name": "Acme Real Estate",
      "business_description": "Real estate agency managing residential properties",
      "industry": "real_estate",
      "num_entities": 4
    }
    ```
    
    **Returns:** Workspace details with all entities
    """
    try:
        logger.info(f"User {user['email']} generating workspace: {request.workspace_name}")
        
        # 1. Generate config using AI
        config, metadata = await generate_crm_config(
            business_description=request.business_description,
            industry=request.industry,
            num_entities=request.num_entities
        )
        
        logger.info(
            f"Generated config: {len(config.entities)} entities, "
            f"Tokens: {metadata.tokens_used}"
        )
        
        # 2. Create workspace
        client = get_client(use_service_role=True)
        
        # Generate slug from name
        import uuid
        slug = request.workspace_name.lower().replace(" ", "-").replace("_", "-")
        slug = "".join(c for c in slug if c.isalnum() or c == "-")[:90]

        # Add unique suffix to avoid conflicts
        unique_suffix = str(uuid.uuid4())[:8]
        slug = f"{slug}-{unique_suffix}" if slug else unique_suffix

        workspace_data = {
            "name": request.workspace_name,
            "slug": slug,
            "owner_id": user["id"],
            "subscription_tier": "free",
            "config": {
                "industry": config.industry,
                "description": config.workspace_description,
                "generated_with_ai": True,
                "tokens_used": metadata.tokens_used
            },
            "is_active": True
        }

        workspace_result = client.table("workspaces").insert(workspace_data).execute()
        workspace = workspace_result.data[0]
        workspace_id = workspace["id"]
        
        logger.info(f"Created workspace: {workspace_id}")
        
        # 3. Add creator as owner (should happen automatically via trigger, but ensure it)
        try:
            client.table("workspace_members").insert({
                "workspace_id": workspace_id,
                "user_id": user["id"],
                "role": "owner",
                "invited_by": user["id"]
            }).execute()
        except Exception as e:
            # May already exist from trigger
            logger.info(f"Member creation handled by trigger: {str(e)}")
        
        # 4. Create entities
        created_entities = []
        for entity_config in config.entities:
            entity_data = {
                "workspace_id": workspace_id,
                "entity_name": entity_config.entity_name,
                "display_name": entity_config.display_name,
                "display_name_singular": entity_config.display_name_singular,
                "icon": entity_config.icon,
                "color": entity_config.color,
                "description": entity_config.description,
                "fields": [field.model_dump() for field in entity_config.fields],
                "views": entity_config.views,
                "default_view": entity_config.default_view,
                "is_system": False,
                "created_by": user["id"]
            }
            
            entity_result = client.table("crm_entities").insert(entity_data).execute()
            created_entities.append(entity_result.data[0])
        
        logger.info(f"Created {len(created_entities)} entities")
        
        # 5. Create automation rules
        created_automations = []
        for automation in config.suggested_automations:
            # Find entity_id by entity_name
            entity_id = None
            if automation.entity_name:
                for entity in created_entities:
                    if entity["entity_name"] == automation.entity_name:
                        entity_id = entity["id"]
                        break
            
            automation_data = {
                "workspace_id": workspace_id,
                "entity_id": entity_id,
                "name": automation.name,
                "description": automation.description,
                "trigger_type": automation.trigger_type,
                "trigger_config": automation.trigger_config,
                "action_type": automation.action_type,
                "action_config": automation.action_config,
                "is_active": automation.enabled,
                "created_by": user["id"]
            }
            
            automation_result = client.table("automation_rules").insert(automation_data).execute()
            created_automations.append(automation_result.data[0])
        
        logger.info(f"Created {len(created_automations)} automation rules")
        
        # 6. Return complete workspace data
        return SuccessResponse(
            data={
                "workspace": workspace,
                "entities": created_entities,
                "automations": created_automations,
                "metadata": metadata.model_dump(),
                "total_entities": len(created_entities),
                "total_automations": len(created_automations)
            },
            message=f"Workspace '{request.workspace_name}' created successfully with {len(created_entities)} entities"
        )
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to generate workspace: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create workspace. Please try again."
        )


@router.post("", response_model=SuccessResponse[Dict[str, Any]])
async def create_workspace_manual(
    request: CreateWorkspaceRequest,
    user: Dict[str, Any] = Depends(get_current_user)
) -> SuccessResponse:
    """
    Create workspace manually (without AI)
    
    **Requires:** Authentication
    
    **Example:**
    ```json
    {
      "name": "My CRM",
      "slug": "my-crm",
      "description": "Custom CRM workspace",
      "subscription_tier": "free"
    }
    ```
    """
    try:
        client = get_client(use_service_role=True)
        
        # Check if slug is taken
        existing = client.table("workspaces") \
            .select("id") \
            .eq("slug", request.slug) \
            .execute()
        
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workspace slug already taken"
            )
        
        workspace_data = {
            "name": request.name,
            "slug": request.slug,
            "description": request.description,
            "owner_id": user["id"],
            "subscription_tier": request.subscription_tier,
            "is_active": True
        }
        
        result = client.table("workspaces").insert(workspace_data).execute()
        workspace = result.data[0]
        
        logger.info(f"User {user['email']} created workspace: {workspace['id']}")
        
        return SuccessResponse(
            data={"workspace": workspace},
            message=f"Workspace '{request.name}' created successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create workspace: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create workspace"
        )


@router.get("", response_model=SuccessResponse[Dict[str, Any]])
async def list_user_workspaces(
    user: Dict[str, Any] = Depends(get_current_user)
) -> SuccessResponse:
    """
    List all workspaces user has access to
    
    **Requires:** Authentication
    
    **Returns:** List of workspaces with user's role in each
    """
    try:
        client = get_client(use_service_role=True)
        
        # Get workspaces where user is a member
        result = client.table("workspace_members") \
            .select("workspace_id, role, joined_at, workspaces(*)") \
            .eq("user_id", user["id"]) \
            .execute()
        
        workspaces = []
        for item in result.data:
            workspace_data = item.get("workspaces", {})
            workspace_data["user_role"] = item["role"]
            workspace_data["user_joined_at"] = item["joined_at"]
            workspaces.append(workspace_data)
        
        logger.info(f"User {user['email']} has access to {len(workspaces)} workspaces")
        
        return SuccessResponse(
            data={
                "workspaces": workspaces,
                "total": len(workspaces)
            },
            message=f"Found {len(workspaces)} workspaces"
        )
        
    except Exception as e:
        logger.error(f"Failed to list workspaces: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve workspaces"
        )


@router.get("/{workspace_id}", response_model=SuccessResponse[Dict[str, Any]])
async def get_workspace_details(
    workspace_id: str,
    member: Dict[str, Any] = Depends(require_workspace_access)
) -> SuccessResponse:
    """
    Get workspace details with all entities
    
    **Requires:** Workspace membership
    
    **Returns:** Complete workspace data including entities and record counts
    """
    try:
        client = get_client(use_service_role=True)
        
        workspace = member["workspace"]
        
        # Get all entities
        entities_result = client.table("crm_entities") \
            .select("*") \
            .eq("workspace_id", workspace_id) \
            .eq("is_active", True) \
            .order("created_at") \
            .execute()
        
        entities = entities_result.data
        
        # Get record counts for each entity
        for entity in entities:
            count_result = client.table("crm_records") \
                .select("id", count="exact") \
                .eq("entity_id", entity["id"]) \
                .eq("is_archived", False) \
                .execute()
            
            entity["record_count"] = count_result.count if hasattr(count_result, 'count') else 0
        
        # Get member count
        members_result = client.table("workspace_members") \
            .select("id", count="exact") \
            .eq("workspace_id", workspace_id) \
            .execute()
        
        member_count = members_result.count if hasattr(members_result, 'count') else 0
        
        return SuccessResponse(
            data={
                "workspace": workspace,
                "entities": entities,
                "user_role": member["role"],
                "stats": {
                    "total_entities": len(entities),
                    "total_members": member_count
                }
            },
            message="Workspace details retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Failed to get workspace details: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve workspace details"
        )


@router.put("/{workspace_id}", response_model=SuccessResponse[Dict[str, Any]])
async def update_workspace(
    workspace_id: str,
    request: UpdateWorkspaceRequest,
    member: Dict[str, Any] = Depends(require_admin_access)
) -> SuccessResponse:
    """
    Update workspace settings
    
    **Requires:** Admin or owner role
    """
    try:
        client = get_client(use_service_role=True)
        
        update_data = {}
        if request.name is not None:
            update_data["name"] = request.name
        if request.description is not None:
            update_data["description"] = request.description
        if request.config is not None:
            update_data["config"] = request.config
        if request.is_active is not None:
            update_data["is_active"] = request.is_active
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        result = client.table("workspaces") \
            .update(update_data) \
            .eq("id", workspace_id) \
            .execute()
        
        workspace = result.data[0] if result.data else None
        
        logger.info(f"Workspace {workspace_id} updated by user")
        
        return SuccessResponse(
            data={"workspace": workspace},
            message="Workspace updated successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update workspace: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update workspace"
        )


@router.delete("/{workspace_id}", response_model=SuccessResponse[Dict[str, Any]])
async def delete_workspace(
    workspace_id: str,
    member: Dict[str, Any] = Depends(require_owner_access)
) -> SuccessResponse:
    """
    Delete workspace (owner only)
    
    **Requires:** Owner role
    
    **Warning:** This will delete all entities, records, and data. Cannot be undone.
    """
    try:
        client = get_client(use_service_role=True)
        
        # Soft delete (set is_active = false)
        client.table("workspaces") \
            .update({"is_active": False}) \
            .eq("id", workspace_id) \
            .execute()
        
        logger.warning(f"Workspace {workspace_id} deleted (soft delete)")
        
        return SuccessResponse(
            data={"workspace_id": workspace_id, "deleted": True},
            message="Workspace deleted successfully"
        )
        
    except Exception as e:
        logger.error(f"Failed to delete workspace: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete workspace"
        )


# ========================================
# Entity Endpoints
# ========================================

@router.get("/{workspace_id}/entities", response_model=SuccessResponse[Dict[str, Any]])
async def list_entities(
    workspace_id: str,
    member: Dict[str, Any] = Depends(require_workspace_access)
) -> SuccessResponse:
    """
    List all entities in workspace
    
    **Requires:** Workspace membership
    """
    try:
        client = get_client(use_service_role=True)
        
        result = client.table("crm_entities") \
            .select("*") \
            .eq("workspace_id", workspace_id) \
            .eq("is_active", True) \
            .order("created_at") \
            .execute()
        
        entities = result.data
        
        # Add record counts
        for entity in entities:
            count_result = client.table("crm_records") \
                .select("id", count="exact") \
                .eq("entity_id", entity["id"]) \
                .eq("is_archived", False) \
                .execute()
            
            entity["record_count"] = count_result.count if hasattr(count_result, 'count') else 0
        
        return SuccessResponse(
            data={
                "entities": entities,
                "total": len(entities)
            },
            message=f"Found {len(entities)} entities"
        )
        
    except Exception as e:
        logger.error(f"Failed to list entities: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve entities"
        )


@router.post("/{workspace_id}/entities", response_model=SuccessResponse[Dict[str, Any]])
async def create_entity(
    workspace_id: str,
    request: CreateEntityRequest,
    member: Dict[str, Any] = Depends(require_admin_access)
) -> SuccessResponse:
    """
    Create new entity in workspace
    
    **Requires:** Admin or owner role
    """
    try:
        client = get_client(use_service_role=True)
        
        # Check if entity name already exists
        existing = client.table("crm_entities") \
            .select("id") \
            .eq("workspace_id", workspace_id) \
            .eq("entity_name", request.entity_name) \
            .execute()
        
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Entity '{request.entity_name}' already exists"
            )
        
        entity_data = {
            "workspace_id": workspace_id,
            "entity_name": request.entity_name,
            "display_name": request.display_name,
            "display_name_singular": request.display_name_singular,
            "icon": request.icon,
            "description": request.description,
            "fields": request.fields,
            "views_config": request.views_config,
            "is_system": False,
            "is_active": True
        }
        
        result = client.table("crm_entities").insert(entity_data).execute()
        entity = result.data[0]
        
        logger.info(f"Entity '{request.entity_name}' created in workspace {workspace_id}")
        
        return SuccessResponse(
            data={"entity": entity},
            message=f"Entity '{request.display_name}' created successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create entity: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create entity"
        )


@router.put("/{workspace_id}/entities/{entity_id}", response_model=SuccessResponse[Dict[str, Any]])
async def update_entity(
    workspace_id: str,
    entity_id: str,
    request: UpdateEntityRequest,
    member: Dict[str, Any] = Depends(require_admin_access)
) -> SuccessResponse:
    """
    Update entity configuration
    
    **Requires:** Admin or owner role
    """
    try:
        client = get_client(use_service_role=True)
        
        update_data = {}
        if request.display_name is not None:
            update_data["display_name"] = request.display_name
        if request.display_name_singular is not None:
            update_data["display_name_singular"] = request.display_name_singular
        if request.icon is not None:
            update_data["icon"] = request.icon
        if request.description is not None:
            update_data["description"] = request.description
        if request.fields is not None:
            update_data["fields"] = request.fields
        if request.views_config is not None:
            update_data["views_config"] = request.views_config
        if request.is_active is not None:
            update_data["is_active"] = request.is_active
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        result = client.table("crm_entities") \
            .update(update_data) \
            .eq("id", entity_id) \
            .eq("workspace_id", workspace_id) \
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entity not found"
            )
        
        entity = result.data[0]
        
        logger.info(f"Entity {entity_id} updated in workspace {workspace_id}")
        
        return SuccessResponse(
            data={"entity": entity},
            message="Entity updated successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update entity: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update entity"
        )


@router.delete("/{workspace_id}/entities/{entity_id}", response_model=SuccessResponse[Dict[str, Any]])
async def delete_entity(
    workspace_id: str,
    entity_id: str,
    member: Dict[str, Any] = Depends(require_owner_access)
) -> SuccessResponse:
    """
    Delete entity and all its records
    
    **Requires:** Owner role
    
    **Warning:** This will delete all records. Cannot be undone.
    """
    try:
        client = get_client(use_service_role=True)
        
        # Soft delete (CASCADE will handle records)
        result = client.table("crm_entities") \
            .update({"is_active": False}) \
            .eq("id", entity_id) \
            .eq("workspace_id", workspace_id) \
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entity not found"
            )
        
        logger.warning(f"Entity {entity_id} deleted from workspace {workspace_id}")
        
        return SuccessResponse(
            data={"entity_id": entity_id, "deleted": True},
            message="Entity deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete entity: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete entity"
        )


# ========================================
# Team Management Endpoints
# ========================================

@router.get("/{workspace_id}/members", response_model=SuccessResponse[Dict[str, Any]])
async def list_workspace_members(
    workspace_id: str,
    member: Dict[str, Any] = Depends(require_workspace_access)
) -> SuccessResponse:
    """
    List all team members in workspace
    
    **Requires:** Workspace membership
    """
    try:
        client = get_client(use_service_role=True)
        
        # Get members with user profiles
        result = client.table("workspace_members") \
            .select("*, user_profiles(id, email, full_name, avatar_url)") \
            .eq("workspace_id", workspace_id) \
            .order("joined_at") \
            .execute()
        
        members = []
        for m in result.data:
            user_profile = m.get("user_profiles", {}) or {}
            members.append({
                "user_id": m["user_id"],
                "email": user_profile.get("email"),
                "full_name": user_profile.get("full_name"),
                "avatar_url": user_profile.get("avatar_url"),
                "role": m["role"],
                "joined_at": m["joined_at"],
                "invited_by": m.get("invited_by")
            })
        
        return SuccessResponse(
            data={
                "members": members,
                "total": len(members)
            },
            message=f"Found {len(members)} members"
        )
        
    except Exception as e:
        logger.error(f"Failed to list members: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve members"
        )


@router.post("/{workspace_id}/invite", response_model=SuccessResponse[Dict[str, Any]])
async def invite_member_to_workspace(
    workspace_id: str,
    invite: InviteRequest,
    member: Dict[str, Any] = Depends(require_admin_access),
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> SuccessResponse:
    """
    Invite user to workspace
    
    **Requires:** Admin or owner role
    
    **Process:**
    - If user exists: Add directly to workspace
    - If user doesn't exist: Create invitation for signup
    """
    try:
        client = get_client(use_service_role=True)
        
        # Check if user exists
        user_result = client.table("user_profiles") \
            .select("id, email, full_name") \
            .eq("email", invite.email) \
            .execute()
        
        if not user_result.data:
            # TODO: Create invitation and send email
            logger.info(f"Invitation would be sent to {invite.email} (not implemented)")
            return SuccessResponse(
                data={
                    "status": "invitation_sent",
                    "email": invite.email,
                    "message": "Invitation email will be sent (email service not yet configured)"
                },
                message=f"Invitation prepared for {invite.email}"
            )
        
        # User exists - add directly
        invited_user = user_result.data[0]
        
        # Check if already a member
        existing = client.table("workspace_members") \
            .select("id, role") \
            .eq("workspace_id", workspace_id) \
            .eq("user_id", invited_user["id"]) \
            .execute()
        
        if existing.data:
            return SuccessResponse(
                data={
                    "status": "already_member",
                    "existing_role": existing.data[0]["role"]
                },
                message=f"User is already a {existing.data[0]['role']}"
            )
        
        # Add to workspace
        member_data = {
            "workspace_id": workspace_id,
            "user_id": invited_user["id"],
            "role": invite.role,
            "invited_by": current_user["id"]
        }
        
        result = client.table("workspace_members").insert(member_data).execute()
        new_member = result.data[0]
        
        logger.info(f"User {invite.email} added to workspace {workspace_id} as {invite.role}")
        
        # TODO: Send notification email
        
        return SuccessResponse(
            data={
                "status": "added",
                "member": new_member,
                "user": invited_user
            },
            message=f"{invited_user.get('full_name') or invite.email} added as {invite.role}"
        )
        
    except Exception as e:
        logger.error(f"Failed to invite member: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to invite member"
        )


@router.put("/{workspace_id}/members/{user_id}/role", response_model=SuccessResponse[Dict[str, Any]])
async def update_member_role(
    workspace_id: str,
    user_id: str,
    request: UpdateMemberRoleRequest,
    member: Dict[str, Any] = Depends(require_owner_access)
) -> SuccessResponse:
    """
    Update member role
    
    **Requires:** Owner role
    
    **Note:** Cannot change owner role
    """
    try:
        client = get_client(use_service_role=True)
        
        # Get target member
        target_result = client.table("workspace_members") \
            .select("*") \
            .eq("workspace_id", workspace_id) \
            .eq("user_id", user_id) \
            .execute()
        
        if not target_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found"
            )
        
        target_member = target_result.data[0]
        
        if target_member["role"] == "owner":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot change owner role. Use transfer ownership instead."
            )
        
        # Update role
        result = client.table("workspace_members") \
            .update({"role": request.role}) \
            .eq("workspace_id", workspace_id) \
            .eq("user_id", user_id) \
            .execute()
        
        updated_member = result.data[0]
        
        logger.info(f"Member {user_id} role updated to {request.role} in workspace {workspace_id}")
        
        return SuccessResponse(
            data={"member": updated_member},
            message=f"Member role updated to {request.role}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update member role: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update member role"
        )


@router.delete("/{workspace_id}/members/{user_id}", response_model=SuccessResponse[Dict[str, Any]])
async def remove_member_from_workspace(
    workspace_id: str,
    user_id: str,
    member: Dict[str, Any] = Depends(require_admin_access)
) -> SuccessResponse:
    """
    Remove member from workspace
    
    **Requires:** Admin or owner role
    
    **Note:** Cannot remove owner
    """
    try:
        client = get_client(use_service_role=True)
        
        # Get target member
        target_result = client.table("workspace_members") \
            .select("*") \
            .eq("workspace_id", workspace_id) \
            .eq("user_id", user_id) \
            .execute()
        
        if not target_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found"
            )
        
        target_member = target_result.data[0]
        
        if target_member["role"] == "owner":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove owner. Transfer ownership first."
            )
        
        # Remove member
        client.table("workspace_members") \
            .delete() \
            .eq("workspace_id", workspace_id) \
            .eq("user_id", user_id) \
            .execute()
        
        logger.info(f"Member {user_id} removed from workspace {workspace_id}")
        
        return SuccessResponse(
            data={
                "user_id": user_id,
                "removed": True
            },
            message="Member removed from workspace"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to remove member: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove member"
        )


# ========================================
# Export
# ========================================

__all__ = ["router"]

"""
Automation Rules API
CRUD operations for workspace automation rules
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
import logging

from ..middleware.auth import get_current_user, require_workspace_access, require_workspace_admin
from ..models.base import SuccessResponse, ErrorResponse
from supabase_config.config import get_supabase_client
from ..services.automation_executor import trigger_automations

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/workspaces/{workspace_id}/automations", tags=["automations"])


# Pydantic Models
class TriggerConfig(BaseModel):
    """Trigger configuration"""
    from_status: Optional[str] = None
    to_status: Optional[str] = None
    field_name: Optional[str] = None


class ActionConfig(BaseModel):
    """Action configuration"""
    # Email action
    subject: Optional[str] = None
    body: Optional[str] = None
    to_email: Optional[str] = None
    
    # Webhook action
    url: Optional[str] = None
    method: Optional[str] = Field(default="POST")
    headers: Optional[dict] = None
    
    # Update field action
    field_name: Optional[str] = None
    new_value: Optional[str] = None
    
    # Task action
    title: Optional[str] = None
    description: Optional[str] = None


class CreateAutomationRequest(BaseModel):
    """Request to create automation"""
    name: str = Field(..., min_length=1, max_length=255)
    entity_id: str
    trigger_type: str = Field(..., pattern="^(status_changed|record_created|field_updated|record_deleted)$")
    trigger_config: TriggerConfig = Field(default_factory=TriggerConfig)
    action_type: str = Field(..., pattern="^(send_email|webhook|update_field|create_task)$")
    action_config: ActionConfig = Field(default_factory=ActionConfig)
    is_active: bool = Field(default=True)


class UpdateAutomationRequest(BaseModel):
    """Request to update automation"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    is_active: Optional[bool] = None
    trigger_config: Optional[TriggerConfig] = None
    action_config: Optional[ActionConfig] = None


class TestAutomationRequest(BaseModel):
    """Request to test automation"""
    record_id: str


class AutomationResponse(BaseModel):
    """Automation rule response"""
    id: str
    workspace_id: str
    entity_id: str
    name: str
    trigger_type: str
    trigger_config: dict
    action_type: str
    action_config: dict
    is_active: bool
    created_at: str
    updated_at: Optional[str] = None


@router.get("", response_model=SuccessResponse)
async def list_automations(
    workspace_id: str,
    entity_id: Optional[str] = None,
    is_active: Optional[bool] = None,
    user=Depends(get_current_user),
    _=Depends(require_workspace_access)
):
    """
    List all automation rules for workspace
    
    Query params:
    - entity_id: Filter by entity
    - is_active: Filter by active status
    """
    try:
        supabase = get_supabase_client()
        
        # Build query
        query = supabase.table("automation_rules")\
            .select("*")\
            .eq("workspace_id", workspace_id)\
            .order("created_at", desc=True)
        
        # Apply filters
        if entity_id:
            query = query.eq("entity_id", entity_id)
        if is_active is not None:
            query = query.eq("is_active", is_active)
        
        response = query.execute()
        
        automations = response.data if response.data else []
        
        return SuccessResponse(
            success=True,
            message=f"Retrieved {len(automations)} automation(s)",
            data={
                "automations": automations,
                "total": len(automations)
            }
        )
    
    except Exception as e:
        logger.error(f"Error listing automations: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("", response_model=SuccessResponse, status_code=status.HTTP_201_CREATED)
async def create_automation(
    workspace_id: str,
    request: CreateAutomationRequest,
    user=Depends(get_current_user),
    _=Depends(require_workspace_admin)
):
    """
    Create new automation rule
    
    Requires: Admin or Owner role
    """
    try:
        supabase = get_supabase_client()
        
        # Verify entity exists
        entity_response = supabase.table("entities")\
            .select("id")\
            .eq("id", request.entity_id)\
            .eq("workspace_id", workspace_id)\
            .single()\
            .execute()
        
        if not entity_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entity not found in workspace"
            )
        
        # Validate action config based on action type
        _validate_action_config(request.action_type, request.action_config)
        
        # Create automation
        automation_data = {
            "workspace_id": workspace_id,
            "entity_id": request.entity_id,
            "name": request.name,
            "trigger_type": request.trigger_type,
            "trigger_config": request.trigger_config.dict(exclude_none=True),
            "action_type": request.action_type,
            "action_config": request.action_config.dict(exclude_none=True),
            "is_active": request.is_active
        }
        
        response = supabase.table("automation_rules")\
            .insert(automation_data)\
            .execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create automation"
            )
        
        automation = response.data[0]
        
        logger.info(f"Created automation {automation['id']} in workspace {workspace_id}")
        
        return SuccessResponse(
            success=True,
            message="Automation created successfully",
            data={"automation": automation}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating automation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{automation_id}", response_model=SuccessResponse)
async def get_automation(
    workspace_id: str,
    automation_id: str,
    user=Depends(get_current_user),
    _=Depends(require_workspace_access)
):
    """Get automation by ID"""
    try:
        supabase = get_supabase_client()
        
        response = supabase.table("automation_rules")\
            .select("*")\
            .eq("id", automation_id)\
            .eq("workspace_id", workspace_id)\
            .single()\
            .execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Automation not found"
            )
        
        return SuccessResponse(
            success=True,
            message="Automation retrieved successfully",
            data={"automation": response.data}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting automation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put("/{automation_id}", response_model=SuccessResponse)
async def update_automation(
    workspace_id: str,
    automation_id: str,
    request: UpdateAutomationRequest,
    user=Depends(get_current_user),
    _=Depends(require_workspace_admin)
):
    """
    Update automation rule
    
    Requires: Admin or Owner role
    """
    try:
        supabase = get_supabase_client()
        
        # Build update data
        update_data = {}
        if request.name is not None:
            update_data["name"] = request.name
        if request.is_active is not None:
            update_data["is_active"] = request.is_active
        if request.trigger_config is not None:
            update_data["trigger_config"] = request.trigger_config.dict(exclude_none=True)
        if request.action_config is not None:
            update_data["action_config"] = request.action_config.dict(exclude_none=True)
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        # Update automation
        response = supabase.table("automation_rules")\
            .update(update_data)\
            .eq("id", automation_id)\
            .eq("workspace_id", workspace_id)\
            .execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Automation not found"
            )
        
        automation = response.data[0]
        
        logger.info(f"Updated automation {automation_id}")
        
        return SuccessResponse(
            success=True,
            message="Automation updated successfully",
            data={"automation": automation}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating automation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/{automation_id}", response_model=SuccessResponse)
async def delete_automation(
    workspace_id: str,
    automation_id: str,
    user=Depends(get_current_user),
    _=Depends(require_workspace_admin)
):
    """
    Delete automation rule
    
    Requires: Admin or Owner role
    """
    try:
        supabase = get_supabase_client()
        
        response = supabase.table("automation_rules")\
            .delete()\
            .eq("id", automation_id)\
            .eq("workspace_id", workspace_id)\
            .execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Automation not found"
            )
        
        logger.info(f"Deleted automation {automation_id}")
        
        return SuccessResponse(
            success=True,
            message="Automation deleted successfully",
            data={}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting automation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/{automation_id}/test", response_model=SuccessResponse)
async def test_automation(
    workspace_id: str,
    automation_id: str,
    request: TestAutomationRequest,
    user=Depends(get_current_user),
    _=Depends(require_workspace_admin)
):
    """
    Test automation with a specific record
    
    Requires: Admin or Owner role
    """
    try:
        supabase = get_supabase_client()
        
        # Get automation
        automation_response = supabase.table("automation_rules")\
            .select("*")\
            .eq("id", automation_id)\
            .eq("workspace_id", workspace_id)\
            .single()\
            .execute()
        
        if not automation_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Automation not found"
            )
        
        automation = automation_response.data
        
        # Get record
        record_response = supabase.table("records")\
            .select("*")\
            .eq("id", request.record_id)\
            .eq("entity_id", automation["entity_id"])\
            .single()\
            .execute()
        
        if not record_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Record not found"
            )
        
        record = record_response.data
        
        # Execute automation (test mode)
        from ..services.automation_executor import AutomationExecutor
        
        executor = AutomationExecutor()
        result = await executor.execute(
            automation,
            record,
            workspace_id,
            automation["entity_id"]
        )
        
        logger.info(f"Tested automation {automation_id} with record {request.record_id}")
        
        return SuccessResponse(
            success=True,
            message="Automation test completed",
            data={
                "test_result": result,
                "automation": automation,
                "record_id": request.record_id
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error testing automation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/{automation_id}/logs", response_model=SuccessResponse)
async def get_automation_logs(
    workspace_id: str,
    automation_id: str,
    limit: int = 50,
    user=Depends(get_current_user),
    _=Depends(require_workspace_access)
):
    """Get execution logs for automation"""
    try:
        supabase = get_supabase_client()
        
        # Verify automation exists
        automation_response = supabase.table("automation_rules")\
            .select("id")\
            .eq("id", automation_id)\
            .eq("workspace_id", workspace_id)\
            .single()\
            .execute()
        
        if not automation_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Automation not found"
            )
        
        # Get logs
        logs_response = supabase.table("automation_logs")\
            .select("*")\
            .eq("automation_id", automation_id)\
            .order("executed_at", desc=True)\
            .limit(limit)\
            .execute()
        
        logs = logs_response.data if logs_response.data else []
        
        return SuccessResponse(
            success=True,
            message=f"Retrieved {len(logs)} log(s)",
            data={
                "logs": logs,
                "total": len(logs)
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting automation logs: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# Helper functions
def _validate_action_config(action_type: str, config: ActionConfig):
    """Validate action configuration"""
    if action_type == "send_email":
        if not config.subject or not config.body:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email action requires subject and body"
            )
    
    elif action_type == "webhook":
        if not config.url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Webhook action requires URL"
            )
        if config.method not in ["POST", "PUT", "PATCH"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid HTTP method"
            )
    
    elif action_type == "update_field":
        if not config.field_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Update field action requires field_name"
            )
    
    elif action_type == "create_task":
        if not config.title:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Create task action requires title"
            )

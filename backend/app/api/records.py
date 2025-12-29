"""
CRM Record Management API
CRUD operations for CRM records with field validation and access control
"""
from fastapi import APIRouter, Query, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Any, Optional
import logging
import json
import re
from datetime import datetime

from app.models.base import SuccessResponse, PaginatedResponse, PaginationMeta
from app.middleware import require_workspace_access, require_admin_access, get_current_user
from app.utils.supabase_client import get_client
from app.config import settings

router = APIRouter(tags=["Records"])
logger = logging.getLogger(__name__)


# ========================================
# Request/Response Models
# ========================================

class RecordCreate(BaseModel):
    """Request to create a record"""
    data: Dict[str, Any] = Field(..., description="Record data as key-value pairs")
    tags: Optional[List[str]] = Field(default_factory=list, description="Tags for the record")
    
    model_config = {"from_attributes": True}


class RecordUpdate(BaseModel):
    """Request to update a record"""
    data: Dict[str, Any] = Field(..., description="Updated record data")
    tags: Optional[List[str]] = Field(None, description="Updated tags")
    is_archived: Optional[bool] = Field(None, description="Archive status")
    
    model_config = {"from_attributes": True}


class RecordBulkUpdate(BaseModel):
    """Request to bulk update records"""
    record_ids: List[str] = Field(..., min_items=1, description="List of record IDs to update")
    data: Dict[str, Any] = Field(..., description="Data to update")
    
    model_config = {"from_attributes": True}


class RecordBulkDelete(BaseModel):
    """Request to bulk delete records"""
    record_ids: List[str] = Field(..., min_items=1, description="List of record IDs to delete")
    
    model_config = {"from_attributes": True}


# ========================================
# Validation Helpers
# ========================================

def validate_record_data(
    data: Dict[str, Any],
    fields: List[Dict[str, Any]],
    is_update: bool = False
) -> Dict[str, Any]:
    """
    Validate record data against entity field schema
    
    Args:
        data: Record data to validate
        fields: Entity field definitions
        is_update: Whether this is an update (allows partial data)
        
    Returns:
        Validated data dictionary
        
    Raises:
        HTTPException: If validation fails
    """
    validated = {}
    errors = []
    
    # Create field map for quick lookup
    field_map = {field["name"]: field for field in fields}
    
    # Validate each field
    for field in fields:
        field_name = field["name"]
        field_type = field["type"]
        field_label = field.get("display_name", field_name)
        required = field.get("required", False)
        value = data.get(field_name)
        
        # Check required fields (only for create, not update)
        if not is_update and required and (value is None or value == ""):
            errors.append(f"Field '{field_label}' is required")
            continue
        
        # Skip validation if value is None and field is not required
        if value is None:
            if not required:
                continue
            elif is_update:
                continue
        
        # Skip empty strings for non-required fields
        if value == "" and not required:
            validated[field_name] = value
            continue
        
        # Type-specific validation
        try:
            validated_value = validate_field_value(value, field)
            validated[field_name] = validated_value
        except ValueError as e:
            errors.append(f"{field_label}: {str(e)}")
    
    # Check for unknown fields
    for key in data.keys():
        if key not in field_map:
            logger.warning(f"Unknown field '{key}' in record data")
    
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Validation failed",
                "errors": errors
            }
        )
    
    return validated


def validate_field_value(value: Any, field: Dict[str, Any]) -> Any:
    """
    Validate a single field value
    
    Args:
        value: Field value to validate
        field: Field definition
        
    Returns:
        Validated value (may be transformed)
        
    Raises:
        ValueError: If validation fails
    """
    field_type = field["type"]
    field_label = field.get("display_name", field["name"])
    
    # Text validation
    if field_type in ["text", "textarea"]:
        if not isinstance(value, str):
            raise ValueError("Must be text")
        max_length = field.get("validation", {}).get("max_length")
        if max_length and len(value) > max_length:
            raise ValueError(f"Maximum length is {max_length} characters")
        return value
    
    # Email validation
    elif field_type == "email":
        if not isinstance(value, str):
            raise ValueError("Must be a string")
        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_pattern, value):
            raise ValueError("Invalid email format")
        return value.lower()
    
    # Phone validation
    elif field_type == "phone":
        if not isinstance(value, str):
            raise ValueError("Must be a string")
        # Basic phone validation (remove spaces, dashes, etc.)
        phone = re.sub(r"[^\d+]", "", value)
        if len(phone) < 10:
            raise ValueError("Invalid phone number")
        return value
    
    # Number validation
    elif field_type in ["number", "currency"]:
        try:
            num_value = float(value)
        except (ValueError, TypeError):
            raise ValueError("Must be a number")
        
        # Check min/max
        validation = field.get("validation", {})
        if "min" in validation and num_value < validation["min"]:
            raise ValueError(f"Must be at least {validation['min']}")
        if "max" in validation and num_value > validation["max"]:
            raise ValueError(f"Must be at most {validation['max']}")
        
        return num_value
    
    # Select validation
    elif field_type == "select":
        options = field.get("options", [])
        if not options:
            return value
        if value not in options:
            raise ValueError(f"Must be one of: {', '.join(options)}")
        return value
    
    # Multiselect validation
    elif field_type == "multiselect":
        if not isinstance(value, list):
            raise ValueError("Must be a list")
        options = field.get("options", [])
        if options:
            for item in value:
                if item not in options:
                    raise ValueError(f"'{item}' is not a valid option")
        return value
    
    # Checkbox validation
    elif field_type == "checkbox":
        if not isinstance(value, bool):
            raise ValueError("Must be true or false")
        return value
    
    # Date validation
    elif field_type == "date":
        if isinstance(value, str):
            try:
                # Validate ISO date format
                datetime.fromisoformat(value.replace('Z', '+00:00'))
                return value
            except ValueError:
                raise ValueError("Invalid date format (use YYYY-MM-DD)")
        return value
    
    # Datetime validation
    elif field_type == "datetime":
        if isinstance(value, str):
            try:
                # Validate ISO datetime format
                datetime.fromisoformat(value.replace('Z', '+00:00'))
                return value
            except ValueError:
                raise ValueError("Invalid datetime format (use ISO 8601)")
        return value
    
    # URL validation
    elif field_type == "url":
        if not isinstance(value, str):
            raise ValueError("Must be a string")
        url_pattern = r"^https?:\/\/.+"
        if not re.match(url_pattern, value):
            raise ValueError("Invalid URL format")
        return value
    
    # Default: accept any value
    else:
        return value


# ========================================
# Record Endpoints
# ========================================

@router.get(
    "/{workspace_id}/entities/{entity_id}/records",
    response_model=SuccessResponse[Dict[str, Any]]
)
async def list_records(
    workspace_id: str,
    entity_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=100, description="Records per page"),
    sort_by: Optional[str] = Query(None, description="Field to sort by"),
    sort_order: str = Query("asc", pattern=r"^(asc|desc)$", description="Sort order"),
    search: Optional[str] = Query(None, description="Search query"),
    filters: Optional[str] = Query(None, description="Filters as JSON string"),
    archived: bool = Query(False, description="Include archived records"),
    member: Dict[str, Any] = Depends(require_workspace_access)
) -> SuccessResponse:
    """
    List records with pagination, filtering, and sorting
    
    **Requires:** Workspace membership
    
    **Query Parameters:**
    - `page`: Page number (default: 1)
    - `per_page`: Records per page (default: 50, max: 100)
    - `sort_by`: Field name to sort by (default: created_at)
    - `sort_order`: asc or desc (default: asc)
    - `search`: Search across fields (optional)
    - `filters`: JSON object of field filters (optional)
    - `archived`: Include archived records (default: false)
    
    **Example Filters:**
    ```
    ?filters={"status": "active", "assigned_to": "user_id"}
    ```
    """
    try:
        client = get_client(use_service_role=True)
        
        # Verify entity exists and belongs to workspace
        entity_result = client.table("crm_entities") \
            .select("id, entity_name, display_name") \
            .eq("id", entity_id) \
            .eq("workspace_id", workspace_id) \
            .eq("is_active", True) \
            .maybe_single() \
            .execute()
        
        if not entity_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entity not found"
            )
        
        entity = entity_result.data
        
        # Calculate offset
        offset = (page - 1) * per_page
        
        # Build base query
        query = client.table("crm_records") \
            .select("*", count="exact") \
            .eq("workspace_id", workspace_id) \
            .eq("entity_id", entity_id)
        
        # Filter archived records
        if not archived:
            query = query.eq("is_archived", False)
        
        # Apply filters
        if filters:
            try:
                filter_dict = json.loads(filters)
                for field, value in filter_dict.items():
                    # Use JSONB containment for filtering
                    query = query.contains("data", {field: value})
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid filters JSON"
                )
        
        # Apply search (search across all text fields in data)
        if search:
            # This is a basic implementation
            # For production, you'd want full-text search
            logger.info(f"Search query: {search} (basic implementation)")
        
        # Apply sorting
        if sort_by and sort_by != "created_at":
            # Sort by JSONB field
            order_column = f"data->>{sort_by}"
            query = query.order(order_column, desc=(sort_order == "desc"))
        else:
            # Default sort by created_at
            query = query.order("created_at", desc=(sort_order == "desc"))
        
        # Apply pagination
        query = query.range(offset, offset + per_page - 1)
        
        # Execute query
        result = query.execute()
        
        records = result.data or []
        total = result.count if hasattr(result, 'count') else len(records)
        
        # Calculate pagination metadata
        total_pages = (total + per_page - 1) // per_page if total > 0 else 0
        
        logger.info(
            f"Listed {len(records)} records from entity {entity['display_name']} "
            f"(page {page}/{total_pages})"
        )
        
        return SuccessResponse(
            data={
                "records": records,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "total_pages": total_pages,
                    "has_next": page < total_pages,
                    "has_previous": page > 1
                },
                "entity": entity
            },
            message=f"Found {total} records"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list records: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve records"
        )


@router.post(
    "/{workspace_id}/entities/{entity_id}/records",
    response_model=SuccessResponse[Dict[str, Any]]
)
async def create_record(
    workspace_id: str,
    entity_id: str,
    record: RecordCreate,
    user: Dict[str, Any] = Depends(get_current_user),
    member: Dict[str, Any] = Depends(require_workspace_access)
) -> SuccessResponse:
    """
    Create new record
    
    **Requires:** Workspace membership
    
    **Example:**
    ```json
    {
      "data": {
        "full_name": "John Doe",
        "email": "john@example.com",
        "status": "active"
      },
      "tags": ["lead", "high-priority"]
    }
    ```
    """
    try:
        client = get_client(use_service_role=True)
        
        # 1. Fetch entity configuration
        entity_result = client.table("crm_entities") \
            .select("*") \
            .eq("id", entity_id) \
            .eq("workspace_id", workspace_id) \
            .eq("is_active", True) \
            .maybe_single() \
            .execute()
        
        if not entity_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entity not found"
            )
        
        entity = entity_result.data
        
        # 2. Validate record data
        validated_data = validate_record_data(
            record.data,
            entity["fields"],
            is_update=False
        )
        
        # 3. Create record
        record_data = {
            "workspace_id": workspace_id,
            "entity_id": entity_id,
            "data": validated_data,
            "tags": record.tags or [],
            "created_by": user["id"],
            "is_archived": False
        }
        
        result = client.table("crm_records").insert(record_data).execute()
        created_record = result.data[0]
        
        logger.info(
            f"Record created in entity {entity['display_name']} "
            f"by user {user['email']}"
        )
        
        # TODO: Trigger automations
        # await trigger_automation(workspace_id, entity_id, "record_created", created_record)
        
        return SuccessResponse(
            data={"record": created_record},
            message="Record created successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create record: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create record"
        )


@router.get(
    "/{workspace_id}/entities/{entity_id}/records/{record_id}",
    response_model=SuccessResponse[Dict[str, Any]]
)
async def get_record(
    workspace_id: str,
    entity_id: str,
    record_id: str,
    member: Dict[str, Any] = Depends(require_workspace_access)
) -> SuccessResponse:
    """
    Get single record by ID
    
    **Requires:** Workspace membership
    """
    try:
        client = get_client(use_service_role=True)
        
        result = client.table("crm_records") \
            .select("*") \
            .eq("id", record_id) \
            .eq("workspace_id", workspace_id) \
            .eq("entity_id", entity_id) \
            .maybe_single() \
            .execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Record not found"
            )
        
        record = result.data
        
        logger.info(f"Record {record_id} retrieved")
        
        return SuccessResponse(
            data={"record": record},
            message="Record retrieved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get record: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve record"
        )


@router.put(
    "/{workspace_id}/entities/{entity_id}/records/{record_id}",
    response_model=SuccessResponse[Dict[str, Any]]
)
async def update_record(
    workspace_id: str,
    entity_id: str,
    record_id: str,
    record: RecordUpdate,
    user: Dict[str, Any] = Depends(get_current_user),
    member: Dict[str, Any] = Depends(require_workspace_access)
) -> SuccessResponse:
    """
    Update existing record
    
    **Requires:** Workspace membership
    
    **Example:**
    ```json
    {
      "data": {
        "status": "completed",
        "notes": "Updated notes"
      }
    }
    ```
    """
    try:
        client = get_client(use_service_role=True)
        
        # 1. Fetch existing record
        existing_result = client.table("crm_records") \
            .select("*") \
            .eq("id", record_id) \
            .eq("workspace_id", workspace_id) \
            .eq("entity_id", entity_id) \
            .maybe_single() \
            .execute()
        
        if not existing_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Record not found"
            )
        
        existing_record = existing_result.data
        
        # 2. Fetch entity configuration
        entity_result = client.table("crm_entities") \
            .select("*") \
            .eq("id", entity_id) \
            .eq("workspace_id", workspace_id) \
            .execute()
        
        if not entity_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entity not found"
            )
        
        entity = entity_result.data[0]
        
        # 3. Validate updated data (partial update allowed)
        validated_data = validate_record_data(
            record.data,
            entity["fields"],
            is_update=True
        )
        
        # Merge with existing data
        updated_data = {**existing_record["data"], **validated_data}
        
        # 4. Prepare update
        update_payload = {
            "data": updated_data,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if record.tags is not None:
            update_payload["tags"] = record.tags
        
        if record.is_archived is not None:
            update_payload["is_archived"] = record.is_archived
        
        # 5. Update record
        result = client.table("crm_records") \
            .update(update_payload) \
            .eq("id", record_id) \
            .execute()
        
        updated_record = result.data[0]
        
        logger.info(
            f"Record {record_id} updated by user {user['email']}"
        )
        
        # 6. Check for field changes and trigger automations
        old_data = existing_record["data"]
        for field_name, new_value in validated_data.items():
            if old_data.get(field_name) != new_value:
                logger.info(f"Field {field_name} changed: {old_data.get(field_name)} -> {new_value}")
                # TODO: Trigger field_changed automation
        
        return SuccessResponse(
            data={"record": updated_record},
            message="Record updated successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update record: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update record"
        )


@router.delete(
    "/{workspace_id}/entities/{entity_id}/records/{record_id}",
    response_model=SuccessResponse[Dict[str, Any]]
)
async def delete_record(
    workspace_id: str,
    entity_id: str,
    record_id: str,
    member: Dict[str, Any] = Depends(require_workspace_access)
) -> SuccessResponse:
    """
    Delete record (soft delete - archives it)
    
    **Requires:** Workspace membership
    """
    try:
        client = get_client(use_service_role=True)
        
        # Check if record exists
        existing = client.table("crm_records") \
            .select("id") \
            .eq("id", record_id) \
            .eq("workspace_id", workspace_id) \
            .eq("entity_id", entity_id) \
            .maybe_single() \
            .execute()
        
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Record not found"
            )
        
        # Soft delete (archive)
        client.table("crm_records") \
            .update({"is_archived": True}) \
            .eq("id", record_id) \
            .execute()
        
        logger.info(f"Record {record_id} archived")
        
        return SuccessResponse(
            data={"record_id": record_id, "archived": True},
            message="Record archived successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete record: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete record"
        )


@router.delete(
    "/{workspace_id}/entities/{entity_id}/records/{record_id}/permanent",
    response_model=SuccessResponse[Dict[str, Any]]
)
async def delete_record_permanent(
    workspace_id: str,
    entity_id: str,
    record_id: str,
    member: Dict[str, Any] = Depends(require_admin_access),
    user: Dict[str, Any] = Depends(get_current_user)
) -> SuccessResponse:
    """
    Permanently delete record
    
    **Requires:** Admin or owner role
    
    **Warning:** This action cannot be undone
    """
    try:
        client = get_client(use_service_role=True)
        
        # Check if record exists
        existing = client.table("crm_records") \
            .select("id") \
            .eq("id", record_id) \
            .eq("workspace_id", workspace_id) \
            .eq("entity_id", entity_id) \
            .execute()
        
        if not existing.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Record not found"
            )
        
        # Permanent delete
        client.table("crm_records") \
            .delete() \
            .eq("id", record_id) \
            .execute()
        
        logger.warning(
            f"Record {record_id} permanently deleted by {user['email']}"
        )
        
        return SuccessResponse(
            data={"record_id": record_id, "deleted": True},
            message="Record permanently deleted"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to permanently delete record: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete record"
        )


# ========================================
# Bulk Operations
# ========================================

@router.put(
    "/{workspace_id}/entities/{entity_id}/records/bulk",
    response_model=SuccessResponse[Dict[str, Any]]
)
async def bulk_update_records(
    workspace_id: str,
    entity_id: str,
    request: RecordBulkUpdate,
    user: Dict[str, Any] = Depends(get_current_user),
    member: Dict[str, Any] = Depends(require_workspace_access)
) -> SuccessResponse:
    """
    Bulk update multiple records
    
    **Requires:** Workspace membership
    
    **Example:**
    ```json
    {
      "record_ids": ["id1", "id2", "id3"],
      "data": {
        "status": "completed"
      }
    }
    ```
    """
    try:
        client = get_client(use_service_role=True)
        
        # Fetch entity for validation
        entity_result = client.table("crm_entities") \
            .select("*") \
            .eq("id", entity_id) \
            .eq("workspace_id", workspace_id) \
            .execute()
        
        if not entity_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entity not found"
            )
        
        entity = entity_result.data[0]
        
        # Validate data
        validated_data = validate_record_data(
            request.data,
            entity["fields"],
            is_update=True
        )
        
        # Update all records
        updated_count = 0
        for record_id in request.record_ids:
            try:
                # Fetch existing record
                existing = client.table("crm_records") \
                    .select("data") \
                    .eq("id", record_id) \
                    .eq("workspace_id", workspace_id) \
                    .eq("entity_id", entity_id) \
                    .maybe_single() \
                    .execute()
                
                if existing.data:
                    # Merge data
                    merged_data = {**existing.data["data"], **validated_data}
                    
                    # Update
                    client.table("crm_records") \
                        .update({"data": merged_data}) \
                        .eq("id", record_id) \
                        .execute()
                    
                    updated_count += 1
            except Exception as e:
                logger.error(f"Failed to update record {record_id}: {str(e)}")
        
        logger.info(f"Bulk updated {updated_count} records")
        
        return SuccessResponse(
            data={
                "updated_count": updated_count,
                "total_requested": len(request.record_ids)
            },
            message=f"Updated {updated_count} records"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to bulk update: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to bulk update records"
        )


@router.delete(
    "/{workspace_id}/entities/{entity_id}/records/bulk",
    response_model=SuccessResponse[Dict[str, Any]]
)
async def bulk_delete_records(
    workspace_id: str,
    entity_id: str,
    request: RecordBulkDelete,
    member: Dict[str, Any] = Depends(require_admin_access)
) -> SuccessResponse:
    """
    Bulk archive multiple records
    
    **Requires:** Admin or owner role
    """
    try:
        client = get_client(use_service_role=True)
        
        # Archive all records
        for record_id in request.record_ids:
            try:
                client.table("crm_records") \
                    .update({"is_archived": True}) \
                    .eq("id", record_id) \
                    .eq("workspace_id", workspace_id) \
                    .eq("entity_id", entity_id) \
                    .execute()
            except Exception as e:
                logger.error(f"Failed to archive record {record_id}: {str(e)}")
        
        logger.info(f"Bulk archived {len(request.record_ids)} records")
        
        return SuccessResponse(
            data={
                "archived_count": len(request.record_ids)
            },
            message=f"Archived {len(request.record_ids)} records"
        )
        
    except Exception as e:
        logger.error(f"Failed to bulk delete: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to bulk archive records"
        )


# ========================================
# Export
# ========================================

__all__ = ["router"]

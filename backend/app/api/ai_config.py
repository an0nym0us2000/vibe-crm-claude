"""
AI-powered CRM configuration API endpoints
Generate CRM configurations from natural language
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List
import logging

from app.models.base import SuccessResponse
from app.middleware import get_current_user
from app.services.ai_config_generator import (
    AIConfigGenerator,
    CRMConfig,
    GenerationMetadata,
    generate_crm_config
)
from app.services.industry_templates import (
    get_industry_template,
    list_available_templates
)

router = APIRouter(tags=["AI Configuration"])
logger = logging.getLogger(__name__)


# ========================================
# Request/Response Models
# ========================================

class GenerateConfigRequest(BaseModel):
    """Request to generate CRM configuration"""
    business_description: str = Field(
        ...,
        description="Detailed description of the business",
        min_length=10,
        max_length=1000
    )
    industry: Optional[str] = Field(
        None,
        description="Industry type (optional, will be detected if not provided)"
    )
    num_entities: Optional[int] = Field(
        None,
        ge=2,
        le=10,
        description="Desired number of entities (optional, 2-10)"
    )
    
    model_config = {"from_attributes": True}


class GenerateConfigResponse(BaseModel):
    """Response with generated CRM configuration"""
    config: CRMConfig = Field(..., description="Generated CRM configuration")
    metadata: GenerationMetadata = Field(..., description="Generation metadata")
    
    model_config = {"from_attributes": True}


class TemplateListResponse(BaseModel):
    """List of available templates"""
    templates: List[str] = Field(..., description="Available industry templates")
    
    model_config = {"from_attributes": True}


# ========================================
# Endpoints
# ========================================

@router.post("/generate", response_model=SuccessResponse[GenerateConfigResponse])
async def generate_crm_configuration(
    request: GenerateConfigRequest,
    user: dict = Depends(get_current_user)
) -> SuccessResponse[GenerateConfigResponse]:
    """
    Generate CRM configuration from business description using AI
    
    **Requires:** Authentication
    
    **Example Request:**
    ```json
    {
      "business_description": "A real estate agency that manages property listings, buyers, sellers, and viewing appointments. We focus on residential properties in urban areas.",
      "industry": "real_estate",
      "num_entities": 5
    }
    ```
    
    **Returns:**
    - Complete CRM configuration with entities, fields, and suggested automations
    - Generation metadata (tokens used, duration, model)
    
    **Note:** Uses OpenAI GPT-4 and may take 10-30 seconds
    """
    try:
        logger.info(
            f"User {user['email']} requested CRM config generation. "
            f"Industry: {request.industry}, Entities: {request.num_entities}"
        )
        
        # Generate configuration
        config, metadata = await generate_crm_config(
            business_description=request.business_description,
            industry=request.industry,
            num_entities=request.num_entities
        )
        
        logger.info(
            f"Generated {len(config.entities)} entities for {user['email']}. "
            f"Tokens: {metadata.tokens_used}, Duration: {metadata.duration_ms}ms"
        )
        
        return SuccessResponse(
            data=GenerateConfigResponse(
                config=config,
                metadata=metadata
            ),
            message=f"Generated {len(config.entities)} entities successfully"
        )
        
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to generate config: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate configuration. Please try again."
        )


@router.get("/templates", response_model=SuccessResponse[TemplateListResponse])
async def list_industry_templates(
    user: dict = Depends(get_current_user)
) -> SuccessResponse[TemplateListResponse]:
    """
    List all available industry templates
    
    **Requires:** Authentication
    
    **Returns:**
    List of industry names with pre-built templates
    
    Available templates:
    - **real_estate**: Properties, Buyers, Sellers, Viewings
    - **recruitment**: Candidates, Jobs, Applications, Interviews
    - **consulting**: Clients, Projects, Proposals, Contracts
    - **sales**: Leads, Contacts, Deals, Companies
    """
    templates = list_available_templates()
    
    return SuccessResponse(
        data=TemplateListResponse(templates=templates),
        message=f"Found {len(templates)} industry templates"
    )


@router.get("/templates/{industry}", response_model=SuccessResponse[CRMConfig])
async def get_template_by_industry(
    industry: str,
    user: dict = Depends(get_current_user)
) -> SuccessResponse[CRMConfig]:
    """
    Get pre-built template for specific industry
    
    **Requires:** Authentication
    
    **Available Industries:**
    - `real_estate` - Real estate agency template
    - `recruitment` - Recruitment agency template
    - `consulting` - Consulting firm template
    - `sales` - Sales organization template
    
    **Returns:**
    Complete CRM configuration ready to use
    
    **Note:** Templates are pre-built and don't use AI, so response is instant
    """
    try:
        config = get_industry_template(industry)
        
        logger.info(f"User {user['email']} retrieved {industry} template")
        
        return SuccessResponse(
            data=config,
            message=f"Template for '{industry}' retrieved successfully"
        )
        
    except ValueError as e:
        logger.error(f"Template not found: {industry}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to get template: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve template"
        )


@router.post("/preview", response_model=SuccessResponse[CRMConfig])
async def preview_configuration(
    request: GenerateConfigRequest
) -> SuccessResponse[CRMConfig]:
    """
    Preview CRM configuration without authentication (limited)
    
    **No authentication required** - for demo/trial purposes
    
    **Limitations:**
    - Uses template instead of AI generation
    - Uses industry field to select template
    - Falls back to 'sales' template if industry not specified
    
    **Example:**
    ```json
    {
      "business_description": "A sales company",
      "industry": "sales"
    }
    ```
    """
    try:
        # Use template instead of AI for unauthenticated preview
        industry = request.industry or "sales"
        
        config = get_industry_template(industry)
        
        logger.info(f"Anonymous preview request for industry: {industry}")
        
        return SuccessResponse(
            data=config,
            message=f"Preview configuration for '{industry}' (Sign in for AI-generated configs)"
        )
        
    except ValueError:
        # If template not found, default to sales
        config = get_industry_template("sales")
        return SuccessResponse(
            data=config,
            message="Preview configuration (default sales template)"
        )
    except Exception as e:
        logger.error(f"Preview failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate preview"
        )


# ========================================
# Export
# ========================================

__all__ = ["router"]

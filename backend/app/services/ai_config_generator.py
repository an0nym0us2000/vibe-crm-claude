"""
AI-powered CRM Configuration Generator
Generates complete CRM entity configurations from natural language business descriptions
"""
from openai import AsyncOpenAI, OpenAIError
from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Any, Optional
import json
import logging
from datetime import datetime
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)

from app.config import settings

logger = logging.getLogger(__name__)


# ========================================
# Pydantic Models
# ========================================

class FieldConfig(BaseModel):
    """Configuration for a single CRM field"""
    name: str = Field(..., description="Internal field name (lowercase, underscores)")
    display_name: str = Field(..., description="User-facing field label")
    type: str = Field(..., description="Field type (text, email, number, select, etc.)")
    required: bool = Field(default=False, description="Whether field is required")
    options: Optional[List[str]] = Field(None, description="Options for select/multiselect fields")
    placeholder: Optional[str] = Field(None, description="Placeholder text")
    help_text: Optional[str] = Field(None, description="Help text for users")
    default_value: Optional[Any] = Field(None, description="Default value")
    validation: Optional[Dict[str, Any]] = Field(None, description="Validation rules")
    
    @field_validator("name")
    @classmethod
    def validate_field_name(cls, v: str) -> str:
        """Ensure field name is lowercase with underscores"""
        return v.lower().replace(" ", "_").replace("-", "_")
    
    @field_validator("type")
    @classmethod
    def validate_field_type(cls, v: str) -> str:
        """Validate field type is supported"""
        valid_types = [
            "text", "textarea", "email", "phone", "number", "currency",
            "select", "multiselect", "checkbox", "date", "datetime",
            "url", "file", "user", "relation"
        ]
        if v not in valid_types:
            logger.warning(f"Unknown field type: {v}, defaulting to 'text'")
            return "text"
        return v
    
    model_config = {"from_attributes": True}


class EntityConfig(BaseModel):
    """Configuration for a CRM entity"""
    entity_name: str = Field(..., description="Internal entity name (lowercase, plural)")
    display_name: str = Field(..., description="Plural display name")
    display_name_singular: str = Field(..., description="Singular display name")
    icon: str = Field(default="DatabaseIcon", description="Icon name")
    description: Optional[str] = Field(None, description="Entity description")
    fields: List[FieldConfig] = Field(..., description="Entity fields")
    views: List[str] = Field(default=["table"], description="Available views")
    default_view: str = Field(default="table", description="Default view type")
    color: Optional[str] = Field(None, description="Theme color (hex)")
    
    @field_validator("entity_name")
    @classmethod
    def validate_entity_name(cls, v: str) -> str:
        """Ensure entity name is lowercase with underscores"""
        return v.lower().replace(" ", "_").replace("-", "_")
    
    @field_validator("views")
    @classmethod
    def validate_views(cls, v: List[str]) -> List[str]:
        """Ensure views are valid"""
        valid_views = ["table", "kanban", "calendar", "timeline", "cards", "list"]
        return [view for view in v if view in valid_views]
    
    model_config = {"from_attributes": True}


class AutomationSuggestion(BaseModel):
    """Suggested automation rule"""
    name: str = Field(..., description="Automation name")
    description: str = Field(..., description="What this automation does")
    trigger_type: str = Field(..., description="Trigger type")
    trigger_config: Dict[str, Any] = Field(..., description="Trigger configuration")
    action_type: str = Field(..., description="Action type")
    action_config: Dict[str, Any] = Field(..., description="Action configuration")
    entity_name: Optional[str] = Field(None, description="Related entity")
    enabled: bool = Field(default=False, description="Whether to enable by default")
    
    model_config = {"from_attributes": True}


class CRMConfig(BaseModel):
    """Complete CRM configuration"""
    entities: List[EntityConfig] = Field(..., description="Entity configurations")
    suggested_automations: List[AutomationSuggestion] = Field(
        default_factory=list,
        description="Suggested automation rules"
    )
    workspace_name: Optional[str] = Field(None, description="Suggested workspace name")
    workspace_description: Optional[str] = Field(None, description="Workspace description")
    industry: Optional[str] = Field(None, description="Detected industry")
    
    model_config = {"from_attributes": True}


class GenerationMetadata(BaseModel):
    """Metadata about the generation process"""
    tokens_used: int = Field(..., description="Total tokens used")
    model: str = Field(..., description="Model used")
    duration_ms: int = Field(..., description="Generation duration in milliseconds")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {"from_attributes": True}


# ========================================
# AI Configuration Generator
# ========================================

class AIConfigGenerator:
    """
    AI-powered CRM configuration generator
    
    Uses OpenAI GPT-4 to generate complete CRM configurations
    from natural language business descriptions
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize AI config generator
        
        Args:
            api_key: OpenAI API key (uses settings if not provided)
        """
        self.api_key = api_key or settings.OPENAI_API_KEY
        if not self.api_key:
            raise ValueError("OpenAI API key is required")
        
        self.client = AsyncOpenAI(api_key=self.api_key)
        self.model = settings.OPENAI_MODEL
        self.max_tokens = settings.OPENAI_MAX_TOKENS
        self.temperature = settings.OPENAI_TEMPERATURE
    
    def _build_system_prompt(self) -> str:
        """
        Build the system prompt for CRM configuration generation
        
        Returns:
            System prompt string
        """
        return """You are an expert CRM configuration specialist. Your task is to generate a complete, production-ready CRM configuration based on the user's business description.

**Important Guidelines:**
1. Generate 3-7 relevant entities based on the business type
2. Each entity should have 5-12 fields covering all important data points
3. Include standard fields (name, email, phone, status) plus industry-specific fields
4. Use appropriate field types (text, email, number, currency, select, date, etc.)
5. Add realistic options for select fields
6. Suggest 2-5 practical automation rules
7. Choose appropriate views (table, kanban, calendar) based on entity type
8. Use clear, professional naming conventions

**CRITICAL - Valid Trigger Types (ONLY use these):**
- record_created: When a new record is created
- status_changed: When a status/field value changes
- field_updated: When any field is updated
- record_deleted: When a record is deleted
DO NOT use: date_trigger, field_changed, time_trigger, or any other trigger types

**Output ONLY valid JSON in this exact format:**
```json
{
  "workspace_name": "Suggested workspace name",
  "workspace_description": "Brief description of the CRM purpose",
  "industry": "Detected industry",
  "entities": [
    {
      "entity_name": "leads",
      "display_name": "Leads",
      "display_name_singular": "Lead",
      "icon": "PersonIcon",
      "description": "Potential customers who have shown interest",
      "fields": [
        {
          "name": "full_name",
          "display_name": "Full Name",
          "type": "text",
          "required": true,
          "placeholder": "John Doe"
        },
        {
          "name": "email",
          "display_name": "Email Address",
          "type": "email",
          "required": true,
          "placeholder": "john@example.com"
        },
        {
          "name": "phone",
          "display_name": "Phone Number",
          "type": "phone",
          "placeholder": "+1 (555) 123-4567"
        },
        {
          "name": "status",
          "display_name": "Lead Status",
          "type": "select",
          "required": true,
          "options": ["new", "contacted", "qualified", "proposal_sent", "won", "lost"],
          "default_value": "new"
        },
        {
          "name": "source",
          "display_name": "Lead Source",
          "type": "select",
          "options": ["website", "referral", "advertisement", "social_media", "cold_call", "event"],
          "help_text": "How did this lead find us?"
        },
        {
          "name": "estimated_value",
          "display_name": "Estimated Deal Value",
          "type": "currency",
          "placeholder": "50000"
        },
        {
          "name": "notes",
          "display_name": "Notes",
          "type": "textarea",
          "placeholder": "Additional information..."
        }
      ],
      "views": ["table", "kanban"],
      "default_view": "kanban",
      "color": "#4F46E5"
    }
  ],
  "suggested_automations": [
    {
      "name": "Welcome Email for New Leads",
      "description": "Automatically send a welcome email when a new lead is created",
      "trigger_type": "record_created",
      "trigger_config": {
        "entity": "leads"
      },
      "action_type": "send_email",
      "action_config": {
        "template": "welcome_lead",
        "to_field": "email"
      },
      "entity_name": "leads",
      "enabled": false
    },
    {
      "name": "Notify on Won Deal",
      "description": "Send notification when lead status changes to won",
      "trigger_type": "status_changed",
      "trigger_config": {
        "entity": "leads",
        "field": "status",
        "to_value": "won"
      },
      "action_type": "create_task",
      "action_config": {
        "title": "Follow up with new customer",
        "due_in_days": 1
      },
      "entity_name": "leads",
      "enabled": false
    }
  ]
}
```

**Common Entities by Industry:**
- Sales: leads, contacts, deals, companies, opportunities
- Real Estate: properties, listings, buyers, sellers, viewings, offers
- Recruitment: candidates, jobs, applications, interviews, clients
- Consulting: clients, projects, proposals, contracts, deliverables
- Healthcare: patients, appointments, treatments, prescriptions
- Education: students, courses, enrollments, assignments, grades
- Event Planning: events, venues, attendees, vendors, bookings

**Field Types:**
- text: Short text (names, titles)
- textarea: Long text (descriptions, notes)
- email: Email addresses
- phone: Phone numbers
- number: Numbers without currency
- currency: Monetary values
- select: Single choice from options
- multiselect: Multiple choices
- checkbox: Boolean (yes/no)
- date: Date only
- datetime: Date and time
- url: Web addresses
- file: File attachments

**Views:**
- table: Standard table view (best for all entities)
- kanban: Board view (best for pipeline/status tracking)
- calendar: Calendar view (best for time-based entities)
- timeline: Timeline view (best for date ranges)
- cards: Card grid (best for visual data)

Generate a comprehensive, realistic configuration that would actually be useful for the described business."""

    def _build_user_prompt(
        self,
        business_description: str,
        industry: Optional[str] = None,
        num_entities: Optional[int] = None
    ) -> str:
        """
        Build the user prompt with business details
        
        Args:
            business_description: Description of the business
            industry: Industry type (optional)
            num_entities: Desired number of entities (optional)
            
        Returns:
            User prompt string
        """
        prompt_parts = [f"Business Description: {business_description}"]
        
        if industry:
            prompt_parts.append(f"Industry: {industry}")
        
        if num_entities:
            prompt_parts.append(f"Generate approximately {num_entities} entities.")
        
        prompt_parts.append("\nGenerate a complete CRM configuration as JSON.")
        
        return "\n".join(prompt_parts)
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(OpenAIError),
        reraise=True
    )
    async def _call_openai(
        self,
        system_prompt: str,
        user_prompt: str
    ) -> tuple[str, int]:
        """
        Call OpenAI API with retry logic
        
        Args:
            system_prompt: System prompt
            user_prompt: User prompt
            
        Returns:
            Tuple of (response_content, tokens_used)
            
        Raises:
            OpenAIError: If API call fails after retries
        """
        try:
            logger.info("Calling OpenAI API for CRM config generation")
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                response_format={"type": "json_object"}  # Ensure JSON response
            )
            
            content = response.choices[0].message.content
            tokens_used = response.usage.total_tokens
            
            logger.info(f"OpenAI API call successful. Tokens used: {tokens_used}")
            
            return content, tokens_used
            
        except OpenAIError as e:
            logger.error(f"OpenAI API error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in OpenAI call: {str(e)}", exc_info=True)
            raise
    
    def _parse_and_validate(self, json_content: str) -> CRMConfig:
        """
        Parse and validate JSON response
        
        Args:
            json_content: JSON string from OpenAI
            
        Returns:
            Validated CRMConfig
            
        Raises:
            ValueError: If JSON is invalid or doesn't match schema
        """
        try:
            # Parse JSON
            config_dict = json.loads(json_content)
            
            # Validate with Pydantic
            config = CRMConfig(**config_dict)
            
            logger.info(
                f"Configuration validated: {len(config.entities)} entities, "
                f"{len(config.suggested_automations)} automations"
            )
            
            return config
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON response: {str(e)}")
            raise ValueError(f"Failed to parse OpenAI response as JSON: {str(e)}")
        except Exception as e:
            logger.error(f"Validation error: {str(e)}", exc_info=True)
            raise ValueError(f"Failed to validate configuration: {str(e)}")
    
    async def generate_config(
        self,
        business_description: str,
        industry: Optional[str] = None,
        num_entities: Optional[int] = None
    ) -> tuple[CRMConfig, GenerationMetadata]:
        """
        Generate CRM configuration from business description
        
        Args:
            business_description: Description of the business
            industry: Industry type (optional)
            num_entities: Desired number of entities (optional)
            
        Returns:
            Tuple of (CRMConfig, GenerationMetadata)
            
        Raises:
            ValueError: If generation fails or response is invalid
            OpenAIError: If API call fails after retries
            
        Example:
            generator = AIConfigGenerator()
            config, metadata = await generator.generate_config(
                business_description="A real estate agency managing property listings",
                industry="real_estate"
            )
        """
        import time
        start_time = time.time()
        
        try:
            # Build prompts
            system_prompt = self._build_system_prompt()
            user_prompt = self._build_user_prompt(
                business_description,
                industry,
                num_entities
            )
            
            # Call OpenAI
            response_content, tokens_used = await self._call_openai(
                system_prompt,
                user_prompt
            )
            
            # Parse and validate
            config = self._parse_and_validate(response_content)
            
            # Create metadata
            duration_ms = int((time.time() - start_time) * 1000)
            metadata = GenerationMetadata(
                tokens_used=tokens_used,
                model=self.model,
                duration_ms=duration_ms
            )
            
            logger.info(
                f"CRM config generated successfully in {duration_ms}ms. "
                f"Tokens: {tokens_used}"
            )
            
            return config, metadata
            
        except Exception as e:
            logger.error(f"Failed to generate CRM config: {str(e)}", exc_info=True)
            raise
    
    def get_example_config(self, industry: str) -> CRMConfig:
        """
        Get example configuration for common industries
        
        Args:
            industry: Industry type (real_estate, recruitment, consulting, etc.)
            
        Returns:
            Pre-built CRMConfig for the industry
            
        Raises:
            ValueError: If industry not found
        """
        examples = {
            "real_estate": self._real_estate_example(),
            "recruitment": self._recruitment_example(),
            "consulting": self._consulting_example(),
            "sales": self._sales_example(),
        }
        
        if industry.lower() not in examples:
            raise ValueError(
                f"Industry '{industry}' not found. "
                f"Available: {', '.join(examples.keys())}"
            )
        
        return examples[industry.lower()]
    
    # Example configurations omitted for brevity
    # These would be implemented as separate methods
    
    def _real_estate_example(self) -> CRMConfig:
        """Example configuration for real estate agency"""
        # Implementation would go here
        pass
    
    def _recruitment_example(self) -> CRMConfig:
        """Example configuration for recruitment agency"""
        pass
    
    def _consulting_example(self) -> CRMConfig:
        """Example configuration for consulting firm"""
        pass
    
    def _sales_example(self) -> CRMConfig:
        """Example configuration for sales organization"""
        pass


# ========================================
# Helper Functions
# ========================================

async def generate_crm_config(
    business_description: str,
    industry: Optional[str] = None,
    num_entities: Optional[int] = None,
    api_key: Optional[str] = None
) -> tuple[CRMConfig, GenerationMetadata]:
    """
    Convenience function to generate CRM configuration
    
    Args:
        business_description: Description of the business
        industry: Industry type (optional)
        num_entities: Desired number of entities (optional)
        api_key: OpenAI API key (uses settings if not provided)
        
    Returns:
        Tuple of (CRMConfig, GenerationMetadata)
    """
    generator = AIConfigGenerator(api_key=api_key)
    return await generator.generate_config(
        business_description,
        industry,
        num_entities
    )


# ========================================
# Export
# ========================================

__all__ = [
    "AIConfigGenerator",
    "CRMConfig",
    "EntityConfig",
    "FieldConfig",
    "AutomationSuggestion",
    "GenerationMetadata",
    "generate_crm_config",
]

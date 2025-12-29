"""
Pydantic models for API request/response schemas
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class DealStage(str, Enum):
    """Deal pipeline stages"""
    LEAD = "lead"
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"


class ActivityType(str, Enum):
    """Activity types"""
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    TASK = "task"
    NOTE = "note"


class UserBase(BaseModel):
    """Base user model"""
    email: EmailStr
    name: Optional[str] = None


class UserCreate(UserBase):
    """User creation model"""
    password: str


class UserResponse(UserBase):
    """User response model"""
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ContactBase(BaseModel):
    """Base contact model"""
    name: str = Field(..., min_length=1, max_length=200)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    tags: Optional[List[str]] = []


class ContactCreate(ContactBase):
    """Contact creation model"""
    pass


class ContactUpdate(BaseModel):
    """Contact update model"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    tags: Optional[List[str]] = None


class ContactResponse(ContactBase):
    """Contact response model"""
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class DealBase(BaseModel):
    """Base deal model"""
    title: str = Field(..., min_length=1, max_length=200)
    amount: float = Field(..., ge=0)
    stage: DealStage
    contact_id: Optional[str] = None
    description: Optional[str] = None
    expected_close_date: Optional[datetime] = None


class DealCreate(DealBase):
    """Deal creation model"""
    pass


class DealResponse(DealBase):
    """Deal response model"""
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class AIGenerationRequest(BaseModel):
    """AI generation request"""
    prompt: str = Field(..., min_length=1)
    context: Optional[dict] = {}
    max_tokens: Optional[int] = Field(default=2000, le=4000)


class AIGenerationResponse(BaseModel):
    """AI generation response"""
    content: str
    tokens_used: int
    model: str


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str

import uuid
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, date

# =============================================================================
# Organization Schemas
# =============================================================================
class OrganizationBase(BaseModel):
    name: str
    size_category: Optional[str] = None
    industry: Optional[str] = None
    membership_start_date: Optional[date] = None

class OrganizationCreate(OrganizationBase):
    pass

class Organization(OrganizationBase):
    id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# =============================================================================
# Member Schemas
# =============================================================================
class MemberBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    role: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

class MemberCreate(MemberBase):
    password: str
    organization_id: Optional[uuid.UUID] = None

class Member(MemberBase):
    id: uuid.UUID
    organization_id: Optional[uuid.UUID] = None
    created_at: datetime
    organization: Optional[Organization] = None
    model_config = ConfigDict(from_attributes=True)

# =============================================================================
# Survey Schemas
# =============================================================================
class SurveyBase(BaseModel):
    title: str
    description: Optional[str] = None
    config: Dict[str, Any]

class SurveyCreate(SurveyBase):
    pass

class Survey(SurveyBase):
    id: uuid.UUID
    version: Optional[str] = None
    status: str
    created_by_id: Optional[uuid.UUID] = None
    created_at: datetime
    published_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

# =============================================================================
# Survey Response Schemas
# =============================================================================
class SurveyResponseBase(BaseModel):
    answers: Dict[str, Any]
    time_spent_seconds: Optional[int] = None

class SurveyResponseCreate(SurveyResponseBase):
    # survey_id will be passed in the URL
    # member_id will be from the authenticated user
    pass

class SurveyResponse(SurveyResponseBase):
    id: uuid.UUID
    survey_id: uuid.UUID
    member_id: Optional[uuid.UUID] = None
    organization_id: Optional[uuid.UUID] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    impact_score: Optional[int] = None
    meta: Optional[Dict[str, Any]] = None
    model_config = ConfigDict(from_attributes=True)

# =============================================================================
# Token Schemas
# =============================================================================
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

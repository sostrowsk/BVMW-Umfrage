import uuid
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr


# =============================================================================
# Organization Schemas
# =============================================================================
class OrganizationBase(BaseModel):
    name: str
    size_category: str | None = None
    industry: str | None = None
    membership_start_date: date | None = None


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
    name: str | None = None
    role: str | None = None
    preferences: dict[str, Any] | None = None


class MemberCreate(MemberBase):
    password: str
    organization_id: uuid.UUID | None = None


class Member(MemberBase):
    id: uuid.UUID
    organization_id: uuid.UUID | None = None
    created_at: datetime
    organization: Organization | None = None
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Survey Schemas
# =============================================================================
class SurveyBase(BaseModel):
    title: str
    description: str | None = None
    config: dict[str, Any]


class SurveyCreate(SurveyBase):
    pass


class Survey(SurveyBase):
    id: uuid.UUID
    version: str | None = None
    status: str
    created_by_id: uuid.UUID | None = None
    created_at: datetime
    published_at: datetime | None = None
    closed_at: datetime | None = None
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Survey Response Schemas
# =============================================================================
class SurveyResponseBase(BaseModel):
    answers: dict[str, Any]
    time_spent_seconds: int | None = None


class SurveyResponseCreate(SurveyResponseBase):
    # survey_id will be passed in the URL
    # member_id will be from the authenticated user
    pass


class SurveyResponse(SurveyResponseBase):
    id: uuid.UUID
    survey_id: uuid.UUID
    member_id: uuid.UUID | None = None
    organization_id: uuid.UUID | None = None
    started_at: datetime
    completed_at: datetime | None = None
    impact_score: int | None = None
    meta: dict[str, Any] | None = None
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Token Schemas
# =============================================================================
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: str | None = None

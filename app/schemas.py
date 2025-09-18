import uuid
from datetime import UTC, date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


def to_camel(value: str) -> str:
    parts = value.split("_")
    return parts[0] + "".join(word.capitalize() for word in parts[1:])


def camel_config(**extra: Any) -> ConfigDict:
    return ConfigDict(alias_generator=to_camel, populate_by_name=True, **extra)


class CamelModel(BaseModel):
    model_config = camel_config()


# =============================================================================
# Organization Schemas
# =============================================================================
class OrganizationBase(CamelModel):
    name: str
    size_category: str | None = None
    industry: str | None = None
    membership_start_date: date | None = None


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(CamelModel):
    name: str | None = None
    size_category: str | None = None
    industry: str | None = None
    membership_start_date: date | None = None


class Organization(OrganizationBase):
    id: uuid.UUID
    created_at: datetime
    model_config = camel_config(from_attributes=True)


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


class MemberUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    organization_id: uuid.UUID | None = None
    preferences: dict[str, Any] | None = None


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
    start_date: datetime | None = None
    end_date: datetime | None = None
    max_responses: int | None = None
    
    @field_validator('start_date', 'end_date', mode='before')
    @classmethod
    def ensure_timezone_aware(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            v = datetime.fromisoformat(v)
        if isinstance(v, datetime) and v.tzinfo is None:
            return v.replace(tzinfo=UTC)
        return v


class SurveyUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    config: dict[str, Any] | None = None
    status: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    max_responses: int | None = None
    
    @field_validator('start_date', 'end_date', mode='before')
    @classmethod
    def ensure_timezone_aware(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            v = datetime.fromisoformat(v)
        if isinstance(v, datetime) and v.tzinfo is None:
            return v.replace(tzinfo=UTC)
        return v


class Survey(SurveyBase):
    id: uuid.UUID
    version: str | None = None
    status: str
    start_date: datetime | None = None
    end_date: datetime | None = None
    max_responses: int | None = None
    created_by: uuid.UUID | None = None
    created_at: datetime
    published_at: datetime | None = None
    closed_at: datetime | None = None
    response_count: int | None = None
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


# =============================================================================
# Survey Invitation Schemas
# =============================================================================
class SurveyInvitationBase(BaseModel):
    email: str | None = None
    expires_at: datetime | None = None
    max_uses: int = 1
    metadata: dict[str, Any] | None = Field(None, alias="invitation_metadata")
    
    @field_validator('expires_at', mode='before')
    @classmethod
    def ensure_timezone_aware(cls, v):
        if v is None:
            return v
        if isinstance(v, str):
            v = datetime.fromisoformat(v)
        if isinstance(v, datetime) and v.tzinfo is None:
            return v.replace(tzinfo=UTC)
        return v


class SurveyInvitationCreate(SurveyInvitationBase):
    member_id: uuid.UUID | None = None


class BatchInvitationCreate(BaseModel):
    member_ids: list[uuid.UUID] | None = None
    emails: list[str] | None = None
    expires_at: datetime | None = None
    max_uses: int = 1


class SurveyInvitation(SurveyInvitationBase):
    id: uuid.UUID
    survey_id: uuid.UUID
    token: str
    member_id: uuid.UUID | None = None
    use_count: int
    used_at: datetime | None = None
    created_at: datetime
    invitation_url: str | None = None
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class PublicSurveyResponse(BaseModel):
    survey_id: uuid.UUID
    title: str
    description: str | None = None
    config: dict[str, Any]
    status: str
    invitation_valid: bool
    member_info: dict[str, Any] | None = None

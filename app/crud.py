from sqlalchemy.orm import Session
import uuid
from datetime import datetime, timezone

from . import models, schemas

# =============================================================================
# Member CRUD
# =============================================================================
def get_member(db: Session, member_id: uuid.UUID):
    return db.query(models.Member).filter(models.Member.id == member_id).first()

def get_member_by_email(db: Session, email: str):
    return db.query(models.Member).filter(models.Member.email == email).first()

from .security import get_password_hash

def create_member(db: Session, member: schemas.MemberCreate):
    hashed_password = get_password_hash(member.password)
    db_member = models.Member(
        email=member.email,
        name=member.name,
        role=member.role,
        organization_id=member.organization_id,
        preferences=member.preferences,
        hashed_password=hashed_password
    )
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member

# =============================================================================
# Organization CRUD
# =============================================================================
def get_organization(db: Session, org_id: uuid.UUID):
    return db.query(models.Organization).filter(models.Organization.id == org_id).first()

def create_organization(db: Session, organization: schemas.OrganizationCreate):
    db_organization = models.Organization(**organization.model_dump())
    db.add(db_organization)
    db.commit()
    db.refresh(db_organization)
    return db_organization

# =============================================================================
# Survey CRUD
# =============================================================================
def get_survey(db: Session, survey_id: uuid.UUID):
    return db.query(models.Survey).filter(models.Survey.id == survey_id).first()

def get_surveys(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Survey).offset(skip).limit(limit).all()

def create_survey(db: Session, survey: schemas.SurveyCreate, creator_id: uuid.UUID):
    db_survey = models.Survey(**survey.model_dump(), created_by_id=creator_id)
    db.add(db_survey)
    db.commit()
    db.refresh(db_survey)
    return db_survey

# =============================================================================
# Survey Response CRUD
# =============================================================================
def create_survey_response(db: Session, response: schemas.SurveyResponseCreate, survey_id: uuid.UUID, member_id: uuid.UUID, organization_id: uuid.UUID):
    db_response = models.SurveyResponse(
        **response.model_dump(),
        survey_id=survey_id,
        member_id=member_id,
        organization_id=organization_id,
        completed_at=datetime.now(timezone.utc)
    )
    db.add(db_response)
    db.commit()
    db.refresh(db_response)
    return db_response

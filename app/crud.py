import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from . import models, schemas
from .security import get_password_hash
from .utils import generate_invitation_token, hash_token, is_invitation_valid


# =============================================================================
# Member CRUD
# =============================================================================
def get_member(db: Session, member_id: uuid.UUID):
    return db.query(models.Member).filter(models.Member.id == member_id).first()


def get_member_by_email(db: Session, email: str):
    return db.query(models.Member).filter(models.Member.email == email).first()


def get_members(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Member).offset(skip).limit(limit).all()


def create_member(db: Session, member: schemas.MemberCreate):
    hashed_password = get_password_hash(member.password)
    db_member = models.Member(
        email=member.email,
        name=member.name,
        role=member.role,
        organization_id=member.organization_id,
        preferences=member.preferences,
        hashed_password=hashed_password,
    )
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member


def update_member(db: Session, member_id: uuid.UUID, member_update: schemas.MemberUpdate):
    db_member = get_member(db, member_id)
    if not db_member:
        return None
    update_data = member_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_member, field, value)
    db.commit()
    db.refresh(db_member)
    return db_member


def delete_member(db: Session, member_id: uuid.UUID):
    db_member = get_member(db, member_id)
    if not db_member:
        return False
    db.delete(db_member)
    db.commit()
    return True


# =============================================================================
# Organization CRUD
# =============================================================================
def get_organization(db: Session, org_id: uuid.UUID):
    return db.query(models.Organization).filter(models.Organization.id == org_id).first()


def get_organizations(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Organization).offset(skip).limit(limit).all()


def create_organization(db: Session, organization: schemas.OrganizationCreate):
    db_organization = models.Organization(**organization.model_dump())
    db.add(db_organization)
    db.commit()
    db.refresh(db_organization)
    return db_organization


def update_organization(db: Session, org_id: uuid.UUID, organization_update: schemas.OrganizationUpdate):
    db_org = get_organization(db, org_id)
    if not db_org:
        return None
    update_data = organization_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_org, field, value)
    db.commit()
    db.refresh(db_org)
    return db_org


def delete_organization(db: Session, org_id: uuid.UUID):
    db_org = get_organization(db, org_id)
    if not db_org:
        return False
    db.delete(db_org)
    db.commit()
    return True


def get_organization_members(db: Session, org_id: uuid.UUID):
    return db.query(models.Member).filter(models.Member.organization_id == org_id).all()


# =============================================================================
# Survey CRUD
# =============================================================================
def get_survey(db: Session, survey_id: uuid.UUID):
    return db.query(models.Survey).filter(models.Survey.id == survey_id).first()


def get_surveys(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Survey).offset(skip).limit(limit).all()


def create_survey(db: Session, survey: schemas.SurveyCreate, creator_id: uuid.UUID):
    survey_data = survey.model_dump()
    db_survey = models.Survey(**survey_data, created_by=creator_id)
    if db_survey.status == "active":
        db_survey.published_at = datetime.now(UTC)
    check_and_update_survey_status(db_survey, db)
    db.add(db_survey)
    db.commit()
    db.refresh(db_survey)
    return db_survey


def update_survey(db: Session, survey_id: uuid.UUID, survey_update: schemas.SurveyUpdate):
    db_survey = get_survey(db, survey_id)
    if not db_survey:
        return None
    update_data = survey_update.model_dump(exclude_unset=True)
    old_status = db_survey.status
    for field, value in update_data.items():
        setattr(db_survey, field, value)
    if old_status != "active" and db_survey.status == "active":
        db_survey.published_at = datetime.now(UTC)
    elif old_status != "closed" and db_survey.status == "closed":
        db_survey.closed_at = datetime.now(UTC)
    check_and_update_survey_status(db_survey, db)
    db.commit()
    db.refresh(db_survey)
    return db_survey


def check_and_update_survey_status(survey: models.Survey, db: Session) -> bool:
    """
    Check and update survey status based on dates and response count.
    Returns True if status was changed.
    """
    now = datetime.now(UTC)
    status_changed = False
    if survey.status == "planned":
        if survey.start_date and survey.start_date <= now:
            survey.status = "active"
            survey.published_at = now
            status_changed = True
    if survey.status == "active":
        if survey.end_date and survey.end_date <= now:
            survey.status = "closed"
            survey.closed_at = now
            status_changed = True
        elif survey.max_responses:
            response_count = db.query(models.SurveyResponse).filter(
                models.SurveyResponse.survey_id == survey.id
            ).count()
            if response_count >= survey.max_responses:
                survey.status = "closed"
                survey.closed_at = now
                status_changed = True
    return status_changed


def get_survey_response_count(db: Session, survey_id: uuid.UUID) -> int:
    return db.query(models.SurveyResponse).filter(
        models.SurveyResponse.survey_id == survey_id
    ).count()


# =============================================================================
# Survey Invitation CRUD
# =============================================================================
def create_survey_invitation(
    db: Session,
    survey_id: uuid.UUID,
    invitation: schemas.SurveyInvitationCreate,
) -> models.SurveyInvitation:
    """Create a single survey invitation."""
    token, token_hash = generate_invitation_token()
    
    db_invitation = models.SurveyInvitation(
        survey_id=survey_id,
        token=token,
        token_hash=token_hash,
        member_id=invitation.member_id,
        email=invitation.email,
        expires_at=invitation.expires_at or datetime.now(UTC) + timedelta(days=30),
        max_uses=invitation.max_uses,
        invitation_metadata=invitation.metadata,
    )
    db.add(db_invitation)
    db.commit()
    db.refresh(db_invitation)
    return db_invitation


def create_anonymous_invitation(
    db: Session,
    survey_id: uuid.UUID,
    expires_in_days: int = 30,
    max_uses: int = 1000,
) -> models.SurveyInvitation:
    """Create an anonymous survey invitation link."""
    token, token_hash = generate_invitation_token()
    
    db_invitation = models.SurveyInvitation(
        survey_id=survey_id,
        token=token,
        token_hash=token_hash,
        expires_at=datetime.now(UTC) + timedelta(days=expires_in_days),
        max_uses=max_uses,
        invitation_metadata={"type": "anonymous"},
    )
    db.add(db_invitation)
    db.commit()
    db.refresh(db_invitation)
    return db_invitation


def create_batch_invitations(
    db: Session,
    survey_id: uuid.UUID,
    batch: schemas.BatchInvitationCreate,
) -> list[models.SurveyInvitation]:
    """Create multiple survey invitations at once."""
    invitations = []
    
    if batch.member_ids:
        for member_id in batch.member_ids:
            token, token_hash = generate_invitation_token()
            invitation = models.SurveyInvitation(
                survey_id=survey_id,
                token=token,
                token_hash=token_hash,
                member_id=member_id,
                expires_at=batch.expires_at or datetime.now(UTC) + timedelta(days=30),
                max_uses=batch.max_uses,
                invitation_metadata={"type": "personalized", "batch": True},
            )
            invitations.append(invitation)
    
    if batch.emails:
        for email in batch.emails:
            token, token_hash = generate_invitation_token()
            invitation = models.SurveyInvitation(
                survey_id=survey_id,
                token=token,
                token_hash=token_hash,
                email=email,
                expires_at=batch.expires_at or datetime.now(UTC) + timedelta(days=30),
                max_uses=batch.max_uses,
                invitation_metadata={"type": "email", "batch": True},
            )
            invitations.append(invitation)
    
    db.add_all(invitations)
    db.commit()
    for inv in invitations:
        db.refresh(inv)
    return invitations


def get_invitation_by_token(db: Session, token: str) -> models.SurveyInvitation | None:
    """Get an invitation by its token."""
    token_hash = hash_token(token)
    return db.query(models.SurveyInvitation).filter(
        models.SurveyInvitation.token_hash == token_hash
    ).first()


def get_survey_invitations(
    db: Session, survey_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> list[models.SurveyInvitation]:
    """Get all invitations for a survey."""
    return db.query(models.SurveyInvitation).filter(
        models.SurveyInvitation.survey_id == survey_id
    ).offset(skip).limit(limit).all()


def use_invitation(db: Session, invitation_id: uuid.UUID) -> bool:
    """Mark an invitation as used."""
    invitation = db.query(models.SurveyInvitation).filter(
        models.SurveyInvitation.id == invitation_id
    ).first()
    
    if not invitation or not is_invitation_valid(invitation):
        return False
    
    invitation.use_count += 1
    if invitation.use_count >= invitation.max_uses:
        invitation.used_at = datetime.now(UTC)
    
    db.commit()
    return True


def delete_invitation(db: Session, invitation_id: uuid.UUID) -> bool:
    """Delete an invitation."""
    invitation = db.query(models.SurveyInvitation).filter(
        models.SurveyInvitation.id == invitation_id
    ).first()
    
    if not invitation:
        return False
    
    db.delete(invitation)
    db.commit()
    return True


# =============================================================================
# Survey Response CRUD
# =============================================================================
def create_survey_response(
    db: Session,
    response: schemas.SurveyResponseCreate,
    survey_id: uuid.UUID,
    member_id: uuid.UUID,
    organization_id: uuid.UUID,
):
    survey = get_survey(db, survey_id)
    if not survey:
        return None
    if survey.status != "active":
        return None
    db_response = models.SurveyResponse(
        **response.model_dump(),
        survey_id=survey_id,
        member_id=member_id,
        organization_id=organization_id,
        completed_at=datetime.now(UTC),
    )
    db.add(db_response)
    db.flush()
    if survey.max_responses:
        response_count = get_survey_response_count(db, survey_id)
        if response_count >= survey.max_responses:
            survey.status = "closed"
            survey.closed_at = datetime.now(UTC)
    db.commit()
    db.refresh(db_response)
    return db_response
def get_survey_responses(db: Session, survey_id: uuid.UUID, skip: int = 0, limit: int = 100):
    return db.query(models.SurveyResponse).filter(
        models.SurveyResponse.survey_id == survey_id
    ).offset(skip).limit(limit).all()

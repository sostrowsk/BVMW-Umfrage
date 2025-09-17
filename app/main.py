import uuid
from datetime import UTC, datetime, timedelta

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from . import crud, models, schemas, security
from .core.config import settings
from .database import SessionLocal
from .utils import is_invitation_valid

# This line can be used to create tables, but we are using init.sql with Docker
# and will later use Alembic for migrations.
# models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Survey API",
    version="1.0.0",
    description="API for the Mitgliederbindung Survey Platform",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# Dependencies
# =============================================================================
def get_db():
    """Dependency to get a DB session for each request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception from None
    user = crud.get_member_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user


# =============================================================================
# API Endpoints
# =============================================================================


@app.post("/api/v1/auth/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_member_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}


# =============================================================================
# API Endpoints
# =============================================================================


@app.post("/api/v1/users", response_model=schemas.Member, status_code=201, tags=["Users"])
def create_user(user: schemas.MemberCreate, db: Session = Depends(get_db)):
    """
    Create a new user/member.
    """
    db_user = crud.get_member_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    if user.organization_id:
        db_org = crud.get_organization(db, org_id=user.organization_id)
        if not db_org:
            raise HTTPException(
                status_code=404,
                detail=f"Organization with id {user.organization_id} not found",
            )
    return crud.create_member(db=db, member=user)


@app.get("/api/v1/users/me", response_model=schemas.Member, tags=["Users"])
async def read_users_me(current_user: models.Member = Depends(get_current_user)):
    """
    Get the profile of the currently authenticated user.
    """
    return current_user


@app.get("/", tags=["General"])
def read_root():
    return {"message": "Welcome to the Survey API"}


@app.post("/api/v1/surveys", response_model=schemas.Survey, status_code=201, tags=["Surveys"])
def create_survey(
    survey: schemas.SurveyCreate,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
):
    """
    Create a new survey. The creator is the currently authenticated user.
    """
    return crud.create_survey(db=db, survey=survey, creator_id=current_user.id)


@app.get("/api/v1/surveys", response_model=list[schemas.Survey], tags=["Surveys"])
def read_surveys(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve a list of all surveys.
    """
    surveys = crud.get_surveys(db, skip=skip, limit=limit)
    for survey in surveys:
        survey.response_count = crud.get_survey_response_count(db, survey.id)
    return surveys


@app.get("/api/v1/surveys/{survey_id}", response_model=schemas.Survey, tags=["Surveys"])
def read_survey(survey_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Get the details of a specific survey by its ID.
    """
    db_survey = crud.get_survey(db, survey_id=survey_id)
    if db_survey is None:
        raise HTTPException(status_code=404, detail="Survey not found")
    crud.check_and_update_survey_status(db_survey, db)
    db.commit()
    db_survey.response_count = crud.get_survey_response_count(db, survey_id)
    return db_survey


@app.put("/api/v1/surveys/{survey_id}", response_model=schemas.Survey, tags=["Surveys"])
def update_survey(
    survey_id: uuid.UUID,
    survey: schemas.SurveyUpdate,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
):
    """
    Update an existing survey.
    """
    db_survey = crud.get_survey(db, survey_id=survey_id)
    if db_survey is None:
        raise HTTPException(status_code=404, detail="Survey not found")
    if db_survey.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this survey")
    updated_survey = crud.update_survey(db=db, survey_id=survey_id, survey_update=survey)
    if updated_survey is None:
        raise HTTPException(status_code=404, detail="Survey not found")
    return updated_survey


@app.post(
    "/api/v1/surveys/{survey_id}/responses",
    response_model=schemas.SurveyResponse,
    status_code=201,
    tags=["Survey Responses"],
)
def submit_survey_response(
    survey_id: uuid.UUID,
    response: schemas.SurveyResponseCreate,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
):
    """
    Submit a response to a specific survey.
    """
    db_survey = crud.get_survey(db, survey_id=survey_id)
    if db_survey is None:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    crud.check_and_update_survey_status(db_survey, db)
    db.commit()
    
    if db_survey.status != "active":
        raise HTTPException(status_code=400, detail="Survey is not active")

    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User must belong to an organization to respond")

    db_response = crud.create_survey_response(
        db=db,
        response=response,
        survey_id=survey_id,
        member_id=current_user.id,
        organization_id=current_user.organization_id,
    )
    
    if db_response is None:
        raise HTTPException(status_code=400, detail="Could not submit response")
    
    return db_response


@app.get("/api/v1/surveys/{survey_id}/analytics")
def get_survey_analytics(survey_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Get simple analytics for a survey.
    For the MVP, this endpoint returns the total number of responses.
    """
    db_survey = crud.get_survey(db, survey_id=survey_id)
    if db_survey is None:
        raise HTTPException(status_code=404, detail="Survey not found")

    response_count = crud.get_survey_response_count(db, survey_id)

    return {
        "survey_id": survey_id,
        "title": db_survey.title,
        "status": db_survey.status,
        "max_responses": db_survey.max_responses,
        "response_count": response_count,
    }
@app.get("/api/v1/surveys/{survey_id}/responses", response_model=list[schemas.SurveyResponse], tags=["Surveys"])
def get_survey_responses(
    survey_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
    current_user: models.Member = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all responses for a specific survey.
    Only admins can view survey responses.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view survey responses")
    
    db_survey = crud.get_survey(db, survey_id=survey_id)
    if not db_survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    responses = crud.get_survey_responses(db, survey_id=survey_id, skip=skip, limit=limit)
    return responses


# =============================================================================
# Members Endpoints
# =============================================================================
@app.get("/api/v1/members", response_model=list[schemas.Member], tags=["Members"])
def get_members(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
):
    """Get all members."""
    members = crud.get_members(db, skip=skip, limit=limit)
    return members


@app.get("/api/v1/members/{member_id}", response_model=schemas.Member, tags=["Members"])
def get_member(
    member_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
):
    """Get a specific member by ID."""
    db_member = crud.get_member(db, member_id=member_id)
    if db_member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    return db_member


@app.post("/api/v1/members", response_model=schemas.Member, status_code=201, tags=["Members"])
def create_member(
    member: schemas.MemberCreate,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
):
    """Create a new member."""
    db_member = crud.get_member_by_email(db, email=member.email)
    if db_member:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_member(db=db, member=member)


@app.put("/api/v1/members/{member_id}", response_model=schemas.Member, tags=["Members"])
def update_member(
    member_id: uuid.UUID,
    member_update: schemas.MemberUpdate,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
):
    """Update an existing member."""
    db_member = crud.update_member(db, member_id=member_id, member_update=member_update)
    if db_member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    return db_member


@app.delete("/api/v1/members/{member_id}", status_code=204, tags=["Members"])
def delete_member(
    member_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
):
    """Delete a member."""
    success = crud.delete_member(db, member_id=member_id)
    if not success:
        raise HTTPException(status_code=404, detail="Member not found")
    return None


# =============================================================================
# Organizations Endpoints
# =============================================================================
@app.get("/api/v1/organizations", response_model=list[schemas.Organization], tags=["Organizations"])
def get_organizations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
):
    """Get all organizations."""
    organizations = crud.get_organizations(db, skip=skip, limit=limit)
    return organizations


@app.get("/api/v1/organizations/{org_id}", response_model=schemas.Organization, tags=["Organizations"])
def get_organization(
    org_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
):
    """Get a specific organization by ID."""
    db_org = crud.get_organization(db, org_id=org_id)
    if db_org is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    return db_org


@app.post("/api/v1/organizations", response_model=schemas.Organization, status_code=201, tags=["Organizations"])
def create_organization(
    organization: schemas.OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
):
    """Create a new organization. Only admins can create organizations."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create organizations")
    return crud.create_organization(db=db, organization=organization)


@app.put("/api/v1/organizations/{org_id}", response_model=schemas.Organization, tags=["Organizations"])
def update_organization(
    org_id: uuid.UUID,
    organization_update: schemas.OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
):
    """Update an organization. Only admins and managers of the organization can update."""
    db_org = crud.get_organization(db, org_id=org_id)
    if db_org is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # Check permissions
    if current_user.role != "admin" and (current_user.role != "manager" or current_user.organization_id != org_id):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    updated_org = crud.update_organization(db, org_id=org_id, organization_update=organization_update)
    return updated_org


@app.delete("/api/v1/organizations/{org_id}", status_code=204, tags=["Organizations"])
def delete_organization(
    org_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
):
    """Delete an organization. Only admins can delete organizations."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete organizations")
    
    success = crud.delete_organization(db, org_id=org_id)
    if not success:
        raise HTTPException(status_code=404, detail="Organization not found")
    return None


@app.get("/api/v1/organizations/{org_id}/members", response_model=list[schemas.Member], tags=["Organizations"])
def get_organization_members(
    org_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
):
    """Get all members of an organization."""
    db_org = crud.get_organization(db, org_id=org_id)
    if db_org is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    members = crud.get_organization_members(db, org_id=org_id)
    return members


# =============================================================================
# Survey Invitations Endpoints
# =============================================================================
@app.post("/api/v1/surveys/{survey_id}/anonymous-link", response_model=schemas.SurveyInvitation, tags=["Survey Invitations"])
def create_anonymous_link(
    survey_id: uuid.UUID,
    expires_in_days: int = 30,
    max_uses: int = 1000,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
):
    """Generate an anonymous survey link that can be shared publicly."""
    db_survey = crud.get_survey(db, survey_id=survey_id)
    if db_survey is None:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    if db_survey.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to manage this survey")
    
    invitation = crud.create_anonymous_invitation(
        db=db,
        survey_id=survey_id,
        expires_in_days=expires_in_days,
        max_uses=max_uses,
    )
    
    # Add the full invitation URL
    invitation.invitation_url = f"{settings.FRONTEND_URL}/survey/{invitation.token}"
    
    return invitation


@app.post("/api/v1/surveys/{survey_id}/invitations", response_model=schemas.SurveyInvitation, tags=["Survey Invitations"])
def create_personalized_invitation(
    survey_id: uuid.UUID,
    invitation: schemas.SurveyInvitationCreate,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
):
    """Create a personalized survey invitation for a specific member or email."""
    db_survey = crud.get_survey(db, survey_id=survey_id)
    if db_survey is None:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    if db_survey.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to manage this survey")
    
    db_invitation = crud.create_survey_invitation(
        db=db,
        survey_id=survey_id,
        invitation=invitation,
    )
    
    # Add the full invitation URL
    base_url = settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else "http://localhost:5173"
    db_invitation.invitation_url = f"{base_url}/survey/{db_invitation.token}"
    
    return db_invitation


@app.post("/api/v1/surveys/{survey_id}/batch-invitations", response_model=list[schemas.SurveyInvitation], tags=["Survey Invitations"])
def create_batch_invitations(
    survey_id: uuid.UUID,
    batch: schemas.BatchInvitationCreate,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
):
    """Create multiple survey invitations at once."""
    db_survey = crud.get_survey(db, survey_id=survey_id)
    if db_survey is None:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    if db_survey.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to manage this survey")
    
    invitations = crud.create_batch_invitations(
        db=db,
        survey_id=survey_id,
        batch=batch,
    )
    
    # Add the full invitation URLs
    base_url = settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else "http://localhost:5173"
    for invitation in invitations:
        invitation.invitation_url = f"{base_url}/survey/{invitation.token}"
    
    return invitations


@app.get("/api/v1/surveys/{survey_id}/invitations", response_model=list[schemas.SurveyInvitation], tags=["Survey Invitations"])
def get_survey_invitations(
    survey_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
):
    """Get all invitations for a survey."""
    db_survey = crud.get_survey(db, survey_id=survey_id)
    if db_survey is None:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    if db_survey.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view survey invitations")
    
    invitations = crud.get_survey_invitations(db, survey_id=survey_id, skip=skip, limit=limit)
    
    # Add the full invitation URLs
    base_url = settings.FRONTEND_URL if hasattr(settings, 'FRONTEND_URL') else "http://localhost:5173"
    for invitation in invitations:
        invitation.invitation_url = f"{base_url}/survey/{invitation.token}"
    
    return invitations


@app.delete("/api/v1/invitations/{invitation_id}", status_code=204, tags=["Survey Invitations"])
def delete_invitation(
    invitation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user),
):
    """Delete a survey invitation."""
    # Get the invitation first to check permissions
    invitation = db.query(models.SurveyInvitation).filter(
        models.SurveyInvitation.id == invitation_id
    ).first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    # Check if user has permission to delete this invitation
    db_survey = crud.get_survey(db, invitation.survey_id)
    if db_survey.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this invitation")
    
    success = crud.delete_invitation(db, invitation_id=invitation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    return None


# =============================================================================
# Public Survey Endpoints (No Authentication Required)
# =============================================================================
@app.get("/api/v1/surveys/public/{token}", response_model=schemas.PublicSurveyResponse, tags=["Public Surveys"])
def get_public_survey(
    token: str,
    db: Session = Depends(get_db),
):
    """Get survey details using an invitation token (no authentication required)."""
    invitation = crud.get_invitation_by_token(db, token=token)
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid invitation token")
    
    if not is_invitation_valid(invitation):
        raise HTTPException(status_code=400, detail="Invitation has expired or been used")
    
    db_survey = crud.get_survey(db, survey_id=invitation.survey_id)
    if not db_survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    crud.check_and_update_survey_status(db_survey, db)
    db.commit()
    
    if db_survey.status != "active":
        raise HTTPException(status_code=400, detail=f"Survey is {db_survey.status}")
    
    # Get member info if this is a personalized invitation
    member_info = None
    if invitation.member_id:
        member = crud.get_member(db, member_id=invitation.member_id)
        if member:
            member_info = {
                "name": member.name,
                "email": member.email,
                "organization": member.organization.name if member.organization else None,
            }
    
    return schemas.PublicSurveyResponse(
        survey_id=db_survey.id,
        title=db_survey.title,
        description=db_survey.description,
        config=db_survey.config,
        status=db_survey.status,
        invitation_valid=True,
        member_info=member_info,
    )


@app.post("/api/v1/surveys/public/{token}/response", response_model=schemas.SurveyResponse, tags=["Public Surveys"])
def submit_public_survey_response(
    token: str,
    response: schemas.SurveyResponseCreate,
    db: Session = Depends(get_db),
):
    """Submit a survey response using an invitation token (no authentication required)."""
    invitation = crud.get_invitation_by_token(db, token=token)
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid invitation token")
    
    if not is_invitation_valid(invitation):
        raise HTTPException(status_code=400, detail="Invitation has expired or been used")
    
    db_survey = crud.get_survey(db, survey_id=invitation.survey_id)
    if not db_survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    
    crud.check_and_update_survey_status(db_survey, db)
    
    if db_survey.status != "active":
        raise HTTPException(status_code=400, detail=f"Survey is {db_survey.status}")
    
    # Determine member and organization from invitation
    member_id = invitation.member_id
    organization_id = None
    
    if member_id:
        member = crud.get_member(db, member_id=member_id)
        if member:
            organization_id = member.organization_id
    
    # Create the survey response
    db_response = models.SurveyResponse(
        **response.model_dump(),
        survey_id=invitation.survey_id,
        member_id=member_id,
        organization_id=organization_id,
        completed_at=datetime.now(UTC) if response.time_spent_seconds else None,
        meta={"invitation_token": token[:8] + "..."},  # Store partial token for tracking
    )
    
    db.add(db_response)
    
    # Mark invitation as used
    success = crud.use_invitation(db, invitation_id=invitation.id)
    if not success:
        db.rollback()
        raise HTTPException(status_code=400, detail="Could not mark invitation as used")
    
    # Check if survey should be closed due to max responses
    if db_survey.max_responses:
        response_count = crud.get_survey_response_count(db, db_survey.id)
        if response_count >= db_survey.max_responses:
            db_survey.status = "closed"
            db_survey.closed_at = datetime.now(UTC)
    
    db.commit()
    db.refresh(db_response)
    
    return db_response

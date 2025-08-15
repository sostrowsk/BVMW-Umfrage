import uuid
from typing import List
from datetime import timedelta

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from . import crud, models, schemas, security
from .core.config import settings
from .database import SessionLocal, engine

# This line can be used to create tables, but we are using init.sql with Docker
# and will later use Alembic for migrations.
# models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Survey API",
    version="1.0.0",
    description="API for the Mitgliederbindung Survey Platform"
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
        raise credentials_exception
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
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
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
            raise HTTPException(status_code=404, detail=f"Organization with id {user.organization_id} not found")
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
    current_user: models.Member = Depends(get_current_user)
):
    """
    Create a new survey. The creator is the currently authenticated user.
    """
    return crud.create_survey(db=db, survey=survey, creator_id=current_user.id)

@app.get("/api/v1/surveys", response_model=List[schemas.Survey], tags=["Surveys"])
def read_surveys(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve a list of all surveys.
    """
    surveys = crud.get_surveys(db, skip=skip, limit=limit)
    return surveys

@app.get("/api/v1/surveys/{survey_id}", response_model=schemas.Survey, tags=["Surveys"])
def read_survey(survey_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Get the details of a specific survey by its ID.
    """
    db_survey = crud.get_survey(db, survey_id=survey_id)
    if db_survey is None:
        raise HTTPException(status_code=404, detail="Survey not found")
    return db_survey

@app.post("/api/v1/surveys/{survey_id}/responses", response_model=schemas.SurveyResponse, status_code=201, tags=["Survey Responses"])
def submit_survey_response(
    survey_id: uuid.UUID,
    response: schemas.SurveyResponseCreate,
    db: Session = Depends(get_db),
    current_user: models.Member = Depends(get_current_user)
):
    """
    Submit a response to a specific survey.
    """
    db_survey = crud.get_survey(db, survey_id=survey_id)
    if db_survey is None:
        raise HTTPException(status_code=404, detail="Survey not found")

    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User must belong to an organization to respond")

    return crud.create_survey_response(
        db=db,
        response=response,
        survey_id=survey_id,
        member_id=current_user.id,
        organization_id=current_user.organization_id
    )

@app.get("/api/v1/surveys/{survey_id}/analytics")
def get_survey_analytics(survey_id: uuid.UUID, db: Session = Depends(get_db)):
    """
    Get simple analytics for a survey.
    For the MVP, this endpoint returns the total number of responses.
    """
    db_survey = crud.get_survey(db, survey_id=survey_id)
    if db_survey is None:
        raise HTTPException(status_code=404, detail="Survey not found")

    response_count = len(db_survey.responses)

    return {
        "survey_id": survey_id,
        "title": db_survey.title,
        "response_count": response_count
    }

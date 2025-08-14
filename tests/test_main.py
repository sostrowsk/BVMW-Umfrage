import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app import crud, schemas

def test_read_root(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the BVMW Survey API"}

def test_create_and_login_user(client: TestClient, db_session: Session):
    # First, create an organization for the user
    org_schema = schemas.OrganizationCreate(name="Test Corp")
    org = crud.create_organization(db_session, organization=org_schema)
    assert org.name == "Test Corp"

    # Create User
    user_email = "test.user@testcorp.com"
    user_password = "a_secure_password"
    response = client.post(
        "/api/v1/users",
        json={
            "email": user_email,
            "password": user_password,
            "name": "Test User",
            "organization_id": str(org.id)
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == user_email
    assert "id" in data
    assert "hashed_password" not in data

    # Login with correct credentials
    login_response = client.post(
        "/api/v1/auth/token",
        data={"username": user_email, "password": user_password},
    )
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

    # Login with incorrect password
    login_response_fail = client.post(
        "/api/v1/auth/token",
        data={"username": user_email, "password": "wrong_password"},
    )
    assert login_response_fail.status_code == 401

def test_create_survey_unauthenticated(client: TestClient):
    response = client.post(
        "/api/v1/surveys",
        json={"title": "Unauthenticated Survey", "config": {}},
    )
    assert response.status_code == 401

def test_create_and_get_survey_authenticated(client: TestClient, db_session: Session):
    # Create org and user
    org = crud.create_organization(db_session, schemas.OrganizationCreate(name="AuthCorp"))
    user_schema = schemas.MemberCreate(email="auth.user@authcorp.com", password="password", organization_id=org.id)
    user = crud.create_member(db_session, user_schema)

    # Get token
    login_res = client.post("/api/v1/auth/token", data={"username": user.email, "password": "password"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create survey
    survey_title = "Customer Satisfaction"
    survey_config = {"questions": [{"id": "q1", "text": "How satisfied are you?"}]}
    create_res = client.post(
        "/api/v1/surveys",
        json={"title": survey_title, "config": survey_config},
        headers=headers,
    )
    assert create_res.status_code == 201
    survey_data = create_res.json()
    assert survey_data["title"] == survey_title
    assert survey_data["config"] == survey_config
    survey_id = survey_data["id"]

    # Get survey
    get_res = client.get(f"/api/v1/surveys/{survey_id}")
    assert get_res.status_code == 200
    assert get_res.json()["title"] == survey_title

def test_submit_response(client: TestClient, db_session: Session):
    # Create org, user, survey
    org = crud.create_organization(db_session, schemas.OrganizationCreate(name="ResponseCorp"))
    user_schema = schemas.MemberCreate(email="resp.user@rescorp.com", password="password", organization_id=org.id)
    user = crud.create_member(db_session, user_schema)
    survey_schema = schemas.SurveyCreate(title="Feedback Survey", config={})
    survey = crud.create_survey(db_session, survey_schema, creator_id=user.id)

    # Get token
    login_res = client.post("/api/v1/auth/token", data={"username": user.email, "password": "password"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Submit response
    response_answers = {"q1": 5, "q2": "Good"}
    response_res = client.post(
        f"/api/v1/surveys/{survey.id}/responses",
        json={"answers": response_answers, "time_spent_seconds": 120},
        headers=headers,
    )
    assert response_res.status_code == 201
    response_data = response_res.json()
    assert response_data["answers"] == response_answers
    assert response_data["member_id"] == str(user.id)
    assert response_data["survey_id"] == str(survey.id)

    # Check analytics
    analytics_res = client.get(f"/api/v1/surveys/{survey.id}/analytics")
    assert analytics_res.status_code == 200
    analytics_data = analytics_res.json()
    assert analytics_data["response_count"] == 1

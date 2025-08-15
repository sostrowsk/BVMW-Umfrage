# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Survey Platform Backend - FastAPI-based REST API for managing surveys, members, and responses for the Member Engagement Survey Platform.

## Project Commands

### Development
- Install dependencies: `poetry install`
- Update dependencies: `poetry update`
- Run development server: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
- Run with Docker: `docker-compose up --build`

### Testing
- Run all tests: `docker-compose run --rm backend poetry run pytest`
- Run specific test: `docker-compose run --rm backend poetry run pytest tests/test_main.py::TestClassName::test_method -v`
- Run tests locally (requires setup): `poetry run pytest`

### Database
- Database is automatically initialized via `init.sql` when using Docker Compose
- PostgreSQL connection: `postgresql://user:password@localhost:5432/survey_platform` (when running via Docker)
- Future migrations will use Alembic (configured in pyproject.toml but not yet implemented)

## Architecture

### Core Structure
- **FastAPI Application**: Main app entry point in `app/main.py`
- **Database Models**: SQLAlchemy ORM models in `app/models.py` define relationships between Organizations, Members, Surveys, and SurveyResponses
- **API Schemas**: Pydantic models in `app/schemas.py` handle request/response validation
- **CRUD Operations**: Database interaction logic separated in `app/crud.py`
- **Authentication**: JWT-based auth with OAuth2PasswordBearer flow in `app/security.py`

### Key Design Patterns
- **Dependency Injection**: Database sessions managed via FastAPI's dependency system (`get_db`)
- **Repository Pattern**: CRUD operations abstracted from API endpoints
- **Configuration Management**: Environment-based config via Pydantic Settings in `app/core/config.py`
- **Test Isolation**: Tests use in-memory SQLite database to avoid PostgreSQL dependency

### API Structure
- Base path: `/api/v1/`
- Authentication endpoint: `/api/v1/auth/token`
- Interactive docs: `http://localhost:8000/docs` (Swagger) and `/redoc`
- Protected routes use `get_current_user` dependency for JWT validation

### Testing Strategy
- Test fixtures in `tests/conftest.py` provide isolated database sessions
- Each test gets a fresh database with automatic cleanup
- TestClient from FastAPI for API testing with dependency overrides

## Environment Configuration
Required environment variables (can be set in `.env` file or docker-compose.yml):
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT signing key (generate with `openssl rand -hex 32`)
- `ALGORITHM`: JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time (default: 30)

## Docker Setup
- Backend service runs on port 8000
- PostgreSQL database runs on port 5432
- Volume mounts for hot-reloading: `./app:/app`
- Database data persisted in named volume: `postgres_data`
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Full-stack Survey Platform with FastAPI backend and React frontend for creating, managing, and analyzing surveys. The platform supports multi-tenant organizations, user management, dynamic survey creation, and real-time analytics.

## Project Commands

### Quick Start
- Local setup: `./deploy.sh local`
- Access API: http://localhost:8000
- Access docs: http://localhost:8000/docs
- Access frontend: http://localhost:5173

### Backend Development
- Install dependencies: `poetry install --no-root`
- Update dependencies: `poetry update`
- Run development server: `poetry run uvicorn app.main:app --reload`
- Run with Docker: `docker-compose up --build`
- Format code: `black app/ tests/`
- Lint code: `flake8 app/ tests/`

### Frontend Development
- Install dependencies: `cd frontend && npm install`
- Run dev server: `npm run dev`
- Build for production: `npm run build`
- Run tests: `npm test`
- Lint code: `npm run lint`

### Testing
- Backend tests: `docker-compose run --rm backend poetry run pytest`
- Backend coverage: `poetry run pytest --cov=app --cov-report=html`
- Frontend tests: `cd frontend && npm test`
- Frontend coverage: `cd frontend && npm run test:coverage`

### Database
- PostgreSQL runs on port 5433 (mapped from container port 5432)
- Connection: `postgresql://user:password@localhost:5433/survey_platform`
- Database initialized automatically via `init.sql`
- Access database: `psql -h localhost -p 5433 -U user -d survey_platform`

### Deployment
- Deploy to staging: `./deploy.sh staging`
- Deploy to production: `./deploy.sh production`
- Dry run: `./deploy.sh production --check`

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

## Important Notes

### Port Configuration
- PostgreSQL runs on **port 5433** locally (not 5432) to avoid conflicts
- Backend API runs on port 8000
- Frontend dev server runs on port 5173

### Docker Volume Mappings
- `./app:/app/app` - Application code
- `./pyproject.toml:/app/pyproject.toml` - Poetry config
- `./poetry.lock:/app/poetry.lock` - Locked dependencies

### Environment Variables
Key variables in `.env`:
- `DATABASE_URL`: PostgreSQL connection (use port 5433 for local)
- `SECRET_KEY`: JWT signing key (generate with `openssl rand -hex 32`)
- `ALGORITHM`: JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration (default: 30)

### Frontend API Configuration
Frontend expects backend at `http://localhost:8000/api/v1`
Configured in `frontend/src/api/client.ts`

## Code Style Guidelines

### Backend (Python)
- Use Black for formatting: `black app/ tests/`
- Follow PEP 8 with 120 character line limit
- Use type hints for function parameters and returns
- Prefer f-strings for string formatting
- Use async/await for database operations

### Frontend (TypeScript/React)
- Use ESLint and Prettier for formatting
- Follow React Hooks best practices
- Use functional components with TypeScript
- Implement proper error boundaries
- Keep components small and focused

### Git Commit Messages
- Use conventional commits format
- Prefix: feat, fix, docs, style, refactor, test, chore
- Example: `feat: Add survey response analytics endpoint`

## Common Tasks

### Adding a New API Endpoint
1. Define Pydantic schemas in `app/schemas.py`
2. Add database operations in `app/crud.py`
3. Create endpoint in `app/main.py`
4. Add tests in `tests/test_main.py`
5. Update frontend API client in `frontend/src/api/`

### Adding a New Frontend Page
1. Create component in `frontend/src/pages/`
2. Add route in `frontend/src/App.tsx`
3. Create API integration in `frontend/src/api/`
4. Add navigation link in `frontend/src/layouts/AppLayout.tsx`
5. Implement tests for new components

### Database Schema Changes
1. Update models in `app/models.py`
2. Update `init.sql` for new installations
3. Create Alembic migration (when implemented)
4. Update Pydantic schemas
5. Test with fresh database initialization
- Pubbeteer: http://localhost:5173/
TestUser: test@example.comPassword1234!
TextUserPassword: Password1234!
- use tmp/start_server.sh to start / restart the server!
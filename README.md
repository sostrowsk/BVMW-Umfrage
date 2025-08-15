# Survey Platform - Full Stack Application

A comprehensive survey management platform with backend API and React frontend for creating, managing, and analyzing surveys. Built with FastAPI, PostgreSQL, React, and TypeScript.

## 🚀 Features

- **Survey Management**: Create, edit, and publish dynamic surveys
- **Organization Management**: Multi-tenant support for different organizations
- **Member Management**: User registration, authentication, and role-based access
- **Response Collection**: Secure survey response submission and tracking
- **Analytics Dashboard**: Real-time insights and survey analytics
- **REST API**: Comprehensive API with OpenAPI/Swagger documentation
- **Modern Frontend**: Responsive React application with TypeScript

## 🛠 Tech Stack

### Backend
- **Framework:** Python 3.11+ with FastAPI
- **Database:** PostgreSQL 15
- **Authentication:** JWT-based OAuth2
- **ORM:** SQLAlchemy 2.0
- **Validation:** Pydantic
- **Package Management:** Poetry

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Routing:** React Router v6
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **State Management:** React Context API

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **Deployment:** Ansible automation
- **Web Server:** Nginx (production)
- **Process Manager:** Systemd

## Prerequisites

### For Docker Development
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### For Production Deployment
- Ansible 2.14+
- Python 3.8+ on control machine
- SSH access to target servers

## 🚀 Quick Start

### Using the Deployment Script (Recommended)

```bash
# Install Ansible dependencies
ansible-galaxy install -r ansible/requirements.yml

# Run local setup
./deploy.sh local

# Access the application
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
# Frontend: http://localhost:5173 (after starting frontend)
```

### Manual Docker Setup

1. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Start Services**
   ```bash
   docker-compose up --build
   ```

3. **Start Frontend (separate terminal)**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Access Points
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Frontend Application:** http://localhost:5173
- **Database:** PostgreSQL on port 5433


## 🚢 Deployment

### Environment-Specific Deployment

```bash
# Deploy to staging
./deploy.sh staging

# Deploy to production (with confirmation)
./deploy.sh production

# Dry run for production
./deploy.sh production --check

# Deploy specific version
./deploy.sh staging -e "docker_tag=v1.2.3"
```

### Features by Environment

#### Local Development
- No root privileges required
- Poetry and development tools setup
- Hot reload enabled
- Debug mode active

#### Staging
- Blue-green deployment strategy
- Let's Encrypt staging SSL
- Monitoring enabled
- Integration testing

#### Production
- Canary deployment with monitoring
- Rolling updates (30% at a time)
- Automated backups before/after deployment
- CloudFlare CDN integration
- Slack notifications

See [ansible/README.md](ansible/README.md) for detailed deployment documentation.

## 🧪 Testing

### Backend Tests

```bash
# Run all tests
docker-compose run --rm backend poetry run pytest

# Run with coverage
poetry run pytest --cov=app --cov-report=html

# Run specific test
poetry run pytest tests/test_main.py::TestOrganizations -v
```

### Frontend Tests

```bash
cd frontend
npm test
npm run test:coverage
```

## Project Structure

```
.
├── app/                    # Main application source code
│   ├── core/              # Configuration and core settings
│   │   ├── __init__.py
│   │   └── config.py      # Pydantic settings management
│   ├── crud.py            # CRUD operations (database interaction logic)
│   ├── database.py        # Database engine and session management
│   ├── email.py           # Mock email service for development
│   ├── main.py            # FastAPI application and API endpoints
│   ├── models.py          # SQLAlchemy ORM database models
│   ├── schemas.py         # Pydantic schemas for data validation
│   └── security.py        # Authentication, hashing, and JWT logic
├── ansible/               # Deployment automation
│   ├── playbook.yml       # Main Ansible playbook
│   ├── inventory.ini      # Server inventory
│   ├── requirements.yml   # Ansible dependencies
│   ├── group_vars/        # Configuration variables
│   │   └── all.yml        # Global variables
│   └── templates/         # Jinja2 templates
│       ├── env.j2         # Environment template
│       ├── nginx.conf.j2  # Nginx configuration
│       └── backup.sh.j2   # Backup script
├── tests/                 # Application tests
│   ├── conftest.py        # Pytest configuration and fixtures
│   └── test_main.py       # Tests for the main API endpoints
├── .env.example           # Environment variables template
├── .gitignore
├── CLAUDE.md              # AI assistant instructions
├── docker-compose.yml     # Docker Compose configuration
├── Dockerfile             # Docker image definition
├── init.sql               # Initial database schema
├── poetry.lock            # Locked dependencies
├── pyproject.toml         # Project metadata and dependencies
└── README.md              # This file
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/token` - Login and receive JWT token
- `POST /api/v1/auth/refresh` - Refresh access token

### Organizations
- `GET /api/v1/organizations` - List all organizations
- `POST /api/v1/organizations` - Create new organization
- `GET /api/v1/organizations/{id}` - Get organization details
- `PUT /api/v1/organizations/{id}` - Update organization
- `DELETE /api/v1/organizations/{id}` - Delete organization

### Members
- `GET /api/v1/members` - List all members
- `POST /api/v1/members` - Create new member
- `GET /api/v1/members/{id}` - Get member details
- `PUT /api/v1/members/{id}` - Update member
- `DELETE /api/v1/members/{id}` - Delete member

### Surveys
- `GET /api/v1/surveys` - List all surveys
- `POST /api/v1/surveys` - Create new survey
- `GET /api/v1/surveys/{id}` - Get survey details
- `PUT /api/v1/surveys/{id}` - Update survey
- `DELETE /api/v1/surveys/{id}` - Delete survey
- `POST /api/v1/surveys/{id}/publish` - Publish survey

### Survey Responses
- `GET /api/v1/responses` - List all responses
- `POST /api/v1/responses` - Submit survey response
- `GET /api/v1/responses/{id}` - Get response details
- `PUT /api/v1/responses/{id}` - Update response
- `GET /api/v1/surveys/{id}/responses` - Get responses for a survey

## Development Workflow

### Local Development
```bash
# Install dependencies
poetry install

# Run development server
poetry run uvicorn app.main:app --reload

# Run tests
poetry run pytest

# Format code
poetry run black .
poetry run isort .

# Lint code
poetry run flake8
```

### Using Docker
```bash
# Build and start services
docker-compose up --build

# Run tests in container
docker-compose run --rm backend poetry run pytest

# View logs
docker-compose logs -f backend

# Execute commands in container
docker-compose exec backend bash
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Documentation

- [API Documentation](http://localhost:8000/docs) - Interactive Swagger UI
- [Deployment Guide](ansible/README.md) - Detailed deployment instructions
- [Frontend Documentation](frontend/README.md) - React application details
- [AI Assistant Guide](CLAUDE.md) - Instructions for Claude Code

## 🔒 Security

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- SQL injection protection via SQLAlchemy ORM
- CORS configuration for cross-origin requests
- Environment-based configuration management
- Automated security updates via Dependabot

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Ensure all tests pass (`pytest && npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 💬 Support

For issues or questions:
- Create an issue in the repository
- Contact the development team
- Check the [documentation](http://localhost:8000/docs)

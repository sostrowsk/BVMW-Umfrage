# Docker Setup

## Quick Start
```bash
docker-compose up -d
```

## Access Points
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Frontend**: http://localhost:5173
- **Database**: localhost:5433

## Commands

### Build & Start
```bash
docker-compose build
docker-compose up -d
```

### Management
```bash
docker-compose ps
docker-compose logs -f
docker-compose down
docker-compose restart backend
```

### Database Access
```bash
docker-compose exec db psql -U user -d survey_platform
```

## Environment Variables
Create `.env` file:
```env
DATABASE_URL=postgresql://user:password@db:5432/survey_platform
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Development
Backend code is mounted as volume - changes reflect immediately with `--reload` flag.

Frontend requires rebuild:
```bash
docker-compose build frontend
docker-compose restart frontend
```

## Troubleshooting

### Port Conflicts
PostgreSQL uses port 5433 locally to avoid conflicts with existing installations.

### Container Logs
```bash
docker-compose logs backend
docker-compose logs db
docker-compose logs frontend
```

### Reset Everything
```bash
docker-compose down -v
docker-compose up -d --build
```
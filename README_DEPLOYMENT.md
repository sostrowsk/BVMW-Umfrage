# Survey Platform Deployment Guide

## Architecture
- **Backend**: FastAPI (Python) in Docker
- **Frontend**: React (TypeScript) served via Nginx
- **Database**: PostgreSQL 15
- **Cache**: Redis
- **Orchestration**: Docker Compose + Ansible

## Files Created
1. `frontend/Dockerfile` - Multi-stage build for React app
2. `frontend/nginx.conf` - Nginx configuration for frontend
3. `docker-compose.prod.yml` - Production Docker Compose
4. `ansible/deploy.yml` - Main deployment playbook
5. `ansible/roles/docker/tasks/main.yml` - Docker installation
6. `ansible/roles/app/tasks/main.yml` - Application deployment
7. `ansible/roles/backup/tasks/main.yml` - Backup configuration
8. `ansible/roles/app/templates/env.j2` - Environment template
9. `.github/workflows/deploy.yml` - CI/CD pipeline

## Quick Start

### Local Testing
```bash
docker-compose -f docker-compose.prod.yml up --build
```

### Production Deployment
```bash
cd ansible
ansible-playbook deploy.yml -i inventory.ini --limit production -e "env=production"
```

### Manual Deployment Steps
1. Install Docker on target server
2. Copy project files to `/opt/survey-platform`
3. Create `.env` file with production variables
4. Run `docker-compose -f docker-compose.prod.yml up -d`
5. Setup daily backups with cron

## Environment Variables
Required in `.env`:
- `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `SECRET_KEY` (generate with: `openssl rand -hex 32`)
- `FRONTEND_URL`, `BACKEND_URL`

## Backup & Restore
- **Backup**: Runs daily at 2 AM to `/opt/backups`
- **Restore**: `/opt/backups/restore.sh <backup_file>`

## GitHub Actions Secrets
Configure in repository settings:
- `SSH_PRIVATE_KEY` - Server SSH key
- `SSH_KNOWN_HOSTS` - Server fingerprints
- `ANSIBLE_VAULT_PASSWORD` - Vault password

## Monitoring
- Health check: `http://localhost:8000/health`
- Container logs: `docker-compose logs -f`

## Rollback
```bash
docker-compose down
docker-compose up -d --force-recreate
```
# Ansible Deployment

## Prerequisites
```bash
pip install ansible
```

## Configuration
Edit `inventory.ini` with your server details:
```ini
[production]
umfrage.koeln-bvmw.de ansible_user=root
```

## Deploy Everything
```bash
ansible-playbook -i inventory.ini site.yml
```

## Deploy Individual Components
```bash
# Install Docker only
ansible-playbook -i inventory.ini docker.yml

# Setup PostgreSQL only
ansible-playbook -i inventory.ini postgresql.yml

# Deploy application only
ansible-playbook -i inventory.ini application.yml

# Configure Nginx & SSL only
ansible-playbook -i inventory.ini webserver.yml
```

## Dry Run
```bash
ansible-playbook -i inventory.ini site.yml --check
```

## What It Does
1. Installs Docker & Docker Compose
2. Copies application files to `/opt/bvmw-survey`
3. Builds and starts containers
4. Configures Nginx reverse proxy
5. Obtains SSL certificate via Let's Encrypt
6. Sets up automatic certificate renewal

## Server Access
- Frontend: https://umfrage.koeln-bvmw.de
- API: https://umfrage.koeln-bvmw.de/api
- Docs: https://umfrage.koeln-bvmw.de/docs

## Manual Commands on Server
```bash
cd /opt/bvmw-survey
docker-compose ps
docker-compose logs -f
docker-compose restart backend
```
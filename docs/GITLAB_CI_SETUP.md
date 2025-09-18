# GitLab CI Setup Guide

## Required GitLab CI/CD Variables

Configure these variables in your GitLab project settings under Settings → CI/CD → Variables:

### Container Registry
- `CI_REGISTRY_USER`: GitLab registry username (usually your GitLab username)
- `CI_REGISTRY_PASSWORD`: GitLab registry password or deploy token

### Staging Environment
- `STAGING_HOST`: Staging server IP or hostname
- `STAGING_USER`: SSH user for staging server
- `STAGING_SSH_PRIVATE_KEY`: Private SSH key for staging server (type: File)
- `STAGING_SSH_KNOWN_HOSTS`: SSH known_hosts entry for staging server
- `STAGING_DB_HOST`: PostgreSQL host for staging
- `STAGING_DB_PORT`: PostgreSQL port (usually 5432)
- `STAGING_DB_NAME`: Database name for staging
- `STAGING_DB_USER`: Database user for staging
- `STAGING_DB_PASSWORD`: Database password for staging

### Production Environment
- `PRODUCTION_HOST`: Production server IP or hostname
- `PRODUCTION_USER`: SSH user for production server
- `PRODUCTION_SSH_PRIVATE_KEY`: Private SSH key for production server (type: File)
- `PRODUCTION_SSH_KNOWN_HOSTS`: SSH known_hosts entry for production server
- `PRODUCTION_DB_HOST`: PostgreSQL host for production
- `PRODUCTION_DB_PORT`: PostgreSQL port (usually 5432)
- `PRODUCTION_DB_NAME`: Database name for production
- `PRODUCTION_DB_USER`: Database user for production
- `PRODUCTION_DB_PASSWORD`: Database password for production

### Rollback Variables
- `ROLLBACK_VERSION`: Docker image tag to rollback to (set manually when triggering rollback)

## SSH Setup

### Generate SSH Key Pair
```bash
ssh-keygen -t ed25519 -C "gitlab-ci@bvmw-survey" -f gitlab-ci-key
```

### Add Public Key to Target Servers
```bash
ssh-copy-id -i gitlab-ci-key.pub user@staging-server
ssh-copy-id -i gitlab-ci-key.pub user@production-server
```

### Get SSH Known Hosts
```bash
ssh-keyscan -H staging-server.example.com
ssh-keyscan -H production-server.example.com
```

## Pipeline Workflow

1. **Test Stage**
   - Runs on merge requests and main/develop branches
   - Backend: pytest, black, flake8
   - Frontend: lint, test, build

2. **Build Stage**
   - Builds Docker images on main/develop branches
   - Pushes to GitLab Container Registry
   - Tags latest for main branch

3. **Deploy Stage**
   - Manual deployment to staging from develop branch
   - Manual deployment to production from main branch
   - Manual rollback option for production

## Usage

### Deploy to Staging
1. Merge code to `develop` branch
2. Go to CI/CD → Pipelines
3. Click manual action for "deploy:staging"

### Deploy to Production
1. Merge code to `main` branch
2. Go to CI/CD → Pipelines
3. Click manual action for "deploy:production"

### Rollback Production
1. Set `ROLLBACK_VERSION` variable to desired image tag
2. Go to CI/CD → Pipelines on main branch
3. Click manual action for "rollback:production"

## Modified Ansible Playbook

Update your Ansible playbook to use Docker images from registry instead of building locally:

```yaml
# ansible/roles/app/tasks/main.yml
- name: pull_docker_images
  docker_image:
    name: "{{ docker_registry }}/{{ item }}:{{ docker_tag }}"
    source: pull
  loop:
    - backend
    - frontend

- name: start_containers_from_registry
  docker_container:
    name: "{{ item.name }}"
    image: "{{ docker_registry }}/{{ item.image }}:{{ docker_tag }}"
    state: started
    restart_policy: always
    ports: "{{ item.ports }}"
    env: "{{ item.env }}"
  loop:
    - name: backend
      image: backend
      ports:
        - "8000:8000"
      env:
        DATABASE_URL: "{{ database_url }}"
        SECRET_KEY: "{{ secret_key }}"
    - name: frontend
      image: frontend
      ports:
        - "80:80"
      env: {}
```
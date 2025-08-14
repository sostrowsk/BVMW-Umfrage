# Survey Platform - Ansible Deployment

## Prerequisites

- Ansible 2.14+ installed on your local machine
- Python 3.8+ on the control machine
- SSH access to target servers
- sudo privileges on target servers

## Quick Start

### 1. Install Ansible Dependencies

```bash
ansible-galaxy install -r requirements.yml
```

### 2. Configure Inventory

Edit `inventory.ini` to match your server details:

```ini
[production]
your-server ansible_host=YOUR_SERVER_IP ansible_user=ubuntu
```

### 3. Configure Variables

Create sensitive variables file:

```bash
ansible-vault create group_vars/vault.yml
```

Add the following encrypted variables:
```yaml
vault_db_password: your_secure_db_password
vault_secret_key: your_jwt_secret_key
vault_smtp_password: your_smtp_password
vault_admin_password: your_admin_password
```

### 4. Run Playbook

For local development:
```bash
ansible-playbook -i inventory.ini playbook.yml --limit local
```

For production deployment:
```bash
ansible-playbook -i inventory.ini playbook.yml --limit production --ask-vault-pass
```

## Deployment Options

### Basic Deployment
```bash
ansible-playbook -i inventory.ini playbook.yml
```

### With Custom Variables
```bash
ansible-playbook -i inventory.ini playbook.yml \
  -e "git_repository_url=https://github.com/yourusername/survey-platform.git" \
  -e "git_branch=develop"
```

### Enable Optional Features
```bash
ansible-playbook -i inventory.ini playbook.yml \
  -e "setup_nginx=true" \
  -e "setup_ssl=true" \
  -e "setup_monitoring=true" \
  -e "setup_backup=true"
```

### Dry Run
```bash
ansible-playbook -i inventory.ini playbook.yml --check
```

## Configuration

### Environment-Specific Variables

Create environment-specific variable files:

- `group_vars/development.yml`
- `group_vars/staging.yml`
- `group_vars/production.yml`

Example `group_vars/production.yml`:
```yaml
environment: production
debug_mode: false
app_workers: 4
setup_nginx: true
setup_ssl: true
setup_monitoring: true
setup_backup: true
```

### SSL Configuration

For Let's Encrypt SSL:
```yaml
setup_ssl: true
ssl_provider: letsencrypt
letsencrypt_email: admin@yourdomain.com
nginx_server_name: yourdomain.com
```

### Backup Configuration

Configure automated backups:
```yaml
setup_backup: true
backup_retention_days: 30
backup_s3_bucket: your-backup-bucket
backup_s3_access_key: "{{ vault_s3_access_key }}"
backup_s3_secret_key: "{{ vault_s3_secret_key }}"
```

## Management Commands

### Check Service Status
```bash
ansible all -i inventory.ini -m shell -a "systemctl status survey-platform"
```

### View Logs
```bash
ansible all -i inventory.ini -m shell -a "docker-compose -f /opt/survey-platform/docker-compose.yml logs --tail=100"
```

### Restart Services
```bash
ansible all -i inventory.ini -m shell -a "systemctl restart survey-platform"
```

### Run Database Backup
```bash
ansible all -i inventory.ini -m shell -a "/usr/local/bin/survey-backup"
```

## Troubleshooting

### Connection Issues
```bash
ansible all -i inventory.ini -m ping
```

### Debug Mode
```bash
ansible-playbook -i inventory.ini playbook.yml -vvv
```

### Check Docker Status
```bash
ansible all -i inventory.ini -m shell -a "docker ps"
```

## Security Notes

1. Always use Ansible Vault for sensitive data
2. Restrict SSH access with firewall rules
3. Use strong passwords and rotate them regularly
4. Enable fail2ban for brute force protection
5. Keep system packages updated
6. Use SSL/TLS for production deployments
7. Implement proper backup strategies

## Directory Structure

```
ansible/
├── playbook.yml           # Main playbook
├── inventory.ini          # Inventory file
├── requirements.yml       # Ansible dependencies
├── group_vars/
│   ├── all.yml           # Global variables
│   └── vault.yml         # Encrypted sensitive variables
└── templates/            # Jinja2 templates
    ├── env.j2
    ├── nginx.conf.j2
    ├── docker-compose.service.j2
    ├── backup.sh.j2
    └── logrotate.j2
```

## Post-Deployment

After successful deployment:

1. Access the application at `http://YOUR_SERVER_IP:8000`
2. API documentation at `http://YOUR_SERVER_IP:8000/docs`
3. Login with admin credentials configured in variables
4. Configure organization and initial surveys
5. Test email functionality
6. Verify backup scripts are working

## Support

For issues or questions, please check:
- Application logs: `/var/log/survey-platform/`
- Docker logs: `docker-compose logs`
- System logs: `journalctl -u survey-platform`
#!/bin/bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
usage() {
    echo "Usage: $0 <environment> [options]"
    echo ""
    echo "Environments:"
    echo "  local       Deploy to local development environment"
    echo "  staging     Deploy to staging environment"
    echo "  production  Deploy to production environment"
    echo ""
    echo "Options:"
    echo "  --backend-only    Deploy only backend services"
    echo "  --frontend-only   Deploy only frontend application"
    echo "  --full-stack      Deploy both backend and frontend (default)"
    echo "  --check           Run playbook in check mode (dry run)"
    echo "  --diff            Show differences for changed files"
    echo "  --tags <tags>     Run only specified tags"
    echo "  --skip-tags <tags> Skip specified tags"
    echo "  --limit <hosts>   Limit deployment to specific hosts"
    echo "  --vault-password  Prompt for vault password"
    echo "  --verbose         Enable verbose output"
    echo "  --help            Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 staging                    # Deploy full stack to staging"
    echo "  $0 production --backend-only  # Deploy only backend to production"
    echo "  $0 local --check              # Dry run for local environment"
    echo "  $0 staging --tags deploy      # Run only deploy tasks on staging"
    exit 1
}
if [ $# -lt 1 ]; then
    usage
fi
ENVIRONMENT=$1
shift
DEPLOYMENT_TYPE="full-stack"
ANSIBLE_OPTIONS=""
VAULT_PASSWORD=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --backend-only)
            DEPLOYMENT_TYPE="backend"
            shift
            ;;
        --frontend-only)
            DEPLOYMENT_TYPE="frontend"
            shift
            ;;
        --full-stack)
            DEPLOYMENT_TYPE="full-stack"
            shift
            ;;
        --check)
            ANSIBLE_OPTIONS="$ANSIBLE_OPTIONS --check"
            shift
            ;;
        --diff)
            ANSIBLE_OPTIONS="$ANSIBLE_OPTIONS --diff"
            shift
            ;;
        --tags)
            ANSIBLE_OPTIONS="$ANSIBLE_OPTIONS --tags $2"
            shift 2
            ;;
        --skip-tags)
            ANSIBLE_OPTIONS="$ANSIBLE_OPTIONS --skip-tags $2"
            shift 2
            ;;
        --limit)
            ANSIBLE_OPTIONS="$ANSIBLE_OPTIONS --limit $2"
            shift 2
            ;;
        --vault-password)
            VAULT_PASSWORD="--ask-vault-pass"
            shift
            ;;
        --verbose|-v)
            ANSIBLE_OPTIONS="$ANSIBLE_OPTIONS -v"
            shift
            ;;
        --help|-h)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done
case $ENVIRONMENT in
    local|staging|production)
        ;;
    *)
        echo "Error: Invalid environment '$ENVIRONMENT'"
        echo "Valid environments are: local, staging, production"
        exit 1
        ;;
esac
case $DEPLOYMENT_TYPE in
    backend)
        PLAYBOOK="playbook.yml"
        echo "Deploying backend only to $ENVIRONMENT environment..."
        ;;
    frontend)
        PLAYBOOK="playbook-frontend.yml"
        echo "Deploying frontend only to $ENVIRONMENT environment..."
        ;;
    full-stack)
        PLAYBOOK="playbook-full-stack.yml"
        echo "Deploying full stack to $ENVIRONMENT environment..."
        ;;
    *)
        echo "Error: Invalid deployment type '$DEPLOYMENT_TYPE'"
        exit 1
        ;;
esac
if [ ! -f "$PLAYBOOK" ]; then
    echo "Error: Playbook '$PLAYBOOK' not found!"
    exit 1
fi
if [ ! -f "inventories/$ENVIRONMENT/hosts" ]; then
    echo "Error: Inventory file 'inventories/$ENVIRONMENT/hosts' not found!"
    exit 1
fi
if command -v python3 &> /dev/null; then
    export ANSIBLE_PYTHON_INTERPRETER=$(which python3)
fi
echo "----------------------------------------"
echo "Environment: $ENVIRONMENT"
echo "Deployment Type: $DEPLOYMENT_TYPE"
echo "Playbook: $PLAYBOOK"
echo "----------------------------------------"
if [ "$ENVIRONMENT" = "production" ]; then
    echo ""
    echo "WARNING: You are about to deploy to PRODUCTION!"
    echo "This action will affect live users."
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
    echo ""
    read -p "Type 'PRODUCTION' to confirm: " -r
    echo
    if [[ $REPLY != "PRODUCTION" ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
fi
if command -v ansible-playbook &> /dev/null; then
    echo ""
    echo "Starting deployment..."
    echo "Running: ansible-playbook -i inventories/$ENVIRONMENT/hosts $PLAYBOOK $ANSIBLE_OPTIONS $VAULT_PASSWORD"
    echo ""
    
    ansible-playbook \
        -i "inventories/$ENVIRONMENT/hosts" \
        "$PLAYBOOK" \
        $ANSIBLE_OPTIONS \
        $VAULT_PASSWORD
    
    RESULT=$?
    
    if [ $RESULT -eq 0 ]; then
        echo ""
        echo "========================================="
        echo "Deployment completed successfully!"
        echo "Environment: $ENVIRONMENT"
        echo "Type: $DEPLOYMENT_TYPE"
        echo "========================================="
    else
        echo ""
        echo "========================================="
        echo "Deployment failed!"
        echo "Environment: $ENVIRONMENT"
        echo "Type: $DEPLOYMENT_TYPE"
        echo "Exit code: $RESULT"
        echo "========================================="
        exit $RESULT
    fi
else
    echo "Error: ansible-playbook command not found!"
    echo "Please install Ansible first:"
    echo "  pip install ansible"
    exit 1
fi
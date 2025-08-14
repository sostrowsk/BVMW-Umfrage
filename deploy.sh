#!/bin/bash
set -e

# Survey Platform Deployment Script
# Usage: ./deploy.sh [environment] [options]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANSIBLE_DIR="${SCRIPT_DIR}/ansible"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=""
PLAYBOOK=""
EXTRA_VARS=""
TAGS=""
LIMIT=""
CHECK_MODE=""
VERBOSE=""
FORCE=""

# Function to print colored output
print_color() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

# Function to show usage
usage() {
    cat << EOF
Usage: $0 [environment] [options]

Environments:
    local       Deploy to local development environment
    dev         Deploy to development servers
    staging     Deploy to staging environment
    production  Deploy to production environment

Options:
    -t, --tags TAGS           Run only specific tags
    -l, --limit HOSTS         Limit deployment to specific hosts
    -c, --check              Run in check mode (dry run)
    -v, --verbose            Increase verbosity (-vvv for debug)
    -f, --force              Skip confirmation prompts
    -e, --extra-vars VARS    Pass extra variables to Ansible
    -h, --help               Show this help message

Examples:
    $0 local                          # Deploy to local environment
    $0 staging -t app                 # Deploy only app to staging
    $0 production -c                  # Dry run for production
    $0 production -l prod-web-1       # Deploy to specific server
    $0 staging -e "docker_tag=v1.2.3" # Deploy specific version

EOF
    exit 0
}

# Function to check prerequisites
check_prerequisites() {
    print_color "$YELLOW" "Checking prerequisites..."
    
    # Check if Ansible is installed
    if ! command -v ansible &> /dev/null; then
        print_color "$RED" "Error: Ansible is not installed"
        exit 1
    fi
    
    # Check if inventory file exists
    if [[ ! -f "${ANSIBLE_DIR}/inventory.ini" ]]; then
        print_color "$RED" "Error: Inventory file not found"
        exit 1
    fi
    
    # Check if required files exist
    if [[ ! -d "${ANSIBLE_DIR}/group_vars" ]]; then
        print_color "$RED" "Error: group_vars directory not found"
        exit 1
    fi
    
    print_color "$GREEN" "✓ Prerequisites check passed"
}

# Function to install Ansible requirements
install_requirements() {
    print_color "$YELLOW" "Installing Ansible requirements..."
    
    if [[ -f "${ANSIBLE_DIR}/requirements.yml" ]]; then
        ansible-galaxy install -r "${ANSIBLE_DIR}/requirements.yml" --force
        print_color "$GREEN" "✓ Ansible requirements installed"
    else
        print_color "$YELLOW" "No requirements.yml found, skipping..."
    fi
}

# Function to confirm deployment
confirm_deployment() {
    if [[ "$FORCE" != "true" ]]; then
        print_color "$YELLOW" "You are about to deploy to: $ENVIRONMENT"
        read -p "Are you sure you want to continue? (yes/no): " -r
        echo
        if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
            print_color "$RED" "Deployment cancelled"
            exit 1
        fi
    fi
}

# Function to run deployment
run_deployment() {
    local ansible_cmd="ansible-playbook"
    
    # Add inventory
    ansible_cmd="$ansible_cmd -i ${ANSIBLE_DIR}/inventory.ini"
    
    # Add playbook
    ansible_cmd="$ansible_cmd ${PLAYBOOK}"
    
    # Add limit if specified
    if [[ -n "$LIMIT" ]]; then
        ansible_cmd="$ansible_cmd --limit $LIMIT"
    fi
    
    # Add tags if specified
    if [[ -n "$TAGS" ]]; then
        ansible_cmd="$ansible_cmd --tags $TAGS"
    fi
    
    # Add extra vars if specified
    if [[ -n "$EXTRA_VARS" ]]; then
        ansible_cmd="$ansible_cmd -e \"$EXTRA_VARS\""
    fi
    
    # Add check mode if specified
    if [[ "$CHECK_MODE" == "true" ]]; then
        ansible_cmd="$ansible_cmd --check"
    fi
    
    # Add verbosity if specified
    if [[ -n "$VERBOSE" ]]; then
        ansible_cmd="$ansible_cmd $VERBOSE"
    fi
    
    # Ask for vault password if needed
    if [[ "$ENVIRONMENT" == "staging" ]] || [[ "$ENVIRONMENT" == "production" ]]; then
        ansible_cmd="$ansible_cmd --ask-vault-pass"
    fi
    
    print_color "$YELLOW" "Executing: $ansible_cmd"
    echo
    
    # Run the deployment
    eval $ansible_cmd
    
    if [[ $? -eq 0 ]]; then
        print_color "$GREEN" "✓ Deployment to $ENVIRONMENT completed successfully!"
    else
        print_color "$RED" "✗ Deployment to $ENVIRONMENT failed!"
        exit 1
    fi
}

# Function to show deployment status
show_status() {
    print_color "$YELLOW" "Checking deployment status for $ENVIRONMENT..."
    
    case "$ENVIRONMENT" in
        local)
            ansible localhost -i "${ANSIBLE_DIR}/inventory.ini" -m shell -a "docker ps | grep survey"
            ;;
        dev|staging|production)
            ansible "$ENVIRONMENT" -i "${ANSIBLE_DIR}/inventory.ini" -m shell -a "systemctl status survey-platform"
            ;;
    esac
}

# Parse command line arguments
if [[ $# -eq 0 ]]; then
    usage
fi

ENVIRONMENT=$1
shift

# Parse options
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--tags)
            TAGS="$2"
            shift 2
            ;;
        -l|--limit)
            LIMIT="$2"
            shift 2
            ;;
        -c|--check)
            CHECK_MODE="true"
            shift
            ;;
        -v|--verbose)
            VERBOSE="-vvv"
            shift
            ;;
        -f|--force)
            FORCE="true"
            shift
            ;;
        -e|--extra-vars)
            EXTRA_VARS="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        status)
            show_status
            exit 0
            ;;
        *)
            print_color "$RED" "Unknown option: $1"
            usage
            ;;
    esac
done

# Validate environment and set playbook
case "$ENVIRONMENT" in
    local)
        PLAYBOOK="${ANSIBLE_DIR}/playbook-local.yml"
        LIMIT="${LIMIT:-local}"
        ;;
    dev|development)
        ENVIRONMENT="development"
        PLAYBOOK="${ANSIBLE_DIR}/playbook.yml"
        LIMIT="${LIMIT:-development}"
        ;;
    staging)
        PLAYBOOK="${ANSIBLE_DIR}/playbook-staging.yml"
        LIMIT="${LIMIT:-staging}"
        ;;
    production|prod)
        ENVIRONMENT="production"
        PLAYBOOK="${ANSIBLE_DIR}/playbook-production.yml"
        LIMIT="${LIMIT:-production}"
        ;;
    *)
        print_color "$RED" "Error: Invalid environment '$ENVIRONMENT'"
        usage
        ;;
esac

# Main execution
print_color "$GREEN" "========================================="
print_color "$GREEN" "   Survey Platform Deployment Script"
print_color "$GREEN" "========================================="
echo

# Run deployment steps
check_prerequisites
install_requirements

# Confirm deployment for staging/production
if [[ "$ENVIRONMENT" == "staging" ]] || [[ "$ENVIRONMENT" == "production" ]]; then
    confirm_deployment
fi

# Run the deployment
run_deployment

# Show post-deployment information
echo
print_color "$GREEN" "========================================="
print_color "$GREEN" "   Deployment Complete"
print_color "$GREEN" "========================================="

# Environment-specific post-deployment info
case "$ENVIRONMENT" in
    local)
        print_color "$YELLOW" "Local development environment is ready!"
        print_color "$YELLOW" "Access the application at: http://localhost:8000"
        print_color "$YELLOW" "API documentation: http://localhost:8000/docs"
        ;;
    staging)
        print_color "$YELLOW" "Staging environment deployed!"
        print_color "$YELLOW" "URL: https://staging.survey-platform.com"
        ;;
    production)
        print_color "$YELLOW" "Production environment deployed!"
        print_color "$YELLOW" "URL: https://app.survey-platform.com"
        print_color "$YELLOW" "Remember to:"
        print_color "$YELLOW" "  - Monitor application logs"
        print_color "$YELLOW" "  - Check metrics dashboard"
        print_color "$YELLOW" "  - Verify backup status"
        ;;
esac

echo
print_color "$GREEN" "Run '$0 $ENVIRONMENT status' to check deployment status"
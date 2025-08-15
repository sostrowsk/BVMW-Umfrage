#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"
log_error() {
    echo -e "\033[0;31m✗ $1\033[0m" >&2
}
log_success() {
    echo -e "\033[0;32m✓ $1\033[0m"
}
log_info() {
    echo -e "\033[1;33m$1\033[0m"
}
clean_python_cache() {
    log_info "Cleaning Python Cache"
    echo "===================="
    echo "Removing __pycache__ directories..."
    find "$PROJECT_ROOT" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
    echo "Removing *.pyc files..."
    find "$PROJECT_ROOT" -type f -name "*.pyc" -delete 2>/dev/null || true
    echo "Removing *.pyo files..."
    find "$PROJECT_ROOT" -type f -name "*.pyo" -delete 2>/dev/null || true
    log_success "Python cache cleaned"
    echo
}
run_formatters() {
    log_info "Running Code Formatters"
    echo "===================="
    echo "Running black..."
    if [[ "$FIX_MODE" == true ]]; then
        poetry run black .
        log_success "Black formatting applied"
    else
        if poetry run black . --check --diff; then
            log_success "Black check passed"
        else
            log_error "Black check failed (run 'poetry run black .' to fix)"
        fi
    fi
    echo
}
run_linters() {
    log_info "Running Linters"
    echo "===================="
    echo "Running ruff..."
    if [[ "$FIX_MODE" == true ]]; then
        poetry run ruff check . --fix
        log_success "Ruff fixes applied"
    else
        if poetry run ruff check .; then
            log_success "Ruff check passed"
        else
            log_error "Ruff check failed (run 'poetry run ruff check . --fix' to fix)"
        fi
    fi
    echo
}

run_frontend_linters() {
    log_info "Running Frontend Linters"
    echo "===================="
    
    # Check if frontend directory exists
    if [[ ! -d "$PROJECT_ROOT/frontend" ]]; then
        log_info "Frontend directory not found, skipping frontend linting"
        return 0
    fi
    
    # Change to frontend directory
    cd "$PROJECT_ROOT/frontend"
    
    # Check if node_modules exists
    if [[ ! -d "node_modules" ]]; then
        log_info "node_modules not found, running npm install..."
        npm install
    fi
    
    # Run ESLint
    echo "Running ESLint..."
    if [[ "$FIX_MODE" == true ]]; then
        if npm run lint:fix 2>/dev/null || npx eslint . --ext .ts,.tsx,.js,.jsx --fix; then
            log_success "ESLint fixes applied"
        else
            log_error "ESLint fix failed"
        fi
    else
        if npm run lint 2>/dev/null || npx eslint . --ext .ts,.tsx,.js,.jsx; then
            log_success "ESLint check passed"
        else
            log_error "ESLint check failed (run with -f flag to fix)"
        fi
    fi
    
    # Run TypeScript type checking
    echo "Running TypeScript type check..."
    if npx tsc --noEmit; then
        log_success "TypeScript check passed"
    else
        log_error "TypeScript check failed"
    fi
    
    # Run Prettier
    echo "Running Prettier..."
    if [[ "$FIX_MODE" == true ]]; then
        if npx prettier --write "src/**/*.{ts,tsx,js,jsx,css,scss,json}"; then
            log_success "Prettier formatting applied"
        else
            log_error "Prettier formatting failed"
        fi
    else
        if npx prettier --check "src/**/*.{ts,tsx,js,jsx,css,scss,json}"; then
            log_success "Prettier check passed"
        else
            log_error "Prettier check failed (run with -f flag to fix)"
        fi
    fi
    
    # Return to project root
    cd "$PROJECT_ROOT"
    echo
}
run_tests() {
    log_info "Running Tests"
    echo "===================="
    if [[ ${#TEST_ARGS[@]} -gt 0 ]]; then
        echo "Running specific tests: ${TEST_ARGS[*]}"
        poetry run pytest "${TEST_ARGS[@]}"
    else
        echo "Running all tests with coverage..."
        poetry run pytest
    fi
    local exit_code=$?
    if [[ $exit_code -eq 0 ]]; then
        log_success "Tests passed"
    else
        log_error "Tests failed"
        exit $exit_code
    fi
    echo
}
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS] [FILES/TESTS]

This script runs code quality checks for both Python (backend) and TypeScript/React (frontend).

Options:
    -h, --help       Show this help message
    -c, --check      Run checks only (no fixes)
    -f, --fix        Apply automatic fixes
    -t, --tests      Run tests only
    -l, --lint       Run linters only (Python & TypeScript)
    -a, --all        Run all checks and tests (default)
    --no-format      Skip formatting checks
    --no-lint        Skip linting
    --no-tests       Skip tests
    --clean-cache    Clean Python cache (__pycache__, *.pyc, *.pyo)

Python Checks:
    - Black (code formatting)
    - Ruff (linting)
    - Pytest (testing)

Frontend Checks (if frontend/ exists):
    - ESLint (TypeScript/React linting)
    - TypeScript (type checking)
    - Prettier (code formatting)

Examples:
    $0                      # Run all checks and tests
    $0 -c                   # Check only, no fixes
    $0 -f                   # Apply fixes before running checks
    $0 -t path/to/test.py   # Run specific test only
    $0 file1.py file2.py    # Run checks on specific files
EOF
}
FORMATTING=true
LINTING=true
TESTING=true
FIX_MODE=false
CLEAN_CACHE=false
FILES=()
TEST_ARGS=()
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -c|--check)
            FIX_MODE=false
            shift
            ;;
        -f|--fix)
            FIX_MODE=true
            CLEAN_CACHE=true
            shift
            ;;
        -t|--tests)
            FORMATTING=false
            LINTING=false
            shift
            ;;
        -l|--lint)
            FORMATTING=false
            TESTING=false
            shift
            ;;
        -a|--all)
            FORMATTING=true
            LINTING=true
            TESTING=true
            shift
            ;;
        --no-format)
            FORMATTING=false
            shift
            ;;
        --no-lint)
            LINTING=false
            shift
            ;;
        --no-tests)
            TESTING=false
            shift
            ;;
        --clean-cache)
            CLEAN_CACHE=true
            shift
            ;;
        *)
            if [[ -f "$1" ]]; then
                FILES+=("$1")
            else
                TEST_ARGS+=("$1")
            fi
            shift
            ;;
    esac
done
trap 'echo -e "\n\033[0;31mScript interrupted!\033[0m"; exit 130' INT TERM
log_info "Starting Quality Checks"
echo "======================="
echo
if [[ "$CLEAN_CACHE" == true ]]; then
    clean_python_cache
fi
if [[ ${#FILES[@]} -gt 0 ]]; then
    log_info "Processing specific files: ${FILES[*]}"
    echo "===================="
    if [[ "$FORMATTING" == true ]]; then
        if [[ "$FIX_MODE" == true ]]; then
            poetry run black "${FILES[@]}"
            log_success "Black formatting applied to specified files"
        else
            if poetry run black "${FILES[@]}" --check --diff; then
                log_success "Black check passed for specified files"
            else
                log_error "Black check failed for specified files"
            fi
        fi
    fi
    if [[ "$LINTING" == true ]]; then
        if [[ "$FIX_MODE" == true ]]; then
            poetry run ruff check "${FILES[@]}" --fix
            log_success "Ruff fixes applied to specified files"
        else
            if poetry run ruff check "${FILES[@]}"; then
                log_success "Ruff check passed for specified files"
            else
                log_error "Ruff check failed for specified files"
            fi
        fi
    fi
    echo
else
    if [[ "$FORMATTING" == true ]]; then
        run_formatters
    fi
    if [[ "$LINTING" == true ]]; then
        run_linters
        run_frontend_linters
    fi
fi
if [[ "$TESTING" == true ]]; then
    run_tests
fi
log_success "All checks completed!"
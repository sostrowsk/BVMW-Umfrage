#!/bin/bash
set -e
usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --backend       Check backend health only"
    echo "  --frontend      Check frontend health only"
    echo "  --all           Check all services (default)"
    echo "  --verbose       Show detailed output"
    echo "  --json          Output in JSON format"
    echo "  --help          Show this help message"
    echo ""
    exit 0
}
CHECK_BACKEND=false
CHECK_FRONTEND=false
VERBOSE=false
JSON_OUTPUT=false
if [ $# -eq 0 ]; then
    CHECK_BACKEND=true
    CHECK_FRONTEND=true
fi
while [[ $# -gt 0 ]]; do
    case $1 in
        --backend)
            CHECK_BACKEND=true
            shift
            ;;
        --frontend)
            CHECK_FRONTEND=true
            shift
            ;;
        --all)
            CHECK_BACKEND=true
            CHECK_FRONTEND=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        --help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done
HEALTH_STATUS="healthy"
BACKEND_STATUS="unknown"
FRONTEND_STATUS="unknown"
DATABASE_STATUS="unknown"
REDIS_STATUS="unknown"
log_verbose() {
    if [ "$VERBOSE" = true ]; then
        echo "$1"
    fi
}
check_backend() {
    log_verbose "Checking backend health..."
    
    if curl -s -f -o /dev/null "http://localhost:8000/health"; then
        BACKEND_STATUS="healthy"
        log_verbose "✓ Backend API is responding"
    else
        BACKEND_STATUS="unhealthy"
        HEALTH_STATUS="unhealthy"
        log_verbose "✗ Backend API is not responding"
    fi
    
    if curl -s -f -o /dev/null "http://localhost:8000/api/v1/health"; then
        log_verbose "✓ Backend API v1 endpoints are accessible"
    else
        BACKEND_STATUS="degraded"
        if [ "$HEALTH_STATUS" != "unhealthy" ]; then
            HEALTH_STATUS="degraded"
        fi
        log_verbose "✗ Backend API v1 endpoints are not accessible"
    fi
    
    if command -v pg_isready &> /dev/null; then
        if pg_isready -h localhost -p 5433 -q; then
            DATABASE_STATUS="healthy"
            log_verbose "✓ PostgreSQL is accepting connections"
        else
            DATABASE_STATUS="unhealthy"
            BACKEND_STATUS="degraded"
            if [ "$HEALTH_STATUS" != "unhealthy" ]; then
                HEALTH_STATUS="degraded"
            fi
            log_verbose "✗ PostgreSQL is not accepting connections"
        fi
    fi
    
    if command -v redis-cli &> /dev/null; then
        if redis-cli ping &> /dev/null; then
            REDIS_STATUS="healthy"
            log_verbose "✓ Redis is responding"
        else
            REDIS_STATUS="unhealthy"
            log_verbose "⚠ Redis is not responding (non-critical)"
        fi
    fi
}
check_frontend() {
    log_verbose "Checking frontend health..."
    
    if curl -s -f -o /dev/null "http://localhost:5173"; then
        FRONTEND_STATUS="healthy"
        log_verbose "✓ Frontend dev server is responding"
    elif curl -s -f -o /dev/null "http://localhost:80"; then
        FRONTEND_STATUS="healthy"
        log_verbose "✓ Frontend (nginx) is responding"
    elif curl -s -f -o /dev/null "http://localhost:3000"; then
        FRONTEND_STATUS="healthy"
        log_verbose "✓ Frontend is responding"
    else
        FRONTEND_STATUS="unhealthy"
        HEALTH_STATUS="unhealthy"
        log_verbose "✗ Frontend is not responding"
    fi
    
    if [ -f /opt/survey-platform/frontend/dist/index.html ]; then
        log_verbose "✓ Frontend build artifacts exist"
    elif [ -f /var/www/survey-platform/index.html ]; then
        log_verbose "✓ Frontend deployed to web root"
    else
        if [ "$FRONTEND_STATUS" = "healthy" ]; then
            log_verbose "⚠ Frontend build artifacts not found (development mode?)"
        fi
    fi
}
if [ "$CHECK_BACKEND" = true ]; then
    check_backend
fi
if [ "$CHECK_FRONTEND" = true ]; then
    check_frontend
fi
if [ "$JSON_OUTPUT" = true ]; then
    cat <<EOF
{
  "status": "$HEALTH_STATUS",
  "services": {
    "backend": "$BACKEND_STATUS",
    "frontend": "$FRONTEND_STATUS",
    "database": "$DATABASE_STATUS",
    "redis": "$REDIS_STATUS"
  },
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF
else
    echo "========================================="
    echo "Health Check Report"
    echo "========================================="
    echo "Overall Status: $HEALTH_STATUS"
    echo ""
    
    if [ "$CHECK_BACKEND" = true ]; then
        echo "Backend Services:"
        echo "  API Server: $BACKEND_STATUS"
        echo "  Database: $DATABASE_STATUS"
        echo "  Redis: $REDIS_STATUS"
    fi
    
    if [ "$CHECK_FRONTEND" = true ]; then
        echo ""
        echo "Frontend Services:"
        echo "  Web Server: $FRONTEND_STATUS"
    fi
    
    echo ""
    echo "Timestamp: $(date)"
    echo "========================================="
fi
if [ "$HEALTH_STATUS" = "healthy" ]; then
    exit 0
elif [ "$HEALTH_STATUS" = "degraded" ]; then
    exit 1
else
    exit 2
fi
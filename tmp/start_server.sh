#!/bin/bash
echo "Stopping old servers..."
pkill -f "uvicorn" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
lsof -ti:8000 | xargs -r kill -9 2>/dev/null || true
lsof -ti:5173 | xargs -r kill -9 2>/dev/null || true
sleep 2
echo "Clearing frontend cache..."
rm -rf frontend/node_modules/.vite 2>/dev/null || true
rm -rf frontend/dist 2>/dev/null || true
echo "Starting PostgreSQL database in Docker..."
docker-compose up -d db
sleep 3
echo "Starting backend server on port 8000..."
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
sleep 5
echo "Starting frontend server on port 5173..."
cd frontend && npm run dev &
FRONTEND_PID=$!
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Services running:"
echo "  Frontend: http://localhost:5173/"
echo "  Backend API: http://localhost:8000/"
echo "  API Docs: http://localhost:8000/docs"
echo "  Database: PostgreSQL on port 5433"
echo ""
echo "Press Ctrl+C to stop all services"
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
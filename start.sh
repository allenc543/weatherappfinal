#!/bin/bash
# Start both backend and frontend servers

trap 'kill 0' EXIT

echo "Starting backend on :8000..."
cd "$(dirname "$0")"
source backend/venv/bin/activate
python -m uvicorn backend.main:app --reload --port 8000 &

echo "Starting frontend on :5173..."
cd frontend
npm run dev &

wait

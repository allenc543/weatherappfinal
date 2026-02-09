# Weather ML Pipeline

## Quick Start
```bash
# Backend (from project root)
source backend/venv/bin/activate
python -m uvicorn backend.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend && npm run dev
```
Open http://localhost:5173

## Project Structure
- `frontend/` — React + Vite + React Flow + Zustand + Tailwind + Recharts
- `backend/` — Python FastAPI + PyTorch + XGBoost + scikit-learn
- `backend/data/` — CSV weather data per city (fetched from Open-Meteo)
- `backend/ml/` — ML node framework: base class, registry, executor, nodes
- `scripts/` — Data fetching script

## Key APIs
- `GET /api/node-types` — returns all registered ML node metadata
- `POST /api/pipeline/run` — executes a pipeline graph, returns metrics + charts
- `GET /api/data/cities` — lists available city datasets

## Adding a New ML Node
1. Create `backend/ml/nodes/my_node.py`
2. Implement `MLNode` base class with `@register` decorator
3. Import it in `backend/ml/registry.py` → `discover_nodes()`
4. Frontend auto-discovers via `/api/node-types` — no frontend changes needed

## Tech Stack
- Python 3.12 (venv at `backend/venv/`)
- Node/npm for frontend
- Tailwind CSS v4 via `@tailwindcss/vite` plugin

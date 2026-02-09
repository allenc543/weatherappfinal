"""Pipeline execution router."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any
from ..ml.executor import run_pipeline

router = APIRouter(prefix="/api/pipeline", tags=["pipeline"])


class PipelineRequest(BaseModel):
    nodes: list[dict[str, Any]]
    edges: list[dict[str, Any]]


@router.post("/run")
async def run(req: PipelineRequest):
    try:
        results = run_pipeline({"nodes": req.nodes, "edges": req.edges})
        return {"status": "ok", "results": results}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

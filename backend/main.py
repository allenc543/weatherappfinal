"""FastAPI backend for Weather ML Pipeline."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .ml.registry import discover_nodes, get_all_metadata
from .routers import pipeline, data

app = FastAPI(title="Weather ML Pipeline")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Discover all ML nodes on startup
discover_nodes()

app.include_router(pipeline.router)
app.include_router(data.router)


@app.get("/api/node-types")
async def node_types():
    return {"node_types": get_all_metadata()}

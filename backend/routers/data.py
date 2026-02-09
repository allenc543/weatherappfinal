"""Data-related routes."""
from fastapi import APIRouter
from pathlib import Path

router = APIRouter(prefix="/api/data", tags=["data"])

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


@router.get("/cities")
async def list_cities():
    cities = [f.stem for f in sorted(DATA_DIR.glob("*.csv"))]
    return {"cities": cities}

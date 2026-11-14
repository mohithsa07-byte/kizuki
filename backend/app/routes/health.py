from fastapi import APIRouter
from app.config import settings

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def health():
    """Simple check that the server is alive."""
    return {"status": "ok", "environment": settings.app_env}

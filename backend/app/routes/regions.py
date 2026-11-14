from fastapi import APIRouter
from app.data.regions import REGIONS
from app.models.region import Region

router = APIRouter(prefix="/api", tags=["regions"])


@router.get("/regions", response_model=list[Region])
def list_regions():
    """Return the regions KIZUKI supports."""
    return REGIONS

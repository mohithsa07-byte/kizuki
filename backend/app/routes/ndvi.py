from fastapi import APIRouter, HTTPException, Query

from app.models.ndvi import NdviTimeseries
from app.services.ndvi_service import NdviServiceError, get_ndvi_timeseries

router = APIRouter(prefix="/api/ndvi", tags=["ndvi"])


@router.get("/timeseries", response_model=NdviTimeseries)
def ndvi_timeseries(
    lat: float = Query(..., ge=-90, le=90, description="Latitude of the point"),
    lng: float = Query(..., ge=-180, le=180, description="Longitude of the point"),
    start_date: str = Query(..., description="Start date, YYYY-MM-DD"),
    end_date: str = Query(..., description="End date, YYYY-MM-DD"),
):
    try:
        return get_ndvi_timeseries(round(lat, 4), round(lng, 4), start_date, end_date)
    except NdviServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
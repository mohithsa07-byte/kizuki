from fastapi import APIRouter, HTTPException, Query
from app.data.regions import get_region
from app.models.climate import SummaryResponse, TimeseriesResponse
from app.services import climate_service
from app.services.climate_service import DataSourceError

router = APIRouter(prefix="/api/climate", tags=["climate"])


def load_points(region_id: str, start_year: int, end_year: int) -> list[dict]:
    region = get_region(region_id)
    if region is None:
        raise HTTPException(status_code=404, detail=f"Unknown region_id '{region_id}'. See /api/regions.")
    if start_year > end_year:
        raise HTTPException(status_code=400, detail="start_year must not be later than end_year.")
    try:
        return climate_service.build_timeseries(region["lat"], region["lng"], start_year, end_year)
    except DataSourceError as error:
        raise HTTPException(status_code=502, detail=str(error))


@router.get("/timeseries", response_model=TimeseriesResponse)
def timeseries(
    region_id: str = Query("bengaluru-urban"),
    start_year: int = Query(2016, ge=1990, le=2025),
    end_year: int = Query(2023, ge=1990, le=2025),
):
    """Monthly temperature and rainfall for a region."""
    points = load_points(region_id, start_year, end_year)
    return {
        "region_id": region_id,
        "start_year": start_year,
        "end_year": end_year,
        "frequency": "monthly",
        "source": climate_service.SOURCE,
        "is_sample": climate_service.IS_SAMPLE,
        "temperature_note": climate_service.TEMPERATURE_NOTE,
        "points": points,
    }


@router.get("/summary", response_model=SummaryResponse)
def summary(
    region_id: str = Query("bengaluru-urban"),
    start_year: int = Query(2016, ge=1990, le=2025),
    end_year: int = Query(2023, ge=1990, le=2025),
):
    """Average temperature and annual rainfall for a region and period."""
    points = load_points(region_id, start_year, end_year)
    return {
        "region_id": region_id,
        "start_year": start_year,
        "end_year": end_year,
        "source": climate_service.SOURCE,
        "is_sample": climate_service.IS_SAMPLE,
        "temperature_note": climate_service.TEMPERATURE_NOTE,
        **climate_service.build_summary(points),
    }

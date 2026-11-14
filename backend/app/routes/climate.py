from fastapi import APIRouter, HTTPException, Query
from app.data.regions import get_region
from app.models.climate import SummaryResponse, TimeseriesResponse
from app.services import climate_service

router = APIRouter(prefix="/api/climate", tags=["climate"])


def check_inputs(region_id: str, start_year: int, end_year: int):
    if get_region(region_id) is None:
        raise HTTPException(status_code=404, detail=f"Unknown region_id '{region_id}'. See /api/regions.")
    if start_year > end_year:
        raise HTTPException(status_code=400, detail="start_year must not be later than end_year.")


@router.get("/timeseries", response_model=TimeseriesResponse)
def timeseries(
    region_id: str = Query("bengaluru-urban"),
    start_year: int = Query(2016, ge=1990, le=2025),
    end_year: int = Query(2023, ge=1990, le=2025),
):
    """Monthly temperature and rainfall for a region."""
    check_inputs(region_id, start_year, end_year)
    return {
        "region_id": region_id,
        "start_year": start_year,
        "end_year": end_year,
        "frequency": "monthly",
        "source": climate_service.SOURCE,
        "is_sample": climate_service.IS_SAMPLE,
        "temperature_note": climate_service.TEMPERATURE_NOTE,
        "points": climate_service.build_timeseries(start_year, end_year),
    }


@router.get("/summary", response_model=SummaryResponse)
def summary(
    region_id: str = Query("bengaluru-urban"),
    start_year: int = Query(2016, ge=1990, le=2025),
    end_year: int = Query(2023, ge=1990, le=2025),
):
    """Average temperature and annual rainfall for a region and period."""
    check_inputs(region_id, start_year, end_year)
    stats = climate_service.build_summary(start_year, end_year)
    return {
        "region_id": region_id,
        "start_year": start_year,
        "end_year": end_year,
        "source": climate_service.SOURCE,
        "is_sample": climate_service.IS_SAMPLE,
        "temperature_note": climate_service.TEMPERATURE_NOTE,
        **stats,
    }

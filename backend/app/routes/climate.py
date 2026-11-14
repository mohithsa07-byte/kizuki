from fastapi import APIRouter, HTTPException, Query
from app.data.regions import get_region
from app.models.climate import SummaryResponse, TimeseriesResponse
from app.services import climate_service
from app.services.climate_service import DataSourceError

router = APIRouter(prefix="/api/climate", tags=["climate"])


def resolve_location(region_id: str, lat: float | None, lng: float | None) -> dict:
    """Use lat/lng when both are given, otherwise a known region."""
    if (lat is None) != (lng is None):
        raise HTTPException(status_code=400, detail="Give both lat and lng, or neither.")

    if lat is not None and lng is not None:
        grid_lat, grid_lng = climate_service.snap_to_grid(lat, lng)
        return {
            "region_id": None,
            "location_type": "point",
            "lat": lat,
            "lng": lng,
            "grid_lat": grid_lat,
            "grid_lng": grid_lng,
            "query_lat": grid_lat,
            "query_lng": grid_lng,
            "grid_note": climate_service.GRID_NOTE,
        }

    region = get_region(region_id)
    if region is None:
        raise HTTPException(status_code=404, detail=f"Unknown region_id '{region_id}'. See /api/regions.")
    return {
        "region_id": region_id,
        "location_type": "region",
        "lat": region["lat"],
        "lng": region["lng"],
        "grid_lat": None,
        "grid_lng": None,
        "query_lat": region["lat"],
        "query_lng": region["lng"],
        "grid_note": climate_service.GRID_NOTE,
    }


def load_points(location: dict, start_year: int, end_year: int) -> list[dict]:
    if start_year > end_year:
        raise HTTPException(status_code=400, detail="start_year must not be later than end_year.")
    try:
        return climate_service.build_timeseries(
            location["query_lat"], location["query_lng"], start_year, end_year
        )
    except DataSourceError as error:
        raise HTTPException(status_code=502, detail=str(error))


def public_location(location: dict) -> dict:
    return {k: v for k, v in location.items() if not k.startswith("query_")}


@router.get("/timeseries", response_model=TimeseriesResponse)
def timeseries(
    region_id: str = Query("bengaluru-urban"),
    lat: float | None = Query(None, ge=-90, le=90),
    lng: float | None = Query(None, ge=-180, le=180),
    start_year: int = Query(2016, ge=1990, le=2025),
    end_year: int = Query(2023, ge=1990, le=2025),
):
    """Monthly temperature and rainfall for a region or any lat/lng point."""
    location = resolve_location(region_id, lat, lng)
    points = load_points(location, start_year, end_year)
    return {
        **public_location(location),
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
    lat: float | None = Query(None, ge=-90, le=90),
    lng: float | None = Query(None, ge=-180, le=180),
    start_year: int = Query(2016, ge=1990, le=2025),
    end_year: int = Query(2023, ge=1990, le=2025),
):
    """Average temperature and annual rainfall for a region or any lat/lng point."""
    location = resolve_location(region_id, lat, lng)
    points = load_points(location, start_year, end_year)
    return {
        **public_location(location),
        "start_year": start_year,
        "end_year": end_year,
        "source": climate_service.SOURCE,
        "is_sample": climate_service.IS_SAMPLE,
        "temperature_note": climate_service.TEMPERATURE_NOTE,
        **climate_service.build_summary(points),
    }
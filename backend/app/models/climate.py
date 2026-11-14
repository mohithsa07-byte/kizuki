from pydantic import BaseModel


class TimeseriesPoint(BaseModel):
    date: str
    temperature_c: float | None
    rainfall_mm: float | None


class LocationInfo(BaseModel):
    region_id: str | None = None
    location_type: str  # "region" or "point"
    lat: float
    lng: float
    grid_lat: float | None = None
    grid_lng: float | None = None
    grid_note: str


class TimeseriesResponse(LocationInfo):
    start_year: int
    end_year: int
    frequency: str
    source: str
    is_sample: bool
    temperature_note: str
    points: list[TimeseriesPoint]


class SummaryResponse(LocationInfo):
    start_year: int
    end_year: int
    mean_temperature_c: float | None
    mean_annual_rainfall_mm: float | None
    source: str
    is_sample: bool
    temperature_note: str
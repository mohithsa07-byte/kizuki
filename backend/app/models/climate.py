from pydantic import BaseModel


class TimeseriesPoint(BaseModel):
    date: str
    temperature_c: float | None
    rainfall_mm: float | None


class TimeseriesResponse(BaseModel):
    region_id: str
    start_year: int
    end_year: int
    frequency: str
    source: str
    is_sample: bool
    temperature_note: str
    points: list[TimeseriesPoint]


class SummaryResponse(BaseModel):
    region_id: str
    start_year: int
    end_year: int
    mean_temperature_c: float | None
    mean_annual_rainfall_mm: float | None
    source: str
    is_sample: bool
    temperature_note: str

from typing import List, Optional

from pydantic import BaseModel


class NdviPoint(BaseModel):
    """One 16-day MODIS composite for one pixel."""

    modis_date: str            # e.g. "A2023017"
    date: str                  # ISO date of the composite start, e.g. "2023-01-17"
    ndvi: Optional[float]      # scaled to -1..1, or null if dropped
    quality: str               # "good", "marginal", "cloudy", "snow_ice", "no_data"
    used: bool                 # True only if the value passed quality filtering


class NdviTimeseries(BaseModel):
    source: str
    product: str
    band: str
    latitude: float
    longitude: float
    resolution_m: int
    start_date: str
    end_date: str
    points: List[NdviPoint]
    valid_count: int
    dropped_count: int
    notes: List[str]
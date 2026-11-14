import calendar
from functools import lru_cache

import httpx

POWER_URL = "https://power.larc.nasa.gov/api/temporal/monthly/point"
SOURCE = "NASA POWER (monthly, point query at region centre)"
IS_SAMPLE = False
TEMPERATURE_NOTE = (
    "Air temperature at 2 m (T2M) from NASA POWER. "
    "Not the same as satellite land surface temperature."
)
MISSING_VALUE = -999


class DataSourceError(Exception):
    """Raised when NASA POWER cannot be reached or returns something unexpected."""


@lru_cache(maxsize=64)
def _fetch_power(lat: float, lng: float, start_year: int, end_year: int) -> dict:
    params = {
        "parameters": "T2M,PRECTOTCORR",
        "community": "AG",
        "latitude": lat,
        "longitude": lng,
        "start": start_year,
        "end": end_year,
        "format": "JSON",
    }
    try:
        response = httpx.get(POWER_URL, params=params, timeout=30)
        response.raise_for_status()
        return response.json()["properties"]["parameter"]
    except (httpx.HTTPError, KeyError, ValueError) as error:
        raise DataSourceError(f"Could not get data from NASA POWER: {error}") from error


def _clean(value):
    if value is None or value == MISSING_VALUE:
        return None
    return float(value)


def build_timeseries(lat: float, lng: float, start_year: int, end_year: int) -> list[dict]:
    data = _fetch_power(lat, lng, start_year, end_year)
    temps = data.get("T2M", {})
    rains = data.get("PRECTOTCORR", {})

    points = []
    for key in sorted(temps.keys()):
        year, month = int(key[:4]), int(key[4:])
        if month > 12:
            continue  # month 13 is the annual average, not a real month
        temp = _clean(temps.get(key))
        rain_per_day = _clean(rains.get(key))
        days = calendar.monthrange(year, month)[1]
        points.append(
            {
                "date": f"{year}-{month:02d}",
                "temperature_c": round(temp, 2) if temp is not None else None,
                "rainfall_mm": round(rain_per_day * days, 1) if rain_per_day is not None else None,
            }
        )
    return points


def build_summary(points: list[dict]) -> dict:
    temps = [p["temperature_c"] for p in points if p["temperature_c"] is not None]
    rain = [p["rainfall_mm"] for p in points if p["rainfall_mm"] is not None]
    return {
        "mean_temperature_c": round(sum(temps) / len(temps), 2) if temps else None,
        # Total rain over valid months, scaled to a 12-month year.
        "mean_annual_rainfall_mm": round(sum(rain) / (len(rain) / 12), 1) if rain else None,
    }

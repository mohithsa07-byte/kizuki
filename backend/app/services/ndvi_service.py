from datetime import date, datetime
from functools import lru_cache
from typing import Dict, List, Tuple

import httpx

from app.models.ndvi import NdviPoint, NdviTimeseries

BASE_URL = "https://modis.ornl.gov/rst/api/v1"
PRODUCT = "MOD13Q1"
NDVI_BAND = "250m_16_days_NDVI"
QA_BAND = "250m_16_days_pixel_reliability"

SCALE = 0.0001
VALID_MIN = -2000
VALID_MAX = 10000
CHUNK_SIZE = 10
MAX_DAYS = 740
TIMEOUT_SECONDS = 30

QUALITY_LABELS = {0: "good", 1: "marginal", 2: "snow_ice", 3: "cloudy"}


class NdviServiceError(Exception):
    """Raised when the MODIS service fails or returns something unexpected."""


def _get_json(url: str, params: dict) -> dict:
    try:
        with httpx.Client(timeout=TIMEOUT_SECONDS) as client:
            response = client.get(url, params=params, headers={"Accept": "application/json"})
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as exc:
        raise NdviServiceError(f"MODIS service request failed: {exc}") from exc
    except ValueError as exc:
        raise NdviServiceError("MODIS service returned a response that is not valid JSON.") from exc


def _parse_date(value: str) -> date:
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise NdviServiceError(f"Date must look like YYYY-MM-DD, got '{value}'.") from exc


def _fetch_dates(lat: float, lng: float, start: date, end: date) -> List[Tuple[str, str]]:
    data = _get_json(
        f"{BASE_URL}/{PRODUCT}/dates",
        {"latitude": lat, "longitude": lng},
    )
    items = data.get("dates")
    if not isinstance(items, list):
        raise NdviServiceError("MODIS dates response had no 'dates' list.")

    result: List[Tuple[str, str]] = []
    for item in items:
        try:
            calendar = item["calendar_date"]
            modis = item["modis_date"]
            day = datetime.strptime(calendar, "%Y-%m-%d").date()
        except (KeyError, ValueError, TypeError):
            continue
        if start <= day <= end:
            result.append((modis, calendar))
    return result


def _fetch_band(lat: float, lng: float, band: str, first_modis: str, last_modis: str) -> Dict[str, int]:
    data = _get_json(
        f"{BASE_URL}/{PRODUCT}/subset",
        {
            "latitude": lat,
            "longitude": lng,
            "band": band,
            "startDate": first_modis,
            "endDate": last_modis,
            "kmAboveBelow": 0,
            "kmLeftRight": 0,
        },
    )
    rows = data.get("subset")
    if not isinstance(rows, list):
        raise NdviServiceError(f"MODIS subset response for {band} had no 'subset' list.")

    values: Dict[str, int] = {}
    for row in rows:
        try:
            values[row["modis_date"]] = int(row["data"][0])
        except (KeyError, IndexError, TypeError, ValueError):
            continue
    return values


@lru_cache(maxsize=256)
def get_ndvi_timeseries(lat: float, lng: float, start_date: str, end_date: str) -> NdviTimeseries:
    start = _parse_date(start_date)
    end = _parse_date(end_date)

    if end < start:
        raise NdviServiceError("end_date must not be before start_date.")
    if (end - start).days > MAX_DAYS:
        raise NdviServiceError(f"Date range too long. Maximum is {MAX_DAYS} days per request.")

    composites = _fetch_dates(lat, lng, start, end)
    if not composites:
        raise NdviServiceError("No MODIS composite dates found for this point and date range.")

    ndvi_raw: Dict[str, int] = {}
    qa_raw: Dict[str, int] = {}
    for i in range(0, len(composites), CHUNK_SIZE):
        chunk = composites[i : i + CHUNK_SIZE]
        first_modis, last_modis = chunk[0][0], chunk[-1][0]
        ndvi_raw.update(_fetch_band(lat, lng, NDVI_BAND, first_modis, last_modis))
        qa_raw.update(_fetch_band(lat, lng, QA_BAND, first_modis, last_modis))

    points: List[NdviPoint] = []
    for modis_date, calendar_date in composites:
        raw = ndvi_raw.get(modis_date)
        qa = qa_raw.get(modis_date)
        quality = QUALITY_LABELS.get(qa, "no_data") if qa is not None else "no_data"

        value_ok = raw is not None and VALID_MIN <= raw <= VALID_MAX
        used = value_ok and quality == "good"
        ndvi = round(raw * SCALE, 4) if value_ok else None

        points.append(
            NdviPoint(
                modis_date=modis_date,
                date=calendar_date,
                ndvi=ndvi,
                quality=quality,
                used=used,
            )
        )

    valid_count = sum(1 for p in points if p.used)
    dropped_count = len(points) - valid_count

    notes = [
        "Source: NASA MODIS MOD13Q1 via the ORNL DAAC web service. 250 m pixels, 16-day composites.",
        "NDVI = (NIR - Red) / (NIR + Red). It shows greenness only, not tree count, biodiversity or forest area.",
        "Only pixels flagged 'good' by the pixel-reliability band are marked as used. Marginal, cloudy, snow/ice and fill values are kept in the list but not used.",
        "Compare similar seasons only. Do not compare a wet-season value with a dry-season value.",
        "The pixel is the 250 m MODIS pixel containing the requested point, not an area average.",
    ]

    return NdviTimeseries(
        source="NASA MODIS via ORNL DAAC",
        product=PRODUCT,
        band=NDVI_BAND,
        latitude=lat,
        longitude=lng,
        resolution_m=250,
        start_date=start_date,
        end_date=end_date,
        points=points,
        valid_count=valid_count,
        dropped_count=dropped_count,
        notes=notes,
    )
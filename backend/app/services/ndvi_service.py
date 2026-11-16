from datetime import date, datetime
from functools import lru_cache
from typing import Dict, List, Tuple
import random
import time

import httpx

from app.models.ndvi import NdviPoint, NdviTimeseries


# NASA MODIS / ORNL DAAC
BASE_URL = "https://modis.ornl.gov/rst/api/v1"

PRODUCT = "MOD13Q1"
NDVI_BAND = "250m_16_days_NDVI"
QA_BAND = "250m_16_days_pixel_reliability"

SCALE = 0.0001
VALID_MIN = -2000
VALID_MAX = 10000

MAX_DAYS = 740

# Each MODIS composite represents approximately 16 days.
# Request the complete selected period in one subset call per band.
TIMEOUT = httpx.Timeout(
    connect=8.0,
    read=12.0,
    write=8.0,
    pool=8.0,
)

MAX_ATTEMPTS = 2
RETRY_STATUS = {429, 500, 502, 503, 504}

QUALITY_LABELS = {
    0: "good",
    1: "marginal",
    2: "snow_ice",
    3: "cloudy",
}


class NdviServiceError(Exception):
    """Raised when MODIS data cannot be retrieved or validated."""


def _parse_date(value: str) -> date:
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError as exc:
        raise NdviServiceError(
            f"Invalid date '{value}'. Expected YYYY-MM-DD."
        ) from exc


def _request_json(
    client: httpx.Client,
    endpoint: str,
    params: dict,
) -> dict:
    last_error = None

    for attempt in range(MAX_ATTEMPTS):
        try:
            response = client.get(
                f"{BASE_URL}/{PRODUCT}/{endpoint}",
                params=params,
                headers={"Accept": "application/json"},
            )

            response.raise_for_status()
            result = response.json()

            if not isinstance(result, dict):
                raise NdviServiceError(
                    "MODIS returned an unexpected response."
                )

            return result

        except httpx.HTTPStatusError as exc:
            status = exc.response.status_code

            if status not in RETRY_STATUS:
                raise NdviServiceError(
                    f"MODIS returned HTTP {status}."
                ) from exc

            last_error = exc

        except (httpx.TimeoutException, httpx.TransportError) as exc:
            last_error = exc

        except ValueError as exc:
            raise NdviServiceError(
                "MODIS returned invalid JSON."
            ) from exc

        if attempt < MAX_ATTEMPTS - 1:
            time.sleep(0.4 + random.uniform(0, 0.2))

    raise NdviServiceError(
        "NASA MODIS is temporarily unavailable or responding "
        "too slowly. Please try again later."
    ) from last_error


def _fetch_dates(
    client: httpx.Client,
    lat: float,
    lng: float,
    start: date,
    end: date,
) -> List[Tuple[str, str]]:

    data = _request_json(
        client,
        "dates",
        {
            "latitude": lat,
            "longitude": lng,
        },
    )

    items = data.get("dates")

    if not isinstance(items, list):
        raise NdviServiceError(
            "MODIS dates response is missing its dates list."
        )

    result = []

    for item in items:
        try:
            calendar_date = item["calendar_date"]
            modis_date = item["modis_date"]

            observation_date = datetime.strptime(
                calendar_date, "%Y-%m-%d"
            ).date()

        except (KeyError, ValueError, TypeError):
            continue

        if start <= observation_date <= end:
            result.append((modis_date, calendar_date))

    return result


def _fetch_band(
    client: httpx.Client,
    lat: float,
    lng: float,
    band: str,
    composites: List[Tuple[str, str]],
) -> Dict[str, int]:
    """Fetch at most ten MODIS composites per request (ORNL API limit)."""
    values: Dict[str, int] = {}
    for offset in range(0, len(composites), 10):
        batch = composites[offset:offset + 10]
        data = _request_json(
            client,
            "subset",
            {
                "latitude": lat,
                "longitude": lng,
                "band": band,
                "startDate": batch[0][0],
                "endDate": batch[-1][0],
                "kmAboveBelow": 0,
                "kmLeftRight": 0,
            },
        )
        rows = data.get("subset")
        if not isinstance(rows, list):
            raise NdviServiceError(
                f"MODIS response for {band} has no subset data."
            )
        for row in rows:
            try:
                # Avoid mixing observations from other bands if present.
                if row.get("band") not in (None, band):
                    continue
                modis_date = row["modis_date"]
                raw_value = int(row["data"][0])
                values[modis_date] = raw_value
            except (KeyError, IndexError, TypeError, ValueError):
                continue
    return values


@lru_cache(maxsize=256)
def get_ndvi_timeseries(
    lat: float,
    lng: float,
    start_date: str,
    end_date: str,
) -> NdviTimeseries:

    start = _parse_date(start_date)
    end = _parse_date(end_date)

    if end < start:
        raise NdviServiceError(
            "end_date cannot be before start_date."
        )

    if (end - start).days > MAX_DAYS:
        raise NdviServiceError(
            f"Maximum supported period is {MAX_DAYS} days."
        )

    with httpx.Client(
        timeout=TIMEOUT,
        follow_redirects=True,
    ) as client:

        composites = _fetch_dates(
            client, lat, lng, start, end
        )

        if not composites:
            raise NdviServiceError(
                "No MODIS observations found for this period."
            )

        ndvi_raw = _fetch_band(client, lat, lng, NDVI_BAND, composites)
        qa_raw = _fetch_band(client, lat, lng, QA_BAND, composites)

    points: List[NdviPoint] = []

    for modis_date, calendar_date in composites:

        raw = ndvi_raw.get(modis_date)
        qa = qa_raw.get(modis_date)

        quality = (
            QUALITY_LABELS.get(qa, "no_data")
            if qa is not None
            else "no_data"
        )

        value_ok = (
            raw is not None
            and VALID_MIN <= raw <= VALID_MAX
        )

        used = value_ok and quality == "good"

        ndvi = (
            round(raw * SCALE, 4)
            if value_ok
            else None
        )

        points.append(
            NdviPoint(
                modis_date=modis_date,
                date=calendar_date,
                ndvi=ndvi,
                quality=quality,
                used=used,
            )
        )

    valid_count = sum(
        1 for point in points if point.used
    )

    dropped_count = len(points) - valid_count

    notes = [
        "Source: NASA MODIS MOD13Q1 via ORNL DAAC.",
        "Spatial resolution: approximately 250 metres.",
        "Temporal resolution: 16-day composites.",
        "Only good-quality observations are used.",
        "Cloudy, marginal and invalid observations are excluded.",
        "NDVI represents vegetation greenness, not tree count.",
        "Compare equivalent seasons across years.",
        "The measurement represents one MODIS pixel, not a city-wide average.",
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

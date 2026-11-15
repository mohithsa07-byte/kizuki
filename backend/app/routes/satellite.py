from datetime import date
from functools import lru_cache

import httpx
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/satellite", tags=["satellite"])

STAC_URL = "https://earth-search.aws.element84.com/v1/search"
COLLECTION = "sentinel-2-c1-l2a"


@lru_cache(maxsize=128)
def search_scenes(lat, lng, start_date, end_date, max_cloud):
    delta = 0.005
    south = max(-90, lat - delta)
    north = min(90, lat + delta)
    west = max(-180, lng - delta)
    east = min(180, lng + delta)

    payload = {
        "collections": [COLLECTION],
        "bbox": [west, south, east, north],
        "datetime": f"{start_date}T00:00:00Z/{end_date}T23:59:59Z",
        "limit": 30,
    }

    try:
        with httpx.Client(
            timeout=httpx.Timeout(20.0, connect=5.0),
            follow_redirects=True,
        ) as client:
            response = client.post(STAC_URL, json=payload)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as exc:
        raise RuntimeError(
            f"Satellite catalog request failed: {exc}"
        ) from exc

    scenes = []

    for item in data.get("features", []):
        props = item.get("properties", {})
        cloud = props.get("eo:cloud_cover")

        if cloud is None or cloud > max_cloud:
            continue

        assets = item.get("assets", {})

        scenes.append({
            "id": item.get("id"),
            "date": props.get("datetime"),
            "cloud_cover_percent": cloud,
            "platform": props.get("platform"),
            "red_band_available": (
                "red" in assets or "B04" in assets
            ),
            "nir_band_available": (
                "nir" in assets or "B08" in assets
            ),
            "thumbnail_url": (
                assets.get("thumbnail", {}).get("href")
            ),
        })

    scenes.sort(key=lambda s: s["cloud_cover_percent"])

    return {
        "source": "Element 84 Earth Search",
        "collection": COLLECTION,
        "is_sample": False,
        "latitude": lat,
        "longitude": lng,
        "start_date": start_date,
        "end_date": end_date,
        "scenes": scenes,
        "scene_count": len(scenes),
        "note": (
            "Scene cloud cover applies to the whole scene. "
            "NDVI has not yet been calculated."
        ),
    }


@router.get("/scenes")
def get_scenes(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    start_date: date = Query(...),
    end_date: date = Query(...),
    max_cloud: int = Query(30, ge=0, le=100),
):
    if end_date < start_date:
        raise HTTPException(
            status_code=400,
            detail="End date must not precede start date.",
        )

    if (end_date - start_date).days > 366:
        raise HTTPException(
            status_code=400,
            detail="Maximum period is 366 days.",
        )

    try:
        return search_scenes(
            round(lat, 4),
            round(lng, 4),
            start_date.isoformat(),
            end_date.isoformat(),
            max_cloud,
        )
    except (RuntimeError, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc

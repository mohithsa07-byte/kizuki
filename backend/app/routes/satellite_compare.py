from datetime import date
from functools import lru_cache

import httpx
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(
    prefix="/api/satellite",
    tags=["satellite-comparison"],
)

STAC = "https://planetarycomputer.microsoft.com/api/stac/v1/search"
DATA = "https://planetarycomputer.microsoft.com/api/data/v1"
COLLECTION = "sentinel-2-l2a"


@lru_cache(maxsize=128)
def find_scene(lat, lng, year):
    if year < 2017:
        raise ValueError("Sentinel-2 comparisons require 2017 or later.")

    delta = 0.003
    bbox = [
        lng - delta,
        lat - delta,
        lng + delta,
        lat + delta,
    ]

    payload = {
        "collections": [COLLECTION],
        "bbox": bbox,
        "datetime": f"{year}-01-01T00:00:00Z/{year}-12-31T23:59:59Z",
        "limit": 100,
        "query": {
            "eo:cloud_cover": {"lt": 60}
        },
    }

    with httpx.Client(
        timeout=httpx.Timeout(25, connect=6),
        follow_redirects=True,
    ) as client:
        response = client.post(STAC, json=payload)
        response.raise_for_status()
        features = response.json().get("features", [])

        candidates = []
        for feature in features:
            properties = feature.get("properties", {})
            assets = feature.get("assets", {})
            scene_id = feature.get("id")
            cloud = properties.get("eo:cloud_cover")

            if (
                not scene_id
                or cloud is None
                or "visual" not in assets
            ):
                continue

            bounds = feature.get("bbox")
            if (
                bounds
                and len(bounds) >= 4
                and not (
                    bounds[0] <= lng <= bounds[2]
                    and bounds[1] <= lat <= bounds[3]
                )
            ):
                continue

            candidates.append(feature)

        candidates.sort(
            key=lambda item: item["properties"].get(
                "eo:cloud_cover", 100
            )
        )

        for scene in candidates[:8]:
            scene_id = scene["id"]
            params = {
                "collection": COLLECTION,
                "item": scene_id,
                "assets": "visual",
                "asset_bidx": "visual|1,2,3",
                "nodata": "0",
                "format": "png",
            }

            try:
                tile_response = client.get(
                    f"{DATA}/item/tilejson.json",
                    params=params,
                )
                tile_response.raise_for_status()
                tilejson = tile_response.json()
                tiles = tilejson.get("tiles", [])

                if not tiles:
                    continue

                tile_url = tiles[0]
                if not tile_url.startswith(
                    "https://planetarycomputer.microsoft.com/"
                ):
                    continue

                return {
                    "year": year,
                    "scene_id": scene_id,
                    "date": scene["properties"].get("datetime"),
                    "cloud_cover": scene["properties"].get(
                        "eo:cloud_cover"
                    ),
                    "platform": scene["properties"].get("platform"),
                    "tile_url": tile_url,
                    "bounds": tilejson.get("bounds"),
                    "source": "Copernicus Sentinel-2 via Microsoft Planetary Computer",
                }
            except (httpx.HTTPError, ValueError):
                continue

    return None


@router.get("/compare")
def compare_satellite(
    lat: float = Query(..., ge=-85, le=85),
    lng: float = Query(..., ge=-180, le=180),
    before_year: int = Query(..., ge=2017, le=2026),
    after_year: int = Query(..., ge=2017, le=2026),
):
    if before_year == after_year:
        raise HTTPException(
            status_code=400,
            detail="Select two different years.",
        )

    try:
        before = find_scene(
            round(lat, 4), round(lng, 4), before_year
        )
        after = find_scene(
            round(lat, 4), round(lng, 4), after_year
        )
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Satellite service unavailable: {exc}",
        ) from exc

    return {
        "latitude": lat,
        "longitude": lng,
        "before": before,
        "after": after,
        "note": (
            "Cloud cover is scene-wide, not location-specific. "
            "Scenes may differ in season, illumination, and coverage. "
            "A missing scene is not replaced with current imagery."
        ),
    }
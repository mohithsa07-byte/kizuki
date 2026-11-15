from datetime import date

import httpx
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/satellite", tags=["satellite"])

STAC_URL = "https://earth-search.aws.element84.com/v1/search"
COLLECTION = "sentinel-2-c1-l2a"


@router.get("/ndvi")
def global_ndvi(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    start_date: date = Query(...),
    end_date: date = Query(...),
    max_cloud: int = Query(30, ge=0, le=100),
):
    if end_date < start_date:
        raise HTTPException(
            status_code=400,
            detail="Invalid date range.",
        )

    if (end_date - start_date).days > 366:
        raise HTTPException(
            status_code=400,
            detail="Maximum date range is 366 days.",
        )

    delta = 0.003

    payload = {
        "collections": [COLLECTION],
        "bbox": [
            max(-180, lng - delta),
            max(-90, lat - delta),
            min(180, lng + delta),
            min(90, lat + delta),
        ],
        "datetime": (
            f"{start_date.isoformat()}T00:00:00Z/"
            f"{end_date.isoformat()}T23:59:59Z"
        ),
        "limit": 20,
    }

    try:
        with httpx.Client(
            timeout=httpx.Timeout(20.0, connect=5.0)
        ) as client:
            response = client.post(STAC_URL, json=payload)
            response.raise_for_status()
            features = response.json().get("features", [])

        candidates = [
            scene for scene in features
            if scene.get("properties", {}).get(
                "eo:cloud_cover", 100
            ) <= max_cloud
        ]

        if not candidates:
            return {
                "status": "no_scene",
                "mean_ndvi": None,
                "source": "Sentinel-2 L2A",
                "note": "No matching satellite scene found.",
            }

        scene = min(
            candidates,
            key=lambda item: item["properties"].get(
                "eo:cloud_cover", 100
            ),
        )

        return {
            "status": "scene_found",
            "mean_ndvi": None,
            "source": "Sentinel-2 L2A via Earth Search",
            "is_sample": False,
            "latitude": lat,
            "longitude": lng,
            "scene_id": scene.get("id"),
            "scene_date": scene["properties"].get("datetime"),
            "scene_cloud_percent": scene[
                "properties"
            ].get("eo:cloud_cover"),
            "note": (
                "Satellite scene discovered successfully. "
                "NDVI has not been calculated. "
                "A compatible raster-processing service "
                "is still required."
            ),
        }

    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Satellite catalog request failed: {exc}",
        ) from exc

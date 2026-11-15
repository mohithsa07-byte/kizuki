from datetime import date
from functools import lru_cache

import httpx
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/satellite", tags=["satellite"])

STAC = "https://planetarycomputer.microsoft.com/api/stac/v1/search"
DATA = "https://planetarycomputer.microsoft.com/api/data/v1"
COLLECTION = "sentinel-2-l2a"

# Sentinel-2 scene classification:
# 4 = vegetation, 5 = bare soil, 6 = water
VALID_SCL = {4, 5, 6}


def get_values(payload):
    values = payload.get("values", [])

    # TiTiler normally returns a list of band values.
    if isinstance(values, list):
        result = []
        for value in values:
            if isinstance(value, list):
                result.extend(value)
            else:
                result.append(value)
        return result

    return []


def fetch_point(client, scene_id, lng, lat, assets):
    response = client.get(
        f"{DATA}/item/point/{lng},{lat}",
        params=[
            ("collection", COLLECTION),
            ("item", scene_id),
            *[("assets", asset) for asset in assets],
        ],
    )
    response.raise_for_status()
    return response.json()


@lru_cache(maxsize=128)
def measure(lat, lng, start_date, end_date, max_cloud):
    delta = 0.002

    bbox = [
        max(-180, lng - delta),
        max(-90, lat - delta),
        min(180, lng + delta),
        min(90, lat + delta),
    ]

    payload = {
        "collections": [COLLECTION],
        "bbox": bbox,
        "datetime": (
            f"{start_date}T00:00:00Z/"
            f"{end_date}T23:59:59Z"
        ),
        "limit": 40,
    }

    with httpx.Client(
        timeout=httpx.Timeout(25.0, connect=5.0),
        follow_redirects=True,
    ) as client:
        response = client.post(STAC, json=payload)
        response.raise_for_status()

        features = response.json().get("features", [])

        scenes = [
            scene for scene in features
            if scene.get("properties", {}).get(
                "eo:cloud_cover", 100
            ) <= max_cloud
        ]

        scenes.sort(
            key=lambda scene: scene.get(
                "properties", {}
            ).get("eo:cloud_cover", 100)
        )

        for scene in scenes[:8]:
            scene_id = scene.get("id")

            if not scene_id:
                continue

            try:
                spectral = fetch_point(
                    client,
                    scene_id,
                    lng,
                    lat,
                    ["B04", "B08"],
                )

                classification = fetch_point(
                    client,
                    scene_id,
                    lng,
                    lat,
                    ["SCL"],
                )

                values = get_values(spectral)
                scl_values = get_values(classification)

                if len(values) < 2 or not scl_values:
                    continue

                red = values[0]
                nir = values[1]
                scl = scl_values[0]

                if (
                    red is None
                    or nir is None
                    or scl is None
                ):
                    continue

                red = float(red)
                nir = float(nir)
                scl = int(scl)

                if scl not in VALID_SCL:
                    continue

                if red <= 0 or nir <= 0:
                    continue

                denominator = nir + red

                if denominator <= 0:
                    continue

                ndvi = (nir - red) / denominator

                if not -1 <= ndvi <= 1:
                    continue

                return {
                    "status": "available",
                    "mean_ndvi": round(ndvi, 4),
                    "valid_pixels": 1,
                    "source": (
                        "Sentinel-2 L2A via "
                        "Microsoft Planetary Computer"
                    ),
                    "is_sample": False,
                    "latitude": lat,
                    "longitude": lng,
                    "scene_id": scene_id,
                    "scene_date": scene.get(
                        "properties", {}
                    ).get("datetime"),
                    "scene_cloud_percent": scene.get(
                        "properties", {}
                    ).get("eo:cloud_cover"),
                    "scene_classification": scl,
                    "red_value": red,
                    "nir_value": nir,
                    "note": (
                        "Single-location Sentinel-2 "
                        "red/NIR band ratio. "
                        "Cloud and shadow screening applied "
                        "using the SCL band. "
                        "This is not a regional average. "
                        "Radiometric offset corrections "
                        "have not been independently "
                        "validated."
                    ),
                }

            except (
                httpx.HTTPError,
                ValueError,
                TypeError,
                KeyError,
                IndexError,
            ):
                # Try another available scene.
                continue

    return {
        "status": "no_valid_pixels",
        "mean_ndvi": None,
        "valid_pixels": 0,
        "source": "Sentinel-2 L2A",
        "is_sample": False,
        "latitude": lat,
        "longitude": lng,
        "note": (
            "No usable satellite pixel was retrieved. "
            "Try another year, location, or cloud threshold."
        ),
    }


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
            detail="Maximum period is 366 days.",
        )

    try:
        return measure(
            round(lat, 5),
            round(lng, 5),
            start_date.isoformat(),
            end_date.isoformat(),
            max_cloud,
        )

    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail={
                "error": "Satellite provider unavailable",
                "message": str(exc)[:300],
            },
        ) from exc
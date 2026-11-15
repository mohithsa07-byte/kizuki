import traceback
import math
from datetime import date

import httpx






from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/satellite", tags=["satellite"])

STAC_URL = "https://earth-search.aws.element84.com/v1/search"
COLLECTION = "sentinel-2-c1-l2a"

# Sentinel-2 scene classification:
# 4 vegetation, 5 bare soil, 6 water, 7 unclassified.
# Exclude clouds, shadows, snow and invalid pixels.
VALID_SCL = {4, 5, 6, 7}


def find_scene(lat, lng, start_date, end_date, max_cloud):
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
            f"{start_date}T00:00:00Z/"
            f"{end_date}T23:59:59Z"
        ),
        "limit": 40,
    }

    with httpx.Client(timeout=20, follow_redirects=True) as client:
        response = client.post(STAC_URL, json=payload)
        response.raise_for_status()
        features = response.json().get("features", [])

    candidates = []

    for scene in features:
        props = scene.get("properties", {})
        cloud = props.get("eo:cloud_cover")

        if cloud is None or cloud > max_cloud:
            continue

        assets = scene.get("assets", {})

        if all(k in assets for k in ("red", "nir", "scl")):
            candidates.append(scene)

    if not candidates:
        return None

    return min(
        candidates,
        key=lambda item: item["properties"].get(
            "eo:cloud_cover", 100
        ),
    )


def read_window(url, lat, lng, radius=8):
    import rasterio
    from rasterio.enums import Resampling
    from rasterio.windows import Window
    from rasterio.warp import transform
    with rasterio.Env(
        GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR",
        GDAL_HTTP_MAX_RETRY="2",
        GDAL_HTTP_RETRY_DELAY="1",
    ):
        with rasterio.open(url) as src:
            x, y = transform(
                "EPSG:4326",
                src.crs,
                [lng],
                [lat],
            )

            row, col = src.index(x[0], y[0])

            window = Window(
                col - radius,
                row - radius,
                radius * 2 + 1,
                radius * 2 + 1,
            )

            # Keep every band on the same approximate
            # ground footprint: 17 x 17 pixels at 10 m.
            # SCL is 20 m, so read a matching ground area.
            return src.read(
                1,
                window=window,
                boundless=True,
                fill_value=0,
                out_shape=(17, 17),
                resampling=Resampling.nearest,
            ).astype("float32")


def calculate_ndvi(scene, lat, lng):
    import numpy as np
    assets = scene["assets"]

    red = read_window(assets["red"]["href"], lat, lng)
    nir = read_window(assets["nir"]["href"], lat, lng)
    scl = read_window(assets["scl"]["href"], lat, lng)

    # Sentinel-2 L2A surface reflectance assets can
    # contain a radiometric offset. Apply scale/offset
    # from STAC raster metadata when available.
    def reflectance(asset, values):
        bands = asset.get("raster:bands", [{}])
        metadata = bands[0] if bands else {}
        scale = metadata.get("scale", 0.0001)
        offset = metadata.get("offset", 0)
        return values * scale + offset

    red = reflectance(assets["red"], red)
    nir = reflectance(assets["nir"], nir)

    denominator = nir + red

    mask = (
        np.isin(scl.astype(int), list(VALID_SCL))
        & np.isfinite(red)
        & np.isfinite(nir)
        & (denominator > 0)
    )

    ndvi = np.full(red.shape, np.nan, dtype="float32")

    np.divide(
        nir - red,
        denominator,
        out=ndvi,
        where=mask,
    )

    values = ndvi[np.isfinite(ndvi)]
    values = values[(values >= -1) & (values <= 1)]

    if values.size == 0:
        return {
            "mean_ndvi": None,
            "valid_pixels": 0,
            "status": "no_valid_pixels",
        }

    return {
        "mean_ndvi": round(float(np.mean(values)), 4),
        "min_ndvi": round(float(np.min(values)), 4),
        "max_ndvi": round(float(np.max(values)), 4),
        "valid_pixels": int(values.size),
        "status": "available",
    }


@router.get("/ndvi")
def global_ndvi(
    lat: float = Query(..., ge=-89.99, le=89.99),
    lng: float = Query(..., ge=-180, le=180),
    start_date: date = Query(...),
    end_date: date = Query(...),
    max_cloud: int = Query(20, ge=0, le=100),
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
        scene = find_scene(
            lat,
            lng,
            start_date.isoformat(),
            end_date.isoformat(),
            max_cloud,
        )

        if scene is None:
            return {
                "status": "no_scene",
                "mean_ndvi": None,
                "source": "Sentinel-2 L2A",
                "note": "No matching satellite scene found.",
            }

        result = calculate_ndvi(scene, lat, lng)

        return {
            **result,
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
                "Approximate local NDVI pixel-window estimate. "
                "Not a city-wide vegetation measurement. "
                "Scene cloud percentage is scene-wide."
            ),
        }

    except Exception as exc:
        traceback.print_exc()
        raise HTTPException(
            status_code=502,
            detail={
                "error": "Satellite NDVI processing failed",
                "exception_type": type(exc).__name__,
                "message": str(exc)[:500],
            },
        ) from exc



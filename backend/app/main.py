from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import analyst, climate, health, ndvi, regions, satellite, satellite_ndvi

app = FastAPI(
    title="KIZUKI API",
    description="Global climate and satellite intelligence API.",
    version="0.4.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_origin_regex=settings.frontend_origin_regex,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(regions.router)
app.include_router(climate.router)
app.include_router(analyst.router)
app.include_router(ndvi.router)
app.include_router(satellite.router)


@app.get("/")
def root():
    return {
        "name": "KIZUKI API",
        "version": "0.4.0",
        "docs": "/docs",
    }

app.include_router(satellite_ndvi.router)



@app.get("/api/deployment-check")
def deployment_check():
    return {
        "status": "ok",
        "commit_marker": "kizuki-ndvi-fixed-443cc3d",
        "rasterio_removed": True
    }

from app.routes import satellite_compare
app.include_router(satellite_compare.router)

from app.routes import reports
app.include_router(reports.router)

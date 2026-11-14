from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import health, regions

app = FastAPI(
    title="KIZUKI API",
    description="Climate intelligence API for KIZUKI.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(regions.router)


@app.get("/")
def root():
    return {"name": "KIZUKI API", "docs": "/docs"}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import climate, health, regions

app = FastAPI(
    title="KIZUKI API",
    description="Climate intelligence API for KIZUKI.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(regions.router)
app.include_router(climate.router)


@app.get("/")
def root():
    return {"name": "KIZUKI API", "docs": "/docs"}

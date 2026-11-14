from pydantic import BaseModel


class Region(BaseModel):
    id: str
    name: str
    state: str
    country: str
    lat: float
    lng: float

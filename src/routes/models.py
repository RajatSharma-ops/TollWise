from pydantic import BaseModel
from typing import List, Optional


class RawTollItem(BaseModel):
    """
    Internal domain model representing a toll extracted from external provider.
    """
    name: str
    normal_fee: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class RawRouteItem(BaseModel):
    """
    Internal domain model representing a raw route option returned by TollGuru.
    """
    name: str
    distance_km: float
    duration_minutes: float
    google_maps_url: Optional[str] = None
    tolls: List[RawTollItem]

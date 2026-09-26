from pydantic import BaseModel, Field
from typing import List, Optional
from src.annual_pass.dtos import AnnualPassStatus, TollEvaluationResult


class RouteSearchRequest(BaseModel):
    origin: str = Field(..., example="Delhi", description="Origin city or location")
    destination: str = Field(..., example="Jaipur", description="Destination city or location")
    annual_pass: bool = Field(default=False, description="Whether user owns an official NHAI Annual Pass")


class TollResponse(BaseModel):
    name: str
    normal_fee: float
    annual_pass_status: AnnualPassStatus
    payable_fee: float


class RouteResponse(BaseModel):
    route_name: str
    distance_km: float
    duration_minutes: float
    normal_toll: float
    annual_pass_covered_amount: float
    payable_toll: float
    annual_pass_savings: float
    google_maps_url: Optional[str] = Field(None, description="Direct Google Maps navigation URL for this route")
    tolls: List[TollResponse]


class RouteSearchResponse(BaseModel):
    origin: str
    destination: str
    annual_pass_applied: bool
    routes_count: int
    routes: List[RouteResponse]

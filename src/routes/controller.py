import re
import urllib.parse
from typing import List, Dict, Any
import logging

from src.routes.dtos import (
    RouteSearchRequest,
    RouteSearchResponse,
    RouteResponse,
    TollResponse,
)
from src.routes.models import RawRouteItem, RawTollItem
from src.utils.tollguru_client import TollGuruClient
from src.annual_pass.controller import AnnualPassController

logger = logging.getLogger(__name__)


def _extract_float(val: Any) -> float:
    """
    Safely extracts floating point numbers according to TollGuru documentation spec.
    Handles numeric values, formatted strings ('297 km', '₹100'), and nested objects.
    """
    if val is None:
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        match = re.search(r'[\d\.]+', val)
        if match:
            try:
                return float(match.group(0))
            except ValueError:
                return 0.0
        return 0.0
    if isinstance(val, dict):
        for key in ["value", "metric", "tagCost", "tagPriCost", "cashCost", "tag", "cash", "prepaidCardCost", "licensePlateCost", "text", "cost"]:
            if key in val and val[key] is not None:
                res = _extract_float(val[key])
                if res != 0.0:
                    return res
    return 0.0


class RouteController:
    """
    Coordinates the route search and Annual Pass calculations.
    Flow: Request -> TollGuru API -> Annual Pass calculation -> Response DTO
    Fully aligned with official TollGuru API documentation specification.
    """

    def __init__(self, tollguru_client: TollGuruClient | None = None, annual_pass_controller: AnnualPassController | None = None):
        self.tollguru_client = tollguru_client or TollGuruClient()
        self.annual_pass_controller = annual_pass_controller or AnnualPassController()

    async def search_routes(self, request: RouteSearchRequest) -> RouteSearchResponse:
        """
        Fetches route alternatives from TollGuru, evaluates each toll against NHAI Annual Pass rules,
        and aggregates savings and payable tolls for every route option.
        """
        raw_api_response = await self.tollguru_client.get_routes_and_tolls(
            origin=request.origin,
            destination=request.destination
        )

        raw_routes = self._parse_tollguru_response(raw_api_response, origin=request.origin, destination=request.destination)

        evaluated_routes: List[RouteResponse] = []

        for route_idx, raw_route in enumerate(raw_routes, start=1):
            evaluated_tolls: List[TollResponse] = []
            total_normal_toll = 0.0
            total_payable_toll = 0.0
            total_covered_amount = 0.0

            for raw_toll in raw_route.tolls:
                eval_result = self.annual_pass_controller.evaluate_toll(
                    plaza_name=raw_toll.name,
                    normal_fee=raw_toll.normal_fee,
                    has_annual_pass=request.annual_pass
                )

                toll_response = TollResponse(
                    name=eval_result.name,
                    normal_fee=eval_result.normal_fee,
                    annual_pass_status=eval_result.annual_pass_status,
                    payable_fee=eval_result.payable_fee
                )
                evaluated_tolls.append(toll_response)

                total_normal_toll += eval_result.normal_fee
                total_payable_toll += eval_result.payable_fee
                if eval_result.payable_fee < eval_result.normal_fee:
                    total_covered_amount += (eval_result.normal_fee - eval_result.payable_fee)

            savings = total_normal_toll - total_payable_toll

            evaluated_routes.append(
                RouteResponse(
                    route_name=raw_route.name or f"Route {route_idx}",
                    distance_km=round(raw_route.distance_km, 2),
                    duration_minutes=round(raw_route.duration_minutes, 2),
                    normal_toll=round(total_normal_toll, 2),
                    annual_pass_covered_amount=round(total_covered_amount, 2),
                    payable_toll=round(total_payable_toll, 2),
                    annual_pass_savings=round(savings, 2),
                    google_maps_url=raw_route.google_maps_url,
                    tolls=evaluated_tolls
                )
            )

        return RouteSearchResponse(
            origin=request.origin,
            destination=request.destination,
            annual_pass_applied=request.annual_pass,
            routes_count=len(evaluated_routes),
            routes=evaluated_routes
        )

    def _parse_tollguru_response(self, response_data: Dict[str, Any], origin: str = "", destination: str = "") -> List[RawRouteItem]:
        """
        Parses TollGuru v2 JSON response according to the official TollGuru API schema.
        Extracts distance, duration, Google Maps navigation links, and tolls.
        """
        parsed_routes: List[RawRouteItem] = []

        routes_list = response_data.get("routes", [])
        if not routes_list and "route" in response_data:
            routes_list = [response_data["route"]]

        for idx, route_data in enumerate(routes_list):
            summary = route_data.get("summary", {})
            name = summary.get("name") if isinstance(summary, dict) else f"Route {idx + 1}"
            if not name:
                name = f"Route {idx + 1}"

            # Google Maps URL parsing from summary or direct route data
            gmaps_url = None
            if isinstance(summary, dict):
                gmaps_url = summary.get("url") or summary.get("gmapsUrl")
            if not gmaps_url:
                gmaps_url = route_data.get("url") or route_data.get("gmapsUrl")
            
            # Fallback direct Google Maps directions URL if not returned by API
            if not gmaps_url and origin and destination:
                encoded_origin = urllib.parse.quote(origin)
                encoded_dest = urllib.parse.quote(destination)
                gmaps_url = f"https://www.google.com/maps/dir/?api=1&origin={encoded_origin}&destination={encoded_dest}"

            # Distance parsing
            distance_val = 0.0
            dist_obj = route_data.get("distance", summary.get("distance", {}))
            if isinstance(dist_obj, dict):
                if "value" in dist_obj and isinstance(dist_obj["value"], (int, float)) and dist_obj["value"] > 0:
                    distance_val = float(dist_obj["value"]) / 1000.0  # meters to km
                elif "metric" in dist_obj:
                    distance_val = _extract_float(dist_obj["metric"])
                elif "text" in dist_obj:
                    distance_val = _extract_float(dist_obj["text"])
            else:
                distance_val = _extract_float(dist_obj)
                if distance_val > 1000:
                    distance_val = distance_val / 1000.0

            # Duration parsing
            duration_val = 0.0
            dur_obj = route_data.get("duration", summary.get("duration", {}))
            if isinstance(dur_obj, dict):
                if "value" in dur_obj and isinstance(dur_obj["value"], (int, float)) and dur_obj["value"] > 0:
                    duration_val = float(dur_obj["value"]) / 60.0  # seconds to minutes
                elif "text" in dur_obj:
                    duration_val = _extract_float(dur_obj["text"])
            else:
                duration_val = _extract_float(dur_obj)
                if duration_val > 300:
                    duration_val = duration_val / 60.0

            # Tolls parsing
            tolls_list: List[RawTollItem] = []
            tolls_data = route_data.get("tolls", [])
            for toll in tolls_data:
                toll_name = toll.get("name")
                if not toll_name and isinstance(toll.get("start"), dict):
                    toll_name = toll["start"].get("name")
                if not toll_name:
                    toll_name = "Unknown Toll Plaza"
                
                fee = 0.0
                if "tagCost" in toll and toll["tagCost"] is not None:
                    fee = _extract_float(toll["tagCost"])
                elif "tagPriCost" in toll and toll["tagPriCost"] is not None:
                    fee = _extract_float(toll["tagPriCost"])
                elif "cashCost" in toll and toll["cashCost"] is not None:
                    fee = _extract_float(toll["cashCost"])
                elif "licensePlateCost" in toll and toll["licensePlateCost"] is not None:
                    fee = _extract_float(toll["licensePlateCost"])
                elif "prepaidCardCost" in toll and toll["prepaidCardCost"] is not None:
                    fee = _extract_float(toll["prepaidCardCost"])
                elif "cost" in toll and toll["cost"] is not None:
                    fee = _extract_float(toll["cost"])

                tolls_list.append(
                    RawTollItem(
                        name=toll_name,
                        normal_fee=fee,
                        latitude=toll.get("lat"),
                        longitude=toll.get("lng")
                    )
                )

            parsed_routes.append(
                RawRouteItem(
                    name=name,
                    distance_km=distance_val,
                    duration_minutes=duration_val,
                    google_maps_url=gmaps_url,
                    tolls=tolls_list
                )
            )

        return parsed_routes

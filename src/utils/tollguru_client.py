import os
from typing import Dict, Any
import httpx
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

TOLLGURU_API_URL = "https://apis.tollguru.com/toll/v2/origin-destination-waypoints"


class TollGuruClient:
    """
    Simple client for TollGuru API v2.
    Fetches route options, distances, durations, and toll plazas.
    """

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.getenv("TOLLGURU_API_KEY")

    async def get_routes_and_tolls(self, origin: str, destination: str) -> Dict[str, Any]:
        """
        Calls TollGuru v2 API for origin and destination with Private Car vehicle type.
        """
        if not self.api_key or self.api_key == "your_tollguru_api_key_here":
            raise ValueError("TOLLGURU_API_KEY is missing or invalid in environment variables.")

        headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
        }

        payload = {
            "from": {"address": origin},
            "to": {"address": destination},
            "vehicle": {
                "type": "2AxlesAuto"  # Private Car / Non-commercial car
            }
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(TOLLGURU_API_URL, json=payload, headers=headers)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as exc:
                logger.error(f"TollGuru API HTTP error: {exc.response.status_code} - {exc.response.text}")
                raise RuntimeError(f"TollGuru API error: {exc.response.status_code} - {exc.response.text}")
            except httpx.RequestError as exc:
                logger.error(f"TollGuru API network error: {exc}")
                raise RuntimeError(f"Failed to communicate with TollGuru API: {exc}")

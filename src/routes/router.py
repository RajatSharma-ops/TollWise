from fastapi import APIRouter, HTTPException, status
import logging

from src.routes.dtos import RouteSearchRequest, RouteSearchResponse
from src.routes.controller import RouteController

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/routes", tags=["Routes"])
route_controller = RouteController()


@router.post("/search", response_model=RouteSearchResponse, status_code=status.HTTP_200_OK)
async def search_routes(request: RouteSearchRequest) -> RouteSearchResponse:
    """
    Search route options between origin and destination, applying NHAI Annual Pass toll savings.
    """
    try:
        response = await route_controller.search_routes(request)
        return response
    except ValueError as val_err:
        logger.error(f"Configuration or validation error: {val_err}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except RuntimeError as run_err:
        logger.error(f"External service error: {run_err}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Toll routing provider error: {run_err}"
        )
    except Exception as exc:
        logger.exception("Unexpected error in route search endpoint")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected internal server error occurred."
        )

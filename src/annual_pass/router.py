from fastapi import APIRouter
from src.annual_pass.controller import AnnualPassController

router = APIRouter(prefix="/annual-pass", tags=["Annual Pass"])
annual_pass_controller = AnnualPassController()


@router.get("/status")
def get_dataset_status():
    """
    Returns information on whether the NHAI Annual Pass PDF dataset is loaded.
    """
    return {
        "dataset_loaded": annual_pass_controller._dataset_loaded,
        "eligible_plazas_count": len(annual_pass_controller._eligible_plazas),
        "pdf_path": str(annual_pass_controller.pdf_path),
    }

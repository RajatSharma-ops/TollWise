from pydantic import BaseModel
from typing import Optional


class EligiblePlazaRecord(BaseModel):
    """
    Represents a plaza record extracted from the NHAI PDF data.
    """
    plaza_name: str
    normalized_name: str
    state: Optional[str] = None
    nh_number: Optional[str] = None

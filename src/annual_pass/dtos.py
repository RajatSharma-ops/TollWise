from enum import Enum
from pydantic import BaseModel


class AnnualPassStatus(str, Enum):
    COVERED = "COVERED"
    NOT_COVERED = "NOT_COVERED"
    UNKNOWN = "UNKNOWN"


class TollEvaluationResult(BaseModel):
    name: str
    normal_fee: float
    annual_pass_status: AnnualPassStatus
    payable_fee: float

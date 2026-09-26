import os
from typing import Set, Dict, Any, Tuple
import logging

from src.annual_pass.dtos import AnnualPassStatus, TollEvaluationResult
from src.utils.text_normalizer import normalize_plaza_name
from src.utils.pdf_parser import NHAIPdfParser

logger = logging.getLogger(__name__)


class AnnualPassController:
    """
    Controller responsible for evaluating toll plazas against NHAI Annual Pass PDF dataset.
    """

    def __init__(self, pdf_path: str | None = None):
        env_path = os.getenv("NHAI_PDF_PATH")
        if pdf_path:
            self.pdf_path = pdf_path
        elif env_path and os.path.exists(env_path):
            self.pdf_path = env_path
        elif os.path.exists("data/NH-Plazas.pdf"):
            self.pdf_path = "data/NH-Plazas.pdf"
        elif os.path.exists("NH-Plazas.pdf"):
            self.pdf_path = "NH-Plazas.pdf"
        else:
            self.pdf_path = "data/NH-Plazas.pdf"

        self._parser = NHAIPdfParser(self.pdf_path)
        self._eligible_plazas: Set[str] = set()
        self._dataset_loaded = False
        self.reload_dataset()

    def reload_dataset(self) -> None:
        """
        Loads and parses the NHAI PDF data into memory.
        """
        try:
            self._eligible_plazas = self._parser.extract_eligible_plazas()
            if self._eligible_plazas:
                self._dataset_loaded = True
                logger.info(f"Successfully loaded {len(self._eligible_plazas)} eligible toll plazas from PDF.")
            else:
                self._dataset_loaded = False
                logger.warning(f"No eligible plazas loaded from PDF at {self.pdf_path}.")
        except Exception as e:
            self._dataset_loaded = False
            logger.error(f"Failed to load PDF dataset: {e}")

    def evaluate_toll(self, plaza_name: str, normal_fee: float, has_annual_pass: bool) -> TollEvaluationResult:
        """
        Evaluates a single toll plaza fee based on Annual Pass ownership and PDF dataset.
        """
        if not has_annual_pass:
            return TollEvaluationResult(
                name=plaza_name,
                normal_fee=normal_fee,
                annual_pass_status=AnnualPassStatus.NOT_COVERED,
                payable_fee=normal_fee,
            )

        if not self._dataset_loaded or not self._eligible_plazas:
            # When PDF dataset is missing or unparseable, return UNKNOWN
            return TollEvaluationResult(
                name=plaza_name,
                normal_fee=normal_fee,
                annual_pass_status=AnnualPassStatus.UNKNOWN,
                payable_fee=normal_fee,
            )

        status = self._match_plaza(plaza_name)

        if status == AnnualPassStatus.COVERED:
            payable_fee = 0.0
        else:
            payable_fee = normal_fee

        return TollEvaluationResult(
            name=plaza_name,
            normal_fee=normal_fee,
            annual_pass_status=status,
            payable_fee=payable_fee,
        )

    def _match_plaza(self, plaza_name: str) -> AnnualPassStatus:
        """
        Normalizes TollGuru plaza name and matches against NHAI PDF dataset.
        """
        if not plaza_name:
            return AnnualPassStatus.UNKNOWN

        normalized = normalize_plaza_name(plaza_name)
        if not normalized:
            return AnnualPassStatus.UNKNOWN

        # 1. Exact match against normalized PDF plazas
        if normalized in self._eligible_plazas:
            return AnnualPassStatus.COVERED

        # 2. Token / word boundary substring matching (if exact string differs slightly due to extra words)
        # Check if normalized candidate matches any eligible plaza as a full token phrase
        for eligible in self._eligible_plazas:
            if eligible and (normalized == eligible or normalized in eligible or eligible in normalized):
                # Ensure it's not a generic single word match like "gate"
                if len(normalized) >= 4 and len(eligible) >= 4:
                    return AnnualPassStatus.COVERED

        # 3. If no match and dataset is loaded, mark as NOT_COVERED (or UNKNOWN if extremely short/ambiguous)
        if len(normalized) < 3:
            return AnnualPassStatus.UNKNOWN

        return AnnualPassStatus.NOT_COVERED

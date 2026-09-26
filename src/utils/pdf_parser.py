import os
from pathlib import Path
from typing import Set, List, Dict, Any
import logging

logger = logging.getLogger(__name__)

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

try:
    import pypdf
except ImportError:
    pypdf = None

from src.utils.text_normalizer import normalize_plaza_name


class NHAIPdfParser:
    """
    Parses NHAI / IHMCL Annual Pass Eligible Toll Plazas PDF.
    Extracts text and table rows dynamically without hardcoding plaza names.
    """

    def __init__(self, pdf_path: str):
        self.pdf_path = Path(pdf_path)

    def extract_eligible_plazas(self) -> Set[str]:
        """
        Parses the PDF file and returns a set of normalized plaza names.
        """
        if not self.pdf_path.is_file():
            logger.warning(f"NHAI PDF file not found at path: {self.pdf_path}")
            return set()

        plaza_names: Set[str] = set()

        # Try pdfplumber first for structured table/text extraction
        if pdfplumber is not None:
            try:
                with pdfplumber.open(self.pdf_path) as pdf:
                    for page in pdf.pages:
                        # Extract table text if available
                        tables = page.extract_tables()
                        for table in tables:
                            for row in table:
                                for cell in row:
                                    if cell and isinstance(cell, str):
                                        self._process_text_line(cell, plaza_names)
                        
                        # Extract plain text lines as fallback/supplement
                        text = page.extract_text()
                        if text:
                            for line in text.splitlines():
                                self._process_text_line(line, plaza_names)
                if plaza_names:
                    return plaza_names
            except Exception as e:
                logger.error(f"Error parsing PDF with pdfplumber: {e}")

        # Fallback to pypdf if pdfplumber failed or extracted nothing
        if pypdf is not None:
            try:
                reader = pypdf.PdfReader(str(self.pdf_path))
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        for line in text.splitlines():
                            self._process_text_line(line, plaza_names)
            except Exception as e:
                logger.error(f"Error parsing PDF with pypdf: {e}")

        return plaza_names

    def _process_text_line(self, line: str, plaza_set: Set[str]) -> None:
        """
        Cleans a candidate line or cell from PDF and adds normalized plaza name if valid.
        """
        cleaned_line = line.strip()
        if not cleaned_line or len(cleaned_line) < 3:
            return

        normalized = normalize_plaza_name(cleaned_line)
        if normalized:
            plaza_set.add(normalized)

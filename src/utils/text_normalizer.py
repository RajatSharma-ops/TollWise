import re


def normalize_plaza_name(name: str) -> str:
    """
    Normalizes a toll plaza name for exact matching.
    
    Steps:
    1. Lowercase string
    2. Remove punctuation
    3. Replace keywords (toll plaza, fee plaza, toll, tp, plaza) with standard token or strip them
    4. Collapse multiple whitespaces and strip
    """
    if not name:
        return ""
    
    text = name.lower()
    
    # Remove punctuation characters (e.g. hyphens, dots, commas, apostrophes)
    text = re.sub(r'[^\w\s]', ' ', text)
    
    # Replace common suffixes/keywords to get canonical base name
    # e.g., "kherki daula toll plaza" -> "kherki daula"
    # "kherki daula fee plaza" -> "kherki daula"
    keywords = ["toll plaza", "fee plaza", "toll gate", "toll-plaza", "fee-plaza", "toll", "plaza", "tp"]
    for kw in keywords:
        text = re.sub(r'\b' + re.escape(kw) + r'\b', '', text)
    
    # Collapse extra whitespace
    normalized = re.sub(r'\s+', ' ', text).strip()
    return normalized

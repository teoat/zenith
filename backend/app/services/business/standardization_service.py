import logging
import re
from typing import Any

logger = logging.getLogger(__name__)


class StandardizationService:
    """
    Service for normalizing and standardizing extracted evidence data.
    Handles currency conversion, name normalization, and date parsing.
    """

    @staticmethod
    def normalize_currency(amount_str: str) -> float | None:
        """
        Extracts and normalizes numeric values from strings like '$1,234.56' or '1234.56 EUR'.
        """
        if not amount_str:
            return None

        try:
            # Remove currency symbols and formatting
            clean_str = re.sub(r"[^\d.]", "", amount_str.replace(",", ""))
            return float(clean_str)
        except (ValueError, TypeError):
            logger.warning(f"Failed to normalize currency amount: {amount_str}")
            return None

    @staticmethod
    def normalize_name(name: str) -> str:
        """
        Normalizes names to Title Case and removes excess whitespace.
        """
        if not name:
            return "Unknown"
        return " ".join(name.split()).title()

    @staticmethod
    def extract_entities_from_text(text: str) -> dict[str, Any]:
        """
        Heuristic-based entity extraction for rapid case enrichment.
        Focuses on Amounts, Names (Uppercase patterns), and Dates.
        """
        results = {
            "fraud_amount": 0.0,
            "customer_name": "Unknown",
            "detected_dates": [],
            "potential_ids": [],
        }

        if not text:
            return results

        # 1. Look for currency amounts (e.g., $1,000.00, 500.00 USD)
        amounts = re.findall(r"(\$?\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)", text)
        if amounts:
            # Take the largest amount as the primary fraud amount candidate
            normalized_amounts = [
                StandardizationService.normalize_currency(a) for a in amounts
            ]
            valid_amounts = [a for a in normalized_amounts if a is not None]
            if valid_amounts:
                results["fraud_amount"] = max(valid_amounts)

        # 2. Look for potential Customer/Entity names (Simplified: Sequence of capitalized words)
        # Often found near "Customer:", "Name:", "Client:", etc.
        name_match = re.search(
            r"(?:Customer|Client|Name|Entity):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)", text
        )
        if name_match:
            results["customer_name"] = name_match.group(1).strip()
        else:
            # Fallback: look for suspicious uppercase sequences that look like names
            names = re.findall(r"([A-Z]{2,}(?:\s+[A-Z]{2,})+)", text)
            if names:
                results["customer_name"] = names[0].strip().title()

        # 3. Look for dates
        dates = re.findall(r"(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})", text)
        results["detected_dates"] = dates

        # 4. Look for IBANs or Account IDs (Simplified)
        ids = re.findall(r"([A-Z]{2}\d{2}[A-Z0-9]{12,30})", text)  # Simple IBAN-ish
        results["potential_ids"] = ids

        return results


standardization_service = StandardizationService()

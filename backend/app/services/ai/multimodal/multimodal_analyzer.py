"""
Multimodal Analyzer Service

Provides image analysis using Pytesseract (OCR) and Pillow.
Extracts text, metadata, and basic image statistics.
"""

import io
import logging
from typing import Any, Dict, List

import pytesseract
from PIL import Image

logger = logging.getLogger(__name__)

# Configure pytesseract path if necessary, but usually it relies on PATH
# pytesseract.pytesseract.tesseract_cmd = r'/usr/local/bin/tesseract'


class MultimodalAnalyzer:
    def analyze_image(self, image_data: bytes) -> Dict[str, Any]:
        """Verify image, extract metadata, and perform OCR."""
        try:
            image = Image.open(io.BytesIO(image_data))

            # 1. Basic Metadata
            metadata = {
                "format": image.format,
                "mode": image.mode,
                "size": image.size,
                "width": image.width,
                "height": image.height,
            }

            # 2. OCR Extraction (Text from Image)
            text_content = ""
            try:
                # Tesseract might not be installed in CI env, handle gracefully
                text_content = pytesseract.image_to_string(image)
            except Exception as e:
                logger.warning(f"OCR failed (Tesseract might be missing): {e}")
                text_content = "[OCR Unavailable]"

            # 3. Heuristic Analysis (e.g. is it a screenshot?)
            # Screenshots often have PNG format and specific aspect ratios
            is_screenshot = image.format == "PNG" and (image.width / image.height > 1.3)

            return {
                "success": True,
                "metadata": metadata,
                "extracted_text": text_content.strip(),
                "classification": {
                    "is_screenshot": is_screenshot,
                    "likely_document": len(text_content) > 50,
                },
            }

        except Exception as e:
            logger.error(f"Image analysis failed: {e}")
            return {"success": False, "error": str(e)}

    def analyze_text(self, text: str) -> Dict[str, Any]:
        """Analyze text for fraud indicators (Keyword spotting)."""
        # Simple keyword spotting for now
        risk_keywords = ["wire", "urgent", "secret", "offshore", "shell", "layering"]
        found_keywords = [w for w in risk_keywords if w in text.lower()]

        return {
            "length": len(text),
            "risk_score": len(found_keywords) * 0.2,  # Simple scoring
            "flagged_keywords": found_keywords,
            "sentiment": "neutral",  # Placeholder for future sentiment analysis
        }


multimodal_analyzer = MultimodalAnalyzer()

"""Multimodal analyzer shim: provides OCR and PDF parsing APIs (lightweight).
This implementation is intentionally minimal — it provides interfaces used by
the rest of the codebase and tests, but does not bundle heavy native deps.
"""
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class MultimodalAnalyzer:
    def __init__(self):
        pass

    def extract_text_from_image(self, image_bytes: bytes) -> str:
        # Minimal fallback: return empty string if tesseract not available.
        try:
            from PIL import Image
            import io
            img = Image.open(io.BytesIO(image_bytes))
            # We don't call pytesseract here in the shim to avoid native deps in tests
            return ''
        except Exception:
            return ''

    def extract_text_from_pdf(self, pdf_bytes: bytes) -> str:
        # Minimal fallback: return empty string
        return ''

    def analyze_image_for_forensics(self, image_bytes: bytes) -> Dict[str, Any]:
        # Return basic metadata placeholder
        return {"manipulation_detected": False, "metadata": {}}
"""
Multimodal Analyzer Service

Provides image analysis using Pytesseract (OCR) and Pillow.
Extracts text, metadata, and basic image statistics.
"""

from typing import Dict, Any, List
from PIL import Image
import pytesseract
import io
import logging

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
            is_screenshot = image.format == 'PNG' and (image.width / image.height > 1.3)

            return {
                "success": True,
                "metadata": metadata,
                "extracted_text": text_content.strip(),
                "classification": {
                    "is_screenshot": is_screenshot,
                    "likely_document": len(text_content) > 50
                }
            }
            
        except Exception as e:
            logger.error(f"Image analysis failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def analyze_text(self, text: str) -> Dict[str, Any]:
        """Analyze text for fraud indicators (Keyword spotting)."""
        # Simple keyword spotting for now
        risk_keywords = ['wire', 'urgent', 'secret', 'offshore', 'shell', 'layering']
        found_keywords = [w for w in risk_keywords if w in text.lower()]
        
        return {
            "length": len(text),
            "risk_score": len(found_keywords) * 0.2, # Simple scoring
            "flagged_keywords": found_keywords,
            "sentiment": "neutral" # Placeholder for future sentiment analysis
        }

multimodal_analyzer = MultimodalAnalyzer()

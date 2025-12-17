# backend/tests/test_evidence_service.py
import pytest
from unittest.mock import MagicMock, patch, mock_open
from fastapi import UploadFile
from app.services.intelligence.evidence_service import evidence_processor

@pytest.mark.asyncio
async def test_process_evidence_image():
    mock_file = MagicMock(spec=UploadFile)
    mock_file.filename = "test.jpg"
    mock_file.content_type = "image/jpeg"
    mock_file.file = MagicMock() # Mock file-like object

    # Mock shutil.copyfileobj to avoid actual file IO
    with patch("shutil.copyfileobj"), \
         patch("app.services.evidence_service.EvidenceProcessor._process_image") as mock_process:
        
        mock_process.return_value = ("Extracted Text", {"faces_detected": [], "objects_detected": ["person"]})
        
        result = await evidence_processor.process_evidence(mock_file, "case_123")
        
        assert result.text_content == "Extracted Text"
        assert result.metadata["objects_detected"] == ["person"]

@pytest.mark.asyncio
async def test_process_evidence_pdf():
    mock_file = MagicMock(spec=UploadFile)
    mock_file.filename = "test.pdf"
    mock_file.content_type = "application/pdf"
    mock_file.file = MagicMock()

    with patch("shutil.copyfileobj"):
        result = await evidence_processor.process_evidence(mock_file, "case_123")
        assert "PDF processing" in result.text_content

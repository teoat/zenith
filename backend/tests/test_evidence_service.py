# backend/tests/test_evidence_service.py
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.services.intelligence.evidence_service import evidence_processor


@pytest.mark.asyncio
async def test_process_files_batch_image():
    # Mock _process_image to avoid actual file IO and dependencies
    with (
        patch(
            "app.services.intelligence.evidence_service.EvidenceProcessor._process_image"
        ) as mock_process,
        patch(
            "app.services.intelligence.evidence_service.EvidenceProcessor._detect_mime_type",
            return_value="image/jpeg",
        ),
        patch("app.services.intelligence.evidence_service.ai_service") as mock_ai,
        patch(
            "app.services.intelligence.evidence_service.evidence_search_index"
        ) as mock_search,
        patch("os.path.exists", return_value=True),
        patch("os.path.getsize", return_value=1024),
    ):

        def side_effect(path, res, opts):
            res.extracted_text = "Extracted Text"
            res.metadata["objects_detected"] = ["person"]

        mock_process.side_effect = side_effect

        # Mock async methods
        mock_ai.add_document = AsyncMock(return_value=True)
        mock_search.index_evidence = MagicMock()

        results = await evidence_processor.process_files_batch(
            ["test.jpg"], {"filename": "test.jpg"}
        )

        assert len(results) == 1
        assert results[0].extracted_text == "Extracted Text"
        assert results[0].metadata["objects_detected"] == ["person"]


@pytest.mark.asyncio
async def test_process_files_batch_pdf():
    with (
        patch(
            "app.services.intelligence.evidence_service.EvidenceProcessor._process_document"
        ) as mock_process,
        patch(
            "app.services.intelligence.evidence_service.EvidenceProcessor._detect_mime_type",
            return_value="application/pdf",
        ),
        patch("app.services.intelligence.evidence_service.ai_service") as mock_ai,
        patch(
            "app.services.intelligence.evidence_service.evidence_search_index"
        ) as mock_search,
        patch("os.path.exists", return_value=True),
        patch("os.path.getsize", return_value=1024),
    ):

        def side_effect(path, res, opts):
            res.extracted_text = "PDF Text Content"
            res.metadata["pages"] = 1

        mock_process.side_effect = side_effect

        # Mock async methods
        mock_ai.add_document = AsyncMock(return_value=True)
        mock_search.index_evidence = MagicMock()

        results = await evidence_processor.process_files_batch(
            ["test.pdf"], {"filename": "test.pdf"}
        )

        assert len(results) == 1
        assert "PDF Text Content" in results[0].extracted_text

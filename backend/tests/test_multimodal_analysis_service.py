"""
Unit tests for Multi-Modal Analysis Service
Tests PDF, image, and text file processing using the active MultiModalAnalyzer
"""

import os
import shutil
import tempfile
from datetime import datetime
from pathlib import Path

import pytest
from PIL import Image

from app.services.multimodal_analysis_service import (
    MultiModalAnalysis,
    MultiModalAnalyzer,
)


class TestMultiModalAnalyzer:
    """Test suite for MultiModalAnalyzer"""

    @pytest.fixture
    def analyzer(self):
        """Create a fresh analyzer instance"""
        # Use a temporary directory for analysis
        with tempfile.TemporaryDirectory() as temp_dir:
            yield MultiModalAnalyzer(temp_dir=temp_dir)

    @pytest.fixture
    def temp_text_file(self):
        """Create a temporary text file"""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
            f.write("Test document content\nLine 2\nLine 3")
            temp_path = f.name
        yield temp_path
        if os.path.exists(temp_path):
            os.unlink(temp_path)

    @pytest.fixture
    def temp_image_file(self):
        """Create a temporary image file"""
        # Use NamedTemporaryFile to ensure unique name, but close it so PIL can open it
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
            temp_path = f.name

        try:
            img = Image.new("RGB", (100, 100), color="white")
            img.save(temp_path)
            yield temp_path
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)

    # Text File Processing Tests

    def test_analyze_text_file(self, analyzer, temp_text_file):
        """Test basic text file processing"""
        result = analyzer.analyze_evidence(temp_text_file)

        assert isinstance(result, MultiModalAnalysis)
        assert result.file_type == "text/plain"
        assert "Test document content" in result.extracted_text
        assert result.size_bytes > 0
        assert not result.errors

    # Image Processing Tests

    def test_analyze_image_file(self, analyzer, temp_image_file):
        """Test basic image processing"""
        # Ensure image analysis dependencies are mocked or available
        # This test assumes the environment has PIL installed (which it does)

        result = analyzer.analyze_evidence(
            temp_image_file, options={"enable_ocr": False}
        )

        assert isinstance(result, MultiModalAnalysis)
        assert result.file_type.startswith("image/")
        assert result.visual_features
        assert result.visual_features["width"] == 100
        assert result.visual_features["height"] == 100

    def test_image_forensics_trigger(self, analyzer, temp_image_file):
        """Test that forensics are triggered when enabled"""
        result = analyzer.analyze_evidence(
            temp_image_file, options={"enable_forensics": True}
        )

        # Forensics might fail if cv2 is missing, but it should be attempted
        if analyzer.forensic_available:
            assert result.forensic_result is not None
        else:
            # If unavailable, it should still have processed basic image stats
            assert result.visual_features

    # Error Handling Tests

    def test_analyze_nonexistent_file(self, analyzer):
        """Test that processing non-existent file raises error"""
        with pytest.raises(FileNotFoundError):
            analyzer.analyze_evidence("/nonexistent/file.pdf")

    def test_unsupported_file_type(self, analyzer, tmp_path):
        """Test graceful handling or error for unsupported types"""
        # Create a dummy binary file with unknown extension
        unknown_file = tmp_path / "test.xyz"
        unknown_file.write_bytes(b"\x00\x01\x02")

        result = analyzer.analyze_evidence(str(unknown_file))
        assert result.errors
        assert (
            "Unsupported" in result.errors[0] or "analysis failed" in result.errors[0]
        )

    # Integration Checks

    def test_generate_evidence_id(self, analyzer, temp_text_file):
        """Test evidence ID generation"""
        result = analyzer.analyze_evidence(temp_text_file)
        assert result.evidence_id.startswith("ev_")

    def test_processing_time_tracking(self, analyzer, temp_text_file):
        """Test that processing time is recorded"""
        result = analyzer.analyze_evidence(temp_text_file)
        assert result.processing_time >= 0.0

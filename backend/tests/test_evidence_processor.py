"""
Unit tests for Evidence Processor
Tests PDF, image, and text file processing
"""

import os
import tempfile
from datetime import datetime

import pytest
from PIL import Image

from app.services.intelligence.evidence_processor import (
    ExtractedEvidence,
    FileType,
    MultiModalProcessor,
)


class TestMultiModalProcessor:
    """Test suite for MultiModalProcessor"""

    @pytest.fixture
    def processor(self):
        """Create a fresh processor instance"""
        return MultiModalProcessor()

    @pytest.fixture
    def temp_text_file(self):
        """Create a temporary text file"""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
            f.write("Test document content\nLine 2\nLine 3")
            temp_path = f.name
        yield temp_path
        os.unlink(temp_path)

    @pytest.fixture
    def temp_image_file(self):
        """Create a temporary image file"""
        img = Image.new("RGB", (100, 100), color="white")
        temp_path = tempfile.mktemp(suffix=".jpg")
        img.save(temp_path)
        yield temp_path
        os.unlink(temp_path)

    # Input Validation Tests

    def test_process_nonexistent_file(self, processor):
        """Test that processing non-existent file raises error"""
        with pytest.raises(ValueError, match="does not exist"):
            processor.process_file("/nonexistent/file.pdf")

    def test_process_unsupported_file_type(self, processor, tmp_path):
        """Test that unsupported file types raise error"""
        unsupported_file = tmp_path / "test.xyz"
        unsupported_file.write_text("content")

        with pytest.raises(ValueError, match="Unsupported file type"):
            processor.process_file(str(unsupported_file))

    def test_process_file_too_large(self, processor, tmp_path):
        """Test that files exceeding size limit raise error"""
        large_file = tmp_path / "large.txt"
        # Create 51MB file (exceeds 50MB limit)
        large_file.write_bytes(b"x" * (51 * 1024 * 1024))

        with pytest.raises(ValueError, match="exceeds maximum"):
            processor.process_file(str(large_file))

    # Text File Processing Tests

    def test_process_text_file(self, processor, temp_text_file):
        """Test basic text file processing"""
        evidence = processor.process_file(temp_text_file)

        assert evidence.file_type == FileType.TEXT
        assert evidence.filename == os.path.basename(temp_text_file)
        assert "Test document content" in evidence.extracted_text
        assert evidence.ocr_confidence == 1.0  # Perfect for text files
        assert evidence.file_size > 0

    def test_process_text_file_encoding(self, processor, tmp_path):
        """Test text file with different encodings"""
        # UTF-8 file
        utf8_file = tmp_path / "utf8.txt"
        utf8_file.write_text("Hello 世界", encoding="utf-8")

        evidence = processor.process_file(str(utf8_file))
        assert "Hello" in evidence.extracted_text

    # Image Processing Tests

    def test_process_image_file(self, processor, temp_image_file):
        """Test basic image processing"""
        evidence = processor.process_file(temp_image_file)

        assert evidence.file_type == FileType.IMAGE
        assert evidence.filename == os.path.basename(temp_image_file)
        assert evidence.ocr_confidence >= 0.0
        assert isinstance(evidence.metadata, dict)
        assert evidence.image_analysis is not None

    def test_process_image_with_text(self, processor, tmp_path):
        """Test image with text (OCR)"""
        # Create image with text
        from PIL import ImageDraw, ImageFont

        img = Image.new("RGB", (200, 100), color="white")
        draw = ImageDraw.Draw(img)
        draw.text((10, 40), "TEST123", fill="black")

        img_path = tmp_path / "text_image.png"
        img.save(str(img_path))

        evidence = processor.process_file(str(img_path))

        # OCR might detect the text (depends on Tesseract installation)
        assert evidence.file_type == FileType.IMAGE
        assert evidence.ocr_confidence >= 0.0

    def test_image_metadata_extraction(self, processor, temp_image_file):
        """Test that image metadata is extracted"""
        evidence = processor.process_file(temp_image_file)

        assert "width" in evidence.metadata or "size" in evidence.metadata
        assert isinstance(evidence.image_analysis, dict)

    # Search Functionality Tests

    def test_search_empty_index(self, processor):
        """Test search on empty index"""
        results = processor.search("test query")
        assert results == []

    def test_search_after_processing(self, processor, temp_text_file):
        """Test search after processing files"""
        # Process a file first
        evidence = processor.process_file(temp_text_file, file_id="test1")

        # Search for content
        results = processor.search("Test document")

        assert len(results) > 0
        assert results[0].file_id == "test1"

    def test_search_case_insensitive(self, processor, temp_text_file):
        """Test that search is case-insensitive"""
        processor.process_file(temp_text_file, file_id="test1")

        # Search with different cases
        results1 = processor.search("TEST")
        results2 = processor.search("test")

        assert len(results1) == len(results2)

    def test_search_partial_match(self, processor, temp_text_file):
        """Test partial text matching"""
        processor.process_file(temp_text_file, file_id="test1")

        # Partial match
        results = processor.search("document")

        assert len(results) > 0

    # Statistics Tests

    def test_get_statistics_empty(self, processor):
        """Test statistics with no processed files"""
        stats = processor.get_statistics()

        assert stats["total_files"] == 0
        assert stats["by_type"] == {}

    def test_get_statistics_after_processing(
        self, processor, temp_text_file, temp_image_file
    ):
        """Test statistics after processing files"""
        processor.process_file(temp_text_file, file_id="txt1")
        processor.process_file(temp_image_file, file_id="img1")

        stats = processor.get_statistics()

        assert stats["total_files"] == 2
        assert FileType.TEXT.value in stats["by_type"]
        assert FileType.IMAGE.value in stats["by_type"]
        assert stats["total_extracted_chars"] > 0

    # Edge Cases

    def test_process_empty_text_file(self, processor, tmp_path):
        """Test processing empty text file"""
        empty_file = tmp_path / "empty.txt"
        empty_file.write_text("")

        evidence = processor.process_file(str(empty_file))

        assert evidence.extracted_text == ""
        assert evidence.ocr_confidence == 1.0

    def test_process_binary_text_file(self, processor, tmp_path):
        """Test text file with binary content"""
        binary_file = tmp_path / "binary.txt"
        binary_file.write_bytes(b"\x00\x01\x02\x03")

        # Should handle binary gracefully
        evidence = processor.process_file(str(binary_file))
        assert evidence.file_type == FileType.TEXT

    def test_multiple_files_same_id(self, processor, temp_text_file):
        """Test processing multiple files with same ID (overwrite)"""
        evidence1 = processor.process_file(temp_text_file, file_id="same_id")
        evidence2 = processor.process_file(temp_text_file, file_id="same_id")

        # Second should overwrite first
        stats = processor.get_statistics()
        assert stats["total_files"] == 1

    def test_file_hash_generation(self, processor, temp_text_file):
        """Test that file hash is generated"""
        evidence = processor.process_file(temp_text_file)

        assert evidence.file_hash
        assert len(evidence.file_hash) == 64  # SHA-256 hash length

    def test_timestamp_accuracy(self, processor, temp_text_file):
        """Test that processed timestamp is accurate"""
        before = datetime.now()
        evidence = processor.process_file(temp_text_file)
        after = datetime.now()

        assert before <= evidence.processed_at <= after

    def test_concurrent_processing(self, processor, tmp_path):
        """Test processing multiple files in sequence"""
        files = []
        for i in range(5):
            f = tmp_path / f"file{i}.txt"
            f.write_text(f"Content {i}")
            files.append(str(f))

        results = []
        for file_path in files:
            evidence = processor.process_file(file_path, file_id=f"file{len(results)}")
            results.append(evidence)

        assert len(results) == 5
        assert all(isinstance(e, ExtractedEvidence) for e in results)

    def test_searchable_content_generation(self, processor, temp_text_file):
        """Test that searchable content includes all text"""
        evidence = processor.process_file(temp_text_file, file_id="test1")

        # Search should find content
        results = processor.search("Test document")
        assert len(results) > 0

        # Metadata should also be searchable
        if evidence.metadata:
            for key, value in evidence.metadata.items():
                if isinstance(value, str) and len(value) > 3:
                    results = processor.search(value[:10])
                    # May or may not find depending on content
                    # Just checking it doesn't error


# Run with: pytest backend/tests/test_evidence_processor.py -v

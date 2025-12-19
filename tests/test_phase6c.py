import os
import sys
from unittest.mock import patch, MagicMock
sys.path.insert(0, os.path.abspath('.'))
sys.path.insert(0, os.path.abspath('backend'))

from dotenv import load_dotenv
from test_config import setup_test_environment

load_dotenv()
setup_test_environment()

from fastapi.testclient import TestClient
from fastapi import FastAPI

# Mock the services before importing anything
mock_ai_service = MagicMock()
mock_ai_service.semantic_search.return_value = [
    {"id": "doc1", "similarity": 0.9, "content": "test content", "metadata": {}}
]
mock_ai_service.add_document.return_value = True

mock_evidence_processor = MagicMock()
mock_evidence_processor.process_files_batch.return_value = [
    MagicMock(metadata={}, extracted_text="test text", quality_score=0.8, key_entities=[])
]

# Patch at the source
with patch('backend.app.services.ai.ai_service.ai_service', mock_ai_service), \
     patch('backend.app.services.intelligence.evidence_service.evidence_processor', mock_evidence_processor):

    # Import the advanced_ai router which contains the RAG endpoints
    from backend.app.routers.advanced_ai import router as advanced_ai_router

    app = FastAPI()
    app.include_router(advanced_ai_router, prefix="/api/v1")
    client = TestClient(app)


def test_rag_add():
    payload = {'doc_id': 'doc-456', 'text': 'Sample document content'}
    r = client.post('/api/v1/advanced-ai/rag/add', data=payload)  # Use data instead of json for Form data
    assert r.status_code == 200
    body = r.json()
    assert body.get('success') is True
    assert body.get('doc_id') == 'doc-456'


def test_local_rag():
    payload = {'query': 'what is the meaning of life?', 'k': 3}
    r = client.post('/api/v1/advanced-ai/rag/query', json=payload)
    assert r.status_code == 200
    body = r.json()
    assert 'results' in body
    assert isinstance(body['results'], list)


def test_analyze_text():
    payload = {'text': 'I love sunny days!'}
    r = client.post('/api/v1/advanced-ai/multimodal/text', data=payload)  # Use data instead of json for Form data
    assert r.status_code == 200
    body = r.json()
    assert 'sentiment_score' in body  # Check that sentiment_score exists
    assert 'entities' in body  # Check that entities exists
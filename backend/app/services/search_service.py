
import logging

logger = logging.getLogger(__name__)

class EvidenceSearchIndex:
    """
    Mock Evidence Search Index service to allow backend startup.
    Required by evidence_service.py
    """
    def index_evidence(self, file_id, file_path, processing_dict):
        logger.info(f"Indexing evidence {file_id} from {file_path}")
        return True

evidence_search_index = EvidenceSearchIndex()
search_service = evidence_search_index # Alias if needed

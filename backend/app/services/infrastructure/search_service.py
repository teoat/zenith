import json
import logging
import os
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class EvidenceSearchIndex:
    """Search index for processed evidence content"""

    def __init__(self, db_path: str = "data/evidence_index.db"):
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self._init_db()

    def _init_db(self):
        """Initialize the search index database"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS evidence_index (
                    id INTEGER PRIMARY KEY,
                    evidence_id TEXT UNIQUE,
                    file_path TEXT,
                    content TEXT,
                    extracted_text TEXT,
                    key_entities TEXT,  -- JSON
                    metadata TEXT,      -- JSON
                    indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    file_type TEXT,
                    quality_score REAL,
                    sentiment_score REAL
                )
            """
            )

            # Create FTS (Full Text Search) virtual table for content
            conn.execute(
                """
                CREATE VIRTUAL TABLE IF NOT EXISTS evidence_fts USING fts5(
                    evidence_id, content, extracted_text, key_entities,
                    content=evidence_index, content_rowid=rowid
                )
            """
            )

            # Create triggers to keep FTS table in sync
            conn.execute(
                """
                CREATE TRIGGER IF NOT EXISTS evidence_index_insert
                AFTER INSERT ON evidence_index
                BEGIN
                    INSERT INTO evidence_fts(rowid, evidence_id, content, extracted_text, key_entities)
                    VALUES (new.rowid, new.evidence_id, new.content, new.extracted_text, new.key_entities);
                END
            """
            )

            conn.execute(
                """
                CREATE TRIGGER IF NOT EXISTS evidence_index_delete
                AFTER DELETE ON evidence_index
                BEGIN
                    DELETE FROM evidence_fts WHERE rowid = old.rowid;
                END
            """
            )

            conn.execute(
                """
                CREATE TRIGGER IF NOT EXISTS evidence_index_update
                AFTER UPDATE ON evidence_index
                BEGIN
                    UPDATE evidence_fts SET
                        evidence_id = new.evidence_id,
                        content = new.content,
                        extracted_text = new.extracted_text,
                        key_entities = new.key_entities
                    WHERE rowid = new.rowid;
                END
            """
            )

    def index_evidence(
        self, evidence_id: str, file_path: str, processing_result: Dict[str, Any]
    ):
        """Index processed evidence for search"""
        try:
            content = processing_result.get("extracted_text", "")
            key_entities = json.dumps(processing_result.get("key_entities", []))
            metadata = json.dumps(processing_result.get("metadata", {}))
            file_type = processing_result.get("file_type", "")
            quality_score = processing_result.get("quality_score", 0.0)
            sentiment_score = processing_result.get("sentiment_score", 0.0)

            with sqlite3.connect(self.db_path) as conn:
                conn.execute(
                    """
                    INSERT OR REPLACE INTO evidence_index
                    (evidence_id, file_path, content, extracted_text, key_entities,
                     metadata, file_type, quality_score, sentiment_score)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                    (
                        evidence_id,
                        file_path,
                        content,
                        content,
                        key_entities,
                        metadata,
                        file_type,
                        quality_score,
                        sentiment_score,
                    ),
                )

            logger.info(f"Indexed evidence {evidence_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to index evidence {evidence_id}: {e}")
            return False

    def search_evidence(
        self, query: str, limit: int = 20, filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search indexed evidence"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                # Build search query
                sql = """
                    SELECT e.evidence_id, e.file_path, e.extracted_text, e.key_entities,
                           e.metadata, e.file_type, e.quality_score, e.sentiment_score,
                           e.indexed_at, fts.rank
                    FROM evidence_index e
                    JOIN evidence_fts fts ON e.rowid = fts.rowid
                    WHERE evidence_fts MATCH ?
                """

                params = [query]

                # Add filters
                if filters:
                    if "file_type" in filters:
                        sql += " AND e.file_type = ?"
                        params.append(filters["file_type"])

                    if "min_quality" in filters:
                        sql += " AND e.quality_score >= ?"
                        params.append(filters["min_quality"])

                    if "min_sentiment" in filters:
                        sql += " AND e.sentiment_score >= ?"
                        params.append(filters["min_sentiment"])

                sql += " ORDER BY fts.rank LIMIT ?"
                params.append(limit)

                cursor = conn.execute(sql, params)
                results = []

                for row in cursor:
                    (
                        evidence_id,
                        file_path,
                        extracted_text,
                        key_entities,
                        metadata,
                        file_type,
                        quality_score,
                        sentiment_score,
                        indexed_at,
                        rank,
                    ) = row

                    results.append(
                        {
                            "evidence_id": evidence_id,
                            "file_path": file_path,
                            "extracted_text": extracted_text,
                            "key_entities": (
                                json.loads(key_entities) if key_entities else []
                            ),
                            "metadata": json.loads(metadata) if metadata else {},
                            "file_type": file_type,
                            "quality_score": quality_score,
                            "sentiment_score": sentiment_score,
                            "indexed_at": indexed_at,
                            "relevance_score": rank,
                        }
                    )

                return results

        except Exception as e:
            logger.error(f"Search failed: {e}")
            return []

    def get_evidence_stats(self) -> Dict[str, Any]:
        """Get statistics about indexed evidence"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute(
                    """
                    SELECT
                        COUNT(*) as total_documents,
                        COUNT(CASE WHEN file_type LIKE 'image/%' THEN 1 END) as image_count,
                        COUNT(CASE WHEN file_type LIKE 'application/pdf' THEN 1 END) as pdf_count,
                        AVG(quality_score) as avg_quality,
                        AVG(sentiment_score) as avg_sentiment,
                        MAX(indexed_at) as last_indexed
                    FROM evidence_index
                """
                )

                row = cursor.fetchone()
                return {
                    "total_documents": row[0] or 0,
                    "image_count": row[1] or 0,
                    "pdf_count": row[2] or 0,
                    "avg_quality_score": row[3] or 0.0,
                    "avg_sentiment_score": row[4] or 0.0,
                    "last_indexed": row[5],
                }

        except Exception as e:
            logger.error(f"Failed to get stats: {e}")
            return {}

    def delete_evidence(self, evidence_id: str) -> bool:
        """Remove evidence from index"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute(
                    "DELETE FROM evidence_index WHERE evidence_id = ?", (evidence_id,)
                )
            logger.info(f"Deleted evidence {evidence_id} from index")
            return True
        except Exception as e:
            logger.error(f"Failed to delete evidence {evidence_id}: {e}")
            return False


# Global instance
evidence_search_index = EvidenceSearchIndex()

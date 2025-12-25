
import logging
from typing import Dict, List, Optional, Any
from sqlalchemy import text
from sqlalchemy.orm import Session
from datetime import datetime

logger = logging.getLogger(__name__)

class EvidenceService:
    def get_evidence_paginated(
        self,
        db: Session,
        page: int = 1,
        page_size: int = 20,
        project_id: Optional[str] = None,
        case_id: Optional[str] = None,
        file_type: Optional[str] = None,
        search_query: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get list of evidence items with pagination and search
        """
        try:
            # Base filters
            filters = ["1=1"]
            params = {}

            if project_id:
                filters.append("e.case_id IN (SELECT id FROM cases WHERE project_id = :project_id)")
                params["project_id"] = project_id

            if case_id:
                filters.append("e.case_id = :case_id")
                params["case_id"] = case_id

            if file_type:
                filters.append("e.file_type = :file_type")
                params["file_type"] = file_type

            if search_query:
                filters.append("(e.filename ILIKE :q OR e.uploaded_by ILIKE :q)")
                params["q"] = f"%{search_query}%"

            where_clause = " AND ".join(filters)

            # Count total - ensure safe parameterization
            count_query = f"SELECT count(*) FROM evidence e WHERE {where_clause}"
            total = db.execute(text(count_query), params).scalar()

            # Get Page
            offset = (page - 1) * page_size
            # Ensure where_clause is safe (built from validated filters above)
            data_query = f"""
                SELECT e.id, e.case_id, e.filename, e.file_path,
                       e.file_type, e.file_category, e.size_bytes, e.uploaded_at, e.uploaded_by,
                       e.processed_at, e.processing_status, e.hash, e.ocr_text, e.extracted_text,
                        e.sentiment_score, e.is_admissible, e.fraud_amount, e.customer_name,
                        e.quality_score, e.relevance_score, e.evidence_metadata, e.evidence_tags
                FROM evidence e
                WHERE {where_clause}
                ORDER BY e.uploaded_at DESC
                LIMIT :limit OFFSET :offset
            """
            params["limit"] = page_size
            params["offset"] = offset

            result = db.execute(text(data_query), params)
            rows = result.fetchall()

            evidence_list = []
            for row in rows:
                evidence_list.append(
                    {
                        "id": row.id,
                        "caseId": row.case_id,
                        "fileName": row.filename,
                        "fileType": row.file_type,
                        "sizeBytes": row.size_bytes,
                        "uploadedAt": (
                            str(row.uploaded_at) if row.uploaded_at else None
                        ),
                        "filePath": row.file_path,
                        "ocrText": row.extracted_text,
                        "fraudAmount": row.fraud_amount,
                        "customerName": row.customer_name,
                        "processingStatus": row.processing_status
                    }
                )

            return {
                "items": evidence_list,
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size
            }

        except Exception as e:
            logger.error(f"Failed to get evidence: {str(e)}")
            raise e

    def get_evidence_metadata(self, db: Session, evidence_id: str) -> Optional[Dict[str, Any]]:
        """Get evidence metadata by ID"""
        query = "SELECT evidence_metadata FROM evidence WHERE id = :id"
        result = db.execute(text(query), {"id": evidence_id}).fetchone()
        
        if not result:
            return None
            
        return result.evidence_metadata

    def delete_evidence(self, db: Session, evidence_ids: List[str]) -> int:
        """Bulk delete evidence records"""
        if not evidence_ids:
            return 0
            
        # Count records first
        check_query = text("SELECT COUNT(*) FROM evidence WHERE id IN :ids")
        count = db.execute(check_query, {"ids": tuple(evidence_ids)}).scalar()
        
        # Delete
        delete_query = text("DELETE FROM evidence WHERE id IN :ids")
        db.execute(delete_query, {"ids": tuple(evidence_ids)})
        
        db.commit()
        return count

evidence_service = EvidenceService()

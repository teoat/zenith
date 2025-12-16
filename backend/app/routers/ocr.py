"""
OCR and Document Processing API
Endpoints for evidence document processing
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
from app.services.ocr.document_processor import (
    document_processor, receipt_processor, invoice_processor
)

router = APIRouter()

@router.post('/process')
async def process_document(file: UploadFile = File(...)):
    """
    Process uploaded document (PDF, image, text)
    Extracts text, metadata, and entities
    """
    try:
        contents = await file.read()
        
        result = await document_processor.process_document(
            contents,
            file.filename or 'unknown'
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@router.post('/process/receipt')
async def process_receipt(file: UploadFile = File(...)):
    """
    Process receipt image/PDF
    Extracts structured receipt data
    """
    try:
        contents = await file.read()
        return await receipt_processor.process_receipt(contents, file.filename or 'receipt')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Receipt processing failed: {str(e)}")

@router.post('/process/invoice')
async def process_invoice(file: UploadFile = File(...)):
    """
    Process invoice document
    Extracts structured invoice data
    """
    try:
        contents = await file.read()
        return await invoice_processor.process_invoice(contents, file.filename or 'invoice')
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Invoice processing failed: {str(e)}")

@router.post('/batch-process')
async def batch_process_documents(files: List[UploadFile] = File(...)):
    """
    Process multiple documents in batch
    """
    results = []
    
    for file in files:
        try:
            contents = await file.read()
            result = await document_processor.process_document(contents, file.filename or 'unknown')
            results.append(result)
        except Exception as e:
            results.append({
                "success": False,
                "filename": file.filename,
                "error": str(e)
            })
    
    return {
        "total": len(results),
        "successful": sum(1 for r in results if r.get("success")),
        "failed": sum(1 for r in results if not r.get("success")),
        "results": results
    }

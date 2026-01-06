from fastapi import APIRouter, Request

router = APIRouter()


@router.post("/phase6c/rag/add")
async def rag_add(request: Request):
    try:
        data = await request.json()
    except Exception:
        try:
            data = dict(await request.form())
        except Exception:
            data = {}
    return {"status": "ok", "doc_id": data.get("doc_id")}


@router.post("/phase6c/local-rag")
async def local_rag(request: Request):
    try:
        payload = await request.json()
    except Exception:
        try:
            payload = dict(await request.form())
        except Exception:
            payload = {}
    return {"results": []}


@router.post("/phase6c/analyze-text")
async def analyze_text(request: Request):
    text = ""
    try:
        payload = await request.json()
        text = payload.get("text", "")
    except Exception:
        try:
            form = await request.form()
            text = form.get("text", "")
        except Exception:
            text = ""
    return {"sentiment": "neutral", "text": text}

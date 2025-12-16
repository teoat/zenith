import asyncio
import glob
import os
import sys

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))

from backend.app.services.ai_service import AIService

KNOWLEDGE_BASE_DIR = "backend/app/plugins/knowledge_base"


async def ingest_knowledge_base():
    print(f"🚀 Starting ingestion from {KNOWLEDGE_BASE_DIR}...")
    ai = AIService()
    await ai.initialize()

    # Find all markdown files
    md_files = glob.glob(os.path.join(KNOWLEDGE_BASE_DIR, "**/*.md"), recursive=True)

    if not md_files:
        print("❌ No markdown files found!")
        return

    print(f"Found {len(md_files)} documents.")

    for file_path in md_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            # ID is relative path without extension, e.g., "typologies/aml/layering"
            rel_path = os.path.relpath(file_path, KNOWLEDGE_BASE_DIR)
            doc_id = os.path.splitext(rel_path)[0]

            metadata = {
                "source": "knowledge_base",
                "type": "typology",
                "filename": os.path.basename(file_path),
                "category": os.path.basename(os.path.dirname(file_path)),
            }

            print(f"Processing: {doc_id}...")
            await ai.add_document(doc_id, content, metadata)
            print("  ✅ Indexed")

        except Exception as e:
            print(f"  ❌ Error processing {file_path}: {e}")

    print("\n🎉 Ingestion Complete!")


if __name__ == "__main__":
    asyncio.run(ingest_knowledge_base())

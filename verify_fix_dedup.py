import sys
import os
import tempfile
# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from app.services.evidence_processor import MultiModalProcessor
except ImportError as e:
    print(f"Import failed: {e}")
    # Try alternate path if running from root
    sys.path.append(os.getcwd())
    from backend.app.services.evidence_processor import MultiModalProcessor

def verify_fix():
    print("Verifying deduplication fix...")
    processor = MultiModalProcessor()
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        f.write("Test content")
        data_path = f.name
        
    try:
        # Process file twice with same ID
        print("Processing file 1...")
        processor.process_file(data_path, file_id="unique_id_1")
        
        print("Processing file 2 (same ID)...")
        processor.process_file(data_path, file_id="unique_id_1")
        
        stats = processor.get_statistics()
        count = stats['total_files']
        print(f"Total files in stats: {count}")
        
        if count == 1:
            print("✅ PASS: Deduplication Logic Verified")
        else:
            print(f"❌ FAIL: Expected 1 file, found {count}")
            exit(1)
            
    finally:
        if os.path.exists(data_path):
            os.unlink(data_path)

if __name__ == "__main__":
    verify_fix()

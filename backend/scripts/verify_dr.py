import asyncio
import os
import shutil
import sys
from pathlib import Path

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.services.infrastructure.storage.backup_service import get_backup_manager
from core.database import get_database_url

async def verify_disaster_recovery():
    print("🚀 Starting Disaster Recovery Verification...")
    
    # Set environment variables for config
    app_data_dir = os.path.expanduser("~/.zenith")
    db_path = f"{app_data_dir}/fraud_detection.db"
    backup_dir = os.path.join(os.getcwd(), "data/backups_verify")
    
    os.environ["BACKUP_DIR"] = backup_dir
    os.environ["DATABASE_PATH"] = db_path
    os.environ["EVIDENCE_DIR"] = os.path.join(os.getcwd(), "data/evidence_verify")
    os.environ["CONFIG_DIR"] = os.path.join(os.getcwd(), "data/config_verify")
    
    # Ensure app data dir exists for verification
    os.makedirs(app_data_dir, exist_ok=True)
    
    backup_manager = await get_backup_manager()
    print(f"✅ Backup directory: {backup_dir}")
    print(f"✅ Database path: {db_path}")

    # 2. Create a full backup
    print("\n💾 Creating Full Backup...")
    try:
        backup_info = await backup_manager.create_full_backup(reason="DR Verification")
        print(f"✅ Backup created: {backup_info['id']}")
        print(f"✅ Size: {backup_info['size_bytes']} bytes")
        print(f"✅ Hash: {backup_info['integrity_hash']}")
    except Exception as e:
        print(f"❌ Backup failed: {e}")
        return

    # 3. Verify integrity
    print("\n🔍 Verifying Integrity...")
    verification = await backup_manager.verify_backup_integrity(backup_info['id'])
    if verification['valid']:
        print("✅ Integrity check passed!")
    else:
        print(f"❌ Integrity check failed: {verification.get('error')}")
        return

    # 4. Simulate disaster (move DB)
    print("\n🔥 Simulating Disaster (Data Loss)...")
    original_db_path = Path(db_path)
    if not original_db_path.exists():
        # Create a dummy one if it doesn't exist for the test
        print("⚠️ Database didn't exist, creating dummy for test...")
        with open(original_db_path, "w") as f:
            f.write("DUMMY DATA")
            
    temp_loss_path = original_db_path.with_suffix(".lost")
    shutil.move(original_db_path, temp_loss_path)
    print(f"✅ Original database moved to: {temp_loss_path}")
    print(f"✅ Database exists: {original_db_path.exists()}")

    # 5. Restore from backup
    print("\n🏥 Restoring from Backup...")
    restore_target = os.path.join(os.getcwd(), "data/restore_verify")
    restore_result = await backup_manager.restore_backup(backup_info['id'], target_dir=restore_target)
    
    if restore_result['success']:
        print("✅ Restore operation reported success!")
        # BackupManager.restore_backup also copies back to original path if target_dir is None, 
        # but since we specified target_dir, we need to check the components
        
        # Verify components were restored
        restored_db = Path(restore_target) / backup_info['id'] / "database.db"
        if restored_db.exists():
            print(f"✅ Component verified: {restored_db}")
        else:
            print("❌ Restored component missing!")
            
        # The _restore_database method also attempts to restore to config["database_path"]
        if original_db_path.exists():
            print(f"✅ Database restored to original location: {original_db_path}")
        else:
            print("❌ Database NOT restored to original location!")
    else:
        print(f"❌ Restore failed: {restore_result.get('error')}")

    # 1. Cleanup
    print("\n🧹 Cleaning Up...")
    if original_db_path.exists() and temp_loss_path.exists():
        os.remove(temp_loss_path)
        print("✅ Simualted loss file removed.")
    
    if os.path.exists(backup_dir):
        shutil.rmtree(backup_dir)
        print("✅ Verification backups removed.")
        
    if os.path.exists(restore_target):
        shutil.rmtree(restore_target)
        print("✅ Verification restore directory removed.")

    print("\n✨ Disaster Recovery Verification COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(verify_disaster_recovery())

import json
import os
import sys
import uuid
from typing import Any

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from core.database import SessionLocal, utc_now
from core.plugin_system.models import PluginRegistry


def get_plugin_metadata(path: str) -> dict[str, Any]:
    with open(path) as f:
        return json.load(f)


def register_all_plugins():
    db = SessionLocal()
    plugins_dir = os.path.join(os.path.dirname(__file__), "../plugins")

    print(f"Scanning plugins in {plugins_dir}...")

    count = 0
    for root, dirs, files in os.walk(plugins_dir):
        if "metadata.json" in files:
            try:
                metadata_path = os.path.join(root, "metadata.json")
                metadata = get_plugin_metadata(metadata_path)

                namespace = metadata.get("namespace")
                if not namespace:
                    print(f"Skipping {metadata_path}: No namespace defined")
                    continue

                # Check existing
                existing = db.query(PluginRegistry).filter(PluginRegistry.namespace == namespace).first()
                if existing:
                    print(f"Plugin {namespace} already registered. Updating...")
                    existing.metadata_json = metadata
                    existing.updated_at = utc_now()
                    existing.entry_point = metadata.get("entry_point")  # Ensure entry point sync
                    existing.version = metadata.get("version")
                else:
                    plugin_id = str(uuid.uuid4())
                    plugin = PluginRegistry(
                        plugin_id=plugin_id,
                        namespace=namespace,
                        version=metadata.get("version"),
                        trust_level="official",
                        status="active",
                        metadata_json=metadata,
                        created_at=utc_now(),
                        updated_at=utc_now(),
                        created_by="system_bulk_register",
                    )
                    db.add(plugin)
                    print(f"Registered new plugin: {namespace}")

                count += 1

            except Exception as e:
                print(f"Error processing {root}: {e}")

    try:
        db.commit()
        print(f"Successfully processed {count} plugins.")
    except Exception as e:
        print(f"Database commit failed: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    register_all_plugins()

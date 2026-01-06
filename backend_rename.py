#!/usr/bin/env python3
"""
Backend-focused rename script for Zenith to Zenith
"""

import json
import os


def replace_in_file(filepath, replacements):
    """Replace multiple strings in a file"""
    try:
        with open(filepath, encoding="utf-8", errors="ignore") as file:
            content = file.read()

        original_content = content
        for old_text, new_text in replacements.items():
            content = content.replace(old_text, new_text)

        if content != original_content:
            with open(filepath, "w", encoding="utf-8") as file:
                file.write(content)
            return True
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
    return False


def update_json_file(filepath, key_replacements):
    """Update JSON file with key replacements"""
    try:
        with open(filepath, encoding="utf-8") as file:
            data = json.load(file)

        def update_dict(obj):
            if isinstance(obj, dict):
                for key, value in obj.items():
                    if key in key_replacements:
                        obj[key_replacements[key]] = obj.pop(key)
                    else:
                        update_dict(value)
            elif isinstance(obj, list):
                for item in obj:
                    update_dict(item)
            elif isinstance(obj, str):
                for old_key in key_replacements:
                    if obj == old_key:
                        # This is tricky for JSON values, skip for now
                        pass

        update_dict(data)

        with open(filepath, "w", encoding="utf-8") as file:
            json.dump(data, file, indent=2)

        return True
    except Exception as e:
        print(f"Error updating JSON {filepath}: {e}")
    return False


def main():
    # Backend files to update
    backend_files = [
        "/Users/Arief/Desktop/Zenith/backend/main.py",
        "/Users/Arief/Desktop/Zenith/backend/core/logging.py",
        "/Users/Arief/Desktop/Zenith/backend/core/database.py",
        "/Users/Arief/Desktop/Zenith/backend/core/api_documentation.py",
        "/Users/Arief/Desktop/Zenith/backend/scripts/seed_demo.py",
        "/Users/Arief/Desktop/Zenith/backend/scripts/seed_data.py",
        "/Users/Arief/Desktop/Zenith/backend/scripts/seed_e2e_user.py",
        "/Users/Arief/Desktop/Zenith/backend/scripts/generate_audit_keys.py",
        "/Users/Arief/Desktop/Zenith/backend/scripts/verify_dr.py",
        "/Users/Arief/Desktop/Zenith/backend/scripts/rotate_audit_key.py",
        "/Users/Arief/Desktop/Zenith/backend/scripts/postgresql_migration.py",
        "/Users/Arief/Desktop/Zenith/backend/scripts/test_all.sh",
        "/Users/Arief/Desktop/Zenith/backend/scripts/run_tests.sh",
    ]

    # Text replacements
    replacements = {
        "Zenith Fraud Detection API": "Zenith Fraud Detection API",
        "Zenith API": "Zenith API",
        "~/.Zenith": "~/.zenith",
        "investigator@Zenith.com": "investigator@zenith.com",
        "analyst@Zenith.com": "analyst@zenith.com",
        "investigator1@Zenith.com": "investigator1@zenith.com",
        "analyst1@Zenith.com": "analyst1@zenith.com",
        "analyst2@Zenith.com": "analyst2@zenith.com",
        "Zenith_fraud_detection": "zenith_fraud_detection",
        "staging.Zenith.com": "staging.zenith.com",
        "https://github.com/Zenith/fraud-detection": "https://github.com/zenith/fraud-detection",
    }

    print("Starting backend rename from Zenith to Zenith...")
    files_processed = 0

    # Update text files
    for filepath in backend_files:
        if os.path.exists(filepath) and replace_in_file(filepath, replacements):
            files_processed += 1
            print(f"✓ Updated: {os.path.basename(filepath)}")

    # Update plugin metadata files
    plugin_dir = "/Users/Arief/Desktop/Zenith/backend/plugins/Zenith"
    if os.path.exists(plugin_dir):
        for root, dirs, files in os.walk(plugin_dir):
            for file in files:
                if file == "metadata.json":
                    filepath = os.path.join(root, file)
                    json_replacements = {
                        "Zenith/": "zenith/",
                        "Zenith Team": "Zenith Team",
                    }
                    if update_json_file(filepath, json_replacements):
                        files_processed += 1
                        print(f"✓ Updated JSON: {os.path.relpath(filepath)}")

    print(f"\nCompleted! Processed {files_processed} backend files.")

    # Run validation check
    print("\nRunning validation check...")
    os.chdir("/Users/Arief/Desktop/Zenith")
    result = os.popen(
        "python scripts/documentation/validate_docs.py 2>/dev/null | tail -5"
    ).read()
    print(result)


if __name__ == "__main__":
    main()

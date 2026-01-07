#!/usr/bin/env python3
"""
Bulk find and replace script for renaming Zenith to Zenith
"""

import glob
import os


def find_replace_in_file(filepath, old_text, new_text):
    """Replace text in a file"""
    try:
        with open(filepath, encoding="utf-8", errors="ignore") as file:
            content = file.read()

        if old_text in content:
            new_content = content.replace(old_text, new_text)
            with open(filepath, "w", encoding="utf-8") as file:
                file.write(new_content)
            return True
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
    return False


def bulk_replace(root_dir, replacements):
    """Perform bulk replacements across all files"""
    total_files_processed = 0
    total_replacements = 0

    # File extensions to process
    extensions = [
        "*.py",
        "*.js",
        "*.ts",
        "*.tsx",
        "*.json",
        "*.md",
        "*.html",
        "*.yml",
        "*.yaml",
        "*.toml",
        "*.cfg",
        "*.ini",
        "*.txt",
    ]

    for ext in extensions:
        pattern = os.path.join(root_dir, "**", ext)
        files = glob.glob(pattern, recursive=True)

        for filepath in files:
            # Skip certain directories
            if any(
                skip in filepath
                for skip in [
                    "node_modules",
                    "__pycache__",
                    ".git",
                    "htmlcov",
                    "dist",
                    "build",
                ]
            ):
                continue

            file_changed = False
            for old_text, new_text in replacements.items():
                if find_replace_in_file(filepath, old_text, new_text):
                    file_changed = True
                    total_replacements += 1

            if file_changed:
                total_files_processed += 1
                print(f"Updated: {filepath}")

    return total_files_processed, total_replacements


def main():
    root_dir = "/Users/Arief/Desktop/Zenith"

    # Define replacements
    replacements = {
        # Domain references
        "api.zenith.com": "api.zenith.com",
        "app.zenith.com": "app.zenith.com",
        "docs.zenith.com": "docs.zenith.com",
        # Email addresses
        "support@zenith.com": "support@zenith.com",
        "docs@zenith.com": "docs@zenith.com",
        "admin@zenith.com": "admin@zenith.com",
        "investigator@zenith.com": "investigator@zenith.com",
        "analyst@zenith.com": "analyst@zenith.com",
        # Database paths
        "~/.zenith/": "~/.zenith/",
        "zenith_fraud_detection": "zenith_fraud_detection",
        "zenithLocalDB": "zenithLocalDB",
        # Plugin namespaces
        "zenith/workflow/": "zenith/workflow/",
        "zenith/ui/": "zenith/ui/",
        "zenith/intelligence/": "zenith/intelligence/",
        "zenith/integration/": "zenith/integration/",
        "zenith/infrastructure/": "zenith/infrastructure/",
        "zenith/detection/": "zenith/detection/",
        # Project references
        "Zenith Fraud Detection": "Zenith Fraud Detection",
        "Zenith Forensic Engine": "Zenith Forensic Engine",
        "Zenith Platform": "Zenith Platform",
        # Authentication
        '"iss": "zenith"': '"iss": "zenith"',
        '"aud": "zenith-api"': '"aud": "zenith-api"',
        'issuer_name="Zenith Fraud Platform"': 'issuer_name="Zenith Fraud Platform"',
    }

    print("Starting bulk replacement of Zenith → Zenith...")
    files_processed, replacements_made = bulk_replace(root_dir, replacements)

    print("\nCompleted!")
    print(f"Files processed: {files_processed}")
    print(f"Total replacements: {replacements_made}")

    # Run validation to check progress
    print("\nRunning validation...")
    os.system(
        "cd /Users/Arief/Desktop/Zenith && python scripts/documentation/validate_docs.py 2>/dev/null | tail -10"
    )


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Targeted rename script for remaining critical files
"""

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


def main():
    # Critical remaining files to update
    critical_files = [
        "/Users/Arief/Desktop/Zenith/pyproject.toml",
        "/Users/Arief/Desktop/Zenith/README.md",
        "/Users/Arief/Desktop/Zenith/CONTRIBUTING.md",
        "/Users/Arief/Desktop/Zenith/backend/alembic.ini",
        "/Users/Arief/Desktop/Zenith/.python-version",
        "/Users/Arief/Desktop/Zenith/requirements.txt",
        "/Users/Arief/Desktop/Zenith/mcp-server/package.json",
        "/Users/Arief/Desktop/Zenith/frontend/package.json",  # Already updated but double-check
        "/Users/Arief/Desktop/Zenith/package.json",  # Already updated but double-check
    ]

    # Additional files that might have references
    additional_files = [
        "/Users/Arief/Desktop/Zenith/docker-compose.yml",
        "/Users/Arief/Desktop/Zenith/Dockerfile",
        "/Users/Arief/Desktop/Zenith/infrastructure/terraform/main.tf",
        "/Users/Arief/Desktop/Zenith/.github/workflows/ci.yml",
        "/Users/Arief/Desktop/Zenith/.github/workflows/docs.yml",
    ]

    all_files = critical_files + additional_files

    # Key replacements
    replacements = {
        "Zenith": "zenith",
        "Zenith": "Zenith",  # Title case
        "api.Zenith.com": "api.zenith.com",
        "app.Zenith.com": "app.zenith.com",
        "docs.Zenith.com": "docs.zenith.com",
        "support@Zenith.com": "support@zenith.com",
        "https://github.com/Zenith": "https://github.com/zenith",
    }

    print("Starting targeted rename for critical remaining files...")
    files_processed = 0

    for filepath in all_files:
        if os.path.exists(filepath):
            if replace_in_file(filepath, replacements):
                files_processed += 1
                print(f"✓ Updated: {os.path.basename(filepath)}")
        else:
            print(f"⚠ Skipped (not found): {os.path.basename(filepath)}")

    print(f"\nCompleted! Processed {files_processed} critical files.")

    # Quick grep to check remaining references
    print("\nChecking for remaining Zenith references in key files...")
    os.system(
        "cd /Users/Arief/Desktop/Zenith && find . -name '*.md' -o -name '*.py' -o -name '*.js' -o -name '*.json' | head -20 | xargs grep -l 'Zenith' 2>/dev/null || echo 'No remaining references found in initial check'"
    )


if __name__ == "__main__":
    main()

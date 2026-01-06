#!/usr/bin/env python3
"""
Final comprehensive rename script for all remaining Zenith references
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


def bulk_replace_remaining(root_dir):
    """Replace all remaining Zenith references"""

    # All remaining replacements needed
    replacements = {
        # Core branding
        "Zenith": "Zenith",  # Ensure all variants
        # Specific contexts that need special handling
        "Zenith Fraud Detection Platform": "Zenith Fraud Detection Platform",
        "Zenith Fraud Detection": "Zenith Fraud Detection",
        "Zenith Platform": "Zenith Platform",
        "Zenith Forensic Engine": "Zenith Forensic Engine",
        "Zenith Documentation": "Zenith Documentation",
        "Zenith team": "Zenith team",
        # Domains and URLs
        "api.Zenith.com": "api.zenith.com",
        "app.Zenith.com": "app.zenith.com",
        "docs.Zenith.com": "docs.zenith.com",
        "dashboard.Zenith.com": "dashboard.zenith.com",
        "support.Zenith.com": "support.zenith.com",
        "community.Zenith.com": "community.zenith.com",
        "status.Zenith.com": "status.zenith.com",
        "download.Zenith.com": "download.zenith.com",
        # Email addresses
        "support@Zenith.com": "support@zenith.com",
        "docs@Zenith.com": "docs@zenith.com",
        "admin@Zenith.com": "admin@zenith.com",
        "investigator@Zenith.com": "investigator@zenith.com",
        "analyst@Zenith.com": "analyst@zenith.com",
        "project-updates@Zenith.com": "project-updates@zenith.com",
        "executive-reports@Zenith.com": "executive-reports@zenith.com",
        "success@Zenith.com": "success@zenith.com",
        "security@Zenith.com": "security@zenith.com",
        "devops@Zenith.com": "devops@zenith.com",
        "cto@Zenith.com": "cto@zenith.com",
        "management@Zenith.com": "management@zenith.com",
        "legal@Zenith.com": "legal@zenith.com",
        "pr@Zenith.com": "pr@zenith.com",
        "hardware-security@Zenith.com": "hardware-security@zenith.com",
        "infra-security@Zenith.com": "infra-security@zenith.com",
        "emergency-hardware@Zenith.com": "emergency-hardware@zenith.com",
        "oncall@Zenith.com": "oncall@zenith.com",
        "escalation@Zenith.com": "escalation@zenith.com",
        "ops-management@Zenith.com": "ops-management@zenith.com",
        "infrastructure@Zenith.com": "infrastructure@zenith.com",
        "doc-team@Zenith.com": "doc-team@zenith.com",
        # Database and storage
        "~/.Zenith/": "~/.zenith/",
        "Zenith_fraud_detection": "zenith_fraud_detection",
        "ZenithLocalDB": "zenithLocalDB",
        # API and authentication
        '"iss": "Zenith"': '"iss": "zenith"',
        '"aud": "Zenith-api"': '"aud": "zenith-api"',
        'issuer_name="Zenith Fraud Platform"': 'issuer_name="Zenith Fraud Platform"',
        "dev-token-Zenith": "dev-token-zenith",
        # GitHub and external references
        "https://github.com/Zenith/fraud-detection": "https://github.com/zenith/fraud-detection",
        "staging.Zenith.com": "staging.zenith.com",
        # Logging and monitoring
        "Zenith -": "Zenith -",
    }

    total_files_processed = 0
    total_replacements = 0

    # File extensions to process (excluding binaries and large files)
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
        "*.sh",
    ]

    for ext in extensions:
        pattern = os.path.join(root_dir, "**", ext)
        try:
            files = glob.glob(pattern, recursive=True)

            for filepath in files:
                # Skip certain directories and files
                skip_patterns = [
                    "node_modules",
                    "__pycache__",
                    ".git",
                    "htmlcov",
                    "dist",
                    "coverage",
                    "monitoring_state.json",
                    "backend_startup.log",
                    "frontend_startup.log",
                    "test_results.json",
                ]

                if any(skip in filepath for skip in skip_patterns):
                    continue

                file_changed = False
                for old_text, new_text in replacements.items():
                    if find_replace_in_file(filepath, old_text, new_text):
                        file_changed = True
                        total_replacements += 1

                if file_changed:
                    total_files_processed += 1
                    print(f"✓ Updated: {os.path.relpath(filepath, root_dir)}")
        except Exception as e:
            print(f"Error with pattern {ext}: {e}")

    return total_files_processed, total_replacements


def main():
    root_dir = "/Users/Arief/Desktop/Zenith"

    print(
        "Starting final comprehensive rename of all remaining Zenith → Zenith references..."
    )
    files_processed, replacements_made = bulk_replace_remaining(root_dir)

    print("\nCompleted!")
    print(f"Files processed: {files_processed}")
    print(f"Total replacements: {replacements_made}")

    # Run final validation
    print("\nRunning final validation...")
    os.chdir(root_dir)
    result = os.popen(
        "python scripts/documentation/validate_docs.py 2>/dev/null | tail -10"
    ).read()
    print(result)

    # Check for remaining Zenith references
    print("\nChecking for any remaining Zenith references...")
    remaining = os.popen(
        "find /Users/Arief/Desktop/Zenith -type f \\( -name '*.py' -o -name '*.js' -o -name '*.ts' -o -name '*.tsx' -o -name '*.json' -o -name '*.md' -o -name '*.html' -o -name '*.yml' -o -name '*.yaml' -o -name '*.toml' -o -name '*.cfg' -o -name '*.ini' -o -name '*.txt' -o -name '*.sh' \\) -exec grep -l 'Zenith' {} \\; 2>/dev/null | head -10"
    ).read()
    if remaining.strip():
        print("Remaining files with Zenith references:")
        print(remaining)
    else:
        print("✅ No remaining Zenith references found in source files!")


if __name__ == "__main__":
    main()

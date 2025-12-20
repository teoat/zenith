#!/usr/bin/env python3
"""
Accelerated rename script for critical Zenith to Zenith changes
"""

import os
import re

def replace_in_file(filepath, replacements):
    """Replace multiple strings in a file"""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as file:
            content = file.read()

        original_content = content
        for old_text, new_text in replacements.items():
            content = content.replace(old_text, new_text)

        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as file:
                file.write(content)
            return True
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
    return False

def main():
    # Critical files to update first
    critical_files = [
        "/Users/Arief/Desktop/Zenith/docs/learn/getting-started/enhanced_quick_start.md",
        "/Users/Arief/Desktop/Zenith/docs/learn/faq_comprehensive.md",
        "/Users/Arief/Desktop/Zenith/docs/operate/security_operations.md",
        "/Users/Arief/Desktop/Zenith/docs/operate/production_operations.md",
        "/Users/Arief/Desktop/Zenith/docs/operate/monitoring.md",
        "/Users/Arief/Desktop/Zenith/docs/api/interactive_documentation.md",
        "/Users/Arief/Desktop/Zenith/docs/features/process-optimization-templates.md",
        "/Users/Arief/Desktop/Zenith/docs/features/team-training-workflow.md",
        "/Users/Arief/Desktop/Zenith/docs/features/feedback-version-system.md",
        "/Users/Arief/Desktop/Zenith/docs/features/search-analytics-system.md",
        "/Users/Arief/Desktop/Zenith/docs/features/advanced-automation-ai.md",
        "/Users/Arief/Desktop/Zenith/docs/features/ux-accessibility-optimization.md",
        "/Users/Arief/Desktop/Zenith/docs/features/final-validation-production-launch.md",
        "/Users/Arief/Desktop/Zenith/docs/COMPREHENSIVE_13_DAY_IMPLEMENTATION_COMPLETION_REPORT.md",
        "/Users/Arief/Desktop/Zenith/docs/SYSTEM_ORCHESTRATION_FRAMEWORK.md",
        "/Users/Arief/Desktop/Zenith/docs/reports/DIAMOND_STANDARD_CERTIFICATION_FINAL.md",
        "/Users/Arief/Desktop/Zenith/docs/hardware-security.md"
    ]

    # Key replacements
    replacements = {
        'Zenith Fraud Detection Platform': 'Zenith Fraud Detection Platform',
        'Zenith Fraud Detection': 'Zenith Fraud Detection',
        'Zenith Platform': 'Zenith Platform',
        'Zenith Forensic Engine': 'Zenith Forensic Engine',
        'Zenith Documentation': 'Zenith Documentation',
        'api.Zenith.com': 'api.zenith.com',
        'app.Zenith.com': 'app.zenith.com',
        'docs.Zenith.com': 'docs.zenith.com',
        'support@Zenith.com': 'support@zenith.com',
        'docs@Zenith.com': 'docs@zenith.com',
        'project-updates@Zenith.com': 'project-updates@zenith.com',
        'executive-reports@Zenith.com': 'executive-reports@zenith.com',
        'success@Zenith.com': 'success@zenith.com',
        'security@Zenith.com': 'security@zenith.com',
        'devops@Zenith.com': 'devops@zenith.com',
        'cto@Zenith.com': 'cto@zenith.com',
        'management@Zenith.com': 'management@zenith.com',
        'legal@Zenith.com': 'legal@zenith.com',
        'pr@Zenith.com': 'pr@zenith.com',
        'hardware-security@Zenith.com': 'hardware-security@zenith.com',
        'infra-security@Zenith.com': 'infra-security@zenith.com',
        'emergency-hardware@Zenith.com': 'emergency-hardware@zenith.com',
        'oncall@Zenith.com': 'oncall@zenith.com',
        'escalation@Zenith.com': 'escalation@zenith.com',
        'ops-management@Zenith.com': 'ops-management@zenith.com',
        'infrastructure@Zenith.com': 'infrastructure@zenith.com',
        'doc-team@Zenith.com': 'doc-team@zenith.com',
        'https://dashboard.Zenith.com': 'https://dashboard.zenith.com',
        'https://support.Zenith.com': 'https://support.zenith.com',
        'https://community.Zenith.com': 'https://community.zenith.com',
        'https://status.Zenith.com': 'https://status.zenith.com',
        'https://download.Zenith.com': 'https://download.zenith.com',
        'Zenith team': 'Zenith team',
        'Zenith': 'Zenith'
    }

    print("Starting accelerated rename of critical documentation files...")
    files_processed = 0

    for filepath in critical_files:
        if os.path.exists(filepath):
            if replace_in_file(filepath, replacements):
                files_processed += 1
                print(f"✓ Updated: {os.path.basename(filepath)}")
        else:
            print(f"⚠ Skipped (not found): {os.path.basename(filepath)}")

    print(f"\nCompleted! Processed {files_processed} critical documentation files.")

    # Quick validation check
    print("\nRunning quick validation check...")
    os.chdir("/Users/Arief/Desktop/Zenith")
    result = os.popen("python scripts/documentation/validate_docs.py 2>/dev/null | tail -5").read()
    print(result)

if __name__ == "__main__":
    main()
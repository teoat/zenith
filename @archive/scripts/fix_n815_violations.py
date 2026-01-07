#!/usr/bin/env python3
"""
Fix N815 mixed case variable errors by converting camelCase to snake_case
Focuses on backend/app/routers/ directory where these errors are most common.
"""

import argparse
import re
from pathlib import Path


def camel_to_snake(name: str) -> str:
    """Convert camelCase to snake_case"""
    # Handle special cases
    special_cases = {
        'caseId': 'case_id',
        'riskScore': 'risk_score',
        'createdAt': 'created_at',
        'updatedAt': 'updated_at',
        'userId': 'user_id',
        'transactionId': 'transaction_id',
        'alertId': 'alert_id',
        'reportId': 'report_id',
        'ruleId': 'rule_id',
        'sessionId': 'session_id',
        'authorId': 'author_id',
        'assigneeId': 'assignee_id',
        'evidenceId': 'evidence_id',
        'jobId': 'job_id',
        'caseIds': 'case_ids',
        'failedIds': 'failed_ids',
        'dueDate': 'due_date',
        'fileName': 'file_name',
        'filePath': 'file_path',
        'fileType': 'file_type',
        'customerName': 'customer_name',
        'merchantName': 'merchant_name',
        'authorName': 'author_name',
        'ipAddress': 'ip_address',
        'userAgent': 'user_agent',
        'deviceFingerprint': 'device_fingerprint',
        'ocrText': 'ocr_text',
        'riskLevel': 'risk_level',
        'totalCases': 'total_cases',
        'openCases': 'open_cases',
        'closedCases': 'closed_cases',
        'criticalCases': 'critical_cases',
        'investigatingCases': 'investigating_cases',
        'activeCases': 'active_cases',
        'resolvedCases': 'resolved_cases',
        'urgentCases': 'urgent_cases',
        'highRiskCases': 'high_risk_cases',
        'flaggedTransactions': 'flagged_transactions',
        'blockedAmount': 'blocked_amount',
        'fraudAmount': 'fraud_amount',
        'flaggedAmount': 'flagged_amount',
        'totalFraudAmount': 'total_fraud_amount',
        'totalVolume': 'total_volume',
        'flaggedVolume': 'flagged_volume',
        'suspiciousFlow': 'suspicious_flow',
        'totalSpend': 'total_spend',
        'burnRate': 'burn_rate',
        'projectedRunway': 'projected_runway',
        'avgResolutionTime': 'avg_resolution_time',
        'avgResolutionTimeDays': 'avg_resolution_time_days',
        'avgResolutionTimeMinutes': 'avg_resolution_time_minutes',
        'daysToResolution': 'days_to_resolution',
        'perPage': 'per_page',
        'totalPages': 'total_pages',
        'totalCount': 'total_count',
        'totalRecords': 'total_records',
        'transactionCount': 'transaction_count',
        'flaggedCount': 'flagged_count',
        'deletedCount': 'deleted_count',
        'activeAlerts': 'active_alerts',
        'activeUsers': 'active_users',
        'predictedFraud': 'predicted_fraud',
        'confirmedFraud': 'confirmed_fraud',
        'falsePositives': 'false_positives',
        'alertsResolved': 'alerts_resolved',
        'riskDistribution': 'risk_distribution',
        'riskTrend': 'risk_trend',
        'recentActivity': 'recent_activity',
        'systemHealth': 'system_health',
        'sparklineData': 'sparkline_data',
        'dataQuality': 'data_quality',
        'matchRate': 'match_rate',
        'casesByStatus': 'cases_by_status',
        'overallProgress': 'overall_progress',
        'completedAt': 'completed_at',
        'generatedAt': 'generated_at',
        'expiresAt': 'expires_at',
        'uploadedAt': 'uploaded_at',
        'nextRunAt': 'next_run_at',
        'lastRunAt': 'last_run_at',
        'lastSyncTime': 'last_sync_time',
        'startDate': 'start_date',
        'endDate': 'end_date',
        'dateRange': 'date_range',
        'reportType': 'report_type',
        'reportUrl': 'report_url',
        'includeSensitiveData': 'include_sensitive_data',
        'estimatedCompletionMinutes': 'estimated_completion_minutes',
        'estimatedPages': 'estimated_pages',
        'ingestionRate': 'ingestion_rate',
        'caseAnalytics': 'case_analytics',
        'isInternal': 'is_internal',
        'componentStack': 'component_stack',
        'errorInfo': 'error_info',
        'extractedTextLength': 'extracted_text_length',
        'keyEntitiesCount': 'key_entities_count',
        'qualityScore': 'quality_score',
        'sentimentScore': 'sentiment_score',
        'sizeBytes': 'size_bytes',
        'evidenceRegionId': 'evidence_region_id',
        'selectedCountry': 'selected_country',
        'selectedDocuments': 'selected_documents',
        'reconciliationType': 'reconciliation_type',
        'selectedCalendarFormat': 'selected_calendar_format',
        'selectedCurrencyFormat': 'selected_currency_format',
        'selectedDecimalFormat': 'selected_decimal_format',
        'proposedFeatures': 'proposed_features',
    }

    # Check special cases first
    if name in special_cases:
        return special_cases[name]

    # Default conversion
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    s2 = re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1)
    return s2.lower()

def find_camelcase_in_content(content: str) -> set[str]:
    """Find camelCase variable names in Python code content"""
    # Common patterns to exclude (these are not variable names we want to change)
    exclude_patterns = {
        'id', 'url', 'html', 'pdf', 'csv', 'api', 'json', 'sql', 'db', 'ui',
        'UX', 'CPU', 'GPU', 'RAM', 'OS', 'AI', 'ML', 'NLP', 'HTTP', 'HTTPS',
        'JWT', 'OAuth', 'S3', 'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes',
        'className', 'tagName', 'fieldName', 'elementType', 'queryParam',
        'string', 'list', 'dict', 'set', 'tuple', 'int', 'float', 'bool',
        'true', 'false', 'null', 'None', 'undefined', 'NaN', 'Infinity',
        'pyproject', 'pytest', 'pylint', 'mypy', 'black', 'isort',
    }

    # Patterns to find camelCase variables
    patterns = [
        r'\"([a-z]+[A-Z][a-zA-Z]*)\"',  # Dictionary keys with double quotes
        r'\'([a-z]+[A-Z][a-zA-Z]*)\'',  # Dictionary keys with single quotes
        r'\b([a-z]+[A-Z][a-zA-Z]*)\s*:',  # Pydantic field definitions
        r'\b([a-z]+[A-Z][a-zA-Z]*)\s*=',  # Variable assignments
    ]

    matches = set()
    for pattern in patterns:
        for match in re.finditer(pattern, content):
            var_name = match.group(1)
            if (len(var_name) > 2 and
                var_name not in exclude_patterns and
                re.match(r'^[a-z]+[A-Z]', var_name)):  # Must start with lowercase and have uppercase
                matches.add(var_name)

    return matches

def fix_file_content(content: str, camel_vars: set[str]) -> tuple[str, int]:
    """Fix camelCase variables in file content"""
    fixed_content = content
    changes_count = 0

    # Sort by length (longer patterns first) to avoid partial replacements
    sorted_vars = sorted(camel_vars, key=len, reverse=True)

    for camel_var in sorted_vars:
        snake_var = camel_to_snake(camel_var)
        if camel_var == snake_var:
            continue

        # Replace in quoted strings (dictionary keys)
        pattern_double_quotes = rf'\"({re.escape(camel_var)})\"'
        matches = re.findall(pattern_double_quotes, fixed_content)
        if matches:
            fixed_content = re.sub(pattern_double_quotes, f'"{snake_var}"', fixed_content)
            changes_count += len(matches)

        pattern_single_quotes = rf'\'({re.escape(camel_var)})\''
        matches = re.findall(pattern_single_quotes, fixed_content)
        if matches:
            fixed_content = re.sub(pattern_single_quotes, f"'{snake_var}'", fixed_content)
            changes_count += len(matches)

        # Replace in field definitions and assignments (more careful)
        # Only replace if it's a standalone identifier
        pattern_field = rf'\b{re.escape(camel_var)}\s*[:=]'
        if re.search(pattern_field, fixed_content):
            # For field definitions and assignments, we need to be more careful
            # Replace only the identifier, not the whole pattern
            fixed_content = re.sub(rf'\b({re.escape(camel_var)})\b', snake_var, fixed_content)
            # Count replacements more carefully by looking at the difference
            # This is a simplified count - actual count might vary
            changes_count += 1

    return fixed_content, changes_count

def process_file(file_path: Path, dry_run: bool = False) -> bool:
    """Process a single Python file to fix N815 violations"""
    try:
        with open(file_path, encoding='utf-8') as f:
            content = f.read()

        # Find camelCase variables
        camel_vars = find_camelcase_in_content(content)

        if not camel_vars:
            return False

        print(f"\n{file_path}:")
        print(f"  Found camelCase variables: {sorted(camel_vars)}")

        # Fix the content
        fixed_content, changes_count = fix_file_content(content, camel_vars)

        if changes_count > 0:
            print(f"  Made {changes_count} changes")

            if not dry_run:
                # Write the fixed content back
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(fixed_content)
                print("  ✓ Fixed and saved")
            else:
                print("  (Dry run - would save changes)")
            return True

        return False

    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Fix N815 mixed case variable errors')
    parser.add_argument('--dry-run', action='store_true',
                       help='Show what would be changed without making changes')
    parser.add_argument('--path', default='/Users/Arief/Desktop/378x492/backend/app/routers',
                       help='Path to process (default: backend/app/routers)')
    args = parser.parse_args()

    router_dir = Path(args.path)

    if not router_dir.exists():
        print(f"Error: Directory {router_dir} does not exist")
        return 1

    print(f"Scanning {router_dir} for N815 violations...")
    print("=" * 60)

    total_files_changed = 0
    total_changes = 0

    # Process all Python files
    for py_file in router_dir.glob('**/*.py'):
        if process_file(py_file, args.dry_run):
            total_files_changed += 1

    print("\n" + "=" * 60)
    if args.dry_run:
        print(f"Dry run complete. Would fix {total_files_changed} files.")
    else:
        print(f"Fixed {total_files_changed} files.")

    print("N815 violation fix process completed!")
    return 0

if __name__ == '__main__':
    exit(main())

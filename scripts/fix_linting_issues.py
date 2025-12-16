#!/usr/bin/env python3
"""
Automated Linting Fixes Script
Fixes common linting violations automatically
"""

import os
import re
from pathlib import Path

def fix_trailing_whitespace(file_path):
    """Remove trailing whitespace from a file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # Remove trailing whitespace from each line
        fixed_lines = [line.rstrip() + '\n' for line in lines]

        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(fixed_lines)

        return True
    except Exception as e:
        print(f"Error fixing {file_path}: {e}")
        return False

def fix_blank_lines_with_whitespace(file_path):
    """Fix blank lines that contain only whitespace"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        fixed_lines = []
        for line in lines:
            # If line is only whitespace, make it empty
            if line.strip() == '':
                fixed_lines.append('\n')
            else:
                fixed_lines.append(line)

        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(fixed_lines)

        return True
    except Exception as e:
        print(f"Error fixing {file_path}: {e}")
        return False

def find_and_fix_linting_issues():
    """Find files with linting issues and fix them"""

    print("🔧 AUTOMATED LINTING FIXES")
    print("=" * 50)

    # Get list of Python files
    python_files = []
    for root, dirs, files in os.walk('.'):
        # Skip certain directories
        dirs[:] = [d for d in dirs if d not in ['__pycache__', '.git', 'node_modules', '.venv']]

        for file in files:
            if file.endswith('.py'):
                python_files.append(os.path.join(root, file))

    print(f"📁 Found {len(python_files)} Python files")

    fixed_files = 0
    total_fixes = 0

    for file_path in python_files:
        original_content = None
        fixes_made = 0

        # Read file and check for issues
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            # Check for trailing whitespace or blank lines with whitespace
            has_issues = False
            for line in lines:
                if line.rstrip() != line.rstrip(' \t') or (line.strip() == '' and line != '\n'):
                    has_issues = True
                    break

            if has_issues:
                original_content = ''.join(lines)

                # Fix trailing whitespace
                fixed_lines = []
                for line in lines:
                    # Remove trailing whitespace
                    stripped = line.rstrip()
                    if stripped == '':
                        # Empty line
                        fixed_lines.append('\n')
                    else:
                        fixed_lines.append(stripped + '\n')

                new_content = ''.join(fixed_lines)

                if new_content != original_content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    fixed_files += 1
                    fixes_made += 1
                    print(f"✅ Fixed: {file_path}")

        except Exception as e:
            print(f"❌ Error processing {file_path}: {e}")

    print(f"\n📊 SUMMARY")
    print(f"   Files processed: {len(python_files)}")
    print(f"   Files fixed: {fixed_files}")
    print(f"   Total fixes: {total_fixes}")

    return fixed_files > 0

if __name__ == "__main__":
    success = find_and_fix_linting_issues()
    if success:
        print("\n🎉 Linting fixes completed!")
    else:
        print("\nℹ️  No automatic fixes were needed.")

#!/usr/bin/env python3
import os
import re
import glob

def fix_imports(file_path):
    """Fix relative imports in a TypeScript file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Calculate the depth from src/
        rel_path = os.path.relpath(file_path, 'frontend/src')
        depth = len(rel_path.split(os.sep)) - 1  # -1 for the filename

        # Replace relative imports based on depth
        if depth >= 1:
            # Replace '../' patterns
            for i in range(depth, 0, -1):
                dots = '../' * i
                content = re.sub(rf"from '{re.escape(dots)}", "from '@/", content)
                content = re.sub(rf"import.*from '{re.escape(dots)}", lambda m: m.group().replace(dots, '@/'), content)

        # Write back if changed
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

        return True
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

# Find all TypeScript files
files = glob.glob('frontend/src/**/*.ts', recursive=True) + glob.glob('frontend/src/**/*.tsx', recursive=True)

fixed = 0
for file_path in files:
    if fix_imports(file_path):
        fixed += 1

print(f"Fixed imports in {fixed} files")
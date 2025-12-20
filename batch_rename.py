#!/usr/bin/env python3
"""
Batch processing rename script to avoid timeouts
"""

import os
import glob

def process_batch(file_list, batch_size=50):
    """Process files in batches"""
    total_processed = 0

    for i in range(0, len(file_list), batch_size):
        batch = file_list[i:i + batch_size]
        batch_processed = 0

        for filepath in batch:
            try:
                # Simple replace
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as file:
                    content = file.read()

                if 'Zenith' in content:
                    new_content = content.replace('Zenith', 'Zenith')
                    with open(filepath, 'w', encoding='utf-8') as file:
                        file.write(new_content)
                    batch_processed += 1
                    total_processed += 1

            except Exception as e:
                print(f"Error processing {filepath}: {e}")

        print(f"Processed batch {i//batch_size + 1}: {batch_processed} files updated")

        # Small delay to prevent system overload
        import time
        time.sleep(0.1)

    return total_processed

def main():
    root_dir = "/Users/Arief/Desktop/Zenith"

    # Get all relevant files
    extensions = ['*.md', '*.py', '*.js', '*.ts', '*.tsx', '*.json', '*.html', '*.yml', '*.yaml', '*.toml', '*.cfg', '*.ini', '*.txt', '*.sh']

    all_files = []
    for ext in extensions:
        pattern = os.path.join(root_dir, '**', ext)
        try:
            files = glob.glob(pattern, recursive=True)
            # Filter out unwanted directories
            files = [f for f in files if not any(skip in f for skip in ['node_modules', '__pycache__', '.git', 'htmlcov', 'dist', 'coverage', 'monitoring_state.json'])]
            all_files.extend(files)
        except:
            pass

    print(f"Found {len(all_files)} files to process")

    # Process in batches
    total_processed = process_batch(all_files, batch_size=100)

    print(f"\nCompleted! Total files processed: {total_processed}")

    # Final check
    remaining = sum(1 for f in all_files if os.path.exists(f) and 'Zenith' in open(f, 'r', encoding='utf-8', errors='ignore').read())
    print(f"Files still containing 'Zenith': {remaining}")

if __name__ == "__main__":
    main()
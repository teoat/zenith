#!/usr/bin/env python3
"""
Fix TypeScript error variable naming in catch blocks
Replaces: } catch (_error) { console.error('...', error); }
With: } catch (err) { console.error('...', err); }
"""

import os
import re
import sys

def fix_error_naming(content):
    """Fix _error/error naming issues in catch blocks"""
    # Pattern: } catch (_error) { ... console.error(..., error); }
    # Replace _error with err and subsequent error references with err
    pattern = r'}\s*catch\s*\(_error\)'
    content = re.sub(pattern, '} catch (err)', content)
    
    return content

def process_file(filepath):
    """Process a single TypeScript file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        content = fix_error_naming(content)
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✓ Fixed: {filepath}")
            return True
        return False
    except Exception as e:
        print(f"✗ Error processing {filepath}: {e}")
        return False

def main():
    src_dir = 'src'
    fixed_count = 0
    
    for root, dirs, files in os.walk(src_dir):
        # Skip node_modules
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                filepath = os.path.join(root, file)
                if process_file(filepath):
                    fixed_count += 1
    
    print(f"\n✅ Fixed {fixed_count} files")

if __name__ == '__main__':
    main()

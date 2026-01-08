#!/usr/bin/env python3
"""
Comprehensive fix for error variable naming issues
"""

import os
import re

def fix_error_references(content):
    """Fix error references in console.error/log when catch uses err"""
    # Pattern: catch (err) ... console.error(..., error)
    lines = content.split('\n')
    fixed_lines = []
    in_catch_block = False
    catch_var = None
    brace_count = 0
    
    for i, line in enumerate(lines):
        # Detect catch block
        catch_match = re.search(r'}\s*catch\s*\((\w+)\)', line)
        if catch_match:
            in_catch_block = True
            catch_var = catch_match.group(1)
            brace_count = line.count('{') - line.count('}')
        
        # Track braces
        if in_catch_block:
            brace_count += line.count('{') - line.count('}')
            
            # Fix error references
            if catch_var and catch_var != 'error':
                # Replace standalone 'error' with catch variable
                line = re.sub(r'\berror\b(?![\'"])', catch_var, line)
            
            # Exit catch block
            if brace_count <= 0:
                in_catch_block = False
                catch_var = None
        
        fixed_lines.append(line)
    
    return '\n'.join(fixed_lines)

def process_file(filepath):
    """Process a single TypeScript file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        content = fix_error_references(content)
        
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

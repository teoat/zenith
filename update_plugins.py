#!/usr/bin/env python3
"""
Update all plugin files to use zenith namespace and team
"""

import os
import glob

def update_plugin_file(filepath):
    """Update a plugin file with zenith references"""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as file:
            content = file.read()

        # Replace namespace references
        content = content.replace('Zenith/', 'zenith/')
        content = content.replace('"Zenith Team"', '"Zenith Team"')
        content = content.replace("'Zenith Team'", "'Zenith Team'")
        content = content.replace('Zenith Team', 'Zenith Team')

        with open(filepath, 'w', encoding='utf-8') as file:
            file.write(content)

        return True
    except Exception as e:
        print(f"Error updating {filepath}: {e}")
        return False

def main():
    plugin_dir = "/Users/Arief/Desktop/Zenith/backend/plugins/zenith"

    if not os.path.exists(plugin_dir):
        print("Plugin directory not found!")
        return

    # Find all plugin.py files
    plugin_files = []
    for root, dirs, files in os.walk(plugin_dir):
        for file in files:
            if file == "plugin.py":
                plugin_files.append(os.path.join(root, file))

    print(f"Found {len(plugin_files)} plugin files to update...")

    updated_count = 0
    for plugin_file in plugin_files:
        if update_plugin_file(plugin_file):
            updated_count += 1
            print(f"✓ Updated: {os.path.relpath(plugin_file, plugin_dir)}")

    print(f"\nCompleted! Updated {updated_count} plugin files.")

if __name__ == "__main__":
    main()
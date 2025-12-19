
import os
import re

ui_dir = '/Users/Arief/Desktop/378x492/frontend/src/components/ui'
src_dir = '/Users/Arief/Desktop/378x492/frontend/src'

renames = {
    'alert.tsx': 'Alert.tsx',
    'avatar.tsx': 'Avatar.tsx',
    'badge.tsx': 'Badge.tsx',
    'checkbox.tsx': 'Checkbox.tsx',
    'dialog.tsx': 'Dialog.tsx',
    'label.tsx': 'Label.tsx',
    'progress.tsx': 'Progress.tsx',
    'scroll-area.tsx': 'ScrollArea.tsx',
    'select.tsx': 'Select.tsx',
    'separator.tsx': 'Separator.tsx',
    'slider.tsx': 'Slider.tsx',
    'switch.tsx': 'Switch.tsx',
    'table.tsx': 'Table.tsx',
    'tabs.tsx': 'Tabs.tsx',
    'textarea.tsx': 'Textarea.tsx',
}

# Also handle cases where they might be imported without .tsx extension
import_map = {
    'ui/alert': 'ui/Alert',
    'ui/avatar': 'ui/Avatar',
    'ui/badge': 'ui/Badge',
    'ui/checkbox': 'ui/Checkbox',
    'ui/dialog': 'ui/Dialog',
    'ui/label': 'ui/Label',
    'ui/progress': 'ui/Progress',
    'ui/scroll-area': 'ui/ScrollArea',
    'ui/select': 'ui/Select',
    'ui/separator': 'ui/Separator',
    'ui/slider': 'ui/Slider',
    'ui/switch': 'ui/Switch',
    'ui/table': 'ui/Table',
    'ui/tabs': 'ui/Tabs',
    'ui/textarea': 'ui/Textarea',
    'ui/button': 'ui/Button',
    'ui/card': 'ui/Card',
}

# Rename the files
for old_name, new_name in renames.items():
    old_path = os.path.join(ui_dir, old_name)
    new_path = os.path.join(ui_dir, new_name)
    if os.path.exists(old_path):
        print(f"Renaming {old_path} to {new_path}")
        os.rename(old_path, new_path)
    else:
        print(f"File {old_path} not found")

# Update imports in all files
for root, dirs, files in os.walk(src_dir):
    for name in files:
        if name.endswith(('.ts', '.tsx', '.js', '.jsx', '.css')):
            file_path = os.path.join(root, name)
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for old_imp, new_imp in import_map.items():
                # Match various import patterns
                # @/components/ui/alert
                # ../ui/alert
                # ./ui/alert
                # Also handle variations like '@/components/ui/alert' and "@/components/ui/alert"
                patterns = [
                    (fr"(['\"])([^'\"]*/{old_imp})(['\"])", fr"\1\2_REPLACE_ME\3"),
                ]
                
                # We need to be careful not to replace the path partially if it's not a full segment
                # But since these are specifically UI components, it's safer.
                
                # Let's try a simpler approach
                new_content = new_content.replace(f'ui/{old_imp.split("/")[-1]}', f'ui/{new_imp.split("/")[-1]}')
            
            if new_content != content:
                print(f"Updating imports in {file_path}")
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)

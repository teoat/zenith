import os
import re

root_dir = "docs"
link_pattern = re.compile(r'\[([^\]]+)\]\(([^)]+)\)|!\[([^\]]*)\]\(([^)]+)\)')

print("Scanning for links in docs/...")
for dirpath, dirnames, filenames in os.walk(root_dir):
    for filename in filenames:
        if filename.endswith(".md"):
            filepath = os.path.join(dirpath, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            matches = link_pattern.findall(content)
            for match in matches:
                # match is (text, link) or (alt, src) depending on it's image or link
                # findall returns tuple of groups. groups are (text, link, alt, src)
                link = match[1] if match[1] else match[3]
                
                if link.startswith("http") or link.startswith("#") or link.startswith("mailto:"):
                    continue
                
                print(f"{filepath}: {link}")

import os
import re

root_dir = "docs"

replacements = [
    # Assets were moved to docs/assets. Files in subdirs need ../assets
    (r'\./assets/', '../assets/'),
    (r'assets/', '../assets/'), # specific cases
    
    # Architecture move
    (r'\.\./00_ARCHITECTURE/', '../architecture/'),
    (r'/documents/Architecture/', '/docs/architecture/'),
    
    # Pages/Specs move
    (r'/documents/Pages/', '/docs/specifications/'),
    (r'\.\./Pages/', '../specifications/'),
]

for dirpath, dirnames, filenames in os.walk(root_dir):
    for filename in filenames:
        if filename.endswith(".md"):
            filepath = os.path.join(dirpath, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = content
            for pattern, replacement in replacements:
                # Simple string replacement might be safer than regex for these paths
                # But regex allows boundary checks if needed.
                # Let's use simple replacement for now but iterate 
                new_content = new_content.replace(pattern, replacement)
            
            # Specific fixes for markdown link syntax [label](../old)
            new_content = new_content.replace('](documents/Pages', '](docs/specifications')
            new_content = new_content.replace('](documents/Architecture', '](docs/architecture')

            # Attempt to repair links that reference `docs/reports/...` which were moved
            # into `docs/archives/reports/`. For each markdown link target that mentions
            # 'reports/' try to locate the actual file under `docs/archives/reports` by
            # filename and rewrite the link to a correct relative path from the source
            # file location.
            def replace_report_links(md_content, src_dir):
                link_re = re.compile(r"(\[[^\]]+\])\(([^)]+)\)")

                def repl(m):
                    label = m.group(1)
                    target = m.group(2)
                    if 'report' not in target.lower() and '/reports/' not in target and 'reports/' not in target:
                        return m.group(0)

                    basename = os.path.basename(target)
                    candidates = []
                    archives_reports_dir = os.path.join(root_dir, 'archives', 'reports')
                    if os.path.isdir(archives_reports_dir):
                        for entry in os.listdir(archives_reports_dir):
                            if entry == basename:
                                candidates.append(os.path.join(archives_reports_dir, entry))

                    if not candidates:
                        return m.group(0)

                    real_path = candidates[0]
                    relpath = os.path.relpath(real_path, start=src_dir)
                    relpath = relpath.replace(os.path.sep, '/')
                    return f"{label}({relpath})"

                return link_re.sub(repl, md_content)

            src_dir = os.path.dirname(filepath)
            new_content = replace_report_links(new_content, src_dir)

            if new_content != content:
                print(f"Fixed links in {filepath}")
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)


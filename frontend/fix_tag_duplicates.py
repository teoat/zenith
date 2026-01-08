import os
import re


def fix_duplicates(content):
    # Pattern 1: role="button" tabIndex={0} repeated
    # This matches the block we saw in ProgressiveDisclosure and ResizablePanel
    pattern1 = (
        r'role="button" tabIndex=\{0\} (onClick=\{[^}]+\})\s+onKeyDown=\{[^}]+\}\s+tabIndex=\{0\}\s+role="button"'
    )
    content = re.sub(pattern1, r"\1", content)
    # Wait, that might remove too much. Let's be safer.

    # Let's just remove the redundant ones if the tag has them twice
    # We'll use a more generic approach: if a tag has tabIndex={0} twice, remove one.

    # Split by tags (roughly)
    tags = re.split(r"(<[^>]+>)", content)
    new_tags = []
    for tag in tags:
        if tag.startswith("<") and not tag.startswith("</"):
            # It's an opening or self-closing tag
            # Find all attributes
            attrs = re.findall(r'(\w+)=({[^}]+}|"[^"]*")', tag)
            seen_attrs = set()
            new_attr_strs = []

            # We want to keep the attributes but deduplicate them by name
            # Special case for 'role' and 'tabIndex' which are most common duplicates
            for name, value in attrs:
                if name in seen_attrs:
                    continue
                seen_attrs.add(name)
                new_attr_strs.append(f"{name}={value}")

            # If we found duplicates, rebuild the tag
            if len(attrs) != len(new_attr_strs):
                # Rebuild tag name + deduplicated attributes
                tag_name = re.match(r"<(\w+)", tag).group(1)
                is_self_closing = tag.endswith("/>")
                new_tag = f"<{tag_name} " + " ".join(new_attr_strs) + (" />" if is_self_closing else ">")
                new_tags.append(new_tag)
            else:
                new_tags.append(tag)
        else:
            new_tags.append(tag)

    return "".join(new_tags)


def main():
    src_dir = "src"
    fixed_count = 0
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith(".tsx") or file.endswith(".ts"):
                filepath = os.path.join(root, file)
                with open(filepath, "r", encoding="utf-8") as f:
                    try:
                        content = f.read()
                    except UnicodeDecodeError:
                        continue

                new_content = fix_duplicates(content)

                if new_content != content:
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    fixed_count += 1
                    print(f"Fixed duplicates in: {filepath}")
    print(f"Total files fixed: {fixed_count}")


if __name__ == "__main__":
    main()

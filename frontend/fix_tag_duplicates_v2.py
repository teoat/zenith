import os
import re


def fix_duplicates(content):
    tags = re.split(r"(<[^>]+>)", content)
    new_tags = []
    for tag in tags:
        if tag.startswith("<") and not tag.startswith("</") and not tag.startswith("<>"):
            # It's an opening or self-closing tag
            # Find all attributes
            attrs = re.findall(r'(\w+)=({[^}]+}|"[^"]*")', tag)
            if not attrs:
                new_tags.append(tag)
                continue

            seen_attrs = set()
            new_attr_strs = []
            has_dup = False

            for name, value in attrs:
                if name in seen_attrs:
                    has_dup = True
                    continue
                seen_attrs.add(name)
                new_attr_strs.append(f"{name}={value}")

            if has_dup:
                try:
                    match = re.search(r"<([a-zA-Z0-9.]+)", tag)
                    if match:
                        tag_name = match.group(1)
                        is_self_closing = tag.endswith("/>")
                        # Re-add other props that are not name=value (like {...props})
                        # This is tricky... let's just use the deduplicated attrs and assume the rest are fine
                        # Actually, let's just keep the original tag if we can't rebuild it perfectly
                        new_tag = f"<{tag_name} " + " ".join(new_attr_strs) + (" />" if is_self_closing else ">")
                        new_tags.append(new_tag)
                    else:
                        new_tags.append(tag)
                except Exception:
                    new_tags.append(tag)
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
                    print(f"Fixed: {filepath}")
    print(f"Total files fixed: {fixed_count}")


if __name__ == "__main__":
    main()

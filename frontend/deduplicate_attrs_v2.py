import os


def deduplicate_attributes(content):
    # Specific common duplicate string
    bad_str = 'role="region" aria-label="Section"'
    for _ in range(5):
        content = content.replace(f"{bad_str} {bad_str}", bad_str)
        content = content.replace(f"{bad_str}{bad_str}", bad_str)

    # Another common one: aria-label="Interactive element"
    bad_str2 = 'aria-label="Interactive element"'
    for _ in range(5):
        content = content.replace(f"{bad_str2} {bad_str2}", bad_str2)
        content = content.replace(f"{bad_str2}{bad_str2}", bad_str2)

    return content


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

                new_content = deduplicate_attributes(content)

                if new_content != content:
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    fixed_count += 1
                    print(f"Deduplicated attributes in: {filepath}")
    print(f"Total files fixed: {fixed_count}")


if __name__ == "__main__":
    main()

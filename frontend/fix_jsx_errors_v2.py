import os


def fix_content(content):
    # Fix common mangled patterns
    # 1. length mangling
    content = content.replace('length  aria-label="Action"> 0', "length > 0")
    content.replace('length aria-label="Action"> 0', "length > 0")

    # 2. arrow function mangling
    content = content.replace(') = aria-label="Action">', ") =>")
    content = content.replace(') = aria-label="Input field">', ") =>")
    content = content.replace('(e) = aria-label="Input field">', "(e) =>")
    content = content.replace('() = aria-label="Action">', "() =>")

    # 3. simple tail mangling where double space indicates injection
    # Be careful not to break legitimate JSX tags
    # Usually mangled ones have exactly two spaces before them or are inside { }
    content = content.replace('  aria-label="Action">', " >")
    content = content.replace('  aria-label="Input field">', " >")

    # 4. Redundant role/aria-label attributes
    for _ in range(5):  # Repeat to handle many duplicates
        content = content.replace(
            'role="region" aria-label="Section" role="region" aria-label="Section"',
            'role="region" aria-label="Section"',
        )

    # 5. Fixed specific found errors
    content = content.replace(
        '<header className="text-center">\n      <Settings className="mx-auto h-12 w-12 text-blue-600 mb-4" />\n      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>\n      <p className="text-gray-600 mt-2">Configure your application preferences and behavior</p>\n    </div>',
        '<header className="text-center">\n      <Settings className="mx-auto h-12 w-12 text-blue-600 mb-4" />\n      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>\n      <p className="text-gray-600 mt-2">Configure your application preferences and behavior</p>\n    </header>',
    )

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

                new_content = fix_content(content)

                if new_content != content:
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(new_content)
                    fixed_count += 1
                    print(f"Fixed: {filepath}")
    print(f"Total files fixed: {fixed_count}")


if __name__ == "__main__":
    main()

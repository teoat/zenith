#!/usr/bin/env python3
"""
Automated Link Repair Tool
Fixes broken links in documentation by finding correct targets
"""

import re
from pathlib import Path
from typing import Dict, List, Set, Tuple


class LinkRepairer:
    """Automated link repair for documentation"""

    def __init__(self, docs_root: Path):
        self.docs_root = docs_root
        self.existing_files = self._scan_existing_files()
        self.repair_log = []

    def _scan_existing_files(self) -> set[Path]:
        """Scan all existing files in documentation"""
        existing_files = set()
        for file_path in self.docs_root.rglob("*"):
            if file_path.is_file():
                existing_files.add(file_path.relative_to(self.docs_root))
        return existing_files

    def find_broken_links(self, file_path: Path) -> list[tuple[str, str, int]]:
        """Find broken links in a file"""
        broken_links = []

        try:
            with open(file_path, encoding="utf-8") as f:
                content = f.read()

            # Find markdown links
            link_pattern = r"\[([^\]]+)\]\(([^)]+)\)"
            matches = re.finditer(link_pattern, content)

            for match in matches:
                link_text = match.group(1)
                link_url = match.group(2)
                line_number = content[: match.start()].count("\n") + 1

                if self._is_broken_link(file_path, link_url):
                    broken_links.append((link_text, link_url, line_number))

        except Exception as e:
            print(f"Error scanning {file_path}: {e}")

        return broken_links

    def _is_broken_link(self, source_file: Path, link_url: str) -> bool:
        """Check if a link is broken"""
        # Skip external links
        if link_url.startswith(("http://", "https://")):
            return False

        # Skip anchor links
        if link_url.startswith("#"):
            return False

        # Handle relative links
        if link_url.startswith(("./", "../")):
            target_path = (source_file.parent / link_url).resolve()
            target_relative = target_path.relative_to(self.docs_root)
        else:
            target_relative = Path(link_url)

        # Check if target exists
        return target_relative not in self.existing_files

    def find_correct_target(self, broken_url: str, source_file: Path) -> str:
        """Find the correct target for a broken link"""
        # Extract filename from broken URL
        filename = Path(broken_url).name if "/" in broken_url else broken_url

        # Look for files with similar names
        candidates = []
        for existing_file in self.existing_files:
            if filename.lower() in existing_file.name.lower():
                candidates.append(existing_file)

        # Choose best candidate
        if candidates:
            # Prefer exact matches
            for candidate in candidates:
                if candidate.name == filename:
                    return str(candidate)

            # Otherwise, return first match
            return str(candidates[0])

        # If no match found, return original (will need manual fix)
        return broken_url

    def repair_file(self, file_path: Path) -> int:
        """Repair broken links in a file"""
        broken_links = self.find_broken_links(file_path)

        if not broken_links:
            return 0

        try:
            with open(file_path, encoding="utf-8") as f:
                content = f.read()

            repairs_made = 0

            for link_text, broken_url, line_number in broken_links:
                correct_target = self.find_correct_target(broken_url, file_path)

                if correct_target != broken_url:
                    # Replace the broken link
                    old_link = f"[{link_text}]({broken_url})"
                    new_link = f"[{link_text}]({correct_target})"

                    content = content.replace(old_link, new_link)
                    repairs_made += 1

                    self.repair_log.append(
                        {
                            "file": str(file_path.relative_to(self.docs_root)),
                            "line": line_number,
                            "old_url": broken_url,
                            "new_url": correct_target,
                            "link_text": link_text,
                        }
                    )

            # Write repaired content
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)

            return repairs_made

        except Exception as e:
            print(f"Error repairing {file_path}: {e}")
            return 0

    def repair_all_files(self) -> dict[str, int]:
        """Repair all broken links in documentation"""
        repair_results = {}

        markdown_files = list(self.docs_root.rglob("*.md"))

        for md_file in markdown_files:
            repairs = self.repair_file(md_file)
            if repairs > 0:
                repair_results[str(md_file.relative_to(self.docs_root))] = repairs

        return repair_results

    def generate_repair_report(self) -> str:
        """Generate a report of repairs made"""
        if not self.repair_log:
            return "No repairs were needed."

        report = []
        report.append("# Link Repair Report")
        report.append("")
        report.append(f"Total repairs made: {len(self.repair_log)}")
        report.append("")

        # Group by file
        repairs_by_file = {}
        for repair in self.repair_log:
            file_name = repair["file"]
            if file_name not in repairs_by_file:
                repairs_by_file[file_name] = []
            repairs_by_file[file_name].append(repair)

        for file_name, repairs in repairs_by_file.items():
            report.append(f"## {file_name}")
            report.append("")

            for repair in repairs:
                report.append(f"Line {repair['line']}:")
                report.append(f"  Old: `{repair['old_url']}`")
                report.append(f"  New: `{repair['new_url']}`")
                report.append(f"  Text: [{repair['link_text']}]")
                report.append("")

        return "\n".join(report)


def main():
    """Main link repair process"""
    print("🔧 Starting Automated Link Repair...")

    docs_root = Path(__file__).parent.parent.parent / "docs"

    if not docs_root.exists():
        print(f"❌ Documentation directory not found: {docs_root}")
        return

    # Create repairer
    repairer = LinkRepairer(docs_root)

    # Scan for broken links
    print("🔍 Scanning for broken links...")
    markdown_files = list(docs_root.rglob("*.md"))
    total_broken = 0

    for md_file in markdown_files:
        broken = repairer.find_broken_links(md_file)
        if broken:
            print(f"  {md_file.name}: {len(broken)} broken links")
            total_broken += len(broken)

    if total_broken == 0:
        print("✅ No broken links found!")
        return

    print(f"📊 Found {total_broken} broken links across {len(markdown_files)} files")

    # Repair broken links
    print("🔧 Repairing broken links...")
    repair_results = repairer.repair_all_files()

    # Show results
    print("\n📊 Repair Results:")
    for file_name, repairs in repair_results.items():
        print(f"  {file_name}: {repairs} repairs")

    total_repairs = sum(repair_results.values())
    print(f"\n✅ Total repairs made: {total_repairs}")

    # Generate report
    report = repairer.generate_repair_report()
    report_path = Path(__file__).parent / "link_repair_report.md"

    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"📝 Repair report saved to: {report_path}")

    # Run validation to verify repairs
    print("\n🔍 Verifying repairs...")
    from validate_docs import DocumentationValidator

    validator = DocumentationValidator(docs_root)
    validation_report = validator.validate_all()

    remaining_issues = validation_report["summary"]["broken_links"]
    print(f"📊 Remaining broken links: {remaining_issues}")

    if remaining_issues == 0:
        print("🎉 All broken links repaired successfully!")
    else:
        print(f"⚠️  {remaining_issues} links still need manual repair")


if __name__ == "__main__":
    main()

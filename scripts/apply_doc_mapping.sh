#!/usr/bin/env bash
set -euo pipefail

# apply_doc_mapping.sh
# Reads docs/mapping.csv and archives originals to docs/internal/archives/moved_originals/
# then replaces originals with small redirect stubs pointing to the consolidated target.

MAP="docs/mapping.csv"
ARCH_DIR="docs/internal/archives/moved_originals"
mkdir -p "$ARCH_DIR"

if [ ! -f "$MAP" ]; then
  echo "mapping.csv not found at $MAP"
  exit 1
fi

tail -n +2 "$MAP" | while IFS='|' read -r original title h2s target subsection action note est; do
  orig_path="docs/$original"
  archive_path="$ARCH_DIR/$original"
  echo "Processing: $orig_path -> $target (action=$action)"
  if [ -f "$orig_path" ]; then
    mkdir -p "$(dirname "$archive_path")"
    cp -p "$orig_path" "$archive_path"
    # write stub to original
    mkdir -p "$(dirname "$orig_path")"
    cat > "$orig_path" <<EOF
This document has moved.

New location: [$subsection]($target)

Original archived at: $archive_path
Source: $original
EOF
  else
    echo "Warning: $orig_path not found — skipping"
  fi
done

echo "Done. Originals archived under $ARCH_DIR and replaced with redirect stubs.\nRecommend running: markdown-link-check on docs/*.md and commit changes."

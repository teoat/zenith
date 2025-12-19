#!/bin/bash

# Script to update documentation URLs from placeholder to production URLs

echo "🔄 Updating documentation URLs to production endpoints..."

# Define URL mappings
declare -A URL_MAP=(
    ["https://api.378x492.com"]="https://api.fraud-detection-378x492.com"
    ["https://portal.378x492.com"]="https://app.fraud-detection-378x492.com"
    ["https://docs.378x492.com"]="https://docs.fraud-detection-378x492.com"
    ["https://status.378x492.com"]="https://status.fraud-detection-378x492.com"
    ["https://forum.378x492.com"]="https://community.fraud-detection-378x492.com"
    ["https://updates.378x492.com"]="https://updates.fraud-detection-378x492.com"
    ["api.378x492.com"]="api.fraud-detection-378x492.com"
    ["portal.378x492.com"]="app.fraud-detection-378x492.com"
    ["docs.378x492.com"]="docs.fraud-detection-378x492.com"
    ["status.378x492.com"]="status.fraud-detection-378x492.com"
    ["378x492.com"]="fraud-detection-378x492.com"
)

# Function to update URLs in a file
update_urls_in_file() {
    local file="$1"
    local updated=false

    for old_url in "${!URL_MAP[@]}"; do
        local new_url="${URL_MAP[$old_url]}"

        # Check if file contains the old URL
        if grep -q "$old_url" "$file"; then
            # Replace the URL
            sed -i.bak "s|$old_url|$new_url|g" "$file"
            updated=true
            echo "  Updated: $old_url → $new_url in $file"
        fi
    done

    if [ "$updated" = true ]; then
        # Remove backup file
        rm "${file}.bak"
        return 0
    else
        return 1
    fi
}

# Find all markdown files in docs directory
echo "📁 Scanning documentation files..."

find docs -name "*.md" -type f | while read -r file; do
    echo "Processing: $file"
    if update_urls_in_file "$file"; then
        echo "  ✅ Updated URLs in $file"
    else
        echo "  ℹ️  No URLs to update in $file"
    fi
done

# Update frontend configuration files
echo "🔧 Updating frontend configuration files..."

# Update environment files
if [ -f "frontend/.env.example" ]; then
    update_urls_in_file "frontend/.env.example"
fi

if [ -f "frontend/.env.production" ]; then
    update_urls_in_file "frontend/.env.production"
fi

# Update deployment documentation
if [ -f "frontend/DEPLOYMENT.md" ]; then
    update_urls_in_file "frontend/DEPLOYMENT.md"
fi

echo ""
echo "🎉 URL update complete!"
echo ""
echo "📋 Updated URL mappings:"
for old_url in "${!URL_MAP[@]}"; do
    echo "  $old_url → ${URL_MAP[$old_url]}"
done

echo ""
echo "🔍 Verification:"
echo "  Run: find docs -name '*.md' -exec grep -l 'fraud-detection-378x492.com' {} \\;"
echo "  to verify all URLs have been updated."
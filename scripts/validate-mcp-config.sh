#!/bin/bash
# MCP Workspace Configuration Validator
# Validates .mcp-workspace.json schema and checks for common issues

set -e

CONFIG_FILE=".mcp-workspace.json"
LOCAL_CONFIG_FILE=".mcp-workspace.local.json"

echo "🔍 MCP Workspace Configuration Validator"
echo "=========================================="
echo ""

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ No $CONFIG_FILE found in current directory"
    echo "💡 Run: ./generate-mcp-config.sh to create one"
    exit 1
fi

echo "📄 Found: $CONFIG_FILE"

# Validate JSON syntax
if ! jq empty "$CONFIG_FILE" 2>/dev/null; then
    echo "❌ Invalid JSON syntax in $CONFIG_FILE"
    exit 1
fi

echo "✅ Valid JSON syntax"

# Check required fields
REQUIRED_FIELDS=(
    ".workspace.name"
    ".mcpServers"
)

for field in "${REQUIRED_FIELDS[@]}"; do
    if ! jq -e "$field" "$CONFIG_FILE" > /dev/null 2>&1; then
        echo "⚠️  Warning: Missing field: $field"
    fi
done

# Check workspace name
WORKSPACE_NAME=$(jq -r '.workspace.name // "unknown"' "$CONFIG_FILE")
echo "📦 Workspace: $WORKSPACE_NAME"

# List enabled servers
echo ""
echo "🔌 Enabled MCP Servers:"
jq -r '.mcpServers | to_entries[] | select(.value.enabled == true) | "  • \(.key) (priority: \(.value.priority // "default"))"' "$CONFIG_FILE"

# Check for local overrides
if [ -f "$LOCAL_CONFIG_FILE" ]; then
    echo ""
    echo "🔧 Local overrides found: $LOCAL_CONFIG_FILE"
    if ! jq empty "$LOCAL_CONFIG_FILE" 2>/dev/null; then
        echo "❌ Invalid JSON syntax in $LOCAL_CONFIG_FILE"
        exit 1
    fi
fi

# Check for environment variables
ENV_VARS=$(jq -r '.. | strings | select(contains("${"))' "$CONFIG_FILE" 2>/dev/null || true)
if [ -n "$ENV_VARS" ]; then
    echo ""
    echo "🔐 Environment variables used:"
    echo "$ENV_VARS" | sed 's/.*${\([^}]*\)}.*/\1/' | sort -u | while read var; do
        if [ -z "${!var}" ]; then
            echo "  ⚠️  $var (not set)"
        else
            echo "  ✅ $var (set)"
        fi
    done
fi

# Security checks
echo ""
echo "🔒 Security Checks:"

# Check for hardcoded tokens/passwords
SENSITIVE_PATTERNS=("token" "password" "secret" "api_key")
for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    if jq -r '.. | strings' "$CONFIG_FILE" 2>/dev/null | grep -i "$pattern" | grep -v "\${" > /dev/null; then
        echo "  ⚠️  Warning: Possible hardcoded $pattern found"
    fi
done

# Check if file is in gitignore
if [ -f ".gitignore" ]; then
    if grep -q ".mcp-workspace.local.json" .gitignore; then
        echo "  ✅ .mcp-workspace.local.json in .gitignore"
    else
        echo "  ⚠️  Add .mcp-workspace.local.json to .gitignore"
    fi
fi

echo ""
echo "✅ Validation complete!"
echo ""
echo "💡 Tips:"
echo "  • Use .mcp-workspace.local.json for local overrides"
echo "  • Keep credentials in environment variables"
echo "  • Add .mcp-workspace.local.json to .gitignore"

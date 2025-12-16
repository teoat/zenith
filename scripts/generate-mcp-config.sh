#!/bin/bash
# MCP Workspace Configuration Generator
# Interactive tool to create .mcp-workspace.json

echo "🎯 MCP Workspace Configuration Generator"
echo "=========================================="
echo ""

# Gather workspace information
read -p "Workspace name: " workspace_name
echo ""
echo "Select workspace type:"
echo "  1) fullstack-web (Frontend + Backend)"
echo "  2) python-backend (API/Backend only)"
echo "  3) react-frontend (Frontend only)"
echo "  4) electron-app (Desktop application)"
echo "  5) fullstack-python-react-electron (Like Simple378)"
echo ""
read -p "Choice (1-5): " workspace_type_choice

case $workspace_type_choice in
    1) workspace_type="fullstack-web" ;;
    2) workspace_type="python-backend" ;;
    3) workspace_type="react-frontend" ;;
    4) workspace_type="electron-app" ;;
    5) workspace_type="fullstack-python-react-electron" ;;
    *) workspace_type="custom" ;;
esac

read -p "Description: " description

echo ""
echo "🔌 MCP Servers to enable:"
echo ""

# Server selection with defaults based on type
declare -A servers=(
    ["github"]="yes"
    ["postgres"]="no"
    ["chrome-devtools"]="no"
    ["context7"]="yes"
    ["prometheus"]="no"
    ["memory"]="yes"
    ["sequential-thinking"]="yes"
)

# Set defaults based on workspace type
case $workspace_type in
    "fullstack-web"|"fullstack-python-react-electron")
        servers["postgres"]="yes"
        servers["chrome-devtools"]="yes"
        servers["prometheus"]="yes"
        ;;
    "python-backend")
        servers["postgres"]="yes"
        servers["prometheus"]="yes"
        ;;
    "react-frontend")
        servers["chrome-devtools"]="yes"
        ;;
    "electron-app")
        servers["chrome-devtools"]="yes"
        servers["postgres"]="yes"
        ;;
esac

# Ask for each server
for server in github postgres chrome-devtools context7 prometheus memory sequential-thinking; do
    default="${servers[$server]}"
    read -p "Enable $server? (y/n) [$default]: " enable
    enable=${enable:-$default}
    servers[$server]=$enable
done

# Build JSON
cat > .mcp-workspace.json << EOF
{
  "workspace": {
    "name": "$workspace_name",
    "type": "$workspace_type",
    "description": "$description"
  },
  "mcpServers": {
EOF

# Add enabled servers
first=true
for server in "${!servers[@]}"; do
    if [ "${servers[$server]}" = "yes" ] || [ "${servers[$server]}" = "y" ]; then
        if [ "$first" = false ]; then
            echo "," >> .mcp-workspace.json
        fi
        first=false
        
        # Determine priority
        case $server in
            github|postgres) priority="high" ;;
            chrome-devtools|context7|prometheus) priority="medium" ;;
            *) priority="low" ;;
        esac
        
        echo -n "    \"$server\": { \"enabled\": true, \"priority\": \"$priority\" }" >> .mcp-workspace.json
    fi
done

cat >> .mcp-workspace.json << 'EOF'

  },
  "autoLoad": true,
  "fallbackServers": ["memory", "sequential-thinking"],
  "version": "1.0.0"
}
EOF

echo ""
echo "✅ Created .mcp-workspace.json"
echo ""
echo "📝 Next steps:"
echo "  1. Review and edit .mcp-workspace.json as needed"
echo "  2. Run ./scripts/validate-mcp-config.sh to validate"
echo "  3. Copy .env.mcp.example to .env and configure"
echo "  4. Add .mcp-workspace.local.json to .gitignore"

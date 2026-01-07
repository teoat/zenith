#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Zenith Deployment Assistant${NC}"
echo "-----------------------------------"

# 1. Check Login
echo -e "${YELLOW}🔍 Checking Railway Login...${NC}"
if ! railway whoami &> /dev/null; then
    echo -e "${RED}❌ You are not logged in.${NC}"
    echo "👉 Please run: railway login"
    exit 1
fi
echo -e "${GREEN}✅ Logged in!${NC}"

# 2. Check Link
echo -e "${YELLOW}🔍 Checking Project Link...${NC}"
if ! railway status &> /dev/null; then
    echo -e "${YELLOW}⚠️  No project linked.${NC}"
    echo "👉 You need to link a project. Run 'railway link' in your terminal."
    echo "   Create a NEW project if you don't have one."
    exit 1
fi
echo -e "${GREEN}✅ Project linked!${NC}"

# 3. Set Variables
echo -e "${YELLOW}🔑 Configuring Production Secrets...${NC}"
# Note: These keys are pre-generated secure keys.
# In a real scenario, we might want to regenerate them or read from a secure source.

railway variables \
  --service "6a4268fe-81db-483a-ab59-f003e677b0b7" \
  --set "SECRET_KEY=6Kp7QdqVuzfl6RQsqXph-4kCGiOiati_yi651hWBq-w" \
  --set "JWT_SECRET_KEY=gk-8BuWJaz8SDy5TKtfheeLCNAvAUo-uJqlKaA44ouQ" \
  --set "ENCRYPTION_KEY=LEGT4drWe8R7MVnAxR7-Pg-5QQkw9ntxglWtG6A1dN8=" \
  --set "ENVIRONMENT=production"

echo -e "${GREEN}✅ Secrets configured!${NC}"

# 4. Deploy
echo -e "${YELLOW}🚀 Deploying to Railway...${NC}"
railway up --detach

echo -e "${GREEN}✅ Deployment triggered!${NC}"
echo "-----------------------------------"
echo "👉 Check the dashboard: https://railway.app/dashboard"

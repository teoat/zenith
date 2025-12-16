#!/bin/bash
# Security Key Rotation Script
# Run this to generate fresh cryptographic keys
# Usage: ./rotate_secrets.sh

set -e

echo "🔐 Generating secure cryptographic keys..."
echo ""

# Generate keys
ENCRYPTION_KEY=$(openssl rand -hex 32)
SQLCIPHER_KEY=$(openssl rand -hex 32)
IPC_SECRET=$(openssl rand -hex 32)
AUTH_ENCRYPTION_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)
REDIS_PASSWORD=$(openssl rand -base64 32)

# Create secure .env file
cat > .env.production.generated << EOF
# Generated: $(date)
# CRITICAL: Keep this file secure and NEVER commit to git

# SECURITY & ENCRYPTION
ENCRYPTION_KEY=${ENCRYPTION_KEY}
SQLCIPHER_KEY=${SQLCIPHER_KEY}
IPC_SECRET=${IPC_SECRET}
AUTH_ENCRYPTION_KEY=${AUTH_ENCRYPTION_KEY}
JWT_SECRET_KEY=${JWT_SECRET_KEY}
SESSION_SECRET=${SESSION_SECRET}

# REDIS
REDIS_PASSWORD=${REDIS_PASSWORD}

# DATABASE
DATABASE_URL=postgresql://user:password@localhost:5432/fraud_detection

# JWT
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# APPLICATION
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# Add your other configuration below
EOF

chmod 600 .env.production.generated

echo "✅ Keys generated successfully!"
echo ""
echo "📁 File created: .env.production.generated"
echo "🔒 Permissions set to 600 (owner read/write only)"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "1. Review .env.production.generated"
echo "2. Update DATABASE_URL, ALLOWED_HOSTS, etc."
echo "3. Copy to .env (for local) or deploy to production secrets manager"
echo "4. Delete this file after deployment: rm .env.production.generated"
echo "5. NEVER commit .env.production.generated to git!"
echo ""
echo "💾 To use with AWS Secrets Manager:"
echo "   aws secretsmanager create-secret --name fraud-detection-prod --secret-string file://.env.production.generated"
echo ""
echo "💾 To use with HashiCorp Vault:"
echo "   vault kv put secret/fraud-detection @.env.production.generated"

# GitHub Secrets Configuration Guide
**Phase 5 Extension: CI/CD Secrets Setup**

This guide provides instructions for configuring all required GitHub secrets for the CI/CD pipeline.

---

## 🔐 Required Secrets

### 1. Deployment Secrets

#### `GH_TOKEN`
**Purpose:** GitHub Personal Access Token for Electron releases  
**Scope Required:** `repo`, `write:packages`

**Setup:**
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `write:packages`
4. Copy the token
5. Add to repository secrets as `GH_TOKEN`

```bash
# Repository Settings → Secrets and variables → Actions → New repository secret
Name: GH_TOKEN
Secret: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

#### `CODECOV_TOKEN`
**Purpose:** Upload test coverage reports to Codecov  
**Source:** https://codecov.io

**Setup:**
1. Sign in to Codecov with GitHub
2. Add your repository
3. Copy the upload token
4. Add to repository secrets

```bash
Name: CODECOV_TOKEN
Secret: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

#### `SLACK_WEBHOOK`
**Purpose:** Deployment notifications to Slack  
**Source:** Slack App Incoming Webhooks

**Setup:**
1. Create Slack App: https://api.slack.com/apps
2. Enable Incoming Webhooks
3. Add webhook to channel (e.g., #deployments)
4. Copy webhook URL

```bash
Name: SLACK_WEBHOOK
Secret: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
```

---

### 2. Deployment Environment Secrets

#### Staging Environment

```bash
Name: STAGING_API_URL
Secret: https://staging.your-app.com

Name: STAGING_DB_URL
Secret: postgresql://user:pass@staging-db.example.com:5432/dbname

Name: STAGING_REDIS_URL
Secret: redis://staging-redis.example.com:6379
```

#### Production Environment

```bash
Name: PROD_API_URL
Secret: https://api.your-app.com

Name: PROD_DB_URL
Secret: postgresql://user:pass@prod-db.example.com:5432/dbname

Name: PROD_REDIS_URL
Secret: redis://prod-redis.example.com:6379
```

---

### 3. Optional: Cloud Provider Secrets

#### AWS (if using AWS deployment)

```bash
Name: AWS_ACCESS_KEY_ID
Secret: AKIAIOSFODNN7EXAMPLE

Name: AWS_SECRET_ACCESS_KEY
Secret: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

Name: AWS_REGION
Secret: us-east-1
```

#### Docker Hub (for container deployment)

```bash
Name: DOCKER_USERNAME
Secret: your-dockerhub-username

Name: DOCKER_PASSWORD
Secret: your-dockerhub-password
```

---

## 📋 Secrets Checklist

Use this checklist to ensure all secrets are configured:

### Core Secrets (Required)
- [ ] `GH_TOKEN` - GitHub releases
- [ ] `CODECOV_TOKEN` - Coverage reporting
- [ ] `SLACK_WEBHOOK` - Notifications

### Environment Secrets (Required for deployment)
- [ ] `STAGING_API_URL`
- [ ] `STAGING_DB_URL`
- [ ] `STAGING_REDIS_URL`
- [ ] `PROD_API_URL`
- [ ] `PROD_DB_URL`
- [ ] `PROD_REDIS_URL`

### Optional Secrets
- [ ] `AWS_ACCESS_KEY_ID`
- [ ] `AWS_SECRET_ACCESS_KEY`
- [ ] `DOCKER_USERNAME`
- [ ] `DOCKER_PASSWORD`

---

## 🔒 Security Best Practices

### 1. Rotate Secrets Regularly
```bash
# Recommended rotation schedule:
- GitHub tokens: Every 90 days
- Database passwords: Every 60 days
- API keys: Every 30 days
```

### 2. Use Secret Scanning
Enable GitHub's secret scanning:
```
Repository Settings → Security → Secret scanning → Enable
```

### 3. Principle of Least Privilege
- Only grant necessary permissions
- Use separate tokens for different purposes
- Never share tokens between environments

### 4. Monitor Secret Usage
```bash
# Check GitHub Actions logs for secret usage
# Secrets are automatically masked in logs
# Look for: ***
```

---

## 🧪 Testing Secrets Configuration

### Verify GitHub Token
```bash
curl -H "Authorization: token $GH_TOKEN" \
  https://api.github.com/user
```

### Verify Codecov Token
```bash
curl -X POST --data-binary @coverage.xml \
  -H "Authorization: token $CODECOV_TOKEN" \
  https://codecov.io/upload/v4
```

### Verify Slack Webhook
```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test from CI/CD setup"}' \
  $SLACK_WEBHOOK
```

---

## 🎯 Quick Setup Script

```bash
#!/bin/bash
# setup-secrets.sh - Interactive secret configuration

echo "🔐 GitHub Secrets Configuration"
echo "================================"

# Function to add secret
add_secret() {
  local name=$1
  local description=$2
  
  echo -e "\n📝 $name"
  echo "   $description"
  read -sp "   Enter value: " value
  echo ""
  
  # Add to GitHub (requires gh CLI)
  if command -v gh &> /dev/null; then
    echo "$value" | gh secret set "$name"
    echo "   ✓ Added to GitHub"
  else
    echo "   → Manually add to: Settings → Secrets → Actions"
    echo "   Name: $name"
  fi
}

# Core secrets
add_secret "GH_TOKEN" "GitHub Personal Access Token"
add_secret "CODECOV_TOKEN" "Codecov upload token"
add_secret "SLACK_WEBHOOK" "Slack webhook URL"

# Environment secrets
add_secret "STAGING_API_URL" "Staging API endpoint"
add_secret "PROD_API_URL" "Production API endpoint"

echo -e "\n✅ Secret configuration complete!"
```

---

## 📚 Additional Resources

- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Codecov Documentation](https://docs.codecov.com)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [AWS Credentials](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html)

---

**Last Updated:** 2025-12-16  
**Status:** Ready for configuration

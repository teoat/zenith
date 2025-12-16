# Simple378 Fraud Detection - CI/CD Pipeline

This document describes the automated build and deployment pipeline for the Simple378 Fraud Detection desktop application.

## 🚀 CI/CD Overview

The application uses GitHub Actions for continuous integration and deployment with the following workflow:

### 📋 Pipeline Stages

1. **Quality Assurance** - Linting, type checking, testing, and security scanning
2. **Cross-Platform Builds** - Automated builds for macOS, Windows, and Linux
3. **Smoke Testing** - Basic functionality validation of built applications
4. **Release Deployment** - Automated publishing to GitHub Releases

### 🔄 Workflow Triggers

- **Push to main/develop**: Runs full QA and build pipeline
- **Pull Requests**: Runs QA checks only (no builds)
- **Releases**: Triggers production deployment with asset publishing
- **Scheduled**: Daily security scans and dependency updates

## 🛠️ Local Development Setup

### Prerequisites

```bash
# Node.js 20+
node --version  # Should show v20.x.x

# Python 3.12+
python --version  # Should show 3.12.x

# Install dependencies
npm ci
cd backend && pip install -r requirements.txt
```

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run test            # Run tests
npm run lint            # Run linting
npm run type-check      # Run TypeScript checks

# Quality Assurance
npm run lint:fix        # Fix linting issues
npm run test:ci         # Run tests for CI
npm run docs:api        # Generate API documentation
npm run docs:build      # Build documentation
npm run clean           # Clean build artifacts
```

## 🔧 Build Configuration

### Electron Builder Configuration

The build configuration is defined in `electron-builder.json`:

```json
{
  "appId": "com.378x492.fraud-detection",
  "productName": "Simple378 Fraud Detection",
  "directories": {
    "output": "release"
  },
  "mac": {
    "target": [
      { "target": "dmg", "arch": ["x64", "arm64"] }
    ]
  },
  "win": {
    "target": "nsis"
  },
  "linux": {
    "target": "AppImage"
  }
}
```

### Platform-Specific Builds

- **macOS**: DMG files for both Intel (x64) and Apple Silicon (arm64)
- **Windows**: NSIS installer (.exe)
- **Linux**: AppImage format

## 🚀 Deployment Process

### Automatic Deployment

1. **Quality Gates**: All tests must pass, security scans must pass
2. **Build Validation**: Smoke tests verify application launches
3. **Asset Generation**: Checksums and build metadata are created
4. **Release Publishing**: Assets uploaded to GitHub Releases

### Manual Deployment

For manual builds:

```bash
# Build for all platforms
npm run build

# Build for specific platform
npm run build:electron -- --mac
npm run build:electron -- --win
npm run build:electron -- --linux
```

## 🔐 Security & Code Signing

### macOS Code Signing

The pipeline includes automated code signing for macOS:

- **Development**: Uses development certificates
- **Production**: Uses Apple Developer Program certificates
- **Notarization**: Automatic notarization with Apple

Required secrets:
- `APPLE_ID`: Apple ID email
- `APPLE_ID_PASSWORD`: App-specific password
- `APPLE_TEAM_ID`: Developer team ID

### Security Scanning

Automated security scans include:

- **NPM Audit**: Dependency vulnerability scanning
- **Snyk**: Advanced vulnerability detection
- **Trivy**: Container and filesystem scanning
- **CodeQL**: Static application security testing

## 📊 Monitoring & Analytics

### Build Metrics

The pipeline collects and reports:

- **Build Times**: Duration of each build stage
- **Test Coverage**: Code coverage percentages
- **Security Issues**: Vulnerability counts and severity
- **Platform Success**: Build success rates by platform

### Error Tracking

- **Build Failures**: Detailed error logs and diagnostics
- **Test Failures**: Failed test identification and reporting
- **Security Alerts**: Automated notifications for vulnerabilities

## 🔄 Release Management

### Semantic Release

The project uses semantic-release for automated versioning:

```json
{
  "branches": ["main", "develop"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/git",
    "@semantic-release/github"
  ]
}
```

### Release Types

- **Patch** (`0.0.x`): Bug fixes
- **Minor** (`0.x.0`): New features
- **Major** (`x.0.0`): Breaking changes

### Commit Convention

```bash
feat: add new feature
fix: bug fix
docs: documentation
style: formatting
refactor: code restructuring
test: testing
chore: maintenance
```

## 🐛 Troubleshooting

### Common Build Issues

#### macOS Code Signing
```bash
# Check certificates
security find-identity -v -p codesigning

# Manual notarization
xcrun notarytool submit "path/to/app.dmg" --keychain-profile "notarytool-password"
```

#### Windows Build Issues
```bash
# Clear electron cache
npx electron-builder install-app-deps --platform=win32
```

#### Linux Dependencies
```bash
# Install required libraries
sudo apt-get install libnss3-dev libatk-bridge2.0-dev libdrm2 libxkbcommon-dev
```

### CI/CD Debugging

#### Local Pipeline Testing
```bash
# Test GitHub Actions locally
npm install -g @zeit/ncc
npx act -j build

# Debug specific jobs
npx act -j quality-check
```

#### Build Artifacts
- Located in `release/` directory
- Checksums in `checksums.txt`
- Build metadata in `build-metadata.json`

## 📈 Performance Optimization

### Build Performance

- **Parallel Jobs**: Separate jobs for each platform
- **Caching**: Dependencies and build artifacts cached
- **Incremental Builds**: Only rebuild changed components

### Runtime Performance

- **Bundle Analysis**: Webpack bundle analyzer integration
- **Code Splitting**: Optimized chunk splitting
- **Compression**: Gzip compression for assets

## 🔗 Integration Points

### External Services

- **GitHub Releases**: Automated release publishing
- **Codecov**: Test coverage reporting
- **Snyk**: Security vulnerability monitoring
- **Trivy**: Container security scanning

### API Endpoints

- **Health Check**: `/health` for connectivity testing
- **Build Status**: Integration with CI status APIs
- **Release Hooks**: Webhooks for deployment notifications

## 📚 Documentation

### Generated Documentation

- **API Docs**: Auto-generated from code comments
- **User Guides**: Markdown-based documentation
- **Changelogs**: Automatically generated release notes

### Documentation Deployment

```bash
# Build and deploy docs
npm run docs:build
npm run docs:deploy
```

## 🎯 Success Metrics

### Quality Metrics
- ✅ **Test Coverage**: > 80% overall coverage
- ✅ **Security Score**: Zero critical vulnerabilities
- ✅ **Build Success Rate**: > 95% success rate
- ✅ **Performance Budget**: Meet all performance targets

### Delivery Metrics
- ✅ **Release Frequency**: Weekly releases
- ✅ **Time to Deploy**: < 30 minutes from commit to release
- ✅ **Platform Coverage**: All target platforms supported
- ✅ **Rollback Capability**: < 5 minutes rollback time

---

## 📞 Support

For CI/CD pipeline issues:

1. Check the [GitHub Actions logs](https://github.com/your-org/fraud-detection-desktop/actions)
2. Review the [troubleshooting guide](#-troubleshooting)
3. Create an issue with build logs and error messages
4. Contact the DevOps team for urgent production issues

**Last Updated**: December 2025
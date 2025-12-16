# Deployment Guide - Electron Desktop Application

**Last Updated**: December 8, 2025  
**Platform**: Electron desktop app for macOS, Windows, and Linux

> **Note**: This guide covers packaging and distributing the Electron desktop application. For development setup, see [Onboarding Guide](ONBOARDING.md).

---

## 📋 Prerequisites

### Development Environment
- **Node.js** 20+ (for Electron and React frontend)
- **Python** 3.12+ (for FastAPI backend, bundled in production)
- **macOS** (for macOS builds), **Windows** (for Windows builds), or **Linux** (for Linux builds)
- **Code Signing Certificates** (for production releases)

### Build Tools
- `electron-builder` (installed via npm)
- `PyInstaller` or `cx_Freeze` (for bundling Python backend)
- Platform-specific tools:
  - macOS: Xcode command line tools
  - Windows: Visual Studio Build Tools
  - Linux: Standard build tools (`build-essential`)

---

## 🏗️ Build Configuration

### Electron Builder Configuration

**File**: `electron-builder.json` or `package.json`

```json
{
  "appId": "com.378x492.frauddetection",
  "productName": "Simple378 Fraud Detection",
  "directories": {
    "output": "release",
    "buildResources": "build"
  },
  "files": [
    "frontend/dist/**/*",
    "electron/**/*",
    "backend-dist/**/*"
  ],
  "mac": {
    "category": "public.app-category.finance",
    "target": ["dmg", "zip"],
    "icon": "build/icon.icns",
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist",
    "entit lementsInherit": "build/entitlements.mac.plist"
  },
  "dmg": {
    "title": "Simple378 Fraud Detection",
    "icon": "build/icon.icns",
    "background": "build/dmg-background.png",
    "window": {
      "width": 540,
      "height": 380
    }
  },
  "win": {
    "target": ["nsis", "portable"],
    "icon": "build/icon.ico",
    "certificateFile": "certs/windows-code-signing.pfx",
    "certificatePassword": "${WINDOWS_CERT_PASSWORD}"
  },
  "linux": {
    "target": ["AppImage", "deb", "rpm"],
    "icon": "build/icon.png",
    "category": "Office",
    "synopsis": "Financial fraud detection desktop application"
  }
}
```

---

## 📦 Building the Application

### Step 1: Build Frontend

```bash
cd frontend
npm install
npm run build  # Creates frontend/dist/
```

### Step 2: Bundle Python Backend

```bash
cd backend
pip install pyinstaller
pyinstaller --onedir --name 378x492-backend main.py

# Or use spec file
pyinstaller pyinstaller.spec

# Output: backend/dist/378x492-backend/
```

### Step 3: Copy Backend to Electron Project

```bash
mkdir -p backend-dist
cp -r backend/dist/378x492-backend backend-dist/
```

### Step 4: Build Electron App

```bash
# Build for current platform
npm run electron:build

# Build for specific platform
npm run electron:build:mac    # macOS
npm run electron:build:win    # Windows
npm run electron:build:linux  # Linux

# Build for all platforms (requires macOS, Windows, Linux)
npm run electron:build:all
```

**Output**: Installers in `release/` directory

---

## 🔐 Code Signing

### macOS Code Signing

**Requirements**:
- Apple Developer Account ($99/year)
- Developer ID Application certificate

**Steps**:
1. **Generate Certificate Signing Request (CSR)**
   ```bash
   # In Keychain Access: Certificate Assistant → Request Certificate from CA
   ```

2. **Download Developer ID Certificate**
   - Sign in to Apple Developer portal
   - Certificates → Create → Developer ID Application
   - Download and install in Keychain

3. **Configure electron-builder**
   ```json
   {
     "mac": {
       "identity": "Developer ID Application: Your Name (TEAMID)"
     }
   }
   ```

4. **Sign the App**
   ```bash
   # Automatic via electron-builder
   CSC_LINK=certs/mac-developer-id.p12 \
   CSC_KEY_PASSWORD=your-password \
   npm run electron:build:mac
   ```

5. **Notarize with Apple**
   ```bash
   # Automatic via electron-builder
   APPLE_ID=your@email.com \
   APPLE_ID_PASSWORD=app-specific-password \
   APPLE_TEAM_ID=TEAMID \
   npm run electron:build:mac
   ```

### Windows Code Signing

**Requirements**:
- Code Signing Certificate from trusted CA (DigiCert, Comodo, etc.)

**Steps**:
1. **Obtain Certificate** (.pfx file)

2. **Configure electron-builder**
   ```json
   {
     "win": {
       "certificateFile": "certs/windows-code-signing.pfx",
       "certificatePassword": "${WINDOWS_CERT_PASSWORD}"
     }
   }
   ```

3. **Sign the App**
   ```bash
   WINDOWS_CERT_PASSWORD=your-password npm run electron:build:win
   ```

### Linux Packaging (No Code Signing Required)

```bash
npm run electron:build:linux
```

---

## 🚀 Distribution

### Release Channels

**Stable**: Production releases (v1.0.0, v1.1.0, etc.)  
**Beta**: Pre-release testing (v1.1.0-beta.1)  
**Dev**: Development builds (v1.1.0-dev.20241208)

### Auto-Update Server

**Option 1: GitHub Releases** (Free, recommended)

1. **Create GitHub Release**
   ```bash
   gh release create v1.0.0 \
     release/Simple378-1.0.0.dmg \
     release/Simple378-Setup-1.0.0.exe \
     release/Simple378-1.0.0.AppImage
   ```

2. **Configure electron-updater**
   ```javascript
   // electron/main.js
   const { autoUpdater } = require('electron-updater');
   
   autoUpdater.setFeedURL({
     provider: 'github',
     owner: 'your-org',
     repo: '378x492'
   });
   
   autoUpdater.checkForUpdatesAndNotify();
   ```

**Option 2: Custom Update Server**

1. **Set up update server** (AWS S3, Azure Blob, or custom)

2. **Configure electron-updater**
   ```javascript
   autoUpdater.setFeedURL({
     provider: 'generic',
     url: 'https://updates.378x492.com'
   });
   ```

---

## ✅ Production Checklist

### Pre-Release
- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md`
- [ ] Run full test suite
- [ ] Build for all platforms (macOS, Windows, Linux)
- [ ] Code sign all builds
- [ ] Notarize macOS build
- [ ] Test installers on clean VMs

### Security
- [ ] Verify SQLCipher encryption works
- [ ] Test master password flow
- [ ] Verify file encryption
- [ ] Check IPC security (no XSS/injection)
- [ ] Audit dependencies (`npm audit`, `pip-audit`)

### Performance
- [ ] Measure app startup time (< 3 seconds)
- [ ] Check memory usage (< 500MB idle)
- [ ] Test with large databases (10,000+ cases)
- [ ] Verify offline functionality

### Distribution
- [ ] Upload to update server (GitHub Releases or custom)
- [ ] Update website download links
- [ ] Prepare release notes
- [ ] Notify users (email, in-app notification)

---

## 🔧 Troubleshooting

### Build Fails

**Issue**: `electron-builder` fails with permission error

**Solution**:
```bash
# macOS/Linux
chmod +x electron/main.js
chmod +x backend-dist/378x492-backend

# Check build logs
DEBUG=electron-builder npm run electron:build
```

### Code Signing Fails

**macOS**:
```bash
# Verify certificate
security find-identity -v -p codesigning

# Check entitlements
codesign -d --entitlements :- /path/to/Simple378.app
```

**Windows**:
```bash
# Verify certificate
certutil -dump your-cert.pfx
```

### App Won't Launch

**Check logs**:
- macOS: `~/Library/Logs/Simple378/`
- Windows: `%APPDATA%\Simple378\logs\`
- Linux: `~/.config/Simple378/logs/`

**Common issues**:
- Missing Python backend bundle
- SQLCipher library not found
- Permissions error (macOS Gatekeeper)

---

## 📊 Monitoring Deployment

### Update Adoption Tracking

```javascript
// electron/main.js
const { analytics } = require('./analytics');

autoUpdater.on('update-downloaded', () => {
  analytics.track('update_downloaded', {
    version: app.getVersion(),
    platform: process.platform
  });
});
```

### Error Tracking

```javascript
// electron/main.js
const Sentry = require('@sentry/electron');

Sentry.init({
  dsn: 'https://your-sentry-dsn',
  environment: process.env.NODE_ENV
});
```

---

## 📚 Additional Resources

- [electron-builder Documentation](https://www.electron.build/)
- [Electron Auto-Update Guide](https://www.electronjs.org/docs/latest/api/auto-updater)
- [macOS Notarization Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [Windows Code Signing](https://docs.microsoft.com/en-us/windows/win32/seccrypto/signtool)

---

**For development setup, see**: [Onboarding Guide](ONBOARDING.md)  
**For user installation help, see**: [user-guides/installation.md](user-guides/installation.md)

# Installation Guide

This guide will walk you through installing Simple378 Fraud Detection **desktop application** on your system.

> **Note**: Simple378 is a cross-platform Electron desktop application with an embedded Python backend and encrypted local database.

## 📋 System Requirements

### Minimum Requirements
- **Operating System**: macOS 10.15+, Windows 10+, Ubuntu 18.04+
- **Processor**: Intel Core i5 or equivalent (Apple Silicon supported on macOS)
- **Memory**: 8GB RAM
- **Storage**: 10GB free disk space
- **Python**: Python 3.12+ (bundled with app, no manual installation needed)

### Recommended Requirements
- **Operating System**: macOS 13+, Windows 11+, Ubuntu 22.04+
- **Processor**: Intel Core i7, Apple M1/M2, or AMD Ryzen 5
- **Memory**: 16GB RAM
- **Storage**: 20GB SSD storage

## 🚀 Installation Steps

### Step 1: Download Simple378 Desktop App

1. Visit the [GitHub Releases page](https://github.com/your-org/378x492/releases)
2. Download the appropriate installer for your operating system:

**macOS**:
- Intel Macs: `Simple378-1.0.0.dmg`
- Apple Silicon (M1/M2): `Simple378-1.0.0-arm64.dmg`

**Windows**:
- Windows 10/11: `Simple378-Setup-1.0.0.exe`

**Linux**:
- AppImage (Universal): `Simple378-1.0.0.AppImage`
- Debian/Ubuntu: `378x492_1.0.0_amd64.deb`

### Step 2: Install the Desktop Application

#### macOS Installation

1. **Open the DMG file**
   ```bash
   # Or double-click the downloaded .dmg file
   open Simple378-1.0.0.dmg
   ```

2. **Drag Simple378 to Applications**
   - Drag the Simple378 Fraud Detection icon to your Applications folder
   - Eject the installer disk image

3. **First Launch (Security)**
   - Right-click Simple378 in Applications
   - Select "Open" (required first time on newer macOS)
   - Click "Open" in security dialog

4. **Grant Permissions** (if prompted)
   - Allow file system access
   - Allow notifications (optional)

#### Windows Installation

1. **Run the Installer**
   ```powershell
   # Or double-click Simple378-Setup-1.0.0.exe
   .\Simple378-Setup-1.0.0.exe
   ```

2. **Follow Installation Wizard**
   - Accept license agreement
   - Choose installation directory (default: `C:\Program Files\Simple378`) 
   - Select "Create desktop shortcut" (recommended)
   - Click "Install"

3. **Windows Defender SmartScreen** (if shown)
   - Click "More info"
   - Click "Run anyway"
   - *(App will be code-signed in future releases)*

4. **Launch Application**
   - From Start Menu: Search "Simple378"
   - Or use desktop shortcut

#### Linux Installation

**AppImage** (Recommended - Universal):
```bash
# Make executable
chmod +x Simple378-1.0.0.AppImage

# Run application
./Simple378-1.0.0.AppImage

# Optional: Integrate with system
./Simple378-1.0.0.AppImage --appimage-integrate
```

**Debian/Ubuntu (.deb)**:
```bash
# Install via dpkg
sudo dpkg -i 378x492_1.0.0_amd64.deb

# Fix dependencies if needed
sudo apt-get install -f

# Launch
378x492
```

**Fedora/RHEL (if .rpm available)**:
```bash
sudo rpm -i 378x492-1.0.0.x86_64.rpm
```

### Step 3: Initial Setup

When you first launch Simple378, you'll be guided through the initial setup:

1. **Welcome Screen**: Introduction to Simple378
2. **License Agreement**: Accept the terms of use
3. **Administrator Account**: Create your admin account
4. **Database Setup**: Configure local database encryption
5. **Security Settings**: Set up security preferences
6. **System Check**: Verify system compatibility

## 🔧 Post-Installation Configuration

### Database Encryption Setup

Simple378 uses SQLCipher for database encryption. During setup:

1. Choose a strong master password
2. Store the recovery key in a secure location
3. Set up automatic key rotation (recommended)

### Security Configuration

Configure security settings:

1. **Session Timeout**: Set automatic logout time
2. **Password Policy**: Configure password requirements
3. **File Encryption**: Set up secure file storage
4. **Network Security**: Configure proxy settings if needed

### Performance Optimization

Optimize for your system:

1. **Memory Allocation**: Set appropriate memory limits
2. **Cache Settings**: Configure caching preferences
3. **Background Processing**: Enable/disable background tasks
4. **Update Settings**: Configure automatic updates

## 🔍 Verification

After installation, verify everything is working:

1. **Application Launch**: Simple378 should start without errors
2. **Database Connection**: Initial database setup should complete
3. **Security Features**: Encryption should be active
4. **Network Connectivity**: Application should connect to update servers

## 🐛 Troubleshooting Installation Issues

### Common Issues

#### "Application won't start"
- **macOS**: Check Gatekeeper settings
- **Windows**: Run as administrator or check antivirus
- **Linux**: Check file permissions and dependencies

#### "Database encryption failed"
- Ensure you have sufficient disk space
- Try a different master password
- Check file system permissions

#### "Network connection failed"
- Verify internet connectivity
- Check firewall settings
- Configure proxy settings if behind corporate firewall

### Getting Help

If you encounter issues:
1. Check the [Troubleshooting Guide](../deployment/troubleshooting.md)
2. Review the application logs
3. Contact support with error details

## 🔄 Updates

Simple378 includes automatic update functionality:

- **Automatic Updates**: Enabled by default
- **Manual Updates**: Check for updates in Settings
- **Update Channels**: Stable, Beta, and Development releases

## 🏁 Next Steps

After successful installation:

1. Complete the [First Case Tutorial](first-case.md)
2. Review the [Basic Usage Guide](basic-usage.md)
3. Configure additional users and permissions
4. Set up data import if migrating from another system

## 📞 Support

- **Documentation**: [Full Documentation](../README.md)
- **Community**: Join our user community
- **Professional Support**: Enterprise support options available

---

**Installation complete?** Proceed to the [First Case Tutorial](first-case.md) to create your first fraud investigation case!
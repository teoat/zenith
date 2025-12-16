# Build Assets Directory

This directory contains assets for electron-builder packaging.

## Required Files

### Icons

**macOS:**
- `icon.icns` - macOS application icon (512x512 @2x required)
- Generate from 1024x1024 PNG using: `npm install -g electron-icon-maker`

**Windows:**
- `icon.ico` - Windows application icon (256x256 recommended)
- Include multiple sizes: 16, 32, 48, 64, 128, 256

**Linux:**
- `icons/` - Directory with various PNG sizes
  - `16x16.png`
  - `32x32.png`
  - `48x48.png`
  - `64x64.png`
  - `128x128.png`
  - `256x256.png`
  - `512x512.png`

### Configuration

- `entitlements.mac.plist` - macOS app entitlements for hardened runtime

## Generating Icons

From a 1024x1024 source PNG:

```bash
# Install icon generator
npm install -g electron-icon-maker

# Generate all platform icons
electron-icon-maker --input=icon-source.png --output=./build
```

This will create:
- `icon.icns` for macOS
- `icon.ico` for Windows  
- `icons/*.png` for Linux

## Current Status

- [x] entitlements.mac.plist ✅ Created
- [ ] icon.icns ⚠️ Placeholder needed
- [ ] icon.ico ⚠️ Placeholder needed
- [ ] icons/ ⚠️ Directory needed

**Next:** Create source icon (1024x1024 PNG) and generate platform icons.

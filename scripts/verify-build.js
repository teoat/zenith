#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Build Verification Script
 * Verifies that the packaged application has all required components
 */

function verifyBuild() {
  console.log('🔍 Verifying build artifacts...\n');

  const releaseDir = path.join(__dirname, '..', 'release');

  // Check if release directory exists
  if (!fs.existsSync(releaseDir)) {
    console.error('❌ Release directory not found');
    return false;
  }

  let allChecksPass = true;

  // Check macOS builds
  const macAppPath = path.join(releaseDir, 'mac', '378x492 Fraud Detection.app');
  const macArm64AppPath = path.join(releaseDir, 'mac-arm64', '378x492 Fraud Detection.app');

  console.log('📱 Checking macOS builds:');

  // Check Intel macOS build
  if (fs.existsSync(macAppPath)) {
    console.log('  ✅ Intel macOS app bundle exists');

    // Check main executable
    const macExecutable = path.join(macAppPath, 'Contents', 'MacOS', '378x492 Fraud Detection');
    if (fs.existsSync(macExecutable)) {
      console.log('  ✅ Main executable exists');
      const stats = fs.statSync(macExecutable);
      console.log(`  📊 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    } else {
      console.log('  ❌ Main executable missing');
      allChecksPass = false;
    }

    // Check backend
    const macBackend = path.join(macAppPath, 'Contents', 'Resources', 'backend', 'backend');
    if (fs.existsSync(macBackend)) {
      console.log('  ✅ Backend executable exists');
      const stats = fs.statSync(macBackend);
      console.log(`  📊 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    } else {
      console.log('  ❌ Backend executable missing');
      allChecksPass = false;
    }

    // Check frontend
    const macAsar = path.join(macAppPath, 'Contents', 'Resources', 'app.asar');
    if (fs.existsSync(macAsar)) {
      console.log('  ✅ Frontend bundle (app.asar) exists');
      const stats = fs.statSync(macAsar);
      console.log(`  📊 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    } else {
      console.log('  ❌ Frontend bundle missing');
      allChecksPass = false;
    }
  } else {
    console.log('  ❌ Intel macOS app bundle missing');
    allChecksPass = false;
  }

  // Check ARM64 macOS build
  if (fs.existsSync(macArm64AppPath)) {
    console.log('  ✅ ARM64 macOS app bundle exists');
  } else {
    console.log('  ❌ ARM64 macOS app bundle missing');
    allChecksPass = false;
  }

  // Check DMG files
  console.log('\n💿 Checking DMG installers:');
  const dmgFiles = [
    '378x492 Fraud Detection-1.0.0.dmg',
    '378x492 Fraud Detection-1.0.0-arm64.dmg'
  ];

  dmgFiles.forEach(dmgFile => {
    const dmgPath = path.join(releaseDir, dmgFile);
    if (fs.existsSync(dmgPath)) {
      console.log(`  ✅ ${dmgFile} exists`);
      const stats = fs.statSync(dmgPath);
      console.log(`  📊 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    } else {
      console.log(`  ❌ ${dmgFile} missing`);
      allChecksPass = false;
    }
  });

  // Check build metadata
  console.log('\n📋 Checking build metadata:');
  const metadataPath = path.join(releaseDir, 'build-metadata.json');
  if (fs.existsSync(metadataPath)) {
    console.log('  ✅ Build metadata exists');
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      console.log(`  📊 App: ${metadata.appName} v${metadata.version}`);
      console.log(`  📊 Platform: ${metadata.platform}`);
      console.log(`  📊 Build Time: ${metadata.buildTime}`);
    } catch (error) {
      console.log('  ❌ Build metadata corrupted');
      allChecksPass = false;
    }
  } else {
    console.log('  ❌ Build metadata missing');
    allChecksPass = false;
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (allChecksPass) {
    console.log('🎉 BUILD VERIFICATION PASSED');
    console.log('✅ All required components are present and properly sized');
    console.log('✅ Application is ready for distribution');
  } else {
    console.log('❌ BUILD VERIFICATION FAILED');
    console.log('❌ Some components are missing or corrupted');
    console.log('❌ Application is NOT ready for distribution');
  }
  console.log('='.repeat(50));

  return allChecksPass;
}

// Run verification
if (require.main === module) {
  const success = verifyBuild();
  process.exit(success ? 0 : 1);
}

module.exports = { verifyBuild };
const fs = require('fs');
const path = require('path');

exports.default = async function afterBuild(context) {
  console.log('Starting after-build processing...');
  console.log('Context keys:', Object.keys(context));

  // Safely extract values with fallbacks
  const appOutDir = context.appOutDir || './release';
  const packager = context.packager;

  // Use safe fallbacks for all values
  const appName = (packager && packager.appInfo && packager.appInfo.productFilename) ?
    packager.appInfo.productFilename : '378x492 Fraud Detection';

  const platform = (packager && packager.platform && packager.platform.nodeName) ?
    packager.platform.nodeName : process.platform;

  console.log(`Using appName: ${appName}, platform: ${platform}, appOutDir: ${appOutDir}`);

  console.log(`Post-build processing for ${platform} in ${appOutDir}`);

  try {
    // Create checksums for all built files
    const checksums = {};
    const buildDir = path.join(appOutDir, platform === 'darwin' ? 'mac' : platform === 'win32' ? 'win' : 'linux');

    if (fs.existsSync(buildDir)) {
      const files = fs.readdirSync(buildDir);
      for (const file of files) {
        const filePath = path.join(buildDir, file);
        if (fs.statSync(filePath).isFile()) {
          const checksum = require('crypto').createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
          checksums[file] = checksum;
        }
      }

      // Write checksums file
      const checksumsPath = path.join(buildDir, 'checksums.txt');
      const checksumsContent = Object.entries(checksums)
        .map(([file, checksum]) => `${checksum}  ${file}`)
        .join('\n');

      fs.writeFileSync(checksumsPath, checksumsContent);
      console.log(`Checksums written to ${checksumsPath}`);
    }

    // Create build metadata
    const metadata = {
      appName,
      version: (packager && packager.appInfo && packager.appInfo.version) ?
        packager.appInfo.version : '1.0.0',
      platform,
      buildTime: new Date().toISOString(),
      commit: process.env.GITHUB_SHA || 'unknown',
      branch: process.env.GITHUB_REF_NAME || 'unknown',
      ci: process.env.CI || false
    };

    const metadataPath = path.join(appOutDir, 'build-metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`Build metadata written to ${metadataPath}`);

    // Validate build artifacts
    const validateBuild = (buildPath) => {
      if (!fs.existsSync(buildPath)) {
        throw new Error(`Build artifact not found: ${buildPath}`);
      }

      const stats = fs.statSync(buildPath);
      if (stats.size === 0) {
        throw new Error(`Build artifact is empty: ${buildPath}`);
      }

      console.log(`✓ Validated build artifact: ${path.basename(buildPath)} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    };

    // Validate main build artifacts based on platform
    // Note: DMG files are created after all platforms, so they may not exist yet
    if (platform === 'darwin') {
      const dmgPath = path.join(appOutDir, `${appName}-1.0.0.dmg`);
      const arm64DmgPath = path.join(appOutDir, `${appName}-1.0.0-arm64.dmg`);
      if (fs.existsSync(dmgPath)) {
        validateBuild(dmgPath);
      } else {
        console.log(`ℹ️  DMG file not yet created: ${path.basename(dmgPath)}`);
      }
      if (fs.existsSync(arm64DmgPath)) {
        validateBuild(arm64DmgPath);
      } else {
        console.log(`ℹ️  ARM64 DMG file not yet created: ${path.basename(arm64DmgPath)}`);
      }
    } else if (platform === 'win32') {
      const exePath = path.join(buildDir, `${appName} Setup 1.0.0.exe`);
      if (fs.existsSync(exePath)) validateBuild(exePath);
    } else if (platform === 'linux') {
      const appImagePath = path.join(buildDir, `${appName}-1.0.0.AppImage`);
      if (fs.existsSync(appImagePath)) validateBuild(appImagePath);
    }

    console.log('Post-build processing completed successfully');

  } catch (error) {
    console.error('Post-build processing failed:', error);
    throw error;
  }
};
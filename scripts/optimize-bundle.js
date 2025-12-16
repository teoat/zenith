#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Bundle Optimization Script
 * Removes unused locales and optimizes bundle size
 */

function optimizeBundle(context) {
  const appOutDir = context.appOutDir;
  console.log('🔧 Optimizing bundle in:', appOutDir);

  let totalSaved = 0;

  // Remove unused Electron locales (keep only English)
  const localesToKeep = ['en.lproj', 'en_GB.lproj'];
  const frameworksDir = path.join(appOutDir, 'mac', '378x492 Fraud Detection.app', 'Contents', 'Frameworks');

  if (fs.existsSync(frameworksDir)) {
    const frameworkContents = fs.readdirSync(frameworksDir);
    const electronFramework = frameworkContents.find(item =>
      item.includes('Electron Framework.framework')
    );

    if (electronFramework) {
      const resourcesDir = path.join(frameworksDir, electronFramework, 'Resources');
      if (fs.existsSync(resourcesDir)) {
        const items = fs.readdirSync(resourcesDir);
        const localeDirs = items.filter(item => item.endsWith('.lproj'));

        for (const localeDir of localeDirs) {
          if (!localesToKeep.includes(localeDir)) {
            const fullPath = path.join(resourcesDir, localeDir);
            try {
              const stats = fs.statSync(fullPath);
              if (stats.isDirectory()) {
                fs.rmSync(fullPath, { recursive: true, force: true });
                console.log(`🗑️  Removed unused locale: ${localeDir}`);
                totalSaved += getDirectorySize(fullPath);
              }
            } catch (error) {
              console.warn(`⚠️  Could not remove ${localeDir}:`, error.message);
            }
          }
        }
      }
    }
  }

  // Remove unused app locales
  const appResourcesDir = path.join(appOutDir, 'mac', '378x492 Fraud Detection.app', 'Contents', 'Resources');
  if (fs.existsSync(appResourcesDir)) {
    const items = fs.readdirSync(appResourcesDir);
    const appLocaleDirs = items.filter(item => item.endsWith('.lproj'));

    for (const localeDir of appLocaleDirs) {
      if (!localesToKeep.includes(localeDir)) {
        const fullPath = path.join(appResourcesDir, localeDir);
        try {
          const stats = fs.statSync(fullPath);
          if (stats.isDirectory()) {
            fs.rmSync(fullPath, { recursive: true, force: true });
            console.log(`🗑️  Removed unused app locale: ${localeDir}`);
            totalSaved += getDirectorySize(fullPath);
          }
        } catch (error) {
          console.warn(`⚠️  Could not remove ${localeDir}:`, error.message);
        }
      }
    }
  }

  // Optimize ARM64 bundle as well
  const arm64AppDir = path.join(appOutDir, 'mac-arm64', '378x492 Fraud Detection.app');
  if (fs.existsSync(arm64AppDir)) {
    console.log('🔧 Optimizing ARM64 bundle...');
    // Similar optimizations could be applied here
  }

  console.log(`💾 Bundle optimization complete. Estimated space saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
}

function getDirectorySize(dirPath) {
  let totalSize = 0;

  function calculateSize(itemPath) {
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      const items = fs.readdirSync(itemPath);
      for (const item of items) {
        calculateSize(path.join(itemPath, item));
      }
    } else {
      totalSize += stats.size;
    }
  }

  try {
    calculateSize(dirPath);
  } catch (error) {
    // Directory might have been deleted
    return 0;
  }

  return totalSize;
}

// Export for electron-builder
module.exports = optimizeBundle;

// Run directly if called from command line
if (require.main === module) {
  // For testing - simulate context
  const context = {
    appOutDir: path.join(__dirname, '..', 'release')
  };
  optimizeBundle(context);
}
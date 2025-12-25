const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;

  if (electronPlatformName !== 'darwin') {
    return;
  }

  if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASSWORD) {
    console.warn('Skipping notarization: APPLE_ID or APPLE_ID_PASSWORD not set.');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = `${appOutDir}/${appName}.app`;

  console.log(`Notarizing ${appName} at ${appPath}`);

  try {
    await notarize({
      appBundleId: 'com.378x492.fraud-detection',
      appPath: appPath,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_ID_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    });

    console.log('Notarization completed successfully');
  } catch (error) {
    console.error('Notarization failed:', error);
    // Don't fail the build if notarization fails in CI
    if (process.env.CI) {
      console.warn('Skipping notarization failure in CI environment');
    } else {
      throw error;
    }
  }
};
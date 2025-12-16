const { autoUpdater } = require('electron-updater');
const { BrowserWindow, dialog, app } = require('electron');
const log = require('electron-log');

// Configure logging
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.info('Auto-updater initialized');

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  log.info('Update available:', info.version);
  // Send to renderer
  BrowserWindow.getAllWindows().forEach(window => {
    window.webContents.send('app:update-available', info);
  });
});

autoUpdater.on('update-not-available', (info) => {
  log.info('Update not available:', info.version);
});

autoUpdater.on('error', (err) => {
  log.error('Update error:', err);
  BrowserWindow.getAllWindows().forEach(window => {
    window.webContents.send('app:update-error', err.message);
  });
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  log.info(log_message);

  // Send progress to renderer
  BrowserWindow.getAllWindows().forEach(window => {
    window.webContents.send('app:update-progress', progressObj);
  });
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded:', info.version);

  // Send to renderer
  BrowserWindow.getAllWindows().forEach(window => {
    window.webContents.send('app:update-downloaded', info);
  });

  // Show restart dialog
  const dialogOpts = {
    type: 'info',
    buttons: ['Restart', 'Later'],
    title: 'Application Update',
    message: 'A new version has been downloaded',
    detail: 'Restart the application to apply the updates.'
  };

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

/**
 * Check for updates
 */
function checkForUpdates() {
  if (process.env.NODE_ENV === 'development') {
    log.info('Skipping update check in development mode');
    return;
  }

  autoUpdater.checkForUpdatesAndNotify();
}

/**
 * Check for updates manually (user triggered)
 */
function checkForUpdatesManual() {
  autoUpdater.checkForUpdates();
}

/**
 * Get current version
 */
function getCurrentVersion() {
  return app.getVersion();
}

/**
 * Get update status
 */
function getUpdateStatus() {
  return {
    currentVersion: getCurrentVersion(),
    updateAvailable: false, // Would be set by events
    downloading: false,
    downloaded: false
  };
}

module.exports = {
  checkForUpdates,
  checkForUpdatesManual,
  getCurrentVersion,
  getUpdateStatus
};
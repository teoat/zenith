const { Notification, nativeImage } = require('electron');
const path = require('path');

let notificationSettings = {
  enabled: true,
  sound: true,
  showPreviews: true
};

function showNotification(title, body, options = {}) {
  if (!Notification.isSupported() || !notificationSettings.enabled) {
    return false;
  }

  // Check if system is in Do Not Disturb mode (basic check)
  if (process.platform === 'darwin') {
    // On macOS, we could check Do Not Disturb status via system calls
    // For now, we'll just proceed
  }

  const notificationOptions = {
    title,
    body: notificationSettings.showPreviews ? body : 'New notification',
    silent: !notificationSettings.sound,
    icon: path.join(__dirname, '../build/icon.png'),
    ...options
  };

  const notification = new Notification(notificationOptions);

  if (options.onClick) {
    notification.on('click', options.onClick);
  }

  // Handle notification close
  notification.on('close', () => {
    // Could track notification dismissal
  });

  notification.show();
  return true;
}

function showFraudAlert(caseId, riskLevel, description) {
  const title = `378x492 Fraud Alert - ${riskLevel.toUpperCase()} Risk`;
  const body = `Case ${caseId}: ${description}`;

  return showNotification(title, body, {
    urgency: riskLevel === 'high' ? 'critical' : 'normal',
    onClick: () => {
      // Send message to open case
      if (global.mainWindow) {
        global.mainWindow.show();
        global.mainWindow.webContents.send('notification:case-clicked', caseId);
      }
    }
  });
}

function showAnalysisComplete(caseId, findings) {
  const title = 'Analysis Complete';
  const body = `Analysis finished for case ${caseId}. ${findings} findings detected.`;

  return showNotification(title, body, {
    onClick: () => {
      if (global.mainWindow) {
        global.mainWindow.show();
        global.mainWindow.webContents.send('notification:analysis-complete', caseId);
      }
    }
  });
}

function updateNotificationSettings(settings) {
  notificationSettings = { ...notificationSettings, ...settings };
}

function getNotificationSettings() {
  return { ...notificationSettings };
}

function setupNotificationHandlers(ipcMain) {
   ipcMain.handle('notification:show', (event, { title, body, options }) => {
       const success = showNotification(title, body, options);
       return { success };
   });

   ipcMain.handle('notification:fraud-alert', (event, { caseId, riskLevel, description }) => {
       const success = showFraudAlert(caseId, riskLevel, description);
       return { success };
   });

   ipcMain.handle('notification:analysis-complete', (event, { caseId, findings }) => {
       const success = showAnalysisComplete(caseId, findings);
       return { success };
   });

   ipcMain.handle('notification:get-settings', () => {
       return { success: true, data: getNotificationSettings() };
   });

   ipcMain.handle('notification:update-settings', (event, settings) => {
       updateNotificationSettings(settings);
       return { success: true };
   });
}

module.exports = {
  showNotification,
  showFraudAlert,
  showAnalysisComplete,
  updateNotificationSettings,
  getNotificationSettings,
  setupNotificationHandlers
};

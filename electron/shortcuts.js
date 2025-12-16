const { globalShortcut } = require('electron');

let shortcuts = {
  'toggle-visibility': 'CommandOrControl+Shift+Space',
  'new-case': 'CommandOrControl+Shift+N',
  'run-analysis': 'CommandOrControl+Shift+R',
  'evidence-browser': 'CommandOrControl+Shift+E',
  'generate-report': 'CommandOrControl+Shift+G'
};

/**
 * Register global keyboard shortcuts
 * @param {BrowserWindow} mainWindow - Reference to main window
 */
function registerShortcuts(mainWindow) {
  // Toggle Visibility
  globalShortcut.register(shortcuts['toggle-visibility'], () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // New Case
  globalShortcut.register(shortcuts['new-case'], () => {
    mainWindow.show();
    mainWindow.webContents.send('shortcut:new-case');
  });

  // Run Analysis
  globalShortcut.register(shortcuts['run-analysis'], () => {
    mainWindow.show();
    mainWindow.webContents.send('shortcut:run-analysis');
  });

  // Evidence Browser
  globalShortcut.register(shortcuts['evidence-browser'], () => {
    mainWindow.show();
    mainWindow.webContents.send('shortcut:evidence-browser');
  });

  // Generate Report
  globalShortcut.register(shortcuts['generate-report'], () => {
    mainWindow.show();
    mainWindow.webContents.send('shortcut:generate-report');
  });

  console.log('✅ Global shortcuts registered');
}

/**
 * Update shortcut preferences
 * @param {Object} newShortcuts - New shortcut mappings
 */
function updateShortcuts(newShortcuts) {
  // Unregister old shortcuts
  unregisterShortcuts();

  // Update shortcuts object
  shortcuts = { ...shortcuts, ...newShortcuts };

  // Re-register with new shortcuts
  // Note: This would need mainWindow reference, so it's called from main.js
}

/**
 * Get current shortcuts
 */
function getShortcuts() {
  return { ...shortcuts };
}

/**
 * Unregister all shortcuts
 */
function unregisterShortcuts() {
  globalShortcut.unregisterAll();
  console.log('Global shortcuts unregistered');
}

/**
 * Check if a shortcut is available
 * @param {string} accelerator - Shortcut accelerator
 */
function isShortcutAvailable(accelerator) {
  return !globalShortcut.isRegistered(accelerator);
}

module.exports = {
  registerShortcuts,
  unregisterShortcuts,
  updateShortcuts,
  getShortcuts,
  isShortcutAvailable
};

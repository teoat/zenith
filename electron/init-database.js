// electron/init-database.js
// Database initialization for Electron - relies on backend for actual database operations
// This file now only handles offline queue and local storage setup

const path = require('path');
const fs = require('fs').promises;
const { app } = require('electron');

async function initDatabase() {
  try {
    // Create user data directory if it doesn't exist
    const userDataPath = app.getPath('userData');
    await fs.mkdir(userDataPath, { recursive: true });

    // Create offline storage directory
    const offlinePath = path.join(userDataPath, 'offline-storage');
    await fs.mkdir(offlinePath, { recursive: true });

    // Create settings file if it doesn't exist
    const settingsPath = path.join(userDataPath, 'settings.json');
    try {
      await fs.access(settingsPath);
    } catch {
      const defaultSettings = {
        theme: 'system',
        autoStart: false,
        notifications: true,
        maxMemory: 512,
        backupFrequency: 'daily',
        offlineMode: false,
        syncEnabled: true
      };
      await fs.writeFile(settingsPath, JSON.stringify(defaultSettings, null, 2));
    }

    // Create offline queue file if it doesn't exist
    const queuePath = path.join(offlinePath, 'sync-queue.json');
    try {
      await fs.access(queuePath);
    } catch {
      await fs.writeFile(queuePath, JSON.stringify([]));
    }

    console.log('Electron database/storage initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Electron storage:', error);
    return false;
  }
}

module.exports = { initDatabase };
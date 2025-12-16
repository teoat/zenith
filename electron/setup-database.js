// electron/setup-database.js
// Database setup and initialization script for first-time setup

const { openDatabase, closeDatabase } = require('./database');
const { runMigrations } = require('./migrations/runner');
const { initDatabase } = require('./init-database');
const path = require('path');
const fs = require('fs').promises;
const { app } = require('electron');

/**
 * Setup database for first-time use
 * @param {string} masterPassword - Master password for encryption
 * @returns {Promise<boolean>} Success status
 */
async function setupDatabase(masterPassword) {
  try {
    console.log('🔐 Setting up encrypted database...');

    // Initialize storage directories
    await initDatabase();

    // Check if database already exists
    const dbPath = path.join(app.getPath('userData'), 'frauddb.db');
    const encryptedDbPath = path.join(app.getPath('userData'), 'frauddb.enc');

    let dbExists = false;
    try {
      await fs.access(encryptedDbPath);
      dbExists = true;
    } catch (err) {
      // Database doesn't exist, will create new one
    }

    if (dbExists) {
      console.log('Database already exists, verifying password...');
      // Try to open existing database to verify password
      const db = await openDatabase(masterPassword);
      await closeDatabase(masterPassword);
      console.log('✅ Database password verified');
      return true;
    }

    // Create new database
    console.log('Creating new encrypted database...');
    const db = await openDatabase(masterPassword);

    // Run migrations
    runMigrations(db);

    // Close and encrypt
    await closeDatabase(masterPassword);

    console.log('✅ Database setup complete');
    return true;

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return false;
  }
}

/**
 * Verify database can be opened with given password
 * @param {string} masterPassword - Master password to verify
 * @returns {Promise<boolean>} Verification status
 */
async function verifyDatabasePassword(masterPassword) {
  try {
    const db = await openDatabase(masterPassword);
    await closeDatabase(masterPassword);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Change database master password
 * @param {string} currentPassword - Current master password
 * @param {string} newPassword - New master password
 * @returns {Promise<boolean>} Success status
 */
async function changeDatabasePassword(currentPassword, newPassword) {
  try {
    console.log('🔄 Changing database master password...');

    // Open with current password
    const db = await openDatabase(currentPassword);

    // Close with new password (this encrypts with new password)
    await closeDatabase(newPassword);

    console.log('✅ Database password changed successfully');
    return true;

  } catch (error) {
    console.error('❌ Failed to change database password:', error);
    return false;
  }
}

/**
 * Get database encryption info
 * @returns {Promise<Object>} Encryption information
 */
async function getDatabaseInfo() {
  const dbPath = path.join(app.getPath('userData'), 'frauddb.db');
  const encryptedDbPath = path.join(app.getPath('userData'), 'frauddb.enc');

  let encrypted = false;
  let size = 0;

  try {
    await fs.access(encryptedDbPath);
    encrypted = true;
    const stats = await fs.stat(encryptedDbPath);
    size = stats.size;
  } catch (err) {
    try {
      const stats = await fs.stat(dbPath);
      size = stats.size;
    } catch (err2) {
      // Database doesn't exist
    }
  }

  return {
    encrypted,
    size,
    algorithm: 'AES-256-CBC',
    path: encrypted ? encryptedDbPath : dbPath
  };
}

module.exports = {
  setupDatabase,
  verifyDatabasePassword,
  changeDatabasePassword,
  getDatabaseInfo
};
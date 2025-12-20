// Using better-sqlite3 with file-level encryption
// SQLCipher not available, implementing custom encryption
const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const crypto = require('crypto');
const fs = require('fs').promises;

let db = null;

/**
 * Derive encryption key from master password using PBKDF2
 * @param {string} password - Master password
 * @returns {Buffer} Encryption key
 */
function deriveMasterKey(password) {
  const salt = '378x492-salt-v1-secure'; // NOTE: Using fixed salt for local encryption. In production, consider platform-specific secure storage.
  const iterations = 100000; // PBKDF2 iterations
  const keylen = 32; // 256 bits
  const digest = 'sha512';

  return crypto.pbkdf2Sync(password, salt, iterations, keylen, digest);
}

/**
 * Encrypt database file
 * @param {Buffer} data - Database file data
 * @param {string} password - Master password
 * @returns {Buffer} Encrypted data
 */
function encryptDatabase(data, password) {
  const key = deriveMasterKey(password);
  const iv = crypto.randomBytes(16); // AES block size
  const cipher = crypto.createCipher('aes-256-cbc', key);

  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  // Prepend IV for decryption
  return Buffer.concat([iv, encrypted]);
}

/**
 * Decrypt database file
 * @param {Buffer} encryptedData - Encrypted database data
 * @param {string} password - Master password
 * @returns {Buffer} Decrypted data
 */
function decryptDatabase(encryptedData, password) {
  const key = deriveMasterKey(password);
  const iv = encryptedData.slice(0, 16); // Extract IV
  const encrypted = encryptedData.slice(16); // Extract encrypted data

  const decipher = crypto.createDecipher('aes-256-cbc', key);
  decipher.setAutoPadding(true);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted;
}

/**
 * Open and configure encrypted database with file-level encryption
 * @param {string} masterPassword - Master password for encryption
 * @returns {Database} SQLite database instance
 */
async function openDatabase(masterPassword) {
  if (db) {
    return db; // Return existing connection
  }

  const dbPath = path.join(app.getPath('userData'), 'frauddb.db');
  const encryptedDbPath = path.join(app.getPath('userData'), 'frauddb.enc');

  console.log('Opening database at:', dbPath);

  try {
    // Check if encrypted database exists
    let dbExists = false;
    try {
      await fs.access(encryptedDbPath);
      dbExists = true;
    } catch (err) {
      // Encrypted database doesn't exist, will create new one
    }

    if (dbExists) {
      // Decrypt existing database
      console.log('Decrypting existing database...');
      const encryptedData = await fs.readFile(encryptedDbPath);
      const decryptedData = decryptDatabase(encryptedData, masterPassword);
      await fs.writeFile(dbPath, decryptedData);
    }

    // Open the decrypted database
    db = new Database(dbPath);

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // WAL mode for better concurrency
    db.pragma('journal_mode = WAL');

    // Verify database integrity
    try {
      db.prepare('SELECT count(*) FROM sqlite_master').get();
      console.log('✅ Database opened successfully');
    } catch (err) {
      db.close();
      db = null;
      throw new Error('Failed to open database - corrupted or invalid password');
    }

    return db;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
}

/**
 * Close database connection and encrypt the file
 * @param {string} masterPassword - Master password for encryption
 */
async function closeDatabase(masterPassword = null) {
  if (db) {
    // Close the database connection first
    db.close();
    db = null;

    if (masterPassword) {
      // Encrypt the database file
      const dbPath = path.join(app.getPath('userData'), 'frauddb.db');
      const encryptedDbPath = path.join(app.getPath('userData'), 'frauddb.enc');

      try {
        console.log('Encrypting database file...');
        const data = await fs.readFile(dbPath);
        const encryptedData = encryptDatabase(data, masterPassword);
        await fs.writeFile(encryptedDbPath, encryptedData);

        // Remove the unencrypted file
        await fs.unlink(dbPath);
        console.log('✅ Database encrypted and closed');
      } catch (error) {
        console.error('Failed to encrypt database:', error);
        throw error;
      }
    } else {
      console.log('Database closed (no encryption)');
    }
  }
}

/**
 * Get current database instance
 * @returns {Database|null}
 */
function getDatabase() {
  return db;
}

/**
 * Execute a query (SELECT)
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Array} Query results
 */
function query(sql, params = []) {
  if (!db) {
    throw new Error('Database not opened. Call openDatabase() first.');
  }
  
  try {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

/**
 * Execute a statement (INSERT, UPDATE, DELETE)
 * @param {string} sql - SQL statement
 * @param {Array} params - Statement parameters
 * @returns {Object} Result with changes and lastInsertRowid
 */
function execute(sql, params = []) {
  if (!db) {
    throw new Error('Database not opened. Call openDatabase() first.');
  }
  
  try {
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return {
      changes: result.changes,
      lastInsertRowid: result.lastInsertRowid
    };
  } catch (error) {
    console.error('Execute error:', error);
    throw error;
  }
}

/**
 * Execute multiple statements in a transaction
 * @param {Function} callback - Function containing transaction operations
 * @returns {*} Result of callback
 */
function transaction(callback) {
  if (!db) {
    throw new Error('Database not opened. Call openDatabase() first.');
  }
  
  const txn = db.transaction(callback);
  return txn();
}

module.exports = {
  openDatabase,
  closeDatabase,
  getDatabase,
  query,
  execute,
  transaction,
  deriveMasterKey
};

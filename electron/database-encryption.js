// core/database-encryption.js
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class DatabaseEncryption {
  constructor(masterPassword) {
    this.masterPassword = masterPassword;
    this.keyLength = 32; // 256 bits
    this.salt = crypto.randomBytes(16); // Generate random salt
    this.encryptionVersion = '1.0';
  }

  /**
   * Derive encryption key from master password using PBKDF2
   */
  deriveKey() {
    const kdf = crypto.pbkdf2Sync(
      this.masterPassword,
      this.salt,
      100000, // High iteration count for security
      this.keyLength,
      'sha256'
    );
    return kdf;
  }

  /**
   * Get SQLCipher-compatible key string
   */
  getSQLCipherKey() {
    const key = this.deriveKey();
    return `x'${key.toString('hex')}'`;
  }

  /**
   * Initialize encrypted SQLite database
   */
  setupEncryptedDatabase(dbPath) {
    const Database = require('better-sqlite3');

    try {
      // Connect with encryption
      const db = new Database(dbPath);

      // Enable SQLCipher encryption
      db.pragma(`key = ${this.getSQLCipherKey()}`);

      // Configure encryption settings
      db.pragma("cipher_page_size = 4096");
      db.pragma("kdf_iter = 64000");
      db.pragma("cipher_hmac_algorithm = HMAC_SHA512");

      // Test encryption by creating a table
      db.exec(`
        CREATE TABLE IF NOT EXISTS encryption_test (
          id INTEGER PRIMARY KEY,
          test_data TEXT
        )
      `);

      // Insert test data
      const insert = db.prepare("INSERT INTO encryption_test (test_data) VALUES (?)");
      insert.run("Encryption test successful");

      return db;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify database can be opened with current password
   */
  verifyDatabaseAccess(dbPath) {
    const Database = require('better-sqlite3');

    try {
      const db = new Database(dbPath, { readonly: true });

      // Try to access encrypted content
      const row = db.prepare("SELECT test_data FROM encryption_test LIMIT 1").get();
      db.close();

      return row ? row.test_data : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Change master password (re-encrypts database)
   */
  changePassword(dbPath, newPassword) {
    // This is a complex operation that requires:
    // 1. Export all data in plaintext
    // 2. Create new database with new key
    // 3. Import data to new database
    // 4. Securely delete old database

    const Database = require('better-sqlite3');
    const tempDbPath = `${dbPath}.temp`;

    try {
      // Step 1: Export data from current database
      const currentDb = new Database(dbPath);
      currentDb.pragma(`key = ${this.getSQLCipherKey()}`);

      const tables = currentDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

      // For each table, export data
      const tableData = tables.map(table => {
        const rows = currentDb.prepare(`SELECT * FROM ${table.name}`).all();
        return { table: table.name, rows };
      });

      currentDb.close();

      // Step 2: Create new database with new password
      const newEncryption = new DatabaseEncryption(newPassword);
      const newDb = newEncryption.setupEncryptedDatabase(tempDbPath);

      // Step 3: Import data to new database
      tableData.forEach(({ table, rows }) => {
        if (rows.length === 0) return;

        // Create table (simplified - would need proper schema)
        const columns = Object.keys(rows[0]).join(', ');
        const placeholders = Object.keys(rows[0]).map(() => '?').join(', ');

        newDb.exec(`CREATE TABLE IF NOT EXISTS ${table} (${columns})`);

        // Insert data
        const stmt = newDb.prepare(`INSERT INTO ${table} VALUES (${placeholders})`);
        rows.forEach(row => {
          stmt.run(Object.values(row));
        });
      });

      newDb.close();

      // Step 4: Replace old database
      fs.renameSync(tempDbPath, dbPath);

    } catch (error) {
      // Cleanup
      if (fs.existsSync(tempDbPath)) {
        fs.unlinkSync(tempDbPath);
      }
      throw error;
    }
  }

  /**
   * Get encryption metadata
   */
  getEncryptionInfo() {
    return {
      version: this.encryptionVersion,
      algorithm: 'AES-256',
      kdf: 'PBKDF2-SHA256',
      iterations: 100000,
      salt: this.salt.toString('hex'),
      keyLength: this.keyLength * 8 // bits
    };
  }

  /**
   * Secure cleanup
   */
  cleanup() {
    // Clear sensitive data from memory
    this.masterPassword = null;
    this.salt = null;
  }
}

module.exports = DatabaseEncryption;
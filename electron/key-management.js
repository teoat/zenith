// core/key-management.js
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class KeyManager {
  constructor(keyStorePath) {
    this.keyStorePath = keyStorePath;
    this.masterKeyId = 'master-key';
    this.keyRotationInterval = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds
    this.backupKeys = 5; // Keep 5 previous keys for decryption

    this.ensureKeyStore();
  }

  async ensureKeyStore() {
    try {
      await fs.mkdir(this.keyStorePath, { recursive: true });
    } catch (error) {
      console.error('Failed to create key store:', error);
      throw error;
    }
  }

  /**
   * Generate a new master key
   */
  generateMasterKey() {
    return crypto.randomBytes(32); // 256-bit key
  }

  /**
   * Encrypt a key with another key (for key wrapping)
   */
  encryptKey(keyToEncrypt, wrappingKey) {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, wrappingKey, iv); // Fixed

    cipher.setAAD(Buffer.from('key-wrap'));

    let encrypted = cipher.update(keyToEncrypt);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return {
      encrypted: encrypted.toString('hex'),
      iv: iv.toString('hex'),
      authTag: cipher.getAuthTag().toString('hex'),
      algorithm
    };
  }

  /**
   * Decrypt a wrapped key
   */
  decryptKey(encryptedKeyData, unwrappingKey) {
    const decipher = crypto.createDecipheriv(
        encryptedKeyData.algorithm, 
        unwrappingKey, 
        Buffer.from(encryptedKeyData.iv, 'hex')
    ); // Fixed
    decipher.setAAD(Buffer.from('key-wrap'));
    decipher.setAuthTag(Buffer.from(encryptedKeyData.authTag, 'hex'));

    let decrypted = decipher.update(Buffer.from(encryptedKeyData.encrypted, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted;
  }

  /**
   * Store master key securely
   */
  async storeMasterKey(masterKey, password) {
    // Derive a key from the password to encrypt the master key
    const salt = crypto.randomBytes(16);
    const keyForMasterKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

    // Encrypt the master key
    const encryptedMasterKey = this.encryptKey(masterKey, keyForMasterKey);

    // Store the encrypted master key and salt
    const keyData = {
      version: '1.0',
      created: new Date().toISOString(),
      salt: salt.toString('hex'),
      encryptedKey: encryptedMasterKey,
      keyId: this.masterKeyId
    };

    const keyPath = path.join(this.keyStorePath, `${this.masterKeyId}.json`);
    await fs.writeFile(keyPath, JSON.stringify(keyData, null, 2));

    return this.masterKeyId;
  }

  /**
   * Retrieve and decrypt master key
   */
  async retrieveMasterKey(password) {
    const keyPath = path.join(this.keyStorePath, `${this.masterKeyId}.json`);

    try {
      const keyDataContent = await fs.readFile(keyPath, 'utf8');
      const keyData = JSON.parse(keyDataContent);

      // Derive key from password
      const salt = Buffer.from(keyData.salt, 'hex');
      const keyForMasterKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');

      // Decrypt master key
      const masterKey = this.decryptKey(keyData.encryptedKey, keyForMasterKey);

      return {
        key: masterKey,
        keyId: keyData.keyId,
        created: keyData.created,
        version: keyData.version
      };

    } catch (error) {
      throw new Error('Failed to retrieve master key - invalid password or corrupted key store');
    }
  }

  /**
   * Rotate master key
   */
  async rotateMasterKey(currentPassword, newPassword) {
    // Retrieve current master key
    const currentKeyData = await this.retrieveMasterKey(currentPassword);
    const currentMasterKey = currentKeyData.key;

    // Generate new master key
    const newMasterKey = this.generateMasterKey();

    // Store new master key
    await this.storeMasterKey(newMasterKey, newPassword);

    // Backup old key (encrypted with new master key)
    await this.backupOldKey(currentMasterKey, newMasterKey);

    // Update rotation timestamp
    await this.updateRotationTimestamp();

    return {
      newKeyId: this.masterKeyId,
      rotatedAt: new Date().toISOString(),
      oldKeyBackedUp: true
    };
  }

  /**
   * Backup old key for decryption compatibility
   */
  async backupOldKey(oldKey, newMasterKey) {
    const backupId = `backup-${Date.now()}`;
    const encryptedOldKey = this.encryptKey(oldKey, newMasterKey);

    const backupData = {
      backupId,
      created: new Date().toISOString(),
      encryptedKey: encryptedOldKey,
      purpose: 'key-rotation-backup'
    };

    const backupPath = path.join(this.keyStorePath, `${backupId}.json`);
    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));

    // Maintain only the specified number of backup keys
    await this.cleanupOldBackups();
  }

  /**
   * Clean up old backup keys
   */
  async cleanupOldBackups() {
    try {
      const files = await fs.readdir(this.keyStorePath);
      const backupFiles = files
        .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
        .map(f => ({
          name: f,
          path: path.join(this.keyStorePath, f),
          timestamp: parseInt(f.replace('backup-', '').replace('.json', ''))
        }))
        .sort((a, b) => b.timestamp - a.timestamp);

      // Keep only the most recent backups
      if (backupFiles.length > this.backupKeys) {
        const filesToDelete = backupFiles.slice(this.backupKeys);
        for (const file of filesToDelete) {
          await fs.unlink(file.path);
        }
      }

    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  /**
   * Check if key rotation is needed
   */
  async shouldRotateKey() {
    try {
      const rotationPath = path.join(this.keyStorePath, 'rotation.json');

      if (!(await this.fileExists(rotationPath))) {
        return true; // No rotation record, rotation needed
      }

      const rotationData = JSON.parse(await fs.readFile(rotationPath, 'utf8'));
      const lastRotation = new Date(rotationData.lastRotation);
      const now = new Date();

      return (now - lastRotation) > this.keyRotationInterval;

    } catch (error) {
      console.error('Failed to check key rotation status:', error);
      return true; // Assume rotation is needed on error
    }
  }

  /**
   * Update key rotation timestamp
   */
  async updateRotationTimestamp() {
    const rotationData = {
      lastRotation: new Date().toISOString(),
      nextRotationDue: new Date(Date.now() + this.keyRotationInterval).toISOString(),
      rotationIntervalDays: this.keyRotationInterval / (24 * 60 * 60 * 1000)
    };

    const rotationPath = path.join(this.keyStorePath, 'rotation.json');
    await fs.writeFile(rotationPath, JSON.stringify(rotationData, null, 2));
  }

  /**
   * Get key rotation status
   */
  async getRotationStatus() {
    try {
      const rotationPath = path.join(this.keyStorePath, 'rotation.json');

      if (!(await this.fileExists(rotationPath))) {
        return {
          lastRotation: null,
          nextRotationDue: new Date(Date.now() + this.keyRotationInterval).toISOString(),
          daysUntilRotation: Math.ceil(this.keyRotationInterval / (24 * 60 * 60 * 1000)),
          rotationNeeded: true
        };
      }

      const rotationData = JSON.parse(await fs.readFile(rotationPath, 'utf8'));
      const lastRotation = new Date(rotationData.lastRotation);
      const nextDue = new Date(rotationData.nextRotationDue);
      const now = new Date();

      return {
        lastRotation: rotationData.lastRotation,
        nextRotationDue: rotationData.nextRotationDue,
        daysUntilRotation: Math.max(0, Math.ceil((nextDue - now) / (24 * 60 * 60 * 1000))),
        rotationNeeded: now > nextDue
      };

    } catch (error) {
      console.error('Failed to get rotation status:', error);
      return {
        error: error.message,
        rotationNeeded: true
      };
    }
  }

  /**
   * List all stored keys and backups
   */
  async listKeys() {
    try {
      const files = await fs.readdir(this.keyStorePath);
      const keys = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        try {
          const filePath = path.join(this.keyStorePath, file);
          const content = await fs.readFile(filePath, 'utf8');
          const keyData = JSON.parse(content);

          keys.push({
            filename: file,
            type: file.startsWith('backup-') ? 'backup' : 'active',
            created: keyData.created,
            version: keyData.version || '1.0',
            purpose: keyData.purpose || 'master-key'
          });

        } catch (error) {
          keys.push({
            filename: file,
            type: 'unknown',
            error: error.message
          });
        }
      }

      return keys;

    } catch (error) {
      console.error('Failed to list keys:', error);
      return [];
    }
  }

  /**
   * Emergency key recovery (use with caution)
   */
  async emergencyExport(password, exportPath) {
    // This is a dangerous operation - only use in emergencies
    console.warn('EMERGENCY KEY EXPORT - This operation exposes sensitive key material');

    const masterKeyData = await this.retrieveMasterKey(password);

    const exportData = {
      warning: 'EMERGENCY EXPORT - Handle with extreme care',
      exportedAt: new Date().toISOString(),
      masterKey: masterKeyData.key.toString('hex'),
      keyId: masterKeyData.keyId,
      created: masterKeyData.created
    };

    await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));

    return {
      exported: true,
      path: exportPath,
      warning: 'Secure this file immediately and delete after use'
    };
  }

  /**
   * Utility method to check if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get key store statistics
   */
  async getKeyStoreStats() {
    const keys = await this.listKeys();
    const rotationStatus = await this.getRotationStatus();

    return {
      totalKeys: keys.length,
      activeKeys: keys.filter(k => k.type === 'active').length,
      backupKeys: keys.filter(k => k.type === 'backup').length,
      rotationStatus: rotationStatus,
      keyStorePath: this.keyStorePath
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Clear any cached keys from memory
    // Note: In a real implementation, you might want to use
    // secure memory clearing functions
  }
}

module.exports = KeyManager;
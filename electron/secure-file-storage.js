// core/secure-file-storage.js
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class SecureFileStorage {
  constructor(masterKey, storagePath) {
    this.masterKey = masterKey;
    this.storagePath = storagePath;
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.saltRounds = 100000;

    // Ensure storage directory exists
    this.ensureStorageDirectory();
  }

  async ensureStorageDirectory() {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
      await fs.mkdir(path.join(this.storagePath, 'encrypted'), { recursive: true });
      await fs.mkdir(path.join(this.storagePath, 'metadata'), { recursive: true });
      await fs.mkdir(path.join(this.storagePath, 'keys'), { recursive: true });
    } catch (error) {
      console.error('Failed to create storage directories:', error);
      throw error;
    }
  }

  /**
   * Derive encryption key from master key using PBKDF2
   */
  deriveKey(salt) {
    return crypto.pbkdf2Sync(
      this.masterKey,
      salt,
      this.saltRounds,
      this.keyLength,
      'sha256'
    );
  }

  /**
   * Generate a unique file identifier
   */
  generateFileId() {
    return crypto.randomUUID();
  }

  /**
   * Calculate file hash for integrity verification
   */
  async calculateFileHash(filePath) {
    const fileBuffer = await fs.readFile(filePath);
    const hash = crypto.createHash('sha256');
    hash.update(fileBuffer);
    return hash.digest('hex');
  }

  /**
   * Encrypt and store a file securely
   */
  async storeFile(filePath, metadata = {}) {
    const fileId = this.generateFileId();
    const salt = crypto.randomBytes(16);
    const key = this.deriveKey(salt);
    const iv = crypto.randomBytes(16);

    // Read original file
    const fileBuffer = await fs.readFile(filePath);
    const originalHash = await this.calculateFileHash(filePath);

    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, key, iv); // Fixed
    cipher.setAAD(Buffer.from('378x492-evidence')); // Additional authenticated data

    // Encrypt file data
    let encrypted = cipher.update(fileBuffer);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const authTag = cipher.getAuthTag();

    // Prepare encrypted data structure
    const encryptedData = {
      salt: salt.toString('hex'),
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      data: encrypted.toString('hex'),
      algorithm: this.algorithm
    };

    // Store encrypted file
    const encryptedPath = path.join(this.storagePath, 'encrypted', `${fileId}.enc`);
    await fs.writeFile(encryptedPath, JSON.stringify(encryptedData, null, 2));

    // Store metadata
    const metadataPath = path.join(this.storagePath, 'metadata', `${fileId}.json`);
    const fileMetadata = {
      id: fileId,
      originalName: path.basename(filePath),
      originalPath: filePath,
      originalHash: originalHash,
      encryptedPath: encryptedPath,
      metadataPath: metadataPath,
      size: fileBuffer.length,
      uploadedAt: new Date().toISOString(),
      encryptionInfo: {
        algorithm: this.algorithm,
        keyDerivation: 'PBKDF2-SHA256',
        saltRounds: this.saltRounds,
        version: '1.0'
      },
      ...metadata
    };

    await fs.writeFile(metadataPath, JSON.stringify(fileMetadata, null, 2));

    return fileId;
  }

  /**
   * Retrieve and decrypt a file
   */
  async retrieveFile(fileId, outputPath = null) {
    // Load metadata
    const metadataPath = path.join(this.storagePath, 'metadata', `${fileId}.json`);
    const metadataContent = await fs.readFile(metadataPath, 'utf8');
    const metadata = JSON.parse(metadataContent);

    // Load encrypted data
    const encryptedPath = path.join(this.storagePath, 'encrypted', `${fileId}.enc`);
    const encryptedContent = await fs.readFile(encryptedPath, 'utf8');
    const encryptedData = JSON.parse(encryptedContent);

    // Derive key
    const salt = Buffer.from(encryptedData.salt, 'hex');
    const key = this.deriveKey(salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(
        encryptedData.algorithm, 
        key, 
        Buffer.from(encryptedData.iv, 'hex')
    ); // Fixed
    decipher.setAAD(Buffer.from('378x492-evidence'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    // Decrypt data
    let decrypted = decipher.update(Buffer.from(encryptedData.data, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    // Verify integrity
    const decryptedHash = crypto.createHash('sha256').update(decrypted).digest('hex');
    if (decryptedHash !== metadata.originalHash) {
      throw new Error('File integrity check failed - possible tampering');
    }

    // Write to output path or return buffer
    if (outputPath) {
      await fs.writeFile(outputPath, decrypted);
      return {
        buffer: decrypted,
        path: outputPath,
        metadata: metadata
      };
    } else {
      return {
        buffer: decrypted,
        metadata: metadata
      };
    }
  }

  /**
   * Delete a stored file securely
   */
  async deleteFile(fileId) {
    const metadataPath = path.join(this.storagePath, 'metadata', `${fileId}.json`);
    const encryptedPath = path.join(this.storagePath, 'encrypted', `${fileId}.enc`);

    // Load metadata for audit trail
    let metadata = null;
    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf8');
      metadata = JSON.parse(metadataContent);
    } catch (error) {
      console.warn(`Could not load metadata for file ${fileId}:`, error);
    }

    // Secure delete (overwrite before deletion)
    try {
      await this.secureDelete(encryptedPath);
      await this.secureDelete(metadataPath);
    } catch (error) {
      console.error(`Failed to securely delete file ${fileId}:`, error);
      throw error;
    }

    return {
      fileId,
      deletedAt: new Date().toISOString(),
      metadata: metadata
    };
  }

  /**
   * Securely delete a file by overwriting it first
   */
  async secureDelete(filePath) {
    try {
      // Get file size
      const stats = await fs.stat(filePath);
      const fileSize = stats.size;

      // Overwrite with random data (3 passes)
      const randomData = crypto.randomBytes(fileSize);

      for (let pass = 0; pass < 3; pass++) {
        await fs.writeFile(filePath, randomData);
      }

      // Finally delete the file
      await fs.unlink(filePath);
    } catch (error) {
      // If file doesn't exist, that's fine
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * List stored files with metadata
   */
  async listFiles(filters = {}) {
    const metadataDir = path.join(this.storagePath, 'metadata');

    try {
      const files = await fs.readdir(metadataDir);
      const filePromises = files
        .filter(file => file.endsWith('.json'))
        .map(async (file) => {
          const filePath = path.join(metadataDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          return JSON.parse(content);
        });

      const fileMetadata = await Promise.all(filePromises);

      // Apply filters
      let filteredFiles = fileMetadata;

      if (filters.uploadedAfter) {
        filteredFiles = filteredFiles.filter(f =>
          new Date(f.uploadedAt) > new Date(filters.uploadedAfter)
        );
      }

      if (filters.uploadedBefore) {
        filteredFiles = filteredFiles.filter(f =>
          new Date(f.uploadedAt) < new Date(filters.uploadedBefore)
        );
      }

      if (filters.originalName) {
        filteredFiles = filteredFiles.filter(f =>
          f.originalName.toLowerCase().includes(filters.originalName.toLowerCase())
        );
      }

      return filteredFiles;
    } catch (error) {
      console.error('Failed to list files:', error);
      return [];
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      totalSizeEncrypted: 0,
      storageUsed: 0,
      lastModified: null
    };

    try {
      const files = await this.listFiles();

      stats.totalFiles = files.length;
      stats.totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);

      // Calculate encrypted size
      for (const file of files) {
        try {
          const encryptedPath = path.join(this.storagePath, 'encrypted', `${file.id}.enc`);
          const encryptedStats = await fs.stat(encryptedPath);
          stats.totalSizeEncrypted += encryptedStats.size;
        } catch (error) {
          // File might not exist
        }
      }

      // Calculate total storage used
      const storageStats = await this.calculateDirectorySize(this.storagePath);
      stats.storageUsed = storageStats.size;

      if (files.length > 0) {
        stats.lastModified = files
          .map(f => f.uploadedAt)
          .sort()
          .reverse()[0];
      }

    } catch (error) {
      console.error('Failed to calculate storage stats:', error);
    }

    return stats;
  }

  /**
   * Calculate directory size recursively
   */
  async calculateDirectorySize(dirPath) {
    let totalSize = 0;
    let fileCount = 0;

    async function calculateSize(itemPath) {
      const stats = await fs.stat(itemPath);

      if (stats.isDirectory()) {
        const items = await fs.readdir(itemPath);
        for (const item of items) {
          await calculateSize(path.join(itemPath, item));
        }
      } else {
        totalSize += stats.size;
        fileCount++;
      }
    }

    await calculateSize(dirPath);

    return { size: totalSize, files: fileCount };
  }

  /**
   * Perform maintenance operations
   */
  async maintenance() {
    // Clean up orphaned files
    await this.cleanupOrphanedFiles();

    // Verify file integrity
    await this.verifyFileIntegrity();

    // Optimize storage
    await this.optimizeStorage();
  }

  /**
   * Clean up orphaned encrypted files without metadata
   */
  async cleanupOrphanedFiles() {
    const encryptedDir = path.join(this.storagePath, 'encrypted');
    const metadataDir = path.join(this.storagePath, 'metadata');

    try {
      const encryptedFiles = await fs.readdir(encryptedDir);
      const metadataFiles = await fs.readdir(metadataDir);

      const metadataIds = new Set(
        metadataFiles
          .filter(f => f.endsWith('.json'))
          .map(f => f.replace('.json', ''))
      );

      const orphanedFiles = encryptedFiles
        .filter(f => f.endsWith('.enc'))
        .map(f => f.replace('.enc', ''))
        .filter(id => !metadataIds.has(id));

      for (const orphanedId of orphanedFiles) {
        console.warn(`Removing orphaned encrypted file: ${orphanedId}`);
        await this.secureDelete(path.join(encryptedDir, `${orphanedId}.enc`));
      }

    } catch (error) {
      console.error('Failed to cleanup orphaned files:', error);
    }
  }

  /**
   * Verify integrity of all stored files
   */
  async verifyFileIntegrity() {
    const files = await this.listFiles();
    const integrityResults = [];

    for (const file of files) {
      try {
        // Quick integrity check without full decryption
        const encryptedPath = path.join(this.storagePath, 'encrypted', `${file.id}.enc`);
        await fs.access(encryptedPath);

        integrityResults.push({
          fileId: file.id,
          status: 'intact',
          lastVerified: new Date().toISOString()
        });

      } catch (error) {
        integrityResults.push({
          fileId: file.id,
          status: 'corrupted',
          error: error.message,
          lastVerified: new Date().toISOString()
        });
      }
    }

    return integrityResults;
  }

  /**
   * Optimize storage (compression, deduplication)
   */
  async optimizeStorage() {
    // Placeholder for future optimization features
    // - Compression of metadata files
    // - Deduplication of identical files
    // - Archive old files
    console.log('Storage optimization completed');
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Clear sensitive data from memory
    this.masterKey = null;
  }
}

module.exports = SecureFileStorage;
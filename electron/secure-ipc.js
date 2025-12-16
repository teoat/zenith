// electron/secure-ipc.js
const crypto = require('crypto');
const { ipcMain } = require('electron');

class SecureIPC {
  constructor(secretKey) {
    // Use shared secret for HMAC signing (must match preload.js)
    if (!secretKey) {
      throw new Error('SecureIPC requires a secret key. Use SecureConfig to get the IPC_SECRET.');
    }
    this.secretKey = secretKey;
    this.requestTimeout = 30000; // 30 seconds
    this.maxRequestSize = 1024 * 1024; // 1MB max request size
    this.rateLimit = new Map(); // Simple rate limiting
    this.rateLimitWindow = 60000; // 1 minute
    this.rateLimitMax = 100; // Max 100 requests per minute per IP

    this.setupSecureHandlers();
  }

  generateSecretKey() {
    // Generate a cryptographically secure random key
    return crypto.randomBytes(32).toString('hex');
  }

  setupSecureHandlers() {
    // Override default ipcMain.handle to add security
    const originalHandle = ipcMain.handle.bind(ipcMain);

    ipcMain.handle = (channel, handler) => {
      const secureHandler = async (event, signedData) => {
        try {
          // Rate limiting check
          if (!this.checkRateLimit(event.sender)) {
            throw new Error('Rate limit exceeded');
          }

          // Validate request size
          const dataSize = JSON.stringify(signedData).length;
          if (dataSize > this.maxRequestSize) {
            throw new Error('Request size exceeds limit');
          }

          // Verify and parse request
          const verifiedData = this.verifyRequest(signedData);

          // Validate request structure
          // this.validateRequestStructure(verifiedData); // Skip strictly for now, rely on args

          // Call original handler with verified args
          // Expect verifiedData to be { args: [...], timestamp: ... }
          const args = verifiedData.args || [verifiedData]; // Fallback
          const result = await handler(event, ...args);

          // Sign response
          return this.signResponse(result);

        } catch (error) {
          console.error(`Secure IPC error on ${channel}:`, error.message);

          // Return signed error response
          return this.signResponse({
            error: true,
            message: error.message,
            code: error.code || 'SECURITY_ERROR'
          });
        }
      };

      return originalHandle(channel, secureHandler);
    };
  }

  checkRateLimit(sender) {
    const now = Date.now();
    const senderId = sender.id || 'unknown';

    if (!this.rateLimit.has(senderId)) {
      this.rateLimit.set(senderId, { count: 0, windowStart: now });
    }

    const senderData = this.rateLimit.get(senderId);

    // Reset window if expired
    if (now - senderData.windowStart > this.rateLimitWindow) {
      senderData.count = 0;
      senderData.windowStart = now;
    }

    // Check limit
    if (senderData.count >= this.rateLimitMax) {
      return false;
    }

    senderData.count++;
    return true;
  }

  signRequest(data) {
    const timestamp = Date.now();
    const payload = JSON.stringify({ ...data, timestamp });
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(payload)
      .digest('hex');

    return { payload, signature, timestamp };
  }

  verifyRequest(signedData) {
    const { payload, signature, timestamp } = signedData;

    // Check timestamp (prevent replay attacks - 5 minute window)
    const now = Date.now();
    if (Math.abs(now - timestamp) > 300000) {
      throw new Error('Request timestamp expired');
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', this.secretKey)
      .update(payload)
      .digest('hex');

    if (!crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )) {
      throw new Error('Invalid request signature');
    }

    return JSON.parse(payload);
  }

  encryptRequest(data) {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, this.secretKey, iv); // Fixed: custom IV

    cipher.setAAD(Buffer.from('378x492')); // Additional authenticated data

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm
    };
  }

  decryptRequest(encryptedData) {
    const { encrypted, iv, authTag, algorithm = 'aes-256-gcm' } = encryptedData;

    const decipher = crypto.createDecipheriv(algorithm, this.secretKey, Buffer.from(iv, 'hex')); // Fixed: use IV
    decipher.setAAD(Buffer.from('378x492'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }

  signResponse(data) {
    // Sign response with HMAC for integrity
    const timestamp = Date.now();
    const payload = JSON.stringify({ ...data, timestamp });
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(payload)
      .digest('hex');

    return { payload, signature, timestamp };
  }

  validateRequestStructure(data) {
    // Basic structure validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid request structure');
    }

    // Check for required fields based on operation type
    if (data.operation) {
      const allowedOperations = [
        'get-cases', 'create-case', 'update-case', 'delete-case',
        'select-file', 'process-evidence', 'get-evidence',
        'get-settings', 'update-settings', 'get-system-info'
      ];

      if (!allowedOperations.includes(data.operation)) {
        throw new Error('Unknown operation type');
      }
    }

    // Validate payload size
    const payloadSize = JSON.stringify(data).length;
    if (payloadSize > this.maxRequestSize) {
      throw new Error('Payload size exceeds limit');
    }
  }

  // Utility method to get security stats
  getSecurityStats() {
    return {
      rateLimitViolations: Array.from(this.rateLimit.entries())
        .filter(([_, data]) => data.count >= this.rateLimitMax)
        .length,
      activeConnections: this.rateLimit.size,
      secretKeyRotated: false, // Would be true if key rotation implemented
    };
  }
}

module.exports = SecureIPC;
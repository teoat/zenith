const { contextBridge, ipcRenderer } = require('electron');
const crypto = require('crypto');

// Get IPC secret from arguments
const ipcSecretArg = process.argv.find(arg => arg.startsWith('--ipc-secret='));
const ipcSecret = ipcSecretArg ? ipcSecretArg.split('=')[1] : null;

// Crypto Helper for HMAC-SHA256
async function signRequest(args) {
  if (!ipcSecret) {
    // If no secret, we must match Main's expectation or it will fail.
    // Main expects { payload, signature, timestamp } verification.
    // If we send raw args, it fails. 
    return { args, timestamp: Date.now() }; 
  }

  const timestamp = Date.now();
  const payloadData = { args, timestamp };
  const payload = JSON.stringify(payloadData);
  
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(ipcSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await window.crypto.subtle.sign(
    'HMAC',
    keyMaterial,
    encoder.encode(payload)
  );

  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return { payload, signature, timestamp };
}

// Secure Invoke Wrapper
async function secureInvoke(channel, ...args) {
  try {
    const signedData = await signRequest(args);
    return await ipcRenderer.invoke(channel, signedData);
  } catch (error) {
    console.error(`SecureInvoke Error [${channel}]:`, error);
    throw error;
  }
}

// Expose safe IPC methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  db: {
    query: (sql, params) => secureInvoke('db:query', sql, params),
    execute: (sql, params) => secureInvoke('db:execute', sql, params)
  },

  // File operations
  files: {
    read: (path) => secureInvoke('file:read', path),
    write: (path, data) => secureInvoke('file:write', path, data),
    openDialog: () => secureInvoke('file:open-dialog'),
    saveDialog: () => secureInvoke('file:save-dialog')
  },

  // App metadata
  app: {
    getVersion: () => secureInvoke('app:get-version'),
    getPlatform: () => process.platform,
    getPath: (name) => secureInvoke('app:get-path', name)
  },

  // System info
  getSystemInfo: () => secureInvoke('system:get-info'),

  // Memory management
  logMemoryAlert: (level, memoryUsage) => secureInvoke('memory:log-alert', level, memoryUsage),

  // Case management
  createCase: (caseData) => secureInvoke('case:create', caseData),
  updateCase: (caseId, data) => secureInvoke('case:update', caseId, data),
  getCases: (filters) => secureInvoke('case:get-all', filters),
  getCase: (caseId) => secureInvoke('case:get', caseId),
  deleteCase: (caseId) => secureInvoke('case:delete', caseId),

  // Evidence operations
  selectFile: () => secureInvoke('file:select'),
  processEvidence: (filePath) => secureInvoke('evidence:process', filePath),
  getEvidence: (caseId) => secureInvoke('evidence:get', caseId),

  // Settings
  getSettings: () => secureInvoke('settings:get'),
  updateSettings: (settings) => secureInvoke('settings:update', settings),

  // Security & encryption
  getSecurityStats: () => secureInvoke('security:stats'),
  storeSecureFile: (filePath, metadata) => secureInvoke('file:store-secure', filePath, metadata),
  retrieveSecureFile: (fileId, outputPath) => secureInvoke('file:retrieve-secure', fileId, outputPath),
  deleteSecureFile: (fileId) => secureInvoke('file:delete-secure', fileId),
  listSecureFiles: (filters) => secureInvoke('file:list-secure', filters),
  getSecureStorageStats: () => secureInvoke('file:secure-stats'),

  // Key management
  rotateMasterKey: (currentPassword, newPassword) => secureInvoke('key:rotate', currentPassword, newPassword),
  getKeyRotationStatus: () => secureInvoke('key:rotation-status'),
  listKeys: () => secureInvoke('key:list'),
  getKeyStoreStats: () => secureInvoke('key:stats'),

  // Database encryption
  setupEncryptedDatabase: (dbPath) => secureInvoke('db:setup-encrypted', dbPath),
  verifyDatabaseEncryption: (dbPath) => secureInvoke('db:verify-encryption', dbPath),
  changeDatabasePassword: (dbPath, newPassword) => secureInvoke('db:change-password', dbPath, newPassword),
  getDatabaseEncryptionInfo: () => secureInvoke('db:encryption-info'),

  // Performance monitoring
  getIPCPerformanceStats: () => secureInvoke('performance:ipc-stats'),
  getMemoryStats: () => secureInvoke('performance:memory-stats'),
  cleanupMemory: () => secureInvoke('performance:cleanup-memory'),
  forceGC: () => secureInvoke('performance:force-gc'),

  // Database optimization
  analyzeDatabase: () => secureInvoke('db:analyze'),
  optimizeDatabase: (optimizations) => secureInvoke('db:optimize', optimizations),
  benchmarkDatabaseQuery: (query, params, iterations) => secureInvoke('db:benchmark', query, params, iterations),
  getDatabaseMetrics: () => secureInvoke('db:metrics'),

  // Offline sync
  queueOfflineOperation: (operation) => secureInvoke('sync:queue', operation),
  getSyncStatus: () => secureInvoke('sync:status'),
  forceSync: () => secureInvoke('sync:force'),
  resolveConflict: (conflictId, resolution) => secureInvoke('sync:resolve-conflict', conflictId, resolution),

  // Batch operations
  invokeBatch: (channel, requests) => secureInvoke('batch:invoke', channel, requests),

  // Updater
  checkForUpdates: () => secureInvoke('updater:check'),
  getUpdateStatus: () => secureInvoke('updater:get-status'),

  // Authentication
  auth: {
    setMasterPassword: (password) => secureInvoke('auth:set-master-password', password),
    authenticate: (password) => secureInvoke('auth:authenticate', password),
    isAuthenticated: () => secureInvoke('auth:is-authenticated'),
    logout: () => secureInvoke('auth:logout'),
    changeMasterPassword: (currentPassword, newPassword) => secureInvoke('auth:change-password', currentPassword, newPassword),
    enableBiometric: () => secureInvoke('auth:enable-biometric'),
    authenticateBiometric: () => secureInvoke('auth:authenticate-biometric'),
    getAuthStatus: () => secureInvoke('auth:get-status'),
    isMasterPasswordSet: () => secureInvoke('auth:is-master-password-set'),
  },

  // Event listeners (unchanged as they are receiving, not invoking)
  on: (channel, callback) => {
    const validChannels = [
      'db:changed',
      'file:uploaded',
      'app:update-available',
      'app:update-downloaded',
      'sync:status-changed',
      'memory:alert',
      'auth:changed'
    ];

    if (validChannels.includes(channel)) {
      const subscription = (event, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);

      // Return unsubscribe function
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
  },

  // Remove listener
  off: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  }
});

// Log preload script loaded (visible in DevTools)
console.log('Preload script loaded successfully');
console.log('Platform:', process.platform);
console.log('Electron version:', process.versions.electron);
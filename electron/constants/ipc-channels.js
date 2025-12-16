/**
 * IPC Channel Constants
 * Centralized channel names for type-safe IPC communication
 */

const IPC_CHANNELS = {
  // Authentication
  AUTH: {
    SET_MASTER_PASSWORD: 'auth:set-master-password',
    AUTHENTICATE: 'auth:authenticate',
    IS_AUTHENTICATED: 'auth:is-authenticated',
    LOGOUT: 'auth:logout',
    CHANGE_PASSWORD: 'auth:change-password',
    ENABLE_BIOMETRIC: 'auth:enable-biometric',
    AUTHENTICATE_BIOMETRIC: 'auth:authenticate-biometric',
    GET_STATUS: 'auth:get-status',
    IS_MASTER_PASSWORD_SET: 'auth:is-master-password-set',
  },

  // Database
  DB: {
    QUERY: 'db:query',
    EXECUTE: 'db:execute',
    SETUP: 'db:setup',
    VERIFY_PASSWORD: 'db:verify-password',
    CHANGE_PASSWORD: 'db:change-password',
    ENCRYPTION_INFO: 'db:encryption-info',
    ANALYZE: 'db:analyze',
    OPTIMIZE: 'db:optimize',
    BENCHMARK: 'db:benchmark',
    METRICS: 'db:metrics',
  },

  // File Operations
  FILE: {
    READ: 'file:read',
    WRITE: 'file:write',
    OPEN_DIALOG: 'file:open-dialog',
    SAVE_DIALOG: 'file:save-dialog',
    SELECT: 'file:select',
    PROCESS_DROP: 'file:process-drop',
    ENCRYPT_ON_UPLOAD: 'file:encrypt-on-upload',
    DECRYPT_ON_DOWNLOAD: 'file:decrypt-on-download',
    STORE_SECURE: 'file:store-secure',
    RETRIEVE_SECURE: 'file:retrieve-secure',
    DELETE_SECURE: 'file:delete-secure',
    LIST_SECURE: 'file:list-secure',
    SECURE_STATS: 'file:secure-stats',
  },

  // Cases
  CASE: {
    CREATE: 'case:create',
    UPDATE: 'case:update',
    GET_ALL: 'case:get-all',
    GET: 'case:get',
    DELETE: 'case:delete',
  },

  // Evidence
  EVIDENCE: {
    PROCESS: 'evidence:process',
    GET: 'evidence:get',
  },

  // Settings
  SETTINGS: {
    GET: 'settings:get',
    UPDATE: 'settings:update',
  },

  // Security
  SECURITY: {
    STATS: 'security:stats',
  },

  // Key Management
  KEY: {
    ROTATE: 'key:rotate',
    ROTATION_STATUS: 'key:rotation-status',
    LIST: 'key:list',
    STATS: 'key:stats',
  },

  // Performance
  PERFORMANCE: {
    IPC_STATS: 'performance:ipc-stats',
    MEMORY_STATS: 'performance:memory-stats',
    CLEANUP_MEMORY: 'performance:cleanup-memory',
    FORCE_GC: 'performance:force-gc',
  },

  // Sync
  SYNC: {
    QUEUE: 'sync:queue',
    STATUS: 'sync:status',
    FORCE: 'sync:force',
    RESOLVE_CONFLICT: 'sync:resolve-conflict',
  },

  // App
  APP: {
    GET_VERSION: 'app:get-version',
    GET_PATH: 'app:get-path',
  },

  // System
  SYSTEM: {
    GET_INFO: 'system:get-info',
  },

  // Updater
  UPDATER: {
    CHECK: 'updater:check',
    GET_STATUS: 'updater:get-status',
  },

  // Memory
  MEMORY: {
    LOG_ALERT: 'memory:log-alert',
  },

  // Batch
  BATCH: {
    INVOKE: 'batch:invoke',
  },

  // Events (Main to Renderer)
  EVENTS: {
    DB_CHANGED: 'db:changed',
    FILE_UPLOADED: 'file:uploaded',
    UPDATE_AVAILABLE: 'app:update-available',
    UPDATE_DOWNLOADED: 'app:update-downloaded',
    SYNC_STATUS_CHANGED: 'sync:status-changed',
    MEMORY_ALERT: 'memory:alert',
  },
};

module.exports = { IPC_CHANNELS };

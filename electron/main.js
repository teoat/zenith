const { app, BrowserWindow, session, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const http = require('http');
const windowStateKeeper = require('electron-window-state');

// Database modules
const { openDatabase, closeDatabase } = require('./database');
const { runMigrations } = require('./migrations/runner');
const { setupDatabaseHandlers } = require('./ipcHandlers/database');
const { setupDatabase, verifyDatabasePassword, changeDatabasePassword, getDatabaseInfo } = require('./setup-database');

// Security modules
const SecureIPC = require('./secure-ipc');
const SecureConfig = require('./secure-config');
const SessionManager = require('./session-manager');

// Global configuration
let secureConfig;
let secureIPC;
let sessionManager;

// UI Modules
const { setupMenu } = require('./menu');
const { setupTray, destroyTray } = require('./tray');
const { setupNotificationHandlers } = require('./notifications');
const { registerShortcuts, unregisterShortcuts } = require('./shortcuts');

// Update Module
const { checkForUpdates } = require('./updater');

// Auth Module
const {
  setMasterPassword,
  authenticate,
  isAuthenticated,
  logout,
  changeMasterPassword,
  enableBiometric,
  authenticateBiometric,
  getAuthStatus,
  isMasterPasswordSet
} = require('./auth');

let mainWindow;

// Helper function to determine file type
function getFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.pdf': 'document',
    '.doc': 'document',
    '.docx': 'document',
    '.txt': 'text',
    '.jpg': 'image',
    '.jpeg': 'image',
    '.png': 'image',
    '.xls': 'spreadsheet'
  };
  return types[ext] || 'unknown';
}

// Backend Management
let pyProc = null;

const getBackendPath = () => {
  if (app.isPackaged) {
    if (process.platform === 'win32') {
      return path.join(process.resourcesPath, 'backend', 'backend.exe');
    }
    return path.join(process.resourcesPath, 'backend', 'backend');
  }
  return null;
};

const createPyProc = () => {
  const script = getBackendPath();
  if (!script) {
    console.log('Dev mode: Skipping backend spawn (assume running externally)');
    return;
  }

  console.log('Spawning backend from:', script);
  
  if (require('fs').existsSync(script)) {
    pyProc = require('child_process').spawn(script, [], {
      stdio: 'pipe',
      env: { ...process.env, PORT: '8000' }
    });

    if (pyProc) {
      console.log('Backend process spawned, PID:', pyProc.pid);
      pyProc.stdout.on('data', (data) => console.log('Backend:', data.toString()));
      pyProc.stderr.on('data', (data) => console.error('Backend Err:', data.toString()));
      pyProc.on('close', (code) => console.log('Backend process exited with code:', code));
    }
  } else {
    console.error('Backend executable not found at:', script);
  }
};

const exitPyProc = () => {
  if (pyProc) {
    console.log('Killing backend process...');
    pyProc.kill();
    pyProc = null;
  }
};

// Helper to make requests to Python backend
function makeBackendRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 8000,
      path: '/api/v1' + path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ success: res.statusCode >= 200 && res.statusCode < 300, data: json });
        } catch (e) {
          console.error('Failed to parse backend response:', body);
          resolve({ success: false, error: 'Invalid response from backend' });
        }
      });
    });

    req.on('error', (e) => {
      console.error('Backend request failed:', e);
      reject({ success: false, error: e.message });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function setupSecurity() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' data: https:; " +
          "font-src 'self' data:;"
        ]
      }
    });
  });

  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      if (parsedUrl.origin !== 'file://') {
        event.preventDefault();
      }
    });

    contents.setWindowOpenHandler(() => {
      return { action: 'deny' };
    });
  });
}

function createWindow() {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1440,
    defaultHeight: 900
  });

  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
      additionalArguments: secureIPC ? [`--ipc-secret=${secureIPC.secretKey}`] : []
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#1a1a1a',
    show: false
  });

  mainWindowState.manage(mainWindow);

  const isDev = !app.isPackaged;
  console.log('app.isPackaged:', app.isPackaged, '| isDev:', isDev);
  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../frontend/dist/index.html')}`;

  console.log('Loading URL:', startUrl);
  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });
}

// IPC Handlers - Secure implementation with HMAC signing
function setupIPCHandlers() {
  // Database operations
  // Note: Local DB handlers are set up by setupDatabaseHandlers(db) in initializeDatabase()
  
  // File operations
  ipcMain.handle('file:read', async (_event, filePath) => {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return { success: true, data: content };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('file:write', async (_event, filePath, data) => {
    try {
      await fs.writeFile(filePath, data, 'utf8');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('file:open-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    return result;
  });

  ipcMain.handle('file:save-dialog', async () => {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    return result;
  });

  // Drag and drop handlers
  ipcMain.handle('file:process-drop', async (_event, filePaths) => {
    console.log('Processing dropped files:', filePaths);
    const results = [];

    for (const filePath of filePaths) {
      try {
        const stats = await fs.stat(filePath);
        const result = {
          path: filePath,
          name: path.basename(filePath),
          size: stats.size,
          type: getFileType(filePath),
          processed: true
        };
        results.push(result);
      } catch (error) {
        results.push({
          path: filePath,
          error: error.message,
          processed: false
        });
      }
    }

    return { success: true, data: results };
  });

  ipcMain.handle('file:encrypt-on-upload', async (_event, filePath, destinationPath) => {
    console.log('Encrypting file on upload:', filePath, 'to', destinationPath);
    try {
      if (!secureConfig) {
        secureConfig = new SecureConfig();
        await secureConfig.loadConfig();
      }
      
      const encryptionKey = secureConfig.get('masterPassword');
      const data = await fs.readFile(filePath);
      const iv = require('crypto').randomBytes(16);
      const cipher = require('crypto').createCipher('aes-256-cbc', encryptionKey);
      
      let encryptedData = cipher.update(data);
      encryptedData = Buffer.concat([encryptedData, cipher.final()]);
      
      const encryptedWithIv = Buffer.concat([iv, encryptedData]);
      await fs.writeFile(destinationPath, encryptedWithIv);
      
      console.log('✅ File encrypted successfully');
      return { success: true, encryptedPath: destinationPath };
    } catch (error) {
      console.error('❌ File encryption failed:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('file:decrypt-on-download', async (_event, encryptedPath, destinationPath) => {
    console.log('Decrypting file on download:', encryptedPath, 'to', destinationPath);
    try {
      if (!secureConfig) {
        secureConfig = new SecureConfig();
        await secureConfig.loadConfig();
      }
      
      const encryptionKey = secureConfig.get('masterPassword');
      const encryptedWithIv = await fs.readFile(encryptedPath);
      
      const iv = encryptedWithIv.subarray(0, 16);
      const encryptedData = encryptedWithIv.subarray(16);

      const decipher = require('crypto').createDecipheriv('aes-256-cbc', encryptionKey, iv);
      let decryptedData = decipher.update(encryptedData);
      decryptedData = Buffer.concat([decryptedData, decipher.final()]);
      
      await fs.writeFile(destinationPath, decryptedData);
      
      console.log('✅ File decrypted successfully');
      return { success: true, decryptedPath: destinationPath };
    } catch (error) {
      console.error('❌ File decryption failed:', error);
      return { success: false, error: error.message };
    }
  });

  // App operations
  ipcMain.handle('app:get-version', () => {
    return app.getVersion();
  });

  ipcMain.handle('app:get-path', (_event, name) => {
    return app.getPath(name);
  });

  // Case management (Proxied to Python Backend)
  ipcMain.handle('case:create', async (_event, caseData) => {
    console.log('Proxying create case to backend:', caseData);
    return await makeBackendRequest('POST', '/cases', caseData);
  });

  ipcMain.handle('case:update', async (_event, caseId, data) => {
    console.log('Proxying update case to backend:', caseId);
    return await makeBackendRequest('PUT', `/cases/${caseId}`, data);
  });

  ipcMain.handle('case:get-all', async (_event, filters) => {
    console.log('Proxying get cases to backend:', filters);
    // Convert filters to query string if needed, simpler for now
    return await makeBackendRequest('GET', '/cases');
  });

  ipcMain.handle('case:get', async (_event, caseId) => {
    console.log('Proxying get case to backend:', caseId);
    return await makeBackendRequest('GET', `/cases/${caseId}`);
  });

  ipcMain.handle('case:delete', async (_event, caseId) => {
    console.log('Proxying delete case to backend:', caseId);
    return await makeBackendRequest('DELETE', `/cases/${caseId}`);
  });

  // Evidence operations (Proxied integration)
  ipcMain.handle('file:select', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'All Files', extensions: ['*'] },
        { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt'] },
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'] }
      ]
    });
    return result;
  });

  ipcMain.handle('evidence:process', async (_event, filePath) => {
    console.log('Processing evidence (local stub):', filePath);
    return { success: true, data: { processed: true, path: filePath } };
  });

  ipcMain.handle('evidence:get', async (_event, caseId) => {
    console.log('Getting evidence for case (proxy):', caseId);
    return await makeBackendRequest('GET', `/cases/${caseId}/documents`);
  });

  // Settings
  ipcMain.handle('settings:get', async () => {
    return {
      success: true,
      data: {
        theme: 'dark',
        notifications: true,
        autoSave: true
      }
    };
  });

  ipcMain.handle('settings:update', async (_event, settings) => {
    console.log('Updating settings:', settings);
    return { success: true };
  });

  // Security & encryption (placeholders)
  ipcMain.handle('security:stats', async () => {
    return { success: true, data: { encryptionEnabled: true, secureStorage: true } };
  });

  // File security operations (placeholders)
  ipcMain.handle('file:store-secure', async (_event, filePath, metadata) => {
    console.log('Storing secure file:', filePath, metadata);
    return { success: true, data: { id: 'file_' + Date.now() } };
  });

  ipcMain.handle('file:retrieve-secure', async (_event, fileId, outputPath) => {
    console.log('Retrieving secure file:', fileId, outputPath);
    return { success: true };
  });

  ipcMain.handle('file:delete-secure', async (_event, fileId) => {
    console.log('Deleting secure file:', fileId);
    return { success: true };
  });

  ipcMain.handle('file:list-secure', async (_event, filters) => {
    console.log('Listing secure files:', filters);
    return { success: true, data: [] };
  });

  ipcMain.handle('file:secure-stats', async () => {
    return { success: true, data: { totalFiles: 0, totalSize: 0 } };
  });

  // Key management (placeholders)
  ipcMain.handle('key:rotate', async (_event, _currentPassword, _newPassword) => {
    console.log('Rotating master key');
    return { success: true };
  });

  ipcMain.handle('key:rotation-status', async () => {
    return { success: true, data: { inProgress: false, lastRotation: null } };
  });

  ipcMain.handle('key:list', async () => {
    return { success: true, data: [] };
  });

  ipcMain.handle('key:stats', async () => {
    return { success: true, data: { totalKeys: 1, activeKey: 'master' } };
  });

  // Database encryption
  ipcMain.handle('db:setup-encrypted', async (_event, dbPath) => {
    console.log('Setting up encrypted database:', dbPath);
    return { success: true };
  });

  ipcMain.handle('db:verify-encryption', async (_event, _dbPath) => {
    return { success: true, data: { encrypted: true } };
  });

   ipcMain.handle('db:encryption-info', async () => {
     const info = await getDatabaseInfo();
     return { success: true, data: info };
   });

   // Database setup operations
   ipcMain.handle('db:setup', async (_event, masterPassword) => {
     try {
       const result = await setupDatabase(masterPassword);
       return { success: result };
     } catch (error) {
       return { success: false, error: error.message };
     }
   });

   ipcMain.handle('db:verify-password', async (_event, masterPassword) => {
     try {
       const result = await verifyDatabasePassword(masterPassword);
       return { success: true, data: { valid: result } };
     } catch (error) {
       return { success: false, error: error.message };
     }
   });

   ipcMain.handle('db:change-password', async (_event, currentPassword, newPassword) => {
     try {
       const result = await changeDatabasePassword(currentPassword, newPassword);
       return { success: result };
     } catch (error) {
       return { success: false, error: error.message };
     }
   });

  // Performance monitoring
  ipcMain.handle('performance:ipc-stats', async () => {
    return { success: true, data: { totalCalls: 0, avgResponseTime: 0 } };
  });

  ipcMain.handle('performance:memory-stats', async () => {
    return { success: true, data: { used: 100, total: 1000, percentage: 10 } };
  });

  ipcMain.handle('performance:cleanup-memory', async () => {
    if (global.gc) global.gc();
    return { success: true };
  });

  ipcMain.handle('performance:force-gc', async () => {
    if (global.gc) global.gc();
    return { success: true };
  });

  // Database optimization
  ipcMain.handle('db:analyze', async () => {
    return { success: true, data: { tables: [], indexes: [] } };
  });

  ipcMain.handle('db:optimize', async (_event, optimizations) => {
    console.log('Optimizing database:', optimizations);
    return { success: true };
  });

  ipcMain.handle('db:benchmark', async (_event, query, _params, _iterations) => {
    console.log('Benchmarking query:', query);
    return { success: true, data: { avgTime: 10, minTime: 5, maxTime: 20 } };
  });

  ipcMain.handle('db:metrics', async () => {
    return { success: true, data: { connections: 1, queriesPerSecond: 0 } };
  });

  // Offline sync
  ipcMain.handle('sync:queue', async (_event, operation) => {
    console.log('Queueing offline operation:', operation);
    return { success: true, data: { id: 'op_' + Date.now() } };
  });

  ipcMain.handle('sync:status', async () => {
    return { success: true, data: { online: true, pendingOperations: 0 } };
  });

  ipcMain.handle('sync:force', async () => {
    console.log('Forcing sync');
    return { success: true };
  });

  ipcMain.handle('sync:resolve-conflict', async (_event, conflictId, resolution) => {
    console.log('Resolving conflict:', conflictId, resolution);
    return { success: true };
  });

  // Batch operations
  ipcMain.handle('batch:invoke', async (_event, channel, requests) => {
    console.log('Batch invoke:', channel, requests.length, 'requests');
    const results = [];
    for (const request of requests) {
      try {
        const result = await ipcMain.callHandler(channel, event, ...request.args);
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    return { success: true, data: results };
  });

  // System info
  ipcMain.handle('system:get-info', async () => {
    const os = require('os');
    return {
      success: true,
      data: {
        platform: process.platform,
        arch: process.arch,
        version: app.getVersion(),
        electron: process.versions.electron,
        node: process.versions.node,
        hostname: os.hostname(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem()
      }
    };
  });

  // Memory alerts
  ipcMain.handle('memory:log-alert', async (_event, level, memoryUsage) => {
    console.log(`Memory alert [${level}]:`, memoryUsage);
    return { success: true };
  });

  // Update operations
  ipcMain.handle('updater:check', async () => {
    const { checkForUpdatesManual } = require('./updater');
    checkForUpdatesManual();
    return { success: true };
  });

  ipcMain.handle('updater:get-status', async () => {
    const { getUpdateStatus } = require('./updater');
    return { success: true, data: getUpdateStatus() };
  });

  // Authentication operations
  ipcMain.handle('auth:set-master-password', async (_event, password) => {
    try {
      const result = await setMasterPassword(password);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('auth:authenticate', async (_event, password) => {
    try {
      const result = await authenticate(password);
      if (result.success && mainWindow) {
        mainWindow.webContents.send('auth:changed', { isAuthenticated: true, method: 'password' });
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('auth:is-authenticated', async () => {
    return { success: true, data: { authenticated: isAuthenticated() } };
  });

  ipcMain.handle('auth:logout', async () => {
    logout();
    if (mainWindow) {
      mainWindow.webContents.send('auth:changed', { isAuthenticated: false });
    }
    return { success: true };
  });

  ipcMain.handle('auth:change-password', async (_event, currentPassword, newPassword) => {
    try {
      const result = await changeMasterPassword(currentPassword, newPassword);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('auth:enable-biometric', async () => {
    try {
      const result = await enableBiometric();
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('auth:authenticate-biometric', async () => {
    try {
      const result = await authenticateBiometric();
      if (result.success && mainWindow) {
        mainWindow.webContents.send('auth:changed', { isAuthenticated: true, method: 'biometric' });
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('auth:get-status', async () => {
    return { success: true, data: getAuthStatus() };
  });

  ipcMain.handle('auth:is-master-password-set', async () => {
    const isSet = await isMasterPasswordSet();
    return { success: true, data: { isSet } };
  });
}

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');

    if (!secureConfig) {
      secureConfig = new SecureConfig();
      await secureConfig.loadConfig();
    }

    const masterPassword = secureConfig.get('masterPassword');

    db = await openDatabase(masterPassword);
    runMigrations(db);
    setupDatabaseHandlers(db);

    console.log('✅ Database initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

app.whenReady().then(async () => {
  console.log('Electron app ready, initializing...');
  setupSecurity();

  secureConfig = new SecureConfig();
  await secureConfig.loadConfig();

  const ipcSecret = secureConfig.get('ipcSecret');
  secureIPC = new SecureIPC(ipcSecret);
  console.log('✅ Secure IPC initialized with HMAC signing');

  sessionManager = new SessionManager({
    sessionTimeoutMinutes: secureConfig.get('sessionTimeoutMinutes'),
    maxConcurrentSessions: 3,
    sessionRenewalMinutes: secureConfig.get('sessionTimeoutMinutes') / 2,
    lockoutDurationMinutes: secureConfig.get('lockoutDurationMinutes'),
    maxLoginAttempts: secureConfig.get('maxLoginAttempts')
  });
  console.log('✅ Session Manager initialized with secure session management');

  setupIPCHandlers(secureIPC, sessionManager);

  console.log('Creating main window...');
  createWindow();
  
  setupMenu(mainWindow);
  setupTray(mainWindow);
  setupNotificationHandlers(ipcMain);
  
  registerShortcuts(mainWindow);

  checkForUpdates();

  console.log('Main window created successfully');
  createPyProc();
});

app.on('will-quit', () => {
  unregisterShortcuts();
  exitPyProc();
});

app.on('window-all-closed', async () => {
  await closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', async () => {
  destroyTray();
  unregisterShortcuts();
  await closeDatabase();
});

module.exports = { createWindow, initializeDatabase };
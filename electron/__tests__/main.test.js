const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Mock electron modules
jest.mock('electron', () => ({
  app: {
    getVersion: jest.fn(() => '1.0.0'),
    getPath: jest.fn((name) => `/mock/path/${name}`),
    on: jest.fn(),
    whenReady: jest.fn(() => Promise.resolve()),
    quit: jest.fn(),
    isPackaged: false
  },
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadURL: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    show: jest.fn(),
    webContents: {
      openDevTools: jest.fn(),
      on: jest.fn(),
      setWindowOpenHandler: jest.fn()
    },
    setMenuBarVisibility: jest.fn(),
    close: jest.fn()
  })),
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn()
  },
  session: {
    defaultSession: {
      webRequest: {
        onHeadersReceived: jest.fn()
      }
    }
  },
  dialog: {
    showOpenDialog: jest.fn(),
    showSaveDialog: jest.fn()
  },
  globalShortcut: {
    register: jest.fn(),
    unregisterAll: jest.fn()
  }
}));

jest.mock('electron-window-state', () => jest.fn(() => ({
  manage: jest.fn(),
  x: 100,
  y: 100,
  width: 1200,
  height: 800
})));

jest.mock('./database', () => ({
  openDatabase: jest.fn(() => Promise.resolve({})),
  closeDatabase: jest.fn()
}));

jest.mock('./migrations/runner', () => ({
  runMigrations: jest.fn()
}));

jest.mock('./setup-database', () => ({
  setupDatabase: jest.fn(() => Promise.resolve(true)),
  verifyDatabasePassword: jest.fn(() => Promise.resolve(true)),
  changeDatabasePassword: jest.fn(() => Promise.resolve(true)),
  getDatabaseInfo: jest.fn(() => ({ encrypted: true }))
}));

jest.mock('./secure-config', () => ({
  SecureConfig: jest.fn().mockImplementation(() => ({
    loadConfig: jest.fn(() => Promise.resolve()),
    get: jest.fn((key) => {
      const config = {
        ipcSecret: 'test-secret',
        masterPassword: 'test-password',
        sessionTimeoutMinutes: 60
      };
      return config[key];
    })
  }))
}));

jest.mock('./session-manager', () => ({
  SessionManager: jest.fn().mockImplementation(() => ({
    // Mock session manager methods
  }))
}));

describe('Electron Main Process', () => {
  let mainWindow;
  let secureConfig;
  let sessionManager;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset modules
    jest.resetModules();

    // Create mock instances
    mainWindow = new BrowserWindow();
    secureConfig = new (require('./secure-config').SecureConfig)();
    sessionManager = new (require('./session-manager').SessionManager)({});
  });

  describe('Window Creation', () => {
    test('should create main window with correct options', () => {
      const { createWindow } = require('./main');

      createWindow();

      expect(BrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          width: expect.any(Number),
          height: expect.any(Number),
          minWidth: 1024,
          minHeight: 768,
          webPreferences: expect.objectContaining({
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            sandbox: true
          })
        })
      );
    });

    test('should load correct URL in development', () => {
      const { createWindow } = require('./main');

      createWindow();

      const mockWindow = BrowserWindow.mock.results[0].value;
      expect(mockWindow.loadURL).toHaveBeenCalledWith(
        'http://localhost:5173'
      );
    });
  });

  describe('Security Setup', () => {
    test('should set up CSP headers', () => {
      const { setupSecurity } = require('./main');

      setupSecurity();

      expect(require('electron').session.defaultSession.webRequest.onHeadersReceived)
        .toHaveBeenCalled();
    });
  });

  describe('IPC Handlers', () => {
    test('should set up IPC handlers', () => {
      const { setupIPCHandlers } = require('./main');

      setupIPCHandlers();

      expect(ipcMain.handle).toHaveBeenCalled();
    });

    test('should handle app:get-version', async () => {
      const { setupIPCHandlers } = require('./main');

      setupIPCHandlers();

      // Find the get-version handler
      const handleCalls = ipcMain.handle.mock.calls;
      const versionHandler = handleCalls.find(call =>
        call[0] === 'app:get-version'
      );

      expect(versionHandler).toBeDefined();

      const handler = versionHandler[1];
      const result = await handler();

      expect(result).toBe('1.0.0');
    });

    test('should handle app:get-path', async () => {
      const { setupIPCHandlers } = require('./main');

      setupIPCHandlers();

      const handleCalls = ipcMain.handle.mock.calls;
      const pathHandler = handleCalls.find(call =>
        call[0] === 'app:get-path'
      );

      expect(pathHandler).toBeDefined();

      const handler = pathHandler[1];
      const result = await handler(null, 'userData');

      expect(result).toBe('/mock/path/userData');
    });
  });

  describe('Database Initialization', () => {
    test('should initialize database successfully', async () => {
      const { initializeDatabase } = require('./main');

      const result = await initializeDatabase();

      expect(result).toBeDefined();
      expect(require('./database').openDatabase).toHaveBeenCalled();
      expect(require('./migrations/runner').runMigrations).toHaveBeenCalled();
    });
  });
});
const Module = require('module');
const originalLoad = Module._load;
const path = require('path');
const os = require('os');

// Mock state
global.mockHandlers = {};
// Store original handle for reset
const originalHandle = global.mockIpcMain ? global.mockIpcMain.handle : null;

global.mockHandlers = {};
global.mockIpcMain = {
  handle: (channel, handler) => {
    console.log(`[MockElectron] Registered handler for: ${channel}`);
    global.mockHandlers[channel] = handler;
  },
  invoke: async (channel, ...args) => {
      console.log(`[MockElectron] Invoked: ${channel}`);
      // Simulate invocation if handler exists
      if (global.mockHandlers[channel]) {
          // Create a mock event
          const event = { sender: { id: 'test-sender' } };
          return await global.mockHandlers[channel](event, ...args);
      }
      return null;
  },
  // Feature to reset mocks
  _reset: () => {
      global.mockHandlers = {};
      // Helper to restore original if patched
      // Since SecureIPC replaces ipcMain.handle, we need to manually restore it if we can't reload the module
      global.mockIpcMain.handle = (channel, handler) => {
          console.log(`[MockElectron] Registered handler for: ${channel}`);
          global.mockHandlers[channel] = handler;
      };
  }
};

global.mockApp = {
    getPath: (name) => {
        const tempDir = path.join(os.tmpdir(), '378x492-tests');
        return tempDir;
    },
    getVersion: () => '1.0.0'
};

Module._load = function(request, parent, isMain) {
  if (request === 'electron') {
    return {
      ipcMain: global.mockIpcMain,
      app: global.mockApp,
      BrowserWindow: class MockBrowserWindow {
          constructor() { 
              this.webContents = {
                  send: (channel) => console.log(`[MockWindow] Sent: ${channel}`)
              }
          }
          loadURL() {}
          on() {}
          once() {}
          show() {}
      },
      Menu: { buildFromTemplate: () => {} },
      Tray: class MockTray {
          setContextMenu() {}
          setToolTip() {}
      },
      dialog: {
          showOpenDialog: async () => ({ filePaths: ['/tmp/test.txt'] })
      }
    };
  }
  return originalLoad.apply(this, arguments);
};

console.log('[MockElectron] Loaded Electron mocks');

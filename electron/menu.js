const { app, Menu, shell, BrowserWindow, ipcMain } = require('electron');
const isMac = process.platform === 'darwin';

function setupMenu(mainWindow) {
  const template = [
    // { role: 'appMenu' }
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
        {
          label: 'New Case',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu:new-case');
          }
        },
        { type: 'separator' },
        {
          label: 'Open File...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const { dialog } = require('electron');
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile']
            });
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow.webContents.send('menu:file-opened', result.filePaths[0]);
            }
          }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
             mainWindow.webContents.send('menu:save');
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    // { role: 'editMenu' }
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: 'Speech',
            submenu: [
              { role: 'startSpeaking' },
              { role: 'stopSpeaking' }
            ]
          }
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ])
      ]
    },
    // { role: 'fraudMenu' }
    {
      label: 'Fraud Analysis',
      submenu: [
        {
          label: 'Run Analysis',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.webContents.send('menu:run-analysis');
          }
        },
        {
          label: 'Generate Report',
          accelerator: 'CmdOrCtrl+G',
          click: () => {
            mainWindow.webContents.send('menu:generate-report');
          }
        },
        { type: 'separator' },
        {
          label: 'Evidence Browser',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.send('menu:evidence-browser');
          }
        },
        {
          label: 'Case Timeline',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            mainWindow.webContents.send('menu:case-timeline');
          }
        }
      ]
    },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    },
    // { role: 'toolsMenu' }
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Database Optimization',
          click: () => {
            mainWindow.webContents.send('menu:db-optimize');
          }
        },
        {
          label: 'Memory Cleanup',
          click: () => {
            mainWindow.webContents.send('menu:memory-cleanup');
          }
        },
        { type: 'separator' },
        {
          label: 'Security Settings',
          click: () => {
            mainWindow.webContents.send('menu:security-settings');
          }
        },
        {
          label: 'Backup Database',
          click: () => {
            mainWindow.webContents.send('menu:backup-database');
          }
        }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Fraud Detection Guide',
          click: () => {
            mainWindow.webContents.send('menu:fraud-guide');
          }
        },
        {
          label: 'Evidence Processing',
          click: () => {
            mainWindow.webContents.send('menu:evidence-help');
          }
        },
        { type: 'separator' },
        {
          label: 'User Manual',
          click: async () => {
            // Open local user manual
            mainWindow.webContents.send('menu:user-manual');
          }
        },
        {
          label: 'API Documentation',
          click: async () => {
            // Open API docs
            mainWindow.webContents.send('menu:api-docs');
          }
        },
        { type: 'separator' },
        {
          label: 'Report Issue',
          click: async () => {
            await shell.openExternal('https://github.com/378x492/fraud-detection/issues');
          }
        },
        {
          label: 'About Simple378',
          click: () => {
            mainWindow.webContents.send('menu:about');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Context Menu
  mainWindow.webContents.on('context-menu', (e, props) => {
    const contextMenu = Menu.buildFromTemplate([
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { type: 'separator' },
      { role: 'selectAll' }
    ]);
    contextMenu.popup({ window: mainWindow });
  });
}

module.exports = { setupMenu };

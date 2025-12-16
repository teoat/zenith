/**
 * Application Menu for Simple378 Electron App
 * 
 * Comprehensive menu system with platform-specific keyboard shortcuts
 */

const { Menu, app, shell, dialog } = require('electron');
const path = require('path');

class ApplicationMenu {
    constructor(mainWindow, authManager) {
        this.mainWindow = mainWindow;
        this.authManager = authManager;
    }

    /**
     * Build and set application menu
     */
    buildMenu() {
        const isMac = process.platform === 'darwin';

        const template = [
            // App Menu (macOS only)
            ...(isMac ? [{
                label: app.name,
                submenu: [
                    { role: 'about' },
                    { type: 'separator' },
                    { 
                        label: 'Preferences...',
                        accelerator: 'Cmd+,',
                        click: () => this.openSettings()
                    },
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

            // File Menu
            {
                label: 'File',
                submenu: [
                    {
                        label: 'New Case',
                        accelerator: 'CmdOrCtrl+Shift+N',
                        click: () => this.createNewCase()
                    },
                    {
                        label: 'Open Case...',
                        accelerator: 'CmdOrCtrl+O',
                        click: () => this.openCase()
                    },
                    { type: 'separator' },
                    {
                        label: 'Upload Evidence...',
                        accelerator: 'CmdOrCtrl+U',
                        click: () => this.uploadEvidence()
                    },
                    {
                        label: 'Export Case Data...',
                        accelerator: 'CmdOrCtrl+E',
                        click: () => this.exportCaseData()
                    },
                    { type: 'separator' },
                    {
                        label: 'Backup Database...',
                        click: () => this.backupDatabase()
                    },
                    {
                        label: 'Restore Database...',
                        click: () => this.restoreDatabase()
                    },
                    { type: 'separator' },
                    isMac ? { role: 'close' } : { role: 'quit' }
                ]
            },

            // Edit Menu
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

            // View Menu
            {
                label: 'View',
                submenu: [
                    {
                        label: 'Dashboard',
                        accelerator: 'CmdOrCtrl+1',
                        click: () => this.navigateTo('/')
                    },
                    {
                        label: 'Cases',
                        accelerator: 'CmdOrCtrl+2',
                        click: () => this.navigateTo('/cases')
                    },
                    {
                        label: 'Forensics',
                        accelerator: 'CmdOrCtrl+3',
                        click: () => this.navigateTo('/forensics')
                    },
                    { type: 'separator' },
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

            // Window Menu
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

            // Help Menu
            {
                role: 'help',
                submenu: [
                    {
                        label: 'Documentation',
                        click: async () => {
                            await shell.openExternal('https://docs.378x492.com')
                        }
                    },
                    {
                        label: 'Keyboard Shortcuts',
                        accelerator: 'CmdOrCtrl+/',
                        click: () => this.showKeyboardShortcuts()
                    },
                    { type: 'separator' },
                    {
                        label: 'Report Issue',
                        click: async () => {
                            await shell.openExternal('https://github.com/378x492/issues')
                        }
                    },
                    {
                        label: 'Check for Updates...',
                        click: () => this.checkForUpdates()
                    },
                    { type: 'separator' },
                    {
                        label: 'About Simple378',
                        click: () => this.showAbout()
                    }
                ]
            }
        ];

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }

    // Menu action handlers

    createNewCase() {
        this.mainWindow.webContents.send('menu-action', 'new-case');
    }

    openCase() {
        this.mainWindow.webContents.send('menu-action', 'open-case');
    }

    uploadEvidence() {
        dialog.showOpenDialog(this.mainWindow, {
            title: 'Select Evidence Files',
            properties: ['openFile', 'multiSelections'],
            filters: [
                { name: 'All Files', extensions: ['*'] },
                { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt'] },
                { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif'] },
                { name: 'Videos', extensions: ['mp4', 'mov', 'avi'] }
            ]
        }).then(result => {
            if (!result.canceled) {
                this.mainWindow.webContents.send('upload-evidence', result.filePaths);
            }
        });
    }

    exportCaseData() {
        dialog.showSaveDialog(this.mainWindow, {
            title: 'Export Case Data',
            defaultPath: `case-export-${Date.now()}.json`,
            filters: [
                { name: 'JSON', extensions: ['json'] },
                { name: 'CSV', extensions: ['csv'] }
            ]
        }).then(result => {
            if (!result.canceled) {
                this.mainWindow.webContents.send('export-case', result.filePath);
            }
        });
    }

    async backupDatabase() {
        const { ipcMain } = require('electron');
        this.mainWindow.webContents.send('backup-database');
    }

    async restoreDatabase() {
        const result = await dialog.showOpenDialog(this.mainWindow, {
            title: 'Select Backup File',
            properties: ['openFile'],
            filters: [{ name: 'Database Backup', extensions: ['db'] }]
        });

        if (!result.canceled) {
            this.mainWindow.webContents.send('restore-database', result.filePaths[0]);
        }
    }

    openSettings() {
        this.navigateTo('/settings');
    }

    navigateTo(route) {
        this.mainWindow.webContents.send('navigate', route);
    }

    showKeyboardShortcuts() {
        dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'Keyboard Shortcuts',
            message: 'Simple378 Keyboard Shortcuts',
            detail: `
File:
  Cmd/Ctrl+Shift+N  New Case
  Cmd/Ctrl+O         Open Case
  Cmd/Ctrl+U         Upload Evidence
  Cmd/Ctrl+E         Export Case

View:
  Cmd/Ctrl+1         Dashboard
  Cmd/Ctrl+2         Cases
  Cmd/Ctrl+3         Forensics

Other:
  Cmd/Ctrl+F         Search
  Cmd/Ctrl+,         Settings
  Cmd/Ctrl+/         Keyboard Shortcuts
            `.trim(),
            buttons: ['OK']
        });
    }

    checkForUpdates() {
        this.mainWindow.webContents.send('check-updates');
    }

    showAbout() {
        dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'About Simple378',
            message: 'Simple378 Fraud Detection',
            detail: `
Version: ${app.getVersion()}
Electron: ${process.versions.electron}
Chrome: ${process.versions.chrome}
Node: ${process.versions.node}

© 2024 Simple378. All rights reserved.
            `.trim(),
            buttons: ['OK']
        });
    }
}

module.exports = ApplicationMenu;

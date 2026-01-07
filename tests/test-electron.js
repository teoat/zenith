const { app, BrowserWindow } = require('electron'); app.whenReady().then(() => { const win = new BrowserWindow(); win.loadURL('data:text/html,<h1>Hello Electron</h1>'); });

const { Tray, Menu, app, nativeImage } = require('electron');
const path = require('path');

let tray = null;
let unreadCount = 0;

function updateTrayMenu(mainWindow) {
  if (!tray) return;
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show 378x492',
      click: () => mainWindow.show()
    },
    {
      label: 'New Case',
      accelerator: 'CmdOrCtrl+N',
      click: () => mainWindow.webContents.send('menu:new-case')
    },
    {
      label: 'Run Analysis',
      accelerator: 'CmdOrCtrl+R',
      click: () => mainWindow.webContents.send('menu:run-analysis')
    },
    { type: 'separator' },
    {
      label: unreadCount > 0 ? `Notifications (${unreadCount})` : 'No New Notifications',
      enabled: unreadCount > 0,
      click: () => {
        mainWindow.show();
        mainWindow.webContents.send('menu:show-notifications');
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);
  tray.setContextMenu(contextMenu);
}

function setupTray(mainWindow) {
  try {
    // Try to load icon
    const iconPath = path.join(__dirname, '../build/icon.png'); // Use build icon
    let icon;
    try {
      icon = nativeImage.createFromPath(iconPath);
    } catch (e) {
      // Fallback to default icon or create a simple one
      icon = nativeImage.createEmpty();
      console.warn('Tray icon not found, using empty icon');
    }

    tray = new Tray(icon.resize({ width: 16, height: 16 }));

    updateTrayMenu(mainWindow);
    tray.setToolTip('378x492 Fraud Detection');

  } catch (error) {
    console.warn('Failed to initialize system tray:', error.message);
  }

  return tray;
}

function updateTrayBadge(count, mainWindow) {
  unreadCount = count || 0;
  if (tray) {
    // Update tooltip to show count
    tray.setToolTip(unreadCount > 0 ?
      `378x492 Fraud Detection (${unreadCount} notifications)` :
      '378x492 Fraud Detection'
    );
    // Update menu with new count
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show 378x492',
        click: () => mainWindow.show()
      },
      {
        label: 'New Case',
        accelerator: 'CmdOrCtrl+N',
        click: () => mainWindow.webContents.send('menu:new-case')
      },
      {
        label: 'Run Analysis',
        accelerator: 'CmdOrCtrl+R',
        click: () => mainWindow.webContents.send('menu:run-analysis')
      },
      { type: 'separator' },
      {
        label: unreadCount > 0 ? `Notifications (${unreadCount})` : 'No New Notifications',
        enabled: unreadCount > 0,
        click: () => {
          mainWindow.show();
          mainWindow.webContents.send('menu:show-notifications');
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.isQuitting = true;
          app.quit();
        }
      }
    ]);
    tray.setContextMenu(contextMenu);
  }
}

function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

module.exports = { setupTray, updateTrayBadge, destroyTray };

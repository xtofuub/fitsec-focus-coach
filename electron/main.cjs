const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 460,
    height: 420,
    frame: false,
    resizable: true,
    minWidth: 460,
    maxWidth: 460,
    minHeight: 420,
    maxHeight: 420,
    alwaysOnTop: false,
    transparent: true,
    backgroundColor: '#00000000',
    skipTaskbar: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      devTools: isDev,
    },
    icon: path.join(__dirname, '../public/icon.png'),
  });

  const url = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(url);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handlers for custom window controls
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

function createTray() {
  try {
    const icon = nativeImage.createFromPath(path.join(__dirname, '../public/icon.png'));
    tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  } catch {
    tray = new Tray(nativeImage.createEmpty());
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show/Hide', click: () => {
        if (mainWindow) {
          mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit', click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Focus Coach');
  tray.setContextMenu(contextMenu);
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.focus.coach');
  }
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

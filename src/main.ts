import { app, BrowserWindow, ipcMain } from 'electron';

import db from './db';
import { IPCRendererMessage } from './types';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

let win: BrowserWindow;

const createWindow = () => {
  // Create the browser window.
  win = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  // and load the index.html of the app.
  win.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  win.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
ipcMain.on('toMain', async (event, { type, payload }: IPCRendererMessage) => {
  switch (type) {
    case 'find': {
      const data = await db.rows.find({}).sort({ createdAt: 1 });
      win.webContents.send('fromMain', { type: 'find', payload: data });
      break;
    }
    case 'insert': {
      const res = await db.rows.insert(payload);
      win.webContents.send('fromMain', { type: 'insert', payload: res });
      break;
    }
    case 'remove': {
      await db.rows.remove(payload, {});
      break;
    }
    case 'update': {
      await db.rows.update(
        { _id: (payload as { _id: number })._id },
        (payload as { data: unknown }).data
      );
      break;
    }
  }
});

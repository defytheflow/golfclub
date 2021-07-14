import { app, BrowserWindow, ipcMain } from 'electron';

import db from './db';
import log from './logging';
import { DBAction } from './types';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let win: BrowserWindow;

function createWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 900,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });
  win.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools();
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  db.init(createWindow);
});

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

ipcMain.on('toMain', async (event, action: DBAction) => {
  log('IPC MAIN RAN');
  switch (action.type) {
    case 'load': {
      const rows = await db.rows.find({}).sort({ createdAt: 1 });
      const columns = await db.columns.find({}).sort({ order: 1 });
      win.webContents.send('fromMain', { type: action.type, payload: { rows, columns } });
      break;
    }
    case 'insert_row': {
      const row = await db.rows.insert(action.payload);
      win.webContents.send('fromMain', { type: action.type, payload: row });
      break;
    }
    case 'update_row': {
      const { _id, ...data } = action.payload;
      await db.rows.update({ _id }, data);
      win.webContents.send('fromMain', action);
      break;
    }
    case 'remove_row': {
      await db.rows.remove({ _id: action.payload }, {});
      win.webContents.send('fromMain', action);
      break;
    }
    case 'insert_column': {
      const column = await db.columns.insert(action.payload);
      win.webContents.send('fromMain', { type: action.type, payload: column });
      break;
    }
    case 'update_column': {
      const { _id, ...data } = action.payload;
      await db.columns.update({ _id }, data);
      win.webContents.send('fromMain', action);
      break;
    }
    case 'remove_column': {
      await db.columns.remove({ _id: action.payload }, {});
      win.webContents.send('fromMain', action);
      break;
    }
  }
});

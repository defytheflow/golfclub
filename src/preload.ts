import { contextBridge, ipcRenderer } from 'electron';
import { DBAction } from './types';

contextBridge.exposeInMainWorld('api', {
  send(channel: string, action: DBAction) {
    const validChannels = ['toMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, action);
    }
  },
  receive(channel: string, func: (action: DBAction) => void) {
    const validChannels = ['fromMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(args[0]));
    }
  },
});

contextBridge.exposeInMainWorld('platform', process.platform);

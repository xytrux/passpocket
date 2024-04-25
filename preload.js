const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  setEncryptionType: (value) => ipcRenderer.send('setEncryptionType', value)
})
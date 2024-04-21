const { app, BrowserWindow } = require('electron')

function createWindow () {
  let win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
    autoHideMenuBar: true,
  })

  win.loadFile('index.html')
}
app.commandLine.appendSwitch('--enable-features', 'FluentOverlayScrollbar');
app.whenReady().then(createWindow);
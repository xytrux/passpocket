const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");

function createWindow() {
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        icon: "icon.png",
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            devTools: true,
            nodeIntegration: true,
        },
    });

    win.loadFile("index.html");
}
app.commandLine.appendSwitch("--enable-features", "FluentScrollbar");

app.whenReady().then(() => {
    createWindow();

    app.on("activate", function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", function () {
    if (process.platform !== "darwin") app.quit();
});

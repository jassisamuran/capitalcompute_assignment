import { app, BrowserWindow, ipcMain, desktopCapturer, shell } from "electron";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

const getVideosDir = (): string =>
  join(app.getPath("documents"), "Captura", "video");


function ensureDir(dir:string):void{
    if(!existsSync(dir))mkdirSync(dir,{recursive:true})
}
function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1000,
    height: 720,
    minWidth: 860,
    minHeight: 580,
    backgroundColor: '#111113',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: process.platform !== 'darwin',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

app.whenReady().then(()=>{
    ensureDir(getVideosDir())
    createWindow()

    app.on('activate',()=>{
        if(BrowserWindow.getAllWindows().length==0)createWindow()
    })

    app.on('window-all-closed',()=>{
        if(process.platform!=='darwin')app.quit()
    })
})
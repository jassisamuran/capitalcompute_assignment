import { app, BrowserWindow, ipcMain, desktopCapturer, shell } from "electron";
import { existsSync, mkdirSync, renameSync, writeFileSync } from "fs";
import { join } from "path";
import { readdirSync, rmSync, statSync } from "fs";
import { v4 as uuidv4 } from "uuid";

const getVideosDir = (): string =>
  join(app.getPath("documents"), "Captura", "video");

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}
function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1000,
    height: 720,
    minWidth: 860,
    minHeight: 580,
    backgroundColor: "#111113",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    frame: process.platform !== "darwin",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }

  return win;
}

app.whenReady().then(() => {
  ensureDir(getVideosDir());
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length == 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("get-sources", async () => {
  const sources = await desktopCapturer.getSources({
    types: ["screen", "window"],
    thumbnailSize: { width: 320, height: 200 },
    fetchWindowIcons: true,
  });
  return sources.map((s) => ({
    id: s.id,
    name: s.name,
    thumbnail: s.thumbnail.toDataURL(),
    display_id: s.display_id,
    appIcon: s.appIcon?.toDataURL() ?? null,
  }));
});

ipcMain.handle("create-session", () => {
  const sessionId = uuidv4();
  const sessionPath = join(getVideosDir(), sessionId);
  ensureDir(sessionPath);
  return { sessionId, sessionPath };
});

ipcMain.handle(
  "save-recording",
  async (
    _event,
    sessionId: string,
    type: "screen" | "webcam",
    buffer: ArrayBuffer,
  ) => {
    const sessionPath = join(getVideosDir(), sessionId);
    const filename = type === "screen" ? "screen.webm" : "webcam.webm";
    const filepath = join(sessionPath, filename);
    writeFileSync(filepath, Buffer.from(buffer));
    return filepath;
  },
);

ipcMain.handle(
  "rename-session",
  (_event, sessionId: string, newName: string) => {
    const oldPath = join(getVideosDir(), sessionId);
    const safeName = newName.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60);
    const newPath = join(
      getVideosDir(),
      `${safeName}_${sessionId.slice(0, 8)}`,
    );
    renameSync(oldPath, newPath);
    return newPath;
  },
);

ipcMain.handle("open-folder", (_event, sessionId: string) => {
  const sessionPath = join(getVideosDir(), sessionId);
  shell.openPath(sessionPath);
});

ipcMain.handle("list-sessions", () => {
  const baseDir = getVideosDir();

  if (!existsSync(baseDir)) return [];

  const folders = readdirSync(baseDir).filter((name) => {
    const fullPath = join(baseDir, name);
    return statSync(fullPath).isDirectory();
  });

  return folders.map((folderName) => {
    const fullPath = join(baseDir, folderName);

    return {
      folderName,
      path: fullPath,
      createdAt: statSync(fullPath).birthtime,
    };
  });
});

ipcMain.handle("get-version", () => app.getVersion());

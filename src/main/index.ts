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
  (_event, folderName: string, newName: string) => {
    const oldPath = join(getVideosDir(), folderName);

    const safeName = newName
      .trim()
      .replace(/[^a-zA-Z0-9_\-]/g, "_")
      .slice(0, 50);

    const uniqueSuffix = folderName.slice(-8).replace(/[^a-zA-Z0-9]/g, "");
    const newFolderName = `${safeName}_${uniqueSuffix}`;
    const newPath = join(getVideosDir(), newFolderName);

    try {
      renameSync(oldPath, newPath);
      console.log("newfole", newFolderName);
      return newFolderName;
    } catch (err: any) {
      throw new Error(`Rename failed: ${err.message}`);
    }
  },
);

ipcMain.handle("open-folder", (_event, sessionId: string) => {
  const sessionPath = join(getVideosDir(), sessionId);
  shell.openPath(sessionPath);
});

ipcMain.handle("list-sessions", () => {
  const videosDir = getVideosDir();
  ensureDir(videosDir);

  const entries = readdirSync(videosDir, { withFileTypes: true });

  return entries
    .filter((e) => e.isDirectory())
    .map((dir) => {
      const folderPath = join(videosDir, dir.name);

      let files: string[] = [];
      try {
        files = readdirSync(folderPath); // ['screen.webm', 'webcam.webm']
      } catch {
        files = [];
      }

      const screenExists = files.includes("screen.webm");
      const webcamExists = files.includes("webcam.webm");

      const stat = statSync(folderPath);

      const screenSize = screenExists
        ? statSync(join(folderPath, "screen.webm")).size
        : 0;
      const webcamSize = webcamExists
        ? statSync(join(folderPath, "webcam.webm")).size
        : 0;

      const d = {
        folderName: dir.name,
        folderPath,
        createdAt: stat.birthtimeMs || stat.ctimeMs,
        screenExists,
        webcamExists,
        screenSize,
        webcamSize,
      };
      console.log(d);
      return d;
    })
    .sort((a, b) => b.createdAt - a.createdAt);
});

ipcMain.handle("delete-session", (_event, folderName: string) => {
  const folderPath = join(getVideosDir(), folderName);
  rmSync(folderPath, { recursive: true, force: true });
});

ipcMain.handle("get-version", () => app.getVersion());

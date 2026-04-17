import {
  app,
  BrowserWindow,
  ipcMain,
  desktopCapturer,
  shell,
  dialog,
} from "electron";
import { existsSync, mkdirSync, renameSync, writeFileSync } from "fs";
import { join } from "path";
import { readdirSync, rmSync, statSync } from "fs";
import { v4 as uuidv4 } from "uuid";

const getVideosDir = (): string =>
  join(app.getPath("documents"), "ScreenCasta", "video");

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

let isRecording = false;
let mainWindow: BrowserWindow | null = null;

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
  win.maximize();


  win.on("close", (e) => {
    if (!isRecording) return;

    e.preventDefault();
    const choice = dialog.showMessageBoxSync(win, {
      type: "warning",
      buttons: ["Stop & Close", "Keep Recording"],
      defaultId: 1,
      cancelId: 1,
      title: "Recording in progress",
      message: "A recording is in progress.",
      detail:
        "Stopping now will save whatever has been captured so far. Continue anyway?",
    });

    if (choice === 0) {
      win.webContents.send("force-stop-recording");
      isRecording = false;
      setTimeout(() => win.destroy(), 5000);
    }
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
  mainWindow = createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", (e) => {
  if (!isRecording) return;

  e.preventDefault();
  isRecording = false;

  const wins = BrowserWindow.getAllWindows();
  if (wins.length > 0) {
    wins[0].webContents.send("force-stop-recording");
  }
  setTimeout(() => app.quit(), 5000);
});


ipcMain.handle("get-sources", async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ["screen", "window"],
      thumbnailSize: { width: 320, height: 200 },
      fetchWindowIcons: true,
    });
    return {
      ok: true as const,
      sources: sources.map((s) => ({
        id: s.id,
        name: s.name,
        thumbnail: s.thumbnail.toDataURL(),
        display_id: s.display_id,
        appIcon: s.appIcon?.toDataURL() ?? null,
      })),
    };
  } catch (err: any) {
    return {
      ok: false as const,
      error: (err?.message as string) ?? "Screen capture permission denied",
    };
  }
});

ipcMain.handle("create-session", () => {
  const sessionId = uuidv4();
  const sessionPath = join(getVideosDir(), sessionId);
  ensureDir(sessionPath);
  return { sessionId, sessionPath };
});

ipcMain.handle("hide-for-recording", () => {
  BrowserWindow.getAllWindows().forEach((w) => w.minimize());
});

ipcMain.handle("show-after-recording", () => {
  BrowserWindow.getAllWindows().forEach((w) => {
    w.restore();
    w.focus();
  });
});

ipcMain.handle("set-recording-state", (_event, recording: boolean) => {
  isRecording = recording;
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
    ensureDir(sessionPath);

    if (!buffer || buffer.byteLength === 0) {
      throw new Error(
        `Nothing to save — the ${type} recording was empty. Try recording for longer.`,
      );
    }

    const filename = type === "screen" ? "screen.webm" : "webcam.webm";
    const filepath = join(sessionPath, filename);
    writeFileSync(filepath, Buffer.from(buffer));
    return filepath;
  },
);

ipcMain.handle(
  "rename-session",
  (_event, folderName: string, newName: string) => {
    const videosDir = getVideosDir();
    const oldPath = join(videosDir, folderName);

    if (!existsSync(oldPath)) {
      throw new Error("Session folder no longer exists.");
    }

    const safeName = newName
      .trim()
      .replace(/[^a-zA-Z0-9_\-]/g, "_")
      .slice(0, 50);

    const uniqueSuffix = folderName.slice(-8).replace(/[^a-zA-Z0-9]/g, "");
    const newFolderName = `${safeName}_${uniqueSuffix}`;
    const newPath = join(videosDir, newFolderName);

    if (existsSync(newPath)) {
      throw new Error(
        `A session named "${newFolderName}" already exists. Choose a different name.`,
      );
    }

    try {
      renameSync(oldPath, newPath);
      return newFolderName;
    } catch (err: any) {
      throw new Error(`Rename failed: ${err.message}`);
    }
  },
);

ipcMain.handle("open-folder", (_event, sessionId: string) => {
  const sessionPath = join(getVideosDir(), sessionId);

  if (existsSync(sessionPath)) {
    shell.openPath(sessionPath);
  } else {
    shell.openPath(getVideosDir());
  }
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
        files = readdirSync(folderPath);
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

      return {
        folderName: dir.name,
        folderPath,
        createdAt: stat.birthtimeMs || stat.ctimeMs,
        screenExists,
        webcamExists,
        screenSize,
        webcamSize,
      };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
});

ipcMain.handle("delete-session", (_event, folderName: string) => {
  const folderPath = join(getVideosDir(), folderName);
  if (existsSync(folderPath)) {
    rmSync(folderPath, { recursive: true, force: true });
  }
});

ipcMain.handle("get-version", () => app.getVersion());

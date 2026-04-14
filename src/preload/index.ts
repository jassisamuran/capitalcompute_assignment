import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getSources: () => ipcRenderer.invoke("get-sources"),

  createSession: () => ipcRenderer.invoke("create-session"),

  saveRecording: (
    sessionId: String,
    type: "screen" | "webcam",
    buffer: ArrayBuffer,
  ) => ipcRenderer.invoke("save-recording", sessionId, type, buffer),

  renameSession: (sessionId: string, newName: string) =>
    ipcRenderer.invoke("rename-session", sessionId, newName),

  openFolder: (sessionId: string) =>
    ipcRenderer.invoke("open-folder", sessionId),

  getVersion: () => ipcRenderer.invoke("get-version"),
});

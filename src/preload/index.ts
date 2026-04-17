import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electronAPI", {
  getSources: () => ipcRenderer.invoke("get-sources"),

  createSession: () => ipcRenderer.invoke("create-session"),

  saveRecording: (
    sessionId: string,
    type: "screen" | "webcam",
    buffer: ArrayBuffer,
  ) => ipcRenderer.invoke("save-recording", sessionId, type, buffer),

  renameSession: (sessionId: string, newName: string) =>
    ipcRenderer.invoke("rename-session", sessionId, newName),

  openFolder: (sessionId: string) =>
    ipcRenderer.invoke("open-folder", sessionId),
  listSessions: () => ipcRenderer.invoke("list-sessions"),
  deleteSession: (folderName: string) =>
    ipcRenderer.invoke("delete-session", folderName),

  getVersion: () => ipcRenderer.invoke("get-version"),

  hideForRecording: () => ipcRenderer.invoke("hide-for-recording"),
  showAfterRecording: () => ipcRenderer.invoke("show-after-recording"),

  setRecordingState: (recording: boolean) =>
    ipcRenderer.invoke("set-recording-state", recording),

  onForceStop: (callback: () => void) => {
    ipcRenderer.on("force-stop-recording", callback);
    return () => ipcRenderer.removeListener("force-stop-recording", callback);
  },
});

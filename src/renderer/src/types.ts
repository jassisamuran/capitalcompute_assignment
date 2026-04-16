export interface Source {
  id: string;
  name: string;
  thumbnail: string;
  display_id: string;
  appIcon: string | null;
}

export type AppView = 'home' | 'select' | 'ready' | 'recording' | 'complete' | 'library'

export interface RecordingSession {
  sessionId: string;
  sessionPath: string;
  startedAt: number;
  screenSaved: boolean;
  webcamSaved: boolean;
}

declare global {
  interface Window {
    electronAPI: {
      getSources: () => Promise<Source[]>;
      createSession: () => Promise<{ sessionId: string; sessionPath: string }>;
      saveRecording: (
        sessionId: string,
        type: "screen" | "webcam",
        buffer: ArrayBuffer,
      ) => Promise<string>;
      renameSession: (sessionId: string, newName: string) => Promise<string>;
      openFolder: (sessionId: string) => Promise<void>;
      listSessions: () => Promise<SessionEntry[]>
      deleteSession: (folderName: string) => Promise<void>
      getVersion: () => Promise<string>;
    };
  }
}

export interface SessionEntry {
  folderName: string
  folderPath: string
  createdAt: number
  screenExists: boolean
  webcamExists: boolean
  screenSize: number   
  webcamSize: number   
}
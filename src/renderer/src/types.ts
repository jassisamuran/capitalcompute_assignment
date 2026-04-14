export interface Source {
  id: string;
  name: string;
  thubnail: string;
  display_id: string;
  appIcon: string | null;
}

export type AppView = "select" | "ready" | "recording" | "complete";

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
    };
  }
}

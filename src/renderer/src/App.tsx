import { useState } from "react";
import { AppView, RecordingSession, Source } from "./types";

import RecordingView from "./components/RecordingView";
import CompletionView from "./components/completionView/CompletionView";
import HomeView from "./components/homeView/HomeView";
import SourceGrid from "./components/sourceGrid/SourceGrid";
import SessionsView from "./components/sessionView";

export default function App() {
  const [view, setView] = useState<AppView>("home");
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [webcamEnabled, setWebcamEnabled] = useState(true);
  const [session, setSession] = useState<RecordingSession | null>(null);

  const handleSourceSelect = (source: Source) => {
    setSelectedSource(source);
    setView("ready");
  };

  const handleStartRecording = async () => {
    const { sessionId, sessionPath } = await window.electronAPI.createSession();
    setSession({
      sessionId,
      sessionPath,
      startedAt: Date.now(),
      screenSaved: false,
      webcamSaved: false,
    });
    setView("recording");
  };

  const handleRecordingComplete = (updated: RecordingSession) => {
    setSession(updated);
    setView("complete");
  };

  const handleReset = () => {
    setSelectedSource(null);
    setSession(null);
    setView("home");
  };

  return (
    <div className="h-screen flex flex-col bg-[#0e0e10] text-zinc-100 overflow-hidden">
      <main className="flex-1 overflow-hidden">
        {view === "home" && (
          <HomeView
            onNewRecording={() => setView("select")}
            onViewLibrary={() => setView("library")}
          />
        )}

        {view === "select" && (
          <SourceGrid
            onSelect={handleSourceSelect}
            onBack={() => setView("home")}
          />
        )}

        {(view === "ready" || view === "recording") && selectedSource && (
          <RecordingView
            source={selectedSource}
            webcamEnabled={webcamEnabled}
            onWebcamToggle={setWebcamEnabled}
            onStart={handleStartRecording}
            onBack={() => setView("select")}
            mode={view === "recording" ? "recording" : "ready"}
            session={session}
            onComplete={handleRecordingComplete}
          />
        )}

        {view === "complete" && session && (
          <CompletionView
            session={session}
            webcamEnabled={webcamEnabled}
            onReset={handleReset}
            setSession={setSession}
          />
        )}

        {view === "library" && (
          <SessionsView onNewRecording={() => setView("select")} />
        )}
      </main>
    </div>
  );
}

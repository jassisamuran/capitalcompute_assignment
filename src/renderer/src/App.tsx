import { useState } from "react";
import { AppView, RecordingSession, Source } from "./types";
import SourceGrid from "./components/SourceGrid";
import RecordingView from "./components/RecordingView";
import CompletionView from "./components/completionView/CompletionView";

export default function App() {
  const [sources, setSources] = useState<Source[]>([]);
  const [view, setView] = useState<AppView>("select");
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [webcamEnabled, setWebcamEnabled] = useState(true);
  const [session, setSession] = useState<RecordingSession | null>(null);
  const [loadingSources, setLoadingSources] = useState(false);

  const handleSourceSelect = (source: Source) => {
    setSelectedSource(source);
    setView("ready");
  };

  const loadSources = async () => {
    setLoadingSources(true);
    try {
      const src = await window.electronAPI.getSources();
      setSources(src);
    } catch (err) {
      console.log("get-sources failed:", err);
    } finally {
      setLoadingSources(false);
    }
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
  const handleReset = () => {
    setSelectedSource(null);
    setSession(null);
    setSources([]);
    setView("select");
  };

  const handleRecordingComplete = (updated: RecordingSession) => {
    setSession(updated);
    setView("complete");
  };

  return (
    <div className="text-white">
      <div className="h-8 flex items-center ">
        <span className="text-[20px] font-mono">CAPTURA</span>
      </div>
      <main>
        <SourceGrid
          sources={sources}
          onLoad={loadSources}
          loading={loadingSources}
          onSelect={handleSourceSelect}
        />
      </main>
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
        />
      )}
    </div>
  );
}

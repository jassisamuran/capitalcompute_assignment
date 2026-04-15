import { useState } from "react";
import { AppView, RecordingSession, Source } from "./types";
import SourceGrid from "./components/SourceGrid";
import RecordingView from "./components/RecordingView";

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

  const handleRecordingComplete = (updated: RecordingSession) => {
    setSession(updated);
    setView("complete");
  };

  return (
    <div style={{ color: "blue" }}>
      one issd one
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
      {view === "ready" && selectedSource && (
        <RecordingView
          source={selectedSource}
          webcamEnabled={webcamEnabled}
          onWebcamToggle={setWebcamEnabled}
          onStart={handleStartRecording}
          onBack={() => setView("select")}
          mode="ready"
          session={null}
          onComplete={handleRecordingComplete}
        />
      )}
      {view === "recording" && selectedSource && session && (
        <RecordingView
          source={selectedSource}
          webcamEnabled={webcamEnabled}
          onWebcamToggle={setWebcamEnabled}
          onStart={handleStartRecording}
          onBack={() => {}}
          mode="recording"
          session={session}
          onComplete={handleRecordingComplete}
        />
      )}
    </div>
  );
}

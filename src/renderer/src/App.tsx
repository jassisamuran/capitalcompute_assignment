import { useState } from "react";
import { AppView, RecordingSession, Source } from "./types";
import SourceGrid from "./components/SourceGrid";
import RecordingView from "./components/RecordingView";
import CompletionView from "./components/completionView/CompletionView";

export default function App() {
  const [sources, setSources] = useState<Source[]>([]);
  const [view, setView] = useState<AppView>("select");
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [webcamEnabled, setWebcamEnabled] = useState(true);
  const [session, setSession] = useState<RecordingSession | null>(null);
  const [loadingSources, setLoadingSources] = useState(false);
  const [loadingPermission, setLoadingPermission] = useState(false);

  const loadSources = async () => {
    setLoadingSources(true);
    try {
      const src = await window.electronAPI.getSources();
      setSources(src);
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingSources(false);
    }
  };

  const handleSourceSelect = async (source: Source) => {
    try {
      setLoadingPermission(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: source.id,
            maxWidth: 1920,
            maxHeight: 1080,
            maxFrameRate: 30,
          },
        },
      });

      setSelectedSource(source);
      setStream(stream);
      setView("ready");

    } catch (err) {
      console.log("Permission denied", err);
    } finally {
      setLoadingPermission(false);
    }
  };

  const handleStartRecording = async () => {
    const { sessionId, sessionPath } =
      await window.electronAPI.createSession();

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
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
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
    <div className="text-white h-screen flex flex-col">
      <div className="h-10 flex items-center px-4 border-b border-zinc-800">
        <span className="text-lg font-semibold">CAPTURA</span>
      </div>

      {/* SELECT VIEW */}
      {view === "select" && (
        <SourceGrid
          sources={sources}
          loading={loadingSources}
          onLoad={loadSources}
          onSelect={handleSourceSelect}
        />
      )}

      {loadingPermission && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-zinc-400">
            Waiting for screen permission...
          </p>
        </div>
      )}

      {/* RECORDING VIEW */}
      {(view === "ready" || view === "recording") &&
        selectedSource &&
        stream && (
          <RecordingView
            source={selectedSource}
            webcamEnabled={webcamEnabled}
            onWebcamToggle={setWebcamEnabled}
            onStart={handleStartRecording}
            onBack={handleReset}
            mode={view === "recording" ? "recording" : "ready"}
            session={session}
            onComplete={handleRecordingComplete}
          />
        )}

      {/* COMPLETE */}
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
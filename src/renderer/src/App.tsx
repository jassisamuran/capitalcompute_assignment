import { useState } from "react";
import { AppView, RecordingSession, Source } from "./types";
import SourceGrid from "./components/SourceGrid";

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
    </div>
  );
}

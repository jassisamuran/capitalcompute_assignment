import { useEffect, useState } from "react";
import { RefreshIcon, ScanIcon } from "../common/Icons";
import { Source } from "@/types";

interface Props {
  onSelect: (source: Source) => void;
  onBack: () => void;
}

export default function SourceGrid({ onSelect, onBack }: Props) {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const loadSources = async () => {
    setLoading(true);
    setPermissionError(null);
    try {
      const result = await window.electronAPI.getSources();

      if (!result.ok) {
        setPermissionError(
          result.error ??
            "Screen capture permission denied. Grant access in System Settings › Privacy & Security › Screen Recording, then restart the app.",
        );
        setLoaded(true);
        return;
      }

      setSources(result.sources);
      setLoaded(true);
    } catch (err) {
      console.error("get-sources failed:", err);
      setPermissionError("Failed to load sources. Please try again.");
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
  useEffect(() => {
    if (sources.length === 0) return;

    const runSelection = async () => {
      const screens = sources.filter((s) => s.id.startsWith("screen:"));
      const windows = sources.filter((s) => s.id.startsWith("window:"));

      setSelecting(true);

      await delay(500);

      const selected =
        screens.length > 0
          ? screens[0]
          : windows.length > 0
            ? windows[0]
            : null;

      if (selected) onSelect(selected);
      setSelecting(false);
    };

    runSelection();
  }, [sources, onSelect]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div
        className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-zinc-800
        flex items-center justify-between"
      >
        <div>
          <h2 className="text-base font-semibold text-zinc-100">
            Select a source
          </h2>
          <p className="text-xs text-zinc-600 mt-0.5">
            Pick what you want to record
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loaded && !permissionError && (
            <button
              onClick={loadSources}
              disabled={loading}
              className="text-[11px] font-mono text-zinc-600 hover:text-zinc-400
                border border-zinc-800 hover:border-zinc-700 px-2.5 py-1.5
                rounded transition-colors flex items-center gap-1.5
                disabled:opacity-40"
            >
              <RefreshIcon className="w-3 h-3" />
              refresh
            </button>
          )}
          <button
            onClick={onBack}
            className="text-[11px] font-mono text-zinc-600 hover:text-zinc-400
              transition-colors px-2 py-1"
          >
            ← back
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {permissionError && (
          <div className="flex flex-col items-center justify-center h-56 gap-4 text-center">
            <div
              className="w-12 h-12 rounded-xl bg-red-950/40 border border-red-900/40
              flex items-center justify-center"
            >
              <span className="text-red-400 text-xl leading-none font-bold">
                !
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">
                Permission required
              </p>
              <p className="text-xs text-zinc-500 mt-1.5 max-w-xs leading-relaxed">
                {permissionError}
              </p>
            </div>
            <button
              onClick={loadSources}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700
                text-zinc-200 text-xs font-medium rounded-lg transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {!loaded && !loading && !permissionError && (
          <div className="flex flex-col items-center justify-center h-48 gap-4">
            <p className="text-sm text-zinc-600">
              Click below to see available screens and windows
            </p>
            <button
              onClick={loadSources}
              className="flex items-center gap-2 px-5 py-2.5
                bg-zinc-800 hover:bg-zinc-700 border border-zinc-700
                text-zinc-200 text-sm font-medium rounded-xl transition-colors"
            >
              <ScanIcon className="w-4 h-4 text-zinc-500" />
              Scan sources
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="w-8 h-8 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-mono text-zinc-500">scanning…</p>
          </div>
        )}

        {selecting && (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <div className="w-8 h-8 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin"></div>

            <p className="text-sm font-mono text-zinc-500">selecting source…</p>
          </div>
        )}

        {/* Sources list */}
        {loaded && !loading && !selecting && !permissionError && (
          <div className="space-y-7">
            {sources.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 gap-3">
                <p className="text-sm text-zinc-600">No sources found</p>
                <button
                  onClick={loadSources}
                  className="px-4 py-2 bg-amber-500 text-black text-xs
                    font-bold rounded-lg hover:bg-amber-400 transition-colors"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

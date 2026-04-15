import { useEffect } from "react";
import { Source } from "../types";
import SectionLabel from "./SectionLabel";
import SourceCard from "./SourceCard";

interface Props {
  sources: Source[];
  loading: boolean;
  onLoad: () => void;
  onSelect: (source: Source) => void;
}

export default function SourceGrid({
  sources,
  loading,
  onLoad,
  onSelect,
}: Props) {
  // Auto-fetch on mount
  useEffect(() => {
    onLoad();
  }, []);

  const screens = sources.filter((s) => s.id.startsWith("screen:"));
  const windows = sources.filter((s) => s.id.startsWith("window:"));

  return (
    <div className="h-full flex flex-col overflow-y-auto px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
            Choose a source
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Pick a display or window to record
          </p>
        </div>
        <button
          onClick={onLoad}
          disabled={loading}
          className="text-xs font-mono text-zinc-500 hover:text-amber-400 transition-colors disabled:opacity-40 flex items-center gap-1.5 border border-zinc-800 px-3 py-1.5 rounded hover:border-zinc-700"
        >
          {/* <RefreshIcon className="w-3 h-3" /> */}
          refresh
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm font-mono text-zinc-600 animate-pulse">
            scanning sources...
          </p>
        </div>
      )}

      {/* Sources list */}
      {!loading && (
        <div className="space-y-8">
          {screens.length > 0 && (
            <section>
              <SectionLabel text={`Displays — ${screens.length}`} />
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 mt-3">
                {screens.map((s) => (
                  <SourceCard key={s.id} source={s} onSelect={onSelect} />
                ))}
              </div>
            </section>
          )}
          {windows.length > 0 && (
            <section>
              <SectionLabel text={`Windows — ${windows.length}`} />
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 mt-3">
                {windows.map((s) => (
                  <SourceCard key={s.id} source={s} onSelect={onSelect} />
                ))}
              </div>
            </section>
          )}
          {sources.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center gap-4 pt-20">
              <p className="text-sm text-zinc-600">No sources found.</p>
              <button onClick={onLoad}>Try again</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

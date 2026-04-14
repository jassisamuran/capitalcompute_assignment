import React, { useEffect } from "react";
import { Source } from "@/types";
import SectionLabel from "./SectionLabel";
import SourceCard from "./SourceCard";

interface Props {
  sources: Source[];
  loading: boolean;
  onLoad: () => void;
  onSelect: (source: Source) => void;
}

export const SourceGrid = ({ sources, loading, onLoad, onSelect }: Props) => {
  useEffect(() => {
    onLoad();
  }, [onLoad]);

  const screens = sources.filter((s) => s.id.startsWith("screen:"));
  const windows = sources.filter((s) => s.id.startsWith("window:"));

  return (
    <div>
      {/* Header */}
      <div>
        <h1>Choose a Source</h1>
        <p>Pick a display or window to record</p>

        <button onClick={onLoad} disabled={loading}>
          <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* Content */}
      {!loading && (
        <div className="space-y-8">
          {/* Screens */}
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

          {/* Windows */}
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

          {/* Empty State */}
          {sources.length === 0 && (
            <div>
              <p>No sources found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
import { FolderIcon, RecordIcon } from "../common/Icons";

interface Props {
  onNewRecording: () => void;
  onViewLibrary: () => void;
}

export default function HomeView({ onNewRecording, onViewLibrary }: Props) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-8 px-6">
      <div className="flex flex-col items-center gap-2 select-none">
        <div
          className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800
          flex items-center justify-center mb-1"
        >
          <RecordIcon className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">
          ScreenCasta
        </h1>
        <p className="text-sm text-zinc-600">Screen &amp; webcam recorder</p>
      </div>

      {/* Primary action */}
      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        <button
          onClick={onNewRecording}
          className="w-full flex items-center justify-center gap-3 px-6 py-3.5
            bg-red-600 hover:bg-red-500 active:bg-red-700
            text-white text-sm font-bold rounded-xl
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-red-500/50"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-white/90" />
          New Recording
        </button>

        <button
          onClick={onViewLibrary}
          className="w-full flex items-center justify-center gap-2 px-6 py-3
            bg-zinc-900 hover:bg-zinc-800 border border-zinc-800
            hover:border-zinc-700 text-zinc-400 hover:text-zinc-200
            text-sm font-medium rounded-xl transition-colors duration-150"
        >
          <FolderIcon className="w-4 h-4" />
          View Recordings
        </button>
      </div>

      {/* Tip */}
      <p className="text-[11px] font-mono text-zinc-700 text-center max-w-xs leading-relaxed">
        recordings are saved to ~/Documents/ScreenCasta/videos/
      </p>
    </div>
  );
}

import { useState } from "react";
import { RecordingSession } from "../../types";
import FileRow from "./FileRow";
import { FolderIcon } from "../common/Icons";

interface Props {
  session: RecordingSession;
  webcamEnabled: boolean;
  onReset: () => void;
  setSession: React.Dispatch<React.SetStateAction<RecordingSession>>;
}

export default function CompletionView({
  session,
  webcamEnabled,
  onReset,
  setSession,
}: Props) {
  const [renaming, setRenaming] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [renamed, setRenamed] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  const endTime = session.endedAt ?? Date.now();
  const totalSecs = Math.round((endTime - session.startedAt) / 1000);
  const durMM = String(Math.floor(totalSecs / 60)).padStart(2, "0");
  const durSS = String(totalSecs % 60).padStart(2, "0");
  const handleOpenFolder = () =>
    window.electronAPI.openFolder(session.sessionId);

  const handleRename = async () => {
    if (!nameInput.trim()) return;

    try {
      const newFolderName = await window.electronAPI.renameSession(
        session.sessionId,
        nameInput.trim(),
      );

      const baseDir = "/home/jaspreet/Documents/ScreenCasta/video";
      const newPath = `${baseDir}/${newFolderName}`;

      setSession((prev) => ({
        ...prev,
        sessionId: newFolderName,
        sessionPath: newPath,
      }));

      setRenamed(false);
      setRenaming(false);
      setNameInput("");
      setRenameError(null);
    } catch {
      setRenameError("Could not rename — folder may already exist.");
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 gap-7">
      {/* Success icon */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30
          flex items-center justify-center"
        >
          {/* <CheckIcon className="w-7 h-7 text-emerald-400" /> */}
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
            Recording saved
          </h1>
          <p className="text-sm text-zinc-500 mt-1 font-mono">
            {durMM}:{durSS} &nbsp;·&nbsp;{" "}
            {session.webcamSaved ? "screen + webcam" : "screen only"}
          </p>
        </div>
      </div>

      {/* File list */}
      <div className="w-full max-w-xs bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.18em] mb-3">
          Files written
        </p>

        {session.screenSaved && <FileRow filename="screen.webm" tag="Screen" />}
        {session.webcamSaved && <FileRow filename="webcam.webm" tag="Webcam" />}

        {/* Session ID / folder name */}
        <div className="pt-2 mt-2 border-t border-zinc-800">
          <p className="text-[10px] font-mono text-zinc-700 break-all">
            {/* {renamed ? "(renamed — check folder)" : session.sessionId} */}
            {session.sessionId}
          </p>
        </div>
      </div>

      {/* Rename session */}
      <div className="w-full max-w-xs">
        {!renaming && (
          <button
            onClick={() => setRenaming(true)}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors
              underline underline-offset-2 decoration-zinc-700"
          >
            Rename this session…
          </button>
        )}
        {renaming && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
                placeholder="my-recording"
                maxLength={60}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg
                  px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600
                  focus:outline-none focus:border-amber-500/60 font-mono"
              />
              <button
                onClick={handleRename}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400
                  text-black text-xs font-bold rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
            <button
              onClick={() => setRenaming(false)}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors self-start"
            >
              Cancel
            </button>
          </div>
        )}
        {renamed && (
          <p className="text-xs text-emerald-400 font-mono">✓ Renamed</p>
        )}
        {renameError && (
          <p className="text-xs text-red-400 font-mono mt-1">{renameError}</p>
        )}
      </div>

      {/* Primary actions */}
      <div className="flex gap-3">
        <button
          onClick={handleOpenFolder}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800
            hover:bg-zinc-700 border border-zinc-700 text-zinc-200
            text-sm font-medium rounded-lg transition-colors"
        >
          <FolderIcon className="w-4 h-4 text-zinc-400" />
          Open folder
        </button>
        <button
          onClick={onReset}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400
            text-black text-sm font-bold rounded-lg transition-colors"
        >
          New recording
        </button>
      </div>
    </div>
  );
}

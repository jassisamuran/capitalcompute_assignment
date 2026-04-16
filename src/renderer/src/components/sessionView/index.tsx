import { SessionEntry } from "@/types";
import { useEffect, useState, useCallback } from "react";
import { FolderIcon, RefreshIcon } from "../common/Icons";

interface Props {
  onNewRecording: () => void;
}

export default function SessionsView({ onNewRecording }: Props) {
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingFolder, setDeletingFolder] = useState<string | null>(null);
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.listSessions();
      console.log("nowis", data);
      setSessions(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, []);

  const handleOpen = (folderName: string) =>
    window.electronAPI.openFolder(folderName);

  const handleDelete = async (folderName: string) => {
    setDeletingFolder(folderName);
    await window.electronAPI.deleteSession(folderName);
    setSessions((prev) => prev.filter((s) => s.folderName !== folderName));
    setDeletingFolder(null);
  };

  const handleRenameSubmit = async (session: SessionEntry) => {
    if (!renameInput.trim()) return;
    try {
      await window.electronAPI.renameSession(
        session.folderName,
        renameInput.trim(),
      );
      await load();
    } catch (err) {
      console.error("Rename failed:", err);
      await load();
    } finally {
      setRenamingFolder(null);
      setRenameInput("");
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div
        className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-zinc-800
        flex items-center justify-between"
      >
        <div>
          <h1 className="text-base font-semibold text-zinc-100 tracking-tight">
            Recordings
          </h1>
          <p className="text-xs text-zinc-600 mt-0.5 font-mono">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""} saved
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="text-[11px] font-mono text-zinc-600 hover:text-zinc-400
              border border-zinc-800 hover:border-zinc-700 px-2.5 py-1.5
              rounded transition-colors flex items-center gap-1.5"
          >
            <RefreshIcon className="w-3 h-3" />
            refresh
          </button>
          <button
            onClick={onNewRecording}
            className="flex items-center gap-2 px-4 py-2 bg-red-600
              hover:bg-red-500 text-white text-xs font-bold rounded-lg
              transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
            New recording
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading && (
          <div className="flex items-center justify-center h-40">
            <p className="text-sm font-mono text-zinc-700 animate-pulse">
              loading sessions…
            </p>
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 gap-4">
            <div
              className="w-12 h-12 rounded-xl bg-zinc-800/60 border border-zinc-800
              flex items-center justify-center"
            >
              <FolderIcon className="w-6 h-6 text-zinc-700" />
            </div>
            <div className="text-center">
              <p className="text-sm text-zinc-500">No recordings yet</p>
              <p className="text-xs text-zinc-700 mt-1">
                Start your first recording to see it here
              </p>
            </div>
            <button
              onClick={onNewRecording}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400
                text-black text-xs font-bold rounded-lg transition-colors"
            >
              Start recording
            </button>
          </div>
        )}

        {!loading && sessions.length > 0 && (
          <div className="space-y-2">
            {sessions.map((session) => (
              <SessionRow
                key={session.folderName}
                session={session}
                isDeleting={deletingFolder === session.folderName}
                isRenaming={renamingFolder === session.folderName}
                renameInput={renameInput}
                onRenameInputChange={setRenameInput}
                onOpen={() => handleOpen(session.folderName)}
                onDelete={() => handleDelete(session.folderName)}
                onRenameStart={() => {
                  setRenamingFolder(session.folderName);
                  setRenameInput("");
                }}
                onRenameSubmit={() => handleRenameSubmit(session)}
                onRenameCancel={() => {
                  setRenamingFolder(null);
                  setRenameInput("");
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface RowProps {
  session: SessionEntry;
  isDeleting: boolean;
  isRenaming: boolean;
  renameInput: string;
  onRenameInputChange: (v: string) => void;
  onOpen: () => void;
  onDelete: () => void;
  onRenameStart: () => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
}

function SessionRow({
  session,
  isDeleting,
  isRenaming,
  renameInput,
  onRenameInputChange,
  onOpen,
  onDelete,
  onRenameStart,
  onRenameSubmit,
  onRenameCancel,
}: RowProps) {
  const date = new Date(session.createdAt);
  const dateStr = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const totalSize = session.screenSize + session.webcamSize;

  return (
    <div
      className={`group bg-zinc-900/60 border rounded-xl px-4 py-3.5
      transition-all duration-150 ${
        isDeleting
          ? "opacity-40 border-zinc-800"
          : "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900"
      }`}
    >
      {/* Top row: folder name + date */}
      <div className="flex items-start justify-between gap-4 mb-2.5">
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={renameInput}
                onChange={(e) => onRenameInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onRenameSubmit();
                  if (e.key === "Escape") onRenameCancel();
                }}
                placeholder="session name…"
                maxLength={60}
                className="flex-1 bg-zinc-800 border border-amber-500/50 rounded-lg
                  px-2.5 py-1 text-sm text-zinc-100 placeholder-zinc-600
                  focus:outline-none focus:border-amber-500 font-mono text-xs"
              />
              <button
                onClick={onRenameSubmit}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400
                  text-black text-[11px] font-bold rounded-lg transition-colors"
              >
                Save
              </button>
              <button
                onClick={onRenameCancel}
                className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <p className="text-sm font-mono text-zinc-300 truncate leading-snug">
              {session.folderName}
            </p>
          )}
          <p className="text-[11px] text-zinc-600 mt-0.5 font-mono">
            {dateStr} · {timeStr}
          </p>
        </div>
      </div>

      {/* File pills + size */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {session.screenExists && (
          <FilePill
            label="screen.webm"
            size={session.screenSize}
            color="blue"
          />
        )}
        {session.webcamExists && (
          <FilePill
            label="webcam.webm"
            size={session.webcamSize}
            color="amber"
          />
        )}
        {!session.screenExists && !session.webcamExists && (
          <span className="text-[10px] font-mono text-zinc-700">
            empty folder
          </span>
        )}
        {totalSize > 0 && (
          <span className="ml-auto text-[10px] font-mono text-zinc-600">
            {formatBytes(totalSize)} total
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpen}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px]
            bg-zinc-800 hover:bg-zinc-700 border border-zinc-700
            text-zinc-300 rounded-lg transition-colors font-medium"
        >
          <FolderIcon className="w-3 h-3 text-zinc-500" />
          Open folder
        </button>

        {!isRenaming && (
          <button
            onClick={onRenameStart}
            className="px-3 py-1.5 text-[11px] text-zinc-600
              hover:text-zinc-400 border border-transparent
              hover:border-zinc-800 rounded-lg transition-colors"
          >
            Rename
          </button>
        )}

        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="ml-auto px-3 py-1.5 text-[11px] text-red-900
            hover:text-red-400 border border-transparent
            hover:border-red-900/40 rounded-lg 
             disabled:cursor-not-allowed"
        >
          {isDeleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}

function FilePill({
  label,
  size,
  color,
}: {
  label: string;
  size: number;
  color: "blue" | "amber";
}) {
  const styles =
    color === "blue"
      ? "bg-blue-950/50 border-blue-900/50 text-blue-400"
      : "bg-amber-950/50 border-amber-900/50 text-amber-500";

  return (
    <span
      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md
      border text-[10px] font-mono ${styles}`}
    >
      <span className="w-1 h-1 rounded-full bg-current opacity-70" />
      {label}
      {size > 0 && (
        <span className="opacity-60 ml-0.5">{formatBytes(size)}</span>
      )}
    </span>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

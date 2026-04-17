import useTimer from "../hooks/useTimer";
import { RecordingSession, Source } from "@/types";
import React, { useCallback, useEffect, useRef, useState } from "react";

const SCREEN_CODECS = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
  "video/mp4",
];
const CAM_CODECS = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
  "video/mp4",
];
function getSupportedMimeType(codecs: string[]): string {
  return codecs.find((c) => MediaRecorder.isTypeSupported(c)) ?? "";
}

interface Props {
  source: Source;
  webcamEnabled: boolean;
  onWebcamToggle: (v: boolean) => void;
  onStart: () => void;
  onBack: () => void;
  mode: "ready" | "recording";
  session: RecordingSession | null;
  onComplete: (session: RecordingSession) => void;
}

const RecordingView = ({
  source,
  webcamEnabled,
  onWebcamToggle,
  onStart,
  onBack,
  mode,
  session,
  onComplete,
}: Props) => {
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const screenRecorderRef = useRef<MediaRecorder | null>(null);
  const webcamRecorderRef = useRef<MediaRecorder | null>(null);
  const screenChunks = useRef<BlobPart[]>([]);
  const webcamChunks = useRef<BlobPart[]>([]);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [stopping, setStopping] = useState(false);
  const stoppingRef = useRef(false);
  const stopRecordingRef = useRef<() => Promise<void>>(async () => {});

  const timerLabel = useTimer(mode === "recording");

  useEffect(() => {
    let cancelled = false;
    setScreenError(null);
    const init = async () => {
      try {
        const stream = await (navigator.mediaDevices as any).getUserMedia({
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
        if (cancelled) {
          stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());
          return;
        }
        screenStreamRef.current = stream;
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
          await screenVideoRef.current.play();
        }
      } catch (err: any) {
        if (cancelled) return;
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          setScreenError(
            "Screen capture permission denied. Grant access in System Settings › Privacy › Screen Recording, then restart the app.",
          );
        } else {
          setScreenError(
            "Could not capture this source. It may have been closed or moved.",
          );
        }
      }
    };
    init();
    return () => {
      cancelled = true;
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    };
  }, [source.id]);

  useEffect(() => {
    if (!webcamEnabled) {
      webcamStreamRef.current?.getTracks().forEach((t) => t.stop());
      webcamStreamRef.current = null;
      if (webcamVideoRef.current) webcamVideoRef.current.srcObject = null;
      setWebcamError(null);
      return;
    }

    let cancelled = false;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 600 },
            height: { ideal: 480 },
            frameRate: 30,
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        webcamStreamRef.current = stream;
        if (webcamVideoRef.current) {
          webcamVideoRef.current.srcObject = stream;
          await webcamVideoRef.current.play();
        }
        setWebcamError(null);
      } catch (err: any) {
        if (err.name === "NotAllowedError")
          setWebcamError("Camera access denied");
        else if (err.name === "NotFoundError")
          setWebcamError("No camera found");
        else setWebcamError("Camera unavailable");
      }
    };

    init();
    return () => {
      cancelled = true;
      webcamStreamRef.current?.getTracks().forEach((t) => t.stop());
      webcamStreamRef.current = null;
    };
  }, [webcamEnabled]);

  useEffect(() => {
    if (mode !== "recording" || !session || !screenStreamRef.current) return;

    screenChunks.current = [];
    webcamChunks.current = [];

    const screenMime = getSupportedMimeType(SCREEN_CODECS);
    const screenRec = new MediaRecorder(screenStreamRef.current, {
      ...(screenMime ? { mimeType: screenMime } : {}),
      videoBitsPerSecond: 3_000_000,
    });
    screenRec.ondataavailable = (e) => {
      if (e.data.size > 0) screenChunks.current.push(e.data);
    };
    screenRec.start(1000);
    screenRecorderRef.current = screenRec;
    screenStreamRef.current.getTracks().forEach((track) => {
      track.onended = () => {
        if (!stoppingRef.current) {
          stopRecordingRef.current();
        }
      };
    });

    if (webcamEnabled && webcamStreamRef.current) {
      const camMime = getSupportedMimeType(CAM_CODECS);
      const camRec = new MediaRecorder(webcamStreamRef.current, {
        ...(camMime ? { mimeType: camMime } : {}),
        videoBitsPerSecond: 1_000_000,
      });
      camRec.ondataavailable = (e) => {
        if (e.data.size > 0) webcamChunks.current.push(e.data);
      };
      camRec.start(1000);
      webcamRecorderRef.current = camRec;
    }

    return () => {
      if (screenRecorderRef.current?.state !== "inactive") {
        screenRecorderRef.current?.stop();
      }
      if (webcamRecorderRef.current?.state !== "inactive") {
        webcamRecorderRef.current?.stop();
      }
    };
  }, [mode, session?.sessionId]);

  const stopRecording = useCallback(async () => {
    if (!session || stoppingRef.current) return;
    stoppingRef.current = true;
    setStopping(true);

    const awaitStop = (rec: MediaRecorder | null): Promise<void> =>
      new Promise((resolve) => {
        if (!rec || rec.state === "inactive") return resolve();
        rec.onstop = () => resolve();
        rec.stop();
      });

    await Promise.all([
      awaitStop(screenRecorderRef.current),
      awaitStop(webcamRecorderRef.current),
    ]);

    let screenSaved = false;
    if (screenChunks.current.length > 0) {
      try {
        const blob = new Blob(screenChunks.current, { type: "video/webm" });
        await window.electronAPI.saveRecording(
          session.sessionId,
          "screen",
          await blob.arrayBuffer(),
        );
        screenSaved = true;
      } catch (err) {
        console.error("Failed to save screen recording:", err);
      }
    }

    let webcamSaved = false;
    if (webcamChunks.current.length > 0) {
      try {
        const camBlob = new Blob(webcamChunks.current, { type: "video/webm" });
        const camBuffer = await camBlob.arrayBuffer();
        await window.electronAPI.saveRecording(
          session.sessionId,
          "webcam",
          camBuffer,
        );
        webcamSaved = true;
      } catch (err) {
        console.error("Failed to save webcam recording:", err);
      }
    }

    // Tear down streams
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    webcamStreamRef.current?.getTracks().forEach((t) => t.stop());

    await window.electronAPI.setRecordingState(false);
    onComplete({ ...session, screenSaved, webcamSaved });
  }, [session, onComplete]);

  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  useEffect(() => {
    const cleanup = window.electronAPI.onForceStop(() => {
      stopRecordingRef.current();
    });
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      {screenError ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 bg-zinc-950 px-8">
          <div
            className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30
            flex items-center justify-center"
          >
            <span className="text-red-400 text-2xl leading-none">!</span>
          </div>
          <div className="text-center max-w-sm">
            <p className="text-sm font-semibold text-zinc-100">
              Capture failed
            </p>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              {screenError}
            </p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700
              text-zinc-200 text-sm rounded-lg transition-colors"
          >
            ← Choose another source
          </button>
        </div>
      ) : (
        <div className="flex-1 relative bg-black overflow-hidden">
          <video
            ref={screenVideoRef}
            muted
            playsInline
            className="w-full h-full object-contain"
          />

          {/* REC indicator + timer */}
          {mode === "recording" && (
            <div
              className="absolute top-4 left-4 flex items-center gap-2
              bg-black/75 backdrop-blur-sm border border-zinc-700/60
              px-3 py-1.5 rounded-full"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-mono text-zinc-100 tabular-nums tracking-widest">
                {timerLabel}
              </span>
            </div>
          )}

          {stopping && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <p className="text-sm font-mono text-zinc-300 animate-pulse">
                Saving recording…
              </p>
            </div>
          )}

          {/* Webcam picture-in-picture */}
          {webcamEnabled && !webcamError && (
            <div
              className="absolute bottom-4 right-4 w-44 aspect-video
              rounded-lg overflow-hidden border border-zinc-600/60
              bg-zinc-900 shadow-2xl shadow-black/60"
            >
              <video
                ref={webcamVideoRef}
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
            </div>
          )}

          {webcamEnabled && webcamError && (
            <div
              className="absolute bottom-4 right-4 w-44 aspect-video
              rounded-lg border border-red-900/50 bg-red-950/30
              flex flex-col items-center justify-center gap-1"
            >
              <p className="text-[10px] text-red-400/80 text-center px-2">
                {webcamError}
              </p>
            </div>
          )}
        </div>
      )}

      {!screenError && (
        <div
          className="flex-shrink-0 bg-[#111113] border-t border-zinc-800 px-5 py-3.5
          flex items-center gap-3"
        >
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-mono text-zinc-600 truncate">
              {source.name}
            </p>
          </div>

          {mode === "ready" && (
            <>
              <button
                onClick={() => onWebcamToggle(!webcamEnabled)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium
                  border transition-all duration-150 ${
                    webcamEnabled
                      ? "bg-zinc-800 border-zinc-600 text-zinc-200 hover:border-zinc-500"
                      : "bg-zinc-900/50 border-zinc-800 text-zinc-600 hover:text-zinc-400"
                  }`}
              >
                Webcam {webcamEnabled ? "on" : "off"}
              </button>

              <button
                onClick={onBack}
                className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300
                  transition-colors"
              >
                ← Back
              </button>

              <button
                onClick={onStart}
                className="flex items-center gap-2 px-5 py-2 bg-red-600
                  hover:bg-red-500 text-white text-sm font-semibold rounded-lg
                  transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/60"
              >
                <span className="w-2 h-2 rounded-full bg-white/90" />
                Start Recording
              </button>
            </>
          )}

          {mode === "recording" && (
            <button
              onClick={stopRecording}
              disabled={stopping}
              className="flex items-center gap-2 px-5 py-2 bg-zinc-800
                hover:bg-zinc-700 border border-zinc-600 text-zinc-100
                text-sm font-semibold rounded-lg transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-1 focus:ring-zinc-500"
            >
              <span className="w-3 h-3 rounded-sm bg-zinc-100" />
              {stopping ? "Saving…" : "Stop"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RecordingView;

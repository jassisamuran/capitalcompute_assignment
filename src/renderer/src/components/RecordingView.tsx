import useTimer from "../hooks/useTimer";
import { RecordingSession, Source } from "@/types";
import React, { useCallback, useEffect, useRef, useState } from "react";

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
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const screenRecorderRef = useRef<MediaRecorder | null>(null);
  const webcamRecorderRef = useRef<MediaRecorder | null>(null);
  const screenChunks = useRef<BlobPart[]>([]);
  const webcamChunks = useRef<BlobPart[]>([]);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [stopping, setStopping] = useState(false);

  const timerLabel = useTimer(mode === "recording");

  useEffect(() => {
    let cancelled = false;
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
      } catch (error) {
        console.log("Screen capture error:", error);
      }
    };
    init();
    return () => {
      cancelled = true;
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    };
  }, [source.id]);

  // webcamera stream
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
        if (err.name === "NotAllowedError") {
          setWebcamError("Camera access denied");
        } else if (err.name === "NotFoundError") {
          setWebcamError("No camera found");
        } else {
          setWebcamError("Camera unavailable");
        }
      }
    };

    init();
    return () => {
      cancelled: true;
    };
  }, [webcamEnabled]);

  // start recording
  useEffect(() => {
    if (mode !== "recording" || !session || !screenStreamRef.current) return;

    screenChunks.current = [];
    webcamChunks.current = [];

    // Screen recorder
    const screenRec = new MediaRecorder(screenStreamRef.current, {
      mimeType: "video/webm;codecs=vp9",
      videoBitsPerSecond: 3_000_000,
    });
    screenRec.ondataavailable = (e) => {
      if (e.data.size > 0) screenChunks.current.push(e.data);
    };
    screenRec.start(1000);
    screenRecorderRef.current = screenRec;

    if (webcamEnabled && webcamStreamRef.current) {
      const camRec = new MediaRecorder(webcamStreamRef.current, {
        mimeType: "video/webm;codecs=vp9",
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
    if (!session || stopping) return;
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

    // Save screen recording
    const screenBlob = new Blob(screenChunks.current, { type: "video/webm" });
    const screenBuffer = await screenBlob.arrayBuffer();
    await window.electronAPI.saveRecording(
      session.sessionId,
      "screen",
      screenBuffer,
    );

    // Save webcam recording (if any chunks collected)
    let webcamSaved = false;
    if (webcamChunks.current.length > 0) {
      const camBlob = new Blob(webcamChunks.current, { type: "video/webm" });
      const camBuffer = await camBlob.arrayBuffer();
      await window.electronAPI.saveRecording(
        session.sessionId,
        "webcam",
        camBuffer,
      );
      webcamSaved = true;
    }

    // Tear down preview streams
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    webcamStreamRef.current?.getTracks().forEach((t) => t.stop());

    onComplete({ ...session, screenSaved: true, webcamSaved });
  }, [session, stopping, onComplete]);

  const screenVideoRef = useRef<HTMLVideoElement>(null);
  return (
    <div className="h-full flex flex-col">
      <div className="bg-black ">
        <video ref={screenVideoRef} muted className="w-full h-full" />

        {mode === "recording" && (
          <div>
            <span>{timerLabel}</span>
          </div>
        )}

        {webcamEnabled && !webcamError && (
          <div>
            <video ref={webcamVideoRef} muted playsInline />
          </div>
        )}

        {webcamEnabled && webcamError && <div>{webcamError}</div>}
      </div>

      <div>
        <div>
          <p>{source.name}</p>
        </div>
      </div>

      {mode === "ready" && (
        <>
          <button onClick={() => onWebcamToggle(!webcamEnabled)}>
            webcam {webcamEnabled ? "on" : "off"}
          </button>
          <button onClick={onBack}>back</button>

          <button onClick={onStart}>Start recording</button>
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
  );
};

export default RecordingView;

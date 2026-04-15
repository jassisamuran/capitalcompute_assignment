import { useEffect, useRef, useState } from "react";

export default function useTimer(active: boolean): string {
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (active) {
      ref.current = setInterval(() => setElapsed((n) => n + 1), 1000);
    } else {
      if (ref.current) clearInterval(ref.current);
      setElapsed(0);
    }
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [active]);

  const hh = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

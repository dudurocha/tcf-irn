"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TimerProps {
  startedAt: number;
  durationMinutes: number;
  onExpire: () => void;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function Timer({ startedAt, durationMinutes, onExpire }: TimerProps) {
  const endsAt = startedAt + durationMinutes * 60 * 1000;
  const [remaining, setRemaining] = useState(() => endsAt - Date.now());

  useEffect(() => {
    const tick = () => {
      const r = endsAt - Date.now();
      setRemaining(r);
      if (r <= 0) onExpire();
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [endsAt, onExpire]);

  const lowTime = remaining <= 5 * 60 * 1000;
  const veryLow = remaining <= 60 * 1000;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-sans font-medium tabular-nums",
        veryLow
          ? "bg-red-100 text-red-800 border border-red-300"
          : lowTime
            ? "bg-amber-100 text-amber-900 border border-amber-300"
            : "bg-surface-2 text-ink-muted border border-border"
      )}
      aria-live="polite"
      aria-label="Temps restant"
    >
      <span className="text-[10px] uppercase tracking-wider">Temps</span>
      <span className="text-[14px]">{formatRemaining(remaining)}</span>
    </div>
  );
}

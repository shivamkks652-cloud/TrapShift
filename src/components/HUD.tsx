import { Pause, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { LevelDef } from "@/game/types";

interface Props {
  level: LevelDef;
  shardsCollected: number;
  elapsed: number;
  deaths: number;
  onPause: () => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(2);
  return `${m}:${s.padStart(5, "0")}`;
}

export default function HUD({ level, shardsCollected, elapsed, deaths, onPause }: Props) {
  const shardsTotal = level.shards?.length ?? 0;

  // Subtle 320ms pulse whenever the shard count ticks up.
  const [pulse, setPulse] = useState(false);
  const prev = useRef(shardsCollected);
  useEffect(() => {
    if (shardsCollected > prev.current) {
      setPulse(true);
      const t = window.setTimeout(() => setPulse(false), 320);
      prev.current = shardsCollected;
      return () => window.clearTimeout(t);
    }
    prev.current = shardsCollected;
  }, [shardsCollected]);

  return (
    <div className="absolute top-0 inset-x-0 flex items-start justify-between p-3 sm:p-4 pointer-events-none z-10">
      <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md rounded-2xl px-3.5 py-2 border border-white/10">
        <span className="font-mono text-sm text-white/90 tabular-nums">{formatTime(elapsed)}</span>
        <div className="w-px h-4 bg-white/20" />
        <div
          className={`flex items-center gap-1 text-amber-300 text-sm transition-transform duration-200 ${
            pulse ? "scale-125" : "scale-100"
          }`}
        >
          <Zap
            size={14}
            className={`fill-amber-300 transition-[filter] duration-200 ${
              pulse ? "drop-shadow-[0_0_8px_rgba(252,211,77,0.9)]" : ""
            }`}
          />
          <span className="tabular-nums">
            {shardsCollected}/{shardsTotal}
          </span>
        </div>
        {deaths > 0 && (
          <>
            <div className="w-px h-4 bg-white/20" />
            <span className="text-xs text-white/50 tabular-nums">
              {deaths} death{deaths === 1 ? "" : "s"}
            </span>
          </>
        )}
      </div>
      <button
        onClick={onPause}
        aria-label="Pause"
        className="pointer-events-auto w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center justify-center active:scale-90 transition-transform"
      >
        <Pause size={18} />
      </button>
    </div>
  );
}

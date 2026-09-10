import { Star, ArrowRight, RotateCcw, Home, PlaySquare, Check, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { isRewardedAdAvailable, showRewardedBonus } from "@/game/ads";
import { addBonusShards } from "@/game/storage";
import { sfx } from "@/game/audio";

const BONUS_SHARDS_REWARD = 5;

interface Props {
  stars: 1 | 2 | 3;
  timeMs: number;
  shardsCollected: number;
  shardsTotal: number;
  parTime?: number; // seconds; used for the speed-run medal
  hasNext: boolean;
  onNext: () => void;
  onRetry: () => void;
  onMenu: () => void;
}

function formatTime(ms: number) {
  const s = ms / 1000;
  const m = Math.floor(s / 60);
  const rem = (s % 60).toFixed(2);
  return `${m}:${rem.padStart(5, "0")}`;
}

function Confetti({ count }: { count: number }) {
  const colors = ["#4bf3ff", "#ff3df0", "#ffb23d", "#7dff5c", "#ffffff"];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="ts-confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            background: colors[i % colors.length],
            animationDuration: `${1.6 + Math.random() * 1.3}s`,
            animationDelay: `${Math.random() * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function ResultsOverlay({ stars, timeMs, shardsCollected, shardsTotal, parTime, hasNext, onNext, onRetry, onMenu }: Props) {
  const [bonusAvailable, setBonusAvailable] = useState(false);
  const [bonusState, setBonusState] = useState<"idle" | "watching" | "claimed">("idle");
  const isSpeed = parTime !== undefined && timeMs <= parTime * 1000;

  useEffect(() => {
    sfx.win();
  }, []);

  useEffect(() => {
    let cancelled = false;
    isRewardedAdAvailable().then((available) => {
      if (!cancelled) setBonusAvailable(available);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleWatchBonus() {
    if (bonusState !== "idle") return;
    setBonusState("watching");
    const rewarded = await showRewardedBonus();
    if (rewarded) {
      addBonusShards(BONUS_SHARDS_REWARD);
      setBonusState("claimed");
    } else {
      setBonusState("idle");
    }
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm" data-testid="results-overlay">
      <Confetti count={stars === 3 ? 42 : stars === 2 ? 26 : 14} />
      <div className="relative w-80 rounded-3xl bg-[#151233]/95 border border-white/10 p-6 flex flex-col items-center gap-3 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <h2 className="text-2xl font-bold text-white tracking-wide">Level Complete</h2>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <Star
              key={i}
              size={40}
              data-testid={`result-star-${i}`}
              className={`${i <= stars ? "fill-amber-300 text-amber-300 animate-in zoom-in duration-500" : "text-white/20"}`}
              style={{ animationDelay: `${i * 140}ms` }}
            />
          ))}
        </div>
        {(isSpeed || stars === 3) && (
          <div className="flex items-center gap-2" data-testid="result-medals">
            {isSpeed && (
              <span className="flex items-center gap-1 text-amber-300 text-xs font-bold tracking-wide bg-amber-300/10 border border-amber-300/30 rounded-full px-3 py-1">
                <Zap size={13} className="fill-amber-300" /> SPEED RUN
              </span>
            )}
            {stars === 3 && (
              <span className="text-cyan-300 text-xs font-bold tracking-widest bg-cyan-400/10 border border-cyan-400/30 rounded-full px-3 py-1">
                PERFECT
              </span>
            )}
          </div>
        )}
        <div className="w-full flex justify-between text-sm text-white/70 bg-white/5 rounded-2xl px-4 py-3">
          <span>Time</span>
          <span className="font-mono text-white">{formatTime(timeMs)}</span>
        </div>
        <div className="w-full flex justify-between text-sm text-white/70 bg-white/5 rounded-2xl px-4 py-3">
          <span>Shards</span>
          <span className="font-mono text-amber-300">
            {shardsCollected}/{shardsTotal}
          </span>
        </div>
        {bonusAvailable && (
          <button
            onClick={handleWatchBonus}
            disabled={bonusState !== "idle"}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-2.5 bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-200 font-medium active:scale-95 transition-transform disabled:opacity-70"
          >
            {bonusState === "claimed" ? (
              <>
                <Check size={16} /> +{BONUS_SHARDS_REWARD} Bonus Shards
              </>
            ) : (
              <>
                <PlaySquare size={16} /> Watch Ad for +{BONUS_SHARDS_REWARD} Shards
              </>
            )}
          </button>
        )}
        <div className="w-full flex flex-col gap-2 mt-2">
          {hasNext && (
            <button
              onClick={onNext}
              className="flex items-center justify-center gap-2 rounded-2xl py-3 bg-cyan-400 text-[#0b0a1f] font-semibold active:scale-95 transition-transform"
            >
              Next Level <ArrowRight size={18} />
            </button>
          )}
          <button
            onClick={onRetry}
            className="flex items-center justify-center gap-2 rounded-2xl py-3 bg-white/10 text-white font-medium active:scale-95 transition-transform"
          >
            <RotateCcw size={18} /> Retry
          </button>
          <button
            onClick={onMenu}
            className="flex items-center justify-center gap-2 rounded-2xl py-3 bg-white/5 text-white/70 font-medium active:scale-95 transition-transform"
          >
            <Home size={18} /> Menu
          </button>
        </div>
      </div>
    </div>
  );
}

import { Star, ArrowRight, RotateCcw, Home, PlaySquare, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { isRewardedAdAvailable, showRewardedBonus } from "@/game/ads";
import { addBonusShards } from "@/game/storage";

const BONUS_SHARDS_REWARD = 5;

interface Props {
  stars: 1 | 2 | 3;
  timeMs: number;
  shardsCollected: number;
  shardsTotal: number;
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

export default function ResultsOverlay({ stars, timeMs, shardsCollected, shardsTotal, hasNext, onNext, onRetry, onMenu }: Props) {
  const [bonusAvailable, setBonusAvailable] = useState(false);
  const [bonusState, setBonusState] = useState<"idle" | "watching" | "claimed">("idle");

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
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-80 rounded-3xl bg-[#151233]/95 border border-white/10 p-6 flex flex-col items-center gap-4 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <h2 className="text-2xl font-bold text-white tracking-wide">Level Complete</h2>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <Star
              key={i}
              size={36}
              className={`${i <= stars ? "fill-amber-300 text-amber-300" : "text-white/20"} animate-in fade-in zoom-in-50 spin-in-12 duration-500 fill-mode-both`}
              style={{ animationDelay: `${i * 180}ms` }}
            />
          ))}
        </div>
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

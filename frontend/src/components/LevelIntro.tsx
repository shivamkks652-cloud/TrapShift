import { Zap, Play, ChevronsUp, Check } from "lucide-react";
import type { LevelDef } from "@/game/types";

interface Props {
  level: LevelDef;
  onStart: () => void;
  onBoostAd?: () => void;
  boostBusy?: boolean;
  boostFailed?: boolean;
  boostGranted?: boolean;
}

export default function LevelIntro({ level, onStart, onBoostAd, boostBusy, boostFailed, boostGranted }: Props) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-80 rounded-3xl bg-[#151233]/95 border border-white/10 p-6 flex flex-col items-center gap-3 text-center">
        <span className="text-white/40 text-xs uppercase tracking-widest">
          World {level.world} · Level {level.index}
        </span>
        <h2 className="text-2xl font-bold text-white">{level.name}</h2>
        <div className="flex items-center gap-2 bg-cyan-400/10 border border-cyan-400/30 rounded-xl px-4 py-2 text-cyan-200 text-sm">
          <Zap size={14} className="fill-cyan-200" />
          {level.ruleTaught}
        </div>
        {onBoostAd && !boostGranted && (
          <button
            data-testid="intro-boost-ad-btn"
            onClick={onBoostAd}
            disabled={boostBusy}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-2.5 bg-emerald-400/15 border border-emerald-300/40 text-emerald-300 font-semibold text-sm active:scale-95 transition-transform disabled:opacity-60 shadow-[0_0_18px_rgba(57,255,176,0.25)]"
          >
            <Play size={15} className="fill-emerald-300" />
            {boostBusy ? "Loading Ad…" : "Watch Ad · Free Boost ×3"}
            <ChevronsUp size={15} />
          </button>
        )}
        {boostGranted && (
          <div
            data-testid="intro-boost-granted"
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-2.5 bg-emerald-400/20 border border-emerald-300/50 text-emerald-200 font-semibold text-sm"
          >
            <Check size={15} /> Boost ready — 3 powered jumps!
          </div>
        )}
        {boostFailed && (
          <p data-testid="intro-boost-ad-error" className="text-xs text-red-300/90">
            Ad abhi available nahi — bina boost ke bhi try kar sakte ho.
          </p>
        )}
        <button
          data-testid="intro-start-btn"
          onClick={onStart}
          className="w-full mt-1 rounded-2xl py-3 bg-cyan-400 text-[#0b0a1f] font-bold active:scale-95 transition-transform"
        >
          Start
        </button>
      </div>
    </div>
  );
}

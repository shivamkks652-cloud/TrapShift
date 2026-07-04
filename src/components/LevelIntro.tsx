import { Zap } from "lucide-react";
import type { LevelDef } from "@/game/types";

interface Props {
  level: LevelDef;
  onStart: () => void;
}

export default function LevelIntro({ level, onStart }: Props) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-80 rounded-3xl bg-[#151233]/95 border border-white/10 p-6 flex flex-col items-center gap-3 text-center animate-in fade-in zoom-in-95 slide-in-from-bottom-3 duration-300">
        <span className="text-white/40 text-xs uppercase tracking-widest">
          World {level.world} · Level {level.index}
        </span>
        <h2 className="text-2xl font-bold text-white">{level.name}</h2>
        <div className="flex items-center gap-2 bg-cyan-400/10 border border-cyan-400/30 rounded-xl px-4 py-2 text-cyan-200 text-sm">
          <Zap size={14} className="fill-cyan-200" />
          {level.ruleTaught}
        </div>
        <button
          onClick={onStart}
          className="w-full mt-2 rounded-2xl py-3 bg-cyan-400 text-[#0b0a1f] font-bold active:scale-95 transition-transform"
        >
          Start
        </button>
      </div>
    </div>
  );
}

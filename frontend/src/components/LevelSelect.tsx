import { ChevronLeft, Lock, Star, Zap } from "lucide-react";
import { WORLDS, ALL_LEVEL_IDS } from "@/game/levels";
import { isLevelUnlocked, loadSave } from "@/game/storage";
import { useEffect, useState } from "react";
import type { LevelProgress } from "@/game/storage";

interface Props {
  worldId: number;
  onBack: () => void;
  onSelectLevel: (levelId: string) => void;
}

export default function LevelSelect({ worldId, onBack, onSelectLevel }: Props) {
  const world = WORLDS.find((w) => w.id === worldId)!;
  const [progress, setProgress] = useState<Record<string, LevelProgress>>({});

  useEffect(() => {
    setProgress(loadSave().levelProgress);
  }, []);

  return (
    <div
      className="w-full h-full flex flex-col px-5 py-8"
      style={{ background: `linear-gradient(180deg, ${world.colorFrom}, ${world.colorTo})` }}
    >
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90 transition-transform">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-white">{world.name}</h2>
      </div>
      <div className="grid grid-cols-3 gap-4 overflow-y-auto pb-4">
        {world.levels.map((l) => {
          const unlocked = isLevelUnlocked(l.id, ALL_LEVEL_IDS);
          const p = progress[l.id];
          return (
            <button
              key={l.id}
              disabled={!unlocked}
              onClick={() => unlocked && onSelectLevel(l.id)}
              className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 border disabled:opacity-40 active:scale-95 transition-transform"
              style={{
                background: unlocked ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                borderColor: unlocked ? world.accent + "66" : "rgba(255,255,255,0.08)",
              }}
            >
              {unlocked ? (
                <>
                  <span className="text-white text-xl font-bold">{l.index}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map((i) => (
                      <Star
                        key={i}
                        size={10}
                        className={i <= (p?.stars ?? 0) ? "fill-amber-300 text-amber-300" : "text-white/20"}
                      />
                    ))}
                  </div>
                  {p?.shardsCollected ? (
                    <div className="flex items-center gap-0.5 text-amber-300/80 text-[10px]">
                      <Zap size={8} className="fill-amber-300/80" />
                      {p.shardsCollected}
                    </div>
                  ) : null}
                </>
              ) : (
                <Lock size={18} className="text-white/30" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

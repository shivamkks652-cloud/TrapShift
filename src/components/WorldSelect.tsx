import { ChevronLeft, Lock, Star } from "lucide-react";
import { WORLDS } from "@/game/levels";
import { loadSave } from "@/game/storage";
import { useEffect, useState } from "react";

interface Props {
  onBack: () => void;
  onSelectWorld: (worldId: number) => void;
}

export default function WorldSelect({ onBack, onSelectWorld }: Props) {
  const [starsByWorld, setStarsByWorld] = useState<Record<number, { earned: number; total: number }>>({});
  const [unlockedWorlds, setUnlockedWorlds] = useState<Set<number>>(new Set([1]));

  useEffect(() => {
    const save = loadSave();
    const result: Record<number, { earned: number; total: number }> = {};
    const unlocked = new Set<number>([1]);
    for (const w of WORLDS) {
      let earned = 0;
      const total = w.levels.length * 3;
      for (const l of w.levels) earned += save.levelProgress[l.id]?.stars ?? 0;
      result[w.id] = { earned, total };
      const prevWorld = WORLDS.find((pw) => pw.id === w.id - 1);
      if (!prevWorld || prevWorld.levels.every((l) => save.levelProgress[l.id]?.completed)) {
        unlocked.add(w.id);
      }
    }
    setStarsByWorld(result);
    setUnlockedWorlds(unlocked);
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-[#0b1026] to-[#020814] px-5 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90 transition-transform">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-white">Select World</h2>
      </div>
      <div className="flex flex-col gap-4 overflow-y-auto">
        {WORLDS.map((w) => {
          const unlocked = unlockedWorlds.has(w.id);
          const stars = starsByWorld[w.id] ?? { earned: 0, total: 0 };
          const complete = stars.total > 0 && stars.earned >= stars.total;
          return (
            <button
              key={w.id}
              disabled={!unlocked}
              onClick={() => unlocked && onSelectWorld(w.id)}
              className="relative rounded-3xl overflow-hidden h-28 flex items-end p-4 text-left disabled:opacity-50 active:scale-[0.98] active:brightness-125 transition-[transform,filter,box-shadow] duration-150 group"
              style={{
                background: `linear-gradient(135deg, ${w.colorFrom}, ${w.colorTo})`,
                boxShadow: complete ? `0 0 24px -4px ${w.accent}66` : undefined,
              }}
            >
              <div
                className="absolute inset-0 opacity-40 group-active:opacity-70 transition-opacity"
                style={{ background: `radial-gradient(circle at 80% 20%, ${w.accent}55, transparent 60%)` }}
              />
              <div className="relative z-10 flex flex-col gap-1">
                <span className="text-white/50 text-xs uppercase tracking-widest">World {w.id}</span>
                <span className="text-white text-lg font-bold">{w.name}</span>
                {unlocked ? (
                  <div className="flex items-center gap-1 text-amber-300 text-xs">
                    <Star size={12} className="fill-amber-300" />
                    <span className="tabular-nums">{stars.earned}/{stars.total}</span>
                    {complete && (
                      <span className="ml-1 text-[9px] uppercase tracking-widest text-amber-200/80">
                        Complete
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-white/40 text-xs">
                    <Lock size={12} /> Complete previous world
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

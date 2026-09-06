import { ChevronLeft, Check, Lock, Zap } from "lucide-react";
import { SKINS, loadSave, unlockSkin, equipSkin } from "@/game/storage";
import { useEffect, useState } from "react";

interface Props {
  onBack: () => void;
}

export default function SkinShop({ onBack }: Props) {
  const [shards, setShards] = useState(0);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [equipped, setEquipped] = useState("default");

  function refresh() {
    const save = loadSave();
    setShards(save.totalShards);
    setUnlocked(save.unlockedSkins);
    setEquipped(save.equippedSkin);
  }

  useEffect(refresh, []);

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-[#150826] to-[#020814] px-5 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-90 transition-transform">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-white">Skins</h2>
        </div>
        <div className="flex items-center gap-1.5 text-amber-300 bg-white/5 rounded-full px-3 py-1.5 border border-white/10">
          <Zap size={14} className="fill-amber-300" />
          <span className="text-sm font-mono">{shards}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 overflow-y-auto">
        {SKINS.map((s) => {
          const isUnlocked = unlocked.includes(s.id);
          const isEquipped = equipped === s.id;
          return (
            <button
              key={s.id}
              onClick={() => {
                if (isUnlocked) {
                  equipSkin(s.id);
                  refresh();
                } else if (s.cost && unlockSkin(s.id, s.cost)) {
                  equipSkin(s.id);
                  refresh();
                }
              }}
              className="relative rounded-2xl p-4 flex flex-col items-center gap-2 border active:scale-95 transition-transform"
              style={{
                background: "rgba(255,255,255,0.06)",
                borderColor: isEquipped ? s.primary : "rgba(255,255,255,0.1)",
              }}
            >
              {isEquipped && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center">
                  <Check size={12} className="text-[#0b0a1f]" />
                </div>
              )}
              <div
                className="w-14 h-14 rounded-xl"
                style={{ background: s.primary, boxShadow: `0 0 20px ${s.primary}88` }}
              />
              <span className="text-white text-sm font-medium">{s.name}</span>
              {!isUnlocked && (
                <div className="flex items-center gap-1 text-white/50 text-xs">
                  <Lock size={10} />
                  <Zap size={10} className="fill-amber-300 text-amber-300" />
                  {s.cost}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

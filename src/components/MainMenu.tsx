import { Play, Infinity as InfinityIcon, CalendarDays, Shirt, Volume2, VolumeX, Zap, Settings } from "lucide-react";
import { loadSave } from "@/game/storage";
import { useEffect, useState } from "react";

interface Props {
  onPlay: () => void;
  onEndless: () => void;
  onDaily: () => void;
  onSkins: () => void;
  onSettings: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

export default function MainMenu({ onPlay, onEndless, onDaily, onSkins, onSettings, muted, onToggleMute }: Props) {
  const [shards, setShards] = useState(0);

  useEffect(() => {
    setShards(loadSave().totalShards);
  }, []);

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-between px-6 overflow-hidden bg-gradient-to-b from-[#0b1026] via-[#150826] to-[#020814]"
      style={{
        paddingTop: "max(2.5rem, env(safe-area-inset-top))",
        paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <BackgroundGlow />

      <div className="relative flex flex-col items-center mt-8 gap-2">
        <h1 className="text-5xl font-black tracking-tighter text-white drop-shadow-[0_0_20px_rgba(75,243,255,0.6)]">
          TRAP<span className="text-cyan-400">SHIFT</span>
        </h1>
        <p className="text-white/50 text-sm tracking-wide">nothing is what it looks like</p>
      </div>

      <div className="relative w-full max-w-xs flex flex-col gap-3">
        <button
          onClick={onPlay}
          className="group relative overflow-hidden flex items-center justify-center gap-3 rounded-2xl py-4 bg-cyan-400 text-[#0b0a1f] font-bold text-lg shadow-[0_0_30px_rgba(75,243,255,0.5)] active:scale-95 transition-transform"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-full animate-ts-cta-shine motion-reduce:animate-none"
          />
          <Play size={22} fill="currentColor" className="relative" /> <span className="relative">Play Story</span>
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onEndless}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl py-4 bg-white/10 border border-white/10 text-white active:scale-95 transition-transform"
          >
            <InfinityIcon size={20} />
            <span className="text-sm font-medium">Endless</span>
          </button>
          <button
            onClick={onDaily}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl py-4 bg-white/10 border border-white/10 text-white active:scale-95 transition-transform"
          >
            <CalendarDays size={20} />
            <span className="text-sm font-medium">Daily</span>
          </button>
        </div>
        <button
          onClick={onSkins}
          className="flex items-center justify-center gap-2 rounded-2xl py-3 bg-white/5 border border-white/10 text-white/80 active:scale-95 transition-transform"
        >
          <Shirt size={18} /> Skins
        </button>
      </div>

      <div className="relative flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-amber-300 bg-white/5 rounded-full px-3 py-1.5 border border-white/10">
          <Zap size={14} className="fill-amber-300" />
          <span className="text-sm font-mono">{shards}</span>
        </div>
        <button
          onClick={onToggleMute}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white/70 flex items-center justify-center active:scale-90 transition-transform"
        >
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <button
          onClick={onSettings}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white/70 flex items-center justify-center active:scale-90 transition-transform"
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
}

function BackgroundGlow() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute bottom-20 left-10 w-48 h-48 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="absolute bottom-40 right-10 w-56 h-56 rounded-full bg-amber-400/10 blur-3xl" />
    </div>
  );
}

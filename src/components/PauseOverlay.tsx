import { Home, RotateCcw, Volume2, VolumeX, Play } from "lucide-react";

interface Props {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

export default function PauseOverlay({ onResume, onRestart, onQuit, muted, onToggleMute }: Props) {
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onResume}
      role="dialog"
      aria-modal="true"
      aria-label="Paused"
    >
      <div
        className="w-72 rounded-3xl bg-[#151233]/95 border border-white/10 p-6 flex flex-col gap-3 shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-center text-xl font-bold text-white tracking-wide mb-2">Paused</h2>
        <p className="text-center text-[10px] uppercase tracking-widest text-white/30 -mt-3 mb-1">
          Tap outside to resume
        </p>
        <button
          onClick={onResume}
          className="flex items-center justify-center gap-2 rounded-2xl py-3 bg-cyan-400 text-[#0b0a1f] font-semibold active:scale-95 transition-transform"
        >
          <Play size={18} fill="currentColor" /> Resume
        </button>
        <button
          onClick={onRestart}
          className="flex items-center justify-center gap-2 rounded-2xl py-3 bg-white/10 text-white font-medium active:scale-95 transition-transform"
        >
          <RotateCcw size={18} /> Restart
        </button>
        <button
          onClick={onToggleMute}
          className="flex items-center justify-center gap-2 rounded-2xl py-3 bg-white/10 text-white font-medium active:scale-95 transition-transform"
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />} {muted ? "Unmute" : "Mute"}
        </button>
        <button
          onClick={onQuit}
          className="flex items-center justify-center gap-2 rounded-2xl py-3 bg-white/5 text-white/70 font-medium active:scale-95 transition-transform"
        >
          <Home size={18} /> Quit to Menu
        </button>
      </div>
    </div>
  );
}

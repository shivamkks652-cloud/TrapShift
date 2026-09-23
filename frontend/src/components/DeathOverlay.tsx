import { Play, RotateCcw, Skull, Flag } from "lucide-react";

interface Props {
  cause: string;
  endless?: boolean;
  busy: boolean;
  adFailed: boolean;
  onWatchAd: () => void;
  onRespawn: () => void;
}

const CAUSE_LABEL: Record<string, string> = {
  spike: "Shredded by spikes",
  "laser-vertical": "Vaporized by a laser",
  "laser-horizontal": "Vaporized by a laser",
  mimic: "Eaten by a mimic",
  steam: "Cooked by steam",
  firewall: "Burned by a firewall",
  crush: "Crushed by a piston",
  drone: "Shot down by a patrol drone",
  fell: "Fell into the void",
};

export function DeathOverlay({ cause, endless, busy, adFailed, onWatchAd, onRespawn }: Props) {
  return (
    <div
      data-testid="death-overlay"
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-80 rounded-3xl bg-[#151233]/95 border border-red-400/20 p-6 flex flex-col items-center gap-4 shadow-[0_0_40px_rgba(255,61,129,0.25)]">
        <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-400/40 flex items-center justify-center shadow-[0_0_24px_rgba(255,92,122,0.5)]">
          <Skull size={26} className="text-red-400" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white tracking-wide">YOU DIED</h2>
          <p data-testid="death-cause-label" className="text-sm text-white/60 mt-1">
            {CAUSE_LABEL[cause] ?? "Trap got you"}
          </p>
        </div>
        <div className="w-full flex flex-col gap-2 mt-1">
          <button
            data-testid="watch-ad-continue-btn"
            onClick={onWatchAd}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-2xl py-3 bg-cyan-400 text-[#0b0a1f] font-semibold active:scale-95 transition-transform disabled:opacity-60 disabled:active:scale-100"
          >
            <Play size={18} className="fill-[#0b0a1f]" />
            {busy ? "Loading Ad…" : endless ? "Watch Ad & Continue Run" : "Watch Ad & Continue"}
          </button>
          <button
            data-testid={endless ? "death-end-run-btn" : "death-respawn-btn"}
            onClick={onRespawn}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-2xl py-3 bg-white/10 text-white font-medium active:scale-95 transition-transform disabled:opacity-60"
          >
            {endless ? <Flag size={18} /> : <RotateCcw size={18} />}
            {endless ? "End Run" : "Respawn"}
          </button>
        </div>
        {adFailed && (
          <p data-testid="ad-error-msg" className="text-xs text-red-300/90 text-center">
            Ad abhi available nahi hai — Respawn karke continue karein.
          </p>
        )}
        {!endless && (
          <p className="text-[11px] text-white/40 text-center">
            Ad dekhne par wahi se continue — death count nahi badhega
          </p>
        )}
      </div>
    </div>
  );
}

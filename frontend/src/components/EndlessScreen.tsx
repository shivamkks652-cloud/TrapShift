import { useEffect, useMemo, useState } from "react";
import GameCanvas from "./GameCanvas";
import { generateEndlessLevel } from "@/game/endless";
import { loadSave, setEndlessBest, setDailyBest, todayKey } from "@/game/storage";
import { startMusic, stopMusic, sfx } from "@/game/audio";
import { Home, RotateCcw, Trophy, Zap } from "lucide-react";

const CONFETTI_COLORS = ["#4bf3ff", "#ff3df0", "#ffb23d", "#7dff5c", "#ffffff"];

function BestConfetti({ count = 36 }: { count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="ts-confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDuration: `${1.6 + Math.random() * 1.3}s`,
            animationDelay: `${Math.random() * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}

interface Props {
  mode: "endless" | "daily";
  onExit: () => void;
}

function dateSeed(): number {
  const key = todayKey();
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return h;
}

export default function EndlessScreen({ mode, onExit }: Props) {
  const [seed, setSeed] = useState(() => (mode === "daily" ? dateSeed() : Math.floor(Math.random() * 1e9)));
  const level = useMemo(() => generateEndlessLevel(seed), [seed]);
  const [gameOver, setGameOver] = useState<{ distance: number; shards: number } | null>(null);
  const [restartSignal, setRestartSignal] = useState(0);
  const [best, setBest] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);

  useEffect(() => {
    const save = loadSave();
    setBest(mode === "daily" ? save.dailyBest[todayKey()] ?? 0 : save.endlessBest);
  }, [mode]);

  useEffect(() => {
    startMusic(1, mode === "daily" ? 3 : 0);
    return () => stopMusic();
  }, [mode]);

  function handleGameOver(info: { distance: number; shards: number }) {
    const score = info.distance + info.shards * 5;
    // Detect a new record BEFORE persisting so we can celebrate it.
    const before = loadSave();
    const prevBest = mode === "daily" ? before.dailyBest[todayKey()] ?? 0 : before.endlessBest;
    const isNew = score > prevBest && score > 0;
    setIsNewBest(isNew);
    if (mode === "daily") setDailyBest(score);
    else setEndlessBest(score);
    setGameOver(info);
    const save = loadSave();
    setBest(mode === "daily" ? save.dailyBest[todayKey()] ?? 0 : save.endlessBest);
    if (isNew) sfx.win();
  }

  function handleRetry() {
    setGameOver(null);
    setIsNewBest(false);
    if (mode !== "daily") setSeed(Math.floor(Math.random() * 1e9));
    setRestartSignal((s) => s + 1);
  }

  const score = gameOver ? gameOver.distance + gameOver.shards * 5 : 0;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <GameCanvas
        level={level}
        onWin={() => {}}
        paused={!!gameOver}
        restartSignal={restartSignal}
        singleLife
        onGameOver={handleGameOver}
      />
      {!gameOver && (
        <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none">
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/10 text-white text-sm">
            <Trophy size={14} className="text-amber-300" />
            Best: {best}
          </div>
        </div>
      )}
      {gameOver && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          {isNewBest && <BestConfetti />}
          <div className="w-80 rounded-3xl bg-[#151233]/95 border border-white/10 p-6 flex flex-col items-center gap-4">
            {isNewBest && (
              <div
                data-testid="new-best-badge"
                className="flex items-center gap-2 rounded-full px-4 py-1.5 bg-amber-400/15 border border-amber-300/50 text-amber-300 font-bold text-sm tracking-widest shadow-[0_0_24px_rgba(255,178,61,0.5)] animate-pulse"
              >
                <Trophy size={16} className="fill-amber-300" /> NEW BEST!
              </div>
            )}
            <h2 className="text-2xl font-bold text-white">
              {mode === "daily" ? "Daily Run Over" : "Run Over"}
            </h2>
            <div className="w-full flex justify-between text-sm text-white/70 bg-white/5 rounded-2xl px-4 py-3">
              <span>Score</span>
              <span className="font-mono text-white">{score}</span>
            </div>
            <div className="w-full flex justify-between text-sm text-white/70 bg-white/5 rounded-2xl px-4 py-3">
              <span className="flex items-center gap-1">
                <Zap size={14} className="fill-amber-300 text-amber-300" /> Shards
              </span>
              <span className="font-mono text-amber-300">{gameOver.shards}</span>
            </div>
            <div className="w-full flex justify-between text-sm text-white/70 bg-white/5 rounded-2xl px-4 py-3">
              <Trophy size={14} className="text-amber-300" />
              <span className="font-mono text-white">Best: {best}</span>
            </div>
            <div className="w-full flex flex-col gap-2 mt-1">
              {mode !== "daily" && (
                <button
                  onClick={handleRetry}
                  className="flex items-center justify-center gap-2 rounded-2xl py-3 bg-cyan-400 text-[#0b0a1f] font-semibold active:scale-95 transition-transform"
                >
                  <RotateCcw size={18} /> Try Again
                </button>
              )}
              <button
                onClick={onExit}
                className="flex items-center justify-center gap-2 rounded-2xl py-3 bg-white/10 text-white font-medium active:scale-95 transition-transform"
              >
                <Home size={18} /> Menu
              </button>
            </div>
          </div>
        </div>
      )}
      {!gameOver && (
        <button
          onClick={onExit}
          className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center justify-center active:scale-90 transition-transform"
        >
          <Home size={16} />
        </button>
      )}
    </div>
  );
}

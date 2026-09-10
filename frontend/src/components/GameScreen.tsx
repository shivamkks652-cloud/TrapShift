import { useEffect, useRef, useState } from "react";
import GameCanvas from "./GameCanvas";
import HUD from "./HUD";
import PauseOverlay from "./PauseOverlay";
import ResultsOverlay from "./ResultsOverlay";
import LevelIntro from "./LevelIntro";
import type { LevelDef } from "@/game/types";
import { getNextLevelId, getLevelById } from "@/game/levels";
import { getSettings } from "@/game/storage";
import { isMuted, setMuted, startMusic, stopMusic, setMusicVolume, setSfxVolume } from "@/game/audio";
import { maybeShowInterstitialAfterLevelComplete } from "@/game/ads";

interface Props {
  level: LevelDef;
  onExit: () => void;
  onGoToLevel: (levelId: string) => void;
}

export default function GameScreen({ level, onExit, onGoToLevel }: Props) {
  const [phase, setPhase] = useState<"intro" | "playing" | "paused" | "results">("intro");
  const [elapsed, setElapsed] = useState(0);
  const [shardsCollected, setShardsCollected] = useState(0);
  const [deaths, setDeaths] = useState(0);
  const [restartSignal, setRestartSignal] = useState(0);
  const [result, setResult] = useState<{ timeMs: number; shardsCollected: number; shardsTotal: number; stars: 1 | 2 | 3 } | null>(null);
  const [muted, setMutedState] = useState(isMuted());
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1400);
  }

  useEffect(() => {
    const s = getSettings();
    setMusicVolume(s.musicVolume);
    setSfxVolume(s.sfxVolume);
    startMusic(level.world);
    return () => {
      stopMusic();
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, [level.world, level.id]);

  useEffect(() => {
    if (phase !== "playing") return;
    let raf: number;
    const t0 = performance.now() - elapsed * 1000;
    function tick() {
      setElapsed((performance.now() - t0) / 1000);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function handleWin(r: { timeMs: number; shardsCollected: number; shardsTotal: number; stars: 1 | 2 | 3 }) {
    setResult(r);
    setPhase("results");
    void maybeShowInterstitialAfterLevelComplete();
  }

  function handleRestart() {
    setElapsed(0);
    setShardsCollected(0);
    setDeaths(0);
    setResult(null);
    setRestartSignal((s) => s + 1);
    setPhase("playing");
  }

  function handleEvent(type: string) {
    if (type === "shard") setShardsCollected((s) => s + 1);
    else if (type === "checkpoint") showToast("Checkpoint!");
    else if (type === "gateOpen") showToast("Gate opened!");
    else if (type === "switchArmed") showToast("Switch armed");
    else if (type === "switchDenied") showToast("Locked — wrong order!");
  }

  const nextLevelId = getNextLevelId(level.id);
  const nextLevel = nextLevelId ? getLevelById(nextLevelId) : undefined;

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      <GameCanvas
        level={level}
        onWin={handleWin}
        onDeathCount={setDeaths}
        onEvent={handleEvent}
        paused={phase !== "playing"}
        restartSignal={restartSignal}
      />
      {phase === "playing" && (
        <HUD level={level} shardsCollected={shardsCollected} elapsed={elapsed} deaths={deaths} onPause={() => setPhase("paused")} />
      )}
      {toast && phase === "playing" && (
        <div
          data-testid={toast === "Gate opened!" ? "gate-toast" : "checkpoint-toast"}
          className="pointer-events-none absolute top-20 inset-x-0 z-20 flex justify-center"
        >
          <div className="animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2 rounded-full bg-cyan-400/15 backdrop-blur-md border border-cyan-300/40 px-5 py-2 text-cyan-200 font-semibold text-sm shadow-[0_0_24px_rgba(75,243,255,0.35)]">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(75,243,255,0.9)]" />
            {toast}
          </div>
        </div>
      )}
      {phase === "intro" && <LevelIntro level={level} onStart={() => setPhase("playing")} />}
      {phase === "paused" && (
        <PauseOverlay
          onResume={() => setPhase("playing")}
          onRestart={handleRestart}
          onQuit={onExit}
          muted={muted}
          onToggleMute={() => {
            const next = !muted;
            setMuted(next);
            setMutedState(next);
          }}
        />
      )}
      {phase === "results" && result && (
        <ResultsOverlay
          stars={result.stars}
          timeMs={result.timeMs}
          shardsCollected={result.shardsCollected}
          shardsTotal={result.shardsTotal}
          parTime={level.parTime}
          hasNext={!!nextLevel}
          onNext={() => {
            if (nextLevel) {
              setElapsed(0);
              setShardsCollected(0);
              setDeaths(0);
              setResult(null);
              setPhase("intro");
              onGoToLevel(nextLevel.id);
            }
          }}
          onRetry={handleRestart}
          onMenu={onExit}
        />
      )}
    </div>
  );
}

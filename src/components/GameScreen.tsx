import { useEffect, useState } from "react";
import GameCanvas from "./GameCanvas";
import HUD from "./HUD";
import PauseOverlay from "./PauseOverlay";
import ResultsOverlay from "./ResultsOverlay";
import LevelIntro from "./LevelIntro";
import type { LevelDef } from "@/game/types";
import { getNextLevelId, getLevelById } from "@/game/levels";
import { isMuted, setMuted, startMusic, stopMusic } from "@/game/audio";
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

  useEffect(() => {
    startMusic(level.world);
    return () => stopMusic();
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

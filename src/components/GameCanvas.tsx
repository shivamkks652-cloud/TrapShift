import { useEffect, useRef, useState } from "react";
import { GameEngine, type InputState } from "@/game/engine";
import { render } from "@/game/render";
import { TILE, type LevelDef } from "@/game/types";
import { getWorldOfLevel } from "@/game/levels";
import { RESTART_DELAY_MS } from "@/game/constants";
import { loadSave, recordLevelResult, getSettings } from "@/game/storage";
import { resumeAudio } from "@/game/audio";

export interface GameCanvasHandle {
  restart: () => void;
}

interface Props {
  level: LevelDef;
  onWin: (result: { timeMs: number; shardsCollected: number; shardsTotal: number; stars: 1 | 2 | 3 }) => void;
  onDeathCount?: (deaths: number) => void;
  onEvent?: (type: string) => void;
  paused: boolean;
  restartSignal: number;
  singleLife?: boolean;
  onGameOver?: (info: { distance: number; shards: number }) => void;
}

export default function GameCanvas({
  level,
  onWin,
  onDeathCount,
  onEvent,
  paused,
  restartSignal,
  singleLife,
  onGameOver,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const inputRef = useRef<InputState>({ left: false, right: false, jumpPressed: false, jumpHeld: false });
  const frameRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const respawnTimerRef = useRef<number | null>(null);
  const [, forceRender] = useState(0);

  const world = getWorldOfLevel(level.id);

  function attachEngineEvents(eng: GameEngine) {
    eng.onEvent = (e) => {
      if (e.type === "death") {
        onDeathCount?.(eng.deaths);
        onEvent?.("death");
        if (singleLife) {
          onGameOver?.({ distance: Math.round(eng.player.x / TILE), shards: eng.shardsCollected.size });
          return;
        }
        if (respawnTimerRef.current) window.clearTimeout(respawnTimerRef.current);
        respawnTimerRef.current = window.setTimeout(() => {
          eng.respawn();
        }, RESTART_DELAY_MS);
      } else if (e.type === "win") {
        const shardsTotal = level.shards?.length ?? 0;
        const shardsCollected = eng.shardsCollected.size;
        let stars: 1 | 2 | 3 = 1;
        if (eng.time <= level.parTime && shardsCollected === shardsTotal) stars = 3;
        else if (eng.time <= level.parTime * 1.4 || shardsCollected >= Math.ceil(shardsTotal / 2)) stars = 2;
        recordLevelResult(level.id, Math.round(eng.time * 1000), shardsCollected, shardsTotal, stars);
        onWin({ timeMs: Math.round(eng.time * 1000), shardsCollected, shardsTotal, stars });
        onEvent?.("win");
      } else {
        onEvent?.(e.type);
      }
    };
  }

  function makeEngine() {
    const settings = getSettings();
    return new GameEngine(level, {
      reducedShake: settings.reducedShake,
      sensitivity: settings.touchSensitivity,
    });
  }

  useEffect(() => {
    engineRef.current = makeEngine();
    attachEngineEvents(engineRef.current);
    return () => {
      if (respawnTimerRef.current) window.clearTimeout(respawnTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.id]);

  useEffect(() => {
    if (restartSignal > 0) {
      engineRef.current = makeEngine();
      attachEngineEvents(engineRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restartSignal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;
    const ctx: CanvasRenderingContext2D = ctx2d;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const parent = canvas!.parentElement;
      const w = parent ? parent.clientWidth : window.innerWidth;
      const h = parent ? parent.clientHeight : window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function keydown(e: KeyboardEvent) {
      if (["ArrowLeft", "KeyA"].includes(e.code)) inputRef.current.left = true;
      if (["ArrowRight", "KeyD"].includes(e.code)) inputRef.current.right = true;
      if (["Space", "ArrowUp", "KeyW"].includes(e.code)) {
        if (!inputRef.current.jumpHeld) inputRef.current.jumpPressed = true;
        inputRef.current.jumpHeld = true;
        resumeAudio();
      }
      if (e.code === "KeyR") {
        engineRef.current?.die("manual");
      }
    }
    function keyup(e: KeyboardEvent) {
      if (["ArrowLeft", "KeyA"].includes(e.code)) inputRef.current.left = false;
      if (["ArrowRight", "KeyD"].includes(e.code)) inputRef.current.right = false;
      if (["Space", "ArrowUp", "KeyW"].includes(e.code)) inputRef.current.jumpHeld = false;
    }
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);

    function loop(t: number) {
      const dt = lastTimeRef.current ? Math.min(0.033, (t - lastTimeRef.current) / 1000) : 0;
      lastTimeRef.current = t;
      frameRef.current++;

      const eng = engineRef.current;
      if (eng && !paused) {
        eng.update(dt, inputRef.current);
        inputRef.current.jumpPressed = false;
      }

      const rect = canvas!.getBoundingClientRect();
      if (eng) {
        const save = loadSave();
        render(ctx, eng, {
          width: rect.width,
          height: rect.height,
          worldAccent: world?.accent ?? "#4bf3ff",
          worldFrom: world?.colorFrom ?? "#0b1026",
          worldTo: world?.colorTo ?? "#1b1440",
          skinId: save.equippedSkin,
          frame: frameRef.current,
          colorblindMode: save.settings.colorblindMode,
        });
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.id, paused]);

  function setTouch(key: "left" | "right", val: boolean) {
    inputRef.current[key] = val;
  }
  function pressJump() {
    resumeAudio();
    if (!inputRef.current.jumpHeld) inputRef.current.jumpPressed = true;
    inputRef.current.jumpHeld = true;
  }
  function releaseJump() {
    inputRef.current.jumpHeld = false;
  }

  return (
    <div className="relative w-full h-full select-none touch-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-5 pb-6 pointer-events-none">
        <div className="flex gap-3 pointer-events-auto">
          <TouchButton
            label="◀"
            onDown={() => setTouch("left", true)}
            onUp={() => setTouch("left", false)}
          />
          <TouchButton
            label="▶"
            onDown={() => setTouch("right", true)}
            onUp={() => setTouch("right", false)}
          />
        </div>
        <div className="pointer-events-auto">
          <TouchButton label="⤒" big onDown={pressJump} onUp={releaseJump} />
        </div>
      </div>
    </div>
  );
}

function TouchButton({
  label,
  onDown,
  onUp,
  big,
}: {
  label: string;
  onDown: () => void;
  onUp: () => void;
  big?: boolean;
}) {
  return (
    <button
      className={`${big ? "w-20 h-20 text-3xl" : "w-16 h-16 text-2xl"} rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center active:scale-90 active:bg-white/20 transition-transform`}
      onPointerDown={(e) => {
        e.preventDefault();
        onDown();
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        onUp();
      }}
      onPointerLeave={() => onUp()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  );
}

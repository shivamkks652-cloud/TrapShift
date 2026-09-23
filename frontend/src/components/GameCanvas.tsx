import { useEffect, useRef, useState } from "react";
import { GameEngine, type InputState } from "@/game/engine";
import { render } from "@/game/render";
import { TILE, type LevelDef } from "@/game/types";
import { getWorldOfLevel } from "@/game/levels";
import { RESTART_DELAY_MS } from "@/game/constants";
import { loadSave, recordLevelResult, getSettings } from "@/game/storage";
import { resumeAudio, stopAllHums } from "@/game/audio";
import { vibrate } from "@/game/haptics";

export interface GameCanvasHandle {
  restart: () => void;
}

export interface DeathInfo {
  cause: string;
  distance: number;
  shards: number;
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
  // When set, deaths (except manual retry) do NOT auto-respawn — the parent shows
  // a rewarded-ad continue prompt and drives the outcome via reviveSignal (watch
  // ad -> revive in place, death undone) or respawnSignal (normal checkpoint respawn).
  onDeathPrompt?: (info: DeathInfo) => void;
  reviveSignal?: number;
  respawnSignal?: number;
  boostSignal?: number;
  onBoost?: (charges: number, max: number) => void;
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
  onDeathPrompt,
  reviveSignal = 0,
  respawnSignal = 0,
  boostSignal = 0,
  onBoost,
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
        const cause: string = e.data?.cause ?? "unknown";
        if (onDeathPrompt && cause !== "manual") {
          onDeathPrompt({ cause, distance: Math.round(eng.player.x / TILE), shards: eng.shardsCollected.size });
          return;
        }
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
      } else if (e.type === "boostPickup" || e.type === "boostUse") {
        onBoost?.(e.data?.charges ?? 0, e.data?.max ?? 0);
        onEvent?.(e.type);
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
    if (reviveSignal > 0 && engineRef.current) {
      engineRef.current.revive();
      // revive() undoes the death penalty — sync the HUD counter too.
      onDeathCount?.(engineRef.current.deaths);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviveSignal]);

  useEffect(() => {
    if (respawnSignal > 0) engineRef.current?.respawn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [respawnSignal]);

  useEffect(() => {
    if (boostSignal > 0) engineRef.current?.grantBoost(3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boostSignal]);

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
      stopAllHums();
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
      <div
        className="absolute inset-x-0 bottom-0 flex items-end justify-between px-[max(1.25rem,env(safe-area-inset-left))] pb-[max(1.5rem,env(safe-area-inset-bottom))] pointer-events-none"
        style={{ opacity: getSettings().touchOpacity }}
      >
        <div
          className="flex gap-4 pointer-events-auto"
          style={{ transform: `scale(${getSettings().touchScale})`, transformOrigin: "bottom left" }}
        >
          <TouchButton
            testid="touch-left-btn"
            label="◀"
            onDown={() => setTouch("left", true)}
            onUp={() => setTouch("left", false)}
          />
          <TouchButton
            testid="touch-right-btn"
            label="▶"
            onDown={() => setTouch("right", true)}
            onUp={() => setTouch("right", false)}
          />
        </div>
        <div
          className="pointer-events-auto"
          style={{ transform: `scale(${getSettings().touchScale})`, transformOrigin: "bottom right" }}
        >
          <TouchButton testid="touch-jump-btn" label="⤒" big onDown={pressJump} onUp={releaseJump} />
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
  testid,
}: {
  label: string;
  onDown: () => void;
  onUp: () => void;
  big?: boolean;
  testid: string;
}) {
  const accent = big ? "#39ffb0" : "#4bf3ff";
  return (
    <button
      data-testid={testid}
      // Responsive size that scales with the smaller screen edge so it feels right
      // on tall Redmi/Poco phones and small devices alike, with a sane min/max.
      className={`relative rounded-full flex items-center justify-center font-bold text-white/95
        active:scale-90 transition-transform duration-100 will-change-transform
        bg-white/[0.07] backdrop-blur-xl border border-white/25
        ${big
          ? "w-[clamp(72px,20vw,104px)] h-[clamp(72px,20vw,104px)] text-3xl"
          : "w-[clamp(60px,16vw,88px)] h-[clamp(60px,16vw,88px)] text-2xl"}`}
      style={{
        // Critical for reliable MULTI-TOUCH: disable the browser's default touch
        // gestures on the button itself so a second finger (e.g. jump while holding
        // left) never triggers a gesture that cancels the first finger's press.
        touchAction: "none",
        boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.45), inset 0 0 18px ${accent}22, 0 0 22px ${accent}33`,
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        // Keep receiving pointer events for THIS finger even if it slides off, so
        // multi-touch holds don't false-release when fingers drift.
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch { /* ignore */ }
        vibrate(big ? 22 : 14);
        onDown();
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        } catch { /* ignore */ }
        onUp();
      }}
      onPointerCancel={() => onUp()}
      onLostPointerCapture={() => onUp()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span
        className="absolute inset-1 rounded-full pointer-events-none"
        style={{ boxShadow: `inset 0 0 12px ${accent}55`, border: `1px solid ${accent}44` }}
      />
      <span className="relative drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" style={{ color: accent }}>
        {label}
      </span>
    </button>
  );
}

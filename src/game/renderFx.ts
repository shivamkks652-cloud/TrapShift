// Additive polish layer — additive/read-only VFX on top of the existing render pipeline.
// Nothing in this file mutates engine state. All state is scoped per-engine via a WeakMap,
// so restarting a level (new GameEngine instance) automatically resets Fx state.
//
// Removability: `render.ts` calls into this module at explicit hook points; deleting those
// calls (and this file) removes every Phase-2 VFX with zero effect on gameplay.

import type { GameEngine } from "./engine";
import { TILE } from "./types";

interface FxState {
  // camera follow lerp
  smoothedCamX: number | null;
  // internal timing (Fx runs off perf clock so `render` signature stays untouched)
  lastNow: number;
}

const stateMap = new WeakMap<GameEngine, FxState>();

function getState(engine: GameEngine): FxState {
  let s = stateMap.get(engine);
  if (!s) {
    s = { smoothedCamX: null, lastNow: 0 };
    stateMap.set(engine, s);
  }
  return s;
}

/**
 * Returns the Fx-clock delta time in seconds since the previous call for this engine.
 * Clamped to 50ms so a stall/tab-hidden gap can't produce a giant catch-up frame.
 * MUST be called exactly once per render frame, at the top of render().
 */
export function fxTick(engine: GameEngine): number {
  const s = getState(engine);
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (!s.lastNow) {
    s.lastNow = now;
    return 0;
  }
  const dt = Math.min(0.05, (now - s.lastNow) / 1000);
  s.lastNow = now;
  return dt;
}

/**
 * Smoothed camera-follow lerp. Feed the *target* camX (already clamped to the level
 * bounds by the caller); returns the smoothed camX for this frame.
 *
 * On the first call after engine construction (or after reset via new engine), the
 * smoothed value snaps to the target so the level doesn't slide in from the wrong side.
 *
 * Uses an exponential half-life expressed as a rate `k`; at 60fps with k=12 the
 * camera closes ~50% of the gap every ~57ms, which reads as "hugging" without
 * feeling snappy or drifty. Frame-rate independent.
 */
export function getSmoothedCamX(
  engine: GameEngine,
  targetCamX: number,
  dt: number,
): number {
  const s = getState(engine);
  if (s.smoothedCamX === null || dt <= 0) {
    s.smoothedCamX = targetCamX;
    return targetCamX;
  }
  const k = 12;
  const factor = 1 - Math.exp(-dt * k);
  s.smoothedCamX += (targetCamX - s.smoothedCamX) * factor;
  // If we're within a sub-pixel of the target, snap so integer draws don't jitter.
  if (Math.abs(targetCamX - s.smoothedCamX) < 0.05) s.smoothedCamX = targetCamX;
  return s.smoothedCamX;
}

/**
 * Additive glow overlays on top of the existing lethal trap draws. Rendered in
 * world-space (assumes the caller has already translated by -camX). Uses
 * `globalCompositeOperation="lighter"` so it never darkens or repaints the
 * original hazard art — it only adds bloom around the existing lethal region.
 *
 * The glow rects mirror the *danger zones* the engine already treats as lethal:
 *   - active laser gates (vertical / horizontal)
 *   - active steam vents
 *   - firewall sweep bar (only while the sweep phase is lethal)
 *   - saw blade tips (rotating platforms)
 *   - "warning" exploding platforms
 *
 * Read-only: this function inspects engine.laserState / steamVentState /
 * firewallRectPublic / explosionState / rotatingAngle only. No writes.
 */
export function drawTrapHalos(
  ctx: CanvasRenderingContext2D,
  engine: GameEngine,
  frame: number,
  dangerColor: string,
) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const flicker = 0.75 + Math.sin(frame / 8) * 0.25;

  // Vertical laser gates + horizontal electric gates
  for (const l of engine.level.laserGates ?? []) {
    const st = engine.laserState[l.id];
    if (!st?.on) continue;
    if (l.axis === "vertical") {
      const cx = l.x * TILE + TILE * 0.5;
      const y = l.y * TILE;
      const h = l.h * TILE;
      const g = ctx.createLinearGradient(cx - TILE, 0, cx + TILE, 0);
      g.addColorStop(0, dangerColor + "00");
      g.addColorStop(0.5, dangerColor + "55");
      g.addColorStop(1, dangerColor + "00");
      ctx.fillStyle = g;
      ctx.globalAlpha = 0.55 * flicker;
      ctx.fillRect(cx - TILE, y, TILE * 2, h);
    } else {
      const x = l.x * TILE;
      const cy = l.y * TILE + TILE * 0.5;
      const w = l.h * TILE;
      const g = ctx.createLinearGradient(0, cy - TILE, 0, cy + TILE);
      g.addColorStop(0, dangerColor + "00");
      g.addColorStop(0.5, dangerColor + "55");
      g.addColorStop(1, dangerColor + "00");
      ctx.fillStyle = g;
      ctx.globalAlpha = 0.55 * flicker;
      ctx.fillRect(x, cy - TILE, w, TILE * 2);
    }
  }

  // Active steam vents — vertical beam glow
  for (const v of engine.level.steamVents ?? []) {
    const st = engine.steamVentState[v.id];
    if (st?.phase !== "active") continue;
    const cx = v.x * TILE + TILE * 0.5;
    const yBottom = v.y * TILE + TILE;
    const yTop = yBottom - v.h * TILE;
    const g = ctx.createRadialGradient(cx, (yTop + yBottom) / 2, 0, cx, (yTop + yBottom) / 2, TILE * 1.2);
    g.addColorStop(0, "#bff2ff66");
    g.addColorStop(1, "#bff2ff00");
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.5 * flicker;
    ctx.fillRect(cx - TILE * 1.2, yTop, TILE * 2.4, yBottom - yTop);
  }

  // Firewall sweeps (sweep phase only)
  for (const f of engine.level.firewallSweeps ?? []) {
    const { rect, phase } = engine.firewallRectPublic(f, engine.time);
    if (phase !== "sweep") continue;
    const g = ctx.createLinearGradient(0, rect.y - TILE, 0, rect.y + rect.h + TILE);
    g.addColorStop(0, "#39ffb000");
    g.addColorStop(0.5, "#39ffb066");
    g.addColorStop(1, "#39ffb000");
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.55 * flicker;
    ctx.fillRect(rect.x - TILE, rect.y - TILE, rect.w + TILE * 2, rect.h + TILE * 2);
  }

  // Rotating saw blades — glow around the current blade tip
  for (const r of engine.level.rotatingPlatforms ?? []) {
    const angle = engine.rotatingAngle[r.id] ?? 0;
    const cx = r.cx * TILE + Math.cos(angle) * r.radius * TILE;
    const cy = r.cy * TILE + Math.sin(angle) * r.radius * TILE;
    const rad = r.armLen * TILE * 0.9;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, dangerColor + "44");
    g.addColorStop(1, dangerColor + "00");
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.4 * flicker;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Warning-phase exploding platforms
  for (const e of engine.level.explodingPlatforms ?? []) {
    const st = engine.explosionState[e.id];
    if (!st || st.exploded || st.timer <= 0) continue;
    const x = e.x * TILE;
    const y = e.y * TILE;
    const w = e.w * TILE;
    const g = ctx.createLinearGradient(0, y - TILE, 0, y + TILE);
    g.addColorStop(0, "#ff8a3d00");
    g.addColorStop(0.5, "#ff8a3d55");
    g.addColorStop(1, "#ff8a3d00");
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.45 * flicker;
    ctx.fillRect(x - TILE, y - TILE, w + TILE * 2, TILE * 2);
  }

  ctx.restore();
}


// Additive polish layer — additive/read-only VFX on top of the existing render pipeline.
// Nothing in this file mutates engine state. All state is scoped per-engine via a WeakMap,
// so restarting a level (new GameEngine instance) automatically resets Fx state.
//
// Removability: `render.ts` calls into this module at explicit hook points; deleting those
// calls (and this file) removes every Phase-2 VFX with zero effect on gameplay.

import type { GameEngine } from "./engine";
import { TILE } from "./types";

interface Shockwave {
  x: number;
  y: number;
  color: string;
  t: number; // seconds elapsed since spawn
  maxT: number;
}

interface DustMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  z: number; // depth 0..1 (near..far) — controls parallax and alpha
}

interface FxState {
  // camera follow lerp
  smoothedCamX: number | null;
  // internal timing (Fx runs off perf clock so `render` signature stays untouched)
  lastNow: number;
  // death-shockwave state — spawns once on rising edge of engine.status==='dead'
  wasDead: boolean;
  shockwaves: Shockwave[];
  // ambient dust motes drifting in screen-space with camera-based parallax
  dust: DustMote[];
  dustSpawnAccum: number;
}

const stateMap = new WeakMap<GameEngine, FxState>();

function getState(engine: GameEngine): FxState {
  let s = stateMap.get(engine);
  if (!s) {
    s = {
      smoothedCamX: null,
      lastNow: 0,
      wasDead: false,
      shockwaves: [],
      dust: [],
      dustSpawnAccum: 0,
    };
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


/**
 * Death shockwave ring — spawns a single expanding additive ring at the player's
 * position on the rising edge of `engine.status === 'dead'`, then updates and
 * draws it in world-space until it fades. Purely cosmetic; no engine mutation.
 *
 * Call this once per frame, in world-space, AFTER hazards and BEFORE the player.
 */
export function updateAndDrawShockwaves(
  ctx: CanvasRenderingContext2D,
  engine: GameEngine,
  dt: number,
  dangerColor: string,
) {
  const s = getState(engine);
  const isDead = engine.status === "dead";
  // rising edge — spawn a shockwave at the player's current center
  if (isDead && !s.wasDead) {
    s.shockwaves.push({
      x: engine.player.x + engine.player.w / 2,
      y: engine.player.y + engine.player.h / 2,
      // colour matches the death-flash tint (engine.screenFlash.color) when
      // available so the shockwave reads as caused by the same hazard family
      color: engine.screenFlash?.color || dangerColor,
      t: 0,
      maxT: 0.45,
    });
  }
  s.wasDead = isDead;

  if (s.shockwaves.length === 0) return;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = s.shockwaves.length - 1; i >= 0; i--) {
    const w = s.shockwaves[i];
    w.t += dt;
    if (w.t >= w.maxT) {
      s.shockwaves.splice(i, 1);
      continue;
    }
    const p = w.t / w.maxT;
    const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
    const rOuter = 12 + eased * 140;
    const rInner = Math.max(0, rOuter - (18 + p * 22));
    const alpha = (1 - p) * 0.65;
    // Ring drawn via two arcs + even-odd fill for a hollow shockwave
    ctx.globalAlpha = alpha;
    ctx.fillStyle = w.color;
    ctx.beginPath();
    ctx.arc(w.x, w.y, rOuter, 0, Math.PI * 2);
    ctx.arc(w.x, w.y, rInner, 0, Math.PI * 2, true);
    ctx.fill("evenodd");
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}


/**
 * Ambient background dust motes — small drifting sparkles in screen-space with
 * subtle camera-based horizontal parallax. Purely decorative, quality-capped.
 *
 * Draw in SCREEN-SPACE, after the parallax grid but BEFORE the world-space
 * `ctx.translate(-camX, ...)`, so motes don't scroll 1:1 with the level.
 *
 * @param dt   frame delta from fxTick()
 * @param opts pass width/height + optional camX for parallax offset
 */
export function updateAndDrawAmbientDust(
  ctx: CanvasRenderingContext2D,
  engine: GameEngine,
  dt: number,
  opts: { width: number; height: number; camX: number; accent: string },
) {
  const s = getState(engine);
  const MAX_MOTES = 32;
  const SPAWN_PER_SEC = 8;

  // Spawn budget over time (dt-integrated so it's frame-rate independent).
  s.dustSpawnAccum += dt * SPAWN_PER_SEC;
  while (s.dustSpawnAccum >= 1 && s.dust.length < MAX_MOTES) {
    s.dustSpawnAccum -= 1;
    const z = Math.random();
    const life = 6 + Math.random() * 8;
    s.dust.push({
      x: Math.random() * opts.width,
      y: Math.random() * opts.height,
      vx: (Math.random() * 8 - 4) * (0.35 + z * 0.65),
      vy: (Math.random() * 6 - 3) * (0.35 + z * 0.65) - 2,
      life,
      maxLife: life,
      size: 0.8 + z * 1.6,
      z,
    });
  }
  if (s.dustSpawnAccum > 3) s.dustSpawnAccum = 3;

  if (s.dust.length === 0) return;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const parallaxX = -opts.camX * 0.15;
  for (let i = s.dust.length - 1; i >= 0; i--) {
    const d = s.dust[i];
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.life -= dt;
    if (d.life <= 0 || d.x < -20 || d.x > opts.width + 20 || d.y < -20 || d.y > opts.height + 20) {
      s.dust.splice(i, 1);
      continue;
    }
    // twinkle: alpha peaks mid-life
    const p = d.life / d.maxLife;
    const twinkle = Math.sin(p * Math.PI);
    const alpha = twinkle * (0.25 + d.z * 0.35);
    const drawX = d.x + parallaxX * (0.3 + d.z * 0.7);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = opts.accent;
    ctx.beginPath();
    ctx.arc(drawX, d.y, d.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}


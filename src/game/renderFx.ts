// Additive polish layer — additive/read-only VFX on top of the existing render pipeline.
// Nothing in this file mutates engine state. All state is scoped per-engine via a WeakMap,
// so restarting a level (new GameEngine instance) automatically resets Fx state.
//
// Removability: `render.ts` calls into this module at explicit hook points; deleting those
// calls (and this file) removes every Phase-2 VFX with zero effect on gameplay.

import type { GameEngine } from "./engine";

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

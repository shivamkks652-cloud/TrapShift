// Thin wrapper around the Vibration API. Cosmetic device feedback only —
// never gates or influences gameplay, purely a "juice" layer. Safe no-op on
// unsupported devices/browsers (e.g. iOS Safari has no navigator.vibrate).
// Patterns are boosted centrally so game feel stays strong on modern devices.

const SCALE = 2.6;
const MAX_MS = 260;

function boost(n: number): number {
  return n === 0 ? 0 : Math.min(MAX_MS, Math.round(n * SCALE));
}

export function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
    if (Array.isArray(pattern)) {
      navigator.vibrate(pattern.map(boost));
      return;
    }
    // Strong single hits (deaths, big impacts) become a double-buzz.
    if (pattern >= 30) {
      navigator.vibrate([0, boost(pattern), 60, boost(pattern * 1.6)]);
      return;
    }
    navigator.vibrate(boost(pattern));
  } catch {
    /* vibration not supported/permitted — silently ignore */
  }
}

// Thin wrapper around the Vibration API. Cosmetic device feedback only —
// never gates or influences gameplay, purely a "juice" layer. Safe no-op on
// unsupported devices/browsers (e.g. iOS Safari has no navigator.vibrate).

export function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  } catch {
    /* vibration not supported/permitted — silently ignore */
  }
}

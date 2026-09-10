// Hybrid Haptics: uses @capacitor/haptics on Android/iOS (auto-wired by Capacitor,
// zero manual manifest edits needed) + falls back to navigator.vibrate in browser.
import { Haptics, ImpactStyle } from "@capacitor/haptics";

const SCALE = 2.6;
const MAX_MS = 260;

function boost(n: number): number {
  return n === 0 ? 0 : Math.min(MAX_MS, Math.round(n * SCALE));
}

export function vibrate(pattern: number | number[]) {
  // 1. Try native Capacitor Haptics (automatic plugin bridge)
  try {
    if (typeof pattern === "number") {
      if (pattern >= 30) {
        void Haptics.impact({ style: ImpactStyle.Heavy });
      } else if (pattern >= 18) {
        void Haptics.impact({ style: ImpactStyle.Medium });
      } else {
        void Haptics.impact({ style: ImpactStyle.Light });
      }
    } else if (Array.isArray(pattern) && pattern.length > 0) {
      const maxP = Math.max(...pattern);
      if (maxP >= 30) {
        void Haptics.impact({ style: ImpactStyle.Heavy });
      } else {
        void Haptics.impact({ style: ImpactStyle.Medium });
      }
    }
  } catch {
    /* ignore capacitor error, fall through */
  }

  // 2. Web fallback (standard Vibration API)
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      if (Array.isArray(pattern)) {
        navigator.vibrate(pattern.map(boost));
        return;
      }
      if (pattern >= 30) {
        navigator.vibrate([0, boost(pattern), 60, boost(pattern * 1.6)]);
        return;
      }
      navigator.vibrate(boost(pattern));
    }
  } catch {
    /* vibration not permitted/supported */
  }
}

import { GameEngine } from "../src/game/engine";
import { ALL_LEVELS } from "../src/game/levels";
const lv = ALL_LEVELS.find((l) => l.rotatingPlatforms?.length)!;
const e = new GameEngine(lv);
const r = (e as any).rotatingRect(lv.rotatingPlatforms![0], 0);
e.player.x = r.x + r.w / 2 - e.player.w / 2; e.player.y = r.y - e.player.h + 4;
e.update(1 / 120, { left: false, right: false, jumpPressed: false, jumpHeld: false });
console.log(e.status === "dead" && e.lastDeathCause === "wheel" ? "PASS wheel kills on touch" : `FAIL ${e.status} ${e.lastDeathCause}`, lv.id);

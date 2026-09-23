import { GameEngine, type InputState } from "../src/game/engine";
import { ALL_LEVELS } from "../src/game/levels";
import { TILE } from "../src/game/types";

const NO_INPUT: InputState = { left: false, right: false, jumpPressed: false, jumpHeld: false };
let failures = 0;
const log = (ok: boolean, msg: string) => { if (!ok) failures++; console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); };

// 1) Every level with patrolDrones: teleport the player onto the drone's rect => instant death.
const droneLevels = ALL_LEVELS.filter((l) => (l.patrolDrones?.length ?? 0) > 0);
console.log(`drone levels: ${droneLevels.map((l) => l.id).join(", ")}`);
for (const lv of droneLevels) {
  const e = new GameEngine(lv);
  // step a few frames so time advances and drone position settles deterministically
  for (let i = 0; i < 30; i++) e.update(1 / 60, NO_INPUT);
  const d = lv.patrolDrones![0];
  const r = e.droneRect(d);
  e.player.x = r.x + r.w / 2 - e.player.w / 2;
  e.player.y = r.y + r.h / 2 - e.player.h / 2;
  e.update(1 / 60, NO_INPUT);
  log(e.status === "dead" && e.lastDeathCause === "drone", `${lv.id} drone contact -> instant death (cause=${e.lastDeathCause})`);
}

// 2) Jump-boost cube: collect => charges set; boosted jump stronger; depletes per jump.
const lv = ALL_LEVELS.find((l) => (l.jumpCubes?.length ?? 0) > 0)!;
const e = new GameEngine(lv);
const c = lv.jumpCubes![0];
e.player.x = c.x * TILE;
e.player.y = c.y * TILE;
e.update(1 / 60, NO_INPUT);
const gotBoost = e.jumpBoostCharges > 0;
log(gotBoost, `${lv.id} cube pickup -> charges=${e.jumpBoostCharges}/${e.jumpBoostMax}`);

// settle on ground, then boosted jump velocity > normal
for (let i = 0; i < 120; i++) e.update(1 / 60, NO_INPUT);
if (gotBoost && e.player.onGround && e.jumpBoostCharges > 0) {
  e.update(1 / 60, { ...NO_INPUT, jumpPressed: true, jumpHeld: true });
  const boosted = Math.abs(e.player.vy) > 780 * 1.2;
  log(boosted && e.jumpBoostCharges === e.jumpBoostMax - 1, `boosted jump vel=${Math.abs(e.player.vy).toFixed(0)} chargesLeft=${e.jumpBoostCharges}`);
} else {
  log(false, `boost jump setup failed onGround=${e.player.onGround} charges=${e.jumpBoostCharges}`);
}

// 3) Boost resets on death/respawn
e.die("manual");
e.respawn();
log(e.jumpBoostCharges === 0 && e.jumpBoostMax === 0, `boost cleared on respawn (charges=${e.jumpBoostCharges})`);

console.log(failures === 0 ? "ALL PASS" : `${failures} FAILURES`);

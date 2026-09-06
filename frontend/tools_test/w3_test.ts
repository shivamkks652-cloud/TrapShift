import { GameEngine, type InputState } from "../src/game/engine";
import { world3 } from "../src/game/levels/world3";
import { TILE } from "../src/game/types";

const NO_INPUT: InputState = { left: false, right: false, jumpPressed: false, jumpHeld: false };

let failures = 0;
const log = (ok: boolean, msg: string) => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`);
};

// 1) Every row must be exactly 26 columns.
for (const lv of world3) {
  const widths = new Set(lv.rows.map((r) => r.length));
  log(widths.size === 1 && lv.rows[0].length === 26, `${lv.id} row widths uniform=26 (${[...widths].join(",")})`);
}

// 2) Fall boundary: forcing the player below the grid must always kill + respawn.
for (const lv of world3) {
  const e = new GameEngine(lv);
  e.player.y = lv.rows.length * TILE + TILE * 4;
  e.update(1 / 60, NO_INPUT);
  const died = e.status === "dead";
  e.respawn();
  const back = e.status === "playing" && e.player.y === (e.activeCheckpoint?.y ?? lv.playerStart.y) * TILE;
  log(died && back, `${lv.id} below-grid -> death + respawn to start/checkpoint`);
}

// 3) Reachability auto-bot: hold right, auto-hop pits, leap woken mimics. Respawns
//    on death. Reports the furthest x reached and whether the exit is completed.
//    (Precise freeze/laser timing is left to live QA — this just proves geometry.)
function isFootingAhead(e: GameEngine, lv: typeof world3[number]): boolean {
  const feetCol = Math.floor((e.player.x + e.player.w) / TILE) + 1;
  const feetRow = Math.floor((e.player.y + e.player.h) / TILE);
  for (let dy = 0; dy <= 2; dy++) {
    const ty = feetRow + dy;
    const row = lv.rows[ty];
    if (row && (row[feetCol] === "#")) return true;
    for (const bt of (lv.darkZones ?? []).flatMap((d) => d.bridgeTiles)) if (bt.x === feetCol && bt.y === ty) return true;
    for (const ep of lv.explodingPlatforms ?? []) if (ty === ep.y && feetCol >= ep.x && feetCol < ep.x + ep.w && !e.explosionState[ep.id]?.exploded) return true;
    for (const g of lv.gates ?? []) if (!e.isGateOpen(g.id) && feetCol >= g.x && feetCol < g.x + g.w && ty >= g.y && ty < g.y + g.h) return false;
  }
  return false;
}

for (const lv of world3) {
  let solved = false;
  let maxX = 0;
  const exitX = lv.exit.x * TILE;
  // multiple attempts with slight timing variation to thread rhythmic hazards
  for (let attempt = 0; attempt < 60 && !solved; attempt++) {
    const e = new GameEngine(lv);
    e.time = Math.random() * 2; // vary hazard phase alignment per attempt
    let deadFor = 0;
    let stuckX = e.player.x;
    let stuckT = 0;
    const dt = 1 / 120;
    for (let step = 0; step < 120 * 20; step++) {
      if (e.status === "won") { solved = true; break; }
      if (e.status === "dead") {
        deadFor += dt;
        if (deadFor > 0.15) { e.respawn(); deadFor = 0; }
        continue;
      }
      maxX = Math.max(maxX, e.player.x);
      let jump = false;
      if (e.player.onGround) {
        if (!isFootingAhead(e, lv)) jump = true;
        // leap a woken mimic that is close ahead (jump early so we clear it)
        for (const m of lv.mimicEnemies ?? []) {
          const st = e.mimicState[m.id];
          if (st?.woken && st.x > e.player.x + TILE * 0.2 && st.x < e.player.x + TILE * 3) jump = true;
        }
        // anti-stuck against walls / closed gates
        if (Math.abs(e.player.x - stuckX) < 2) { stuckT += dt; if (stuckT > 0.2) { jump = true; stuckT = 0; } }
        else { stuckX = e.player.x; stuckT = 0; }
        if (Math.random() < 0.02) jump = true; // occasional hop to thread beams
      }
      e.update(dt, { left: false, right: true, jumpPressed: jump, jumpHeld: jump });
    }
  }
  const reachedEnd = maxX >= exitX - TILE * 1.5;
  log(solved || reachedEnd, `${lv.id} auto-bot ${solved ? "COMPLETED" : `reached x=${(maxX / TILE).toFixed(1)}/${lv.exit.x}`}`);
}

console.log(`\n${failures === 0 ? "ALL PASS" : failures + " FAILURE(S)"}`);
process.exit(failures === 0 ? 0 : 1);

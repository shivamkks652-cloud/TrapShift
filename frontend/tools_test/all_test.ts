import { GameEngine, type InputState } from "../src/game/engine";
import { ALL_LEVELS } from "../src/game/levels";
import { TILE, type LevelDef } from "../src/game/types";

const NO_INPUT: InputState = { left: false, right: false, jumpPressed: false, jumpHeld: false };
const only = process.argv[3]; // optional filter e.g. "w4" or "w4-3"

const levels = ALL_LEVELS.filter((l) => !only || l.id.startsWith(only));

let failures = 0;
const log = (ok: boolean, msg: string) => { if (!ok) failures++; console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`); };

// 1) uniform 7-row grid; every row same width.
for (const lv of levels) {
  const widths = new Set(lv.rows.map((r) => r.length));
  log(widths.size === 1, `${lv.id} row widths uniform (${[...widths].join(",")}) rows=${lv.rows.length}`);
}

// 2) fall boundary always kills + respawns.
for (const lv of levels) {
  const e = new GameEngine(lv);
  e.player.y = lv.rows.length * TILE + TILE * 4;
  e.update(1 / 60, NO_INPUT);
  const died = e.status === "dead";
  e.respawn();
  log(died && e.status === "playing", `${lv.id} below-grid -> death + respawn`);
}

// 3) reachability auto-bot (holds right, hops pits, leaps woken mimics, rides toward
//    moving/rotating platforms). Reports whether the exit is completed or nearly reached.
function isFootingAhead(e: GameEngine, lv: LevelDef): boolean {
  const gdir = e.gravityDir;
  const feetY = gdir === 1 ? e.player.y + e.player.h : e.player.y;
  const feetCol = Math.floor((e.player.x + e.player.w) / TILE) + 1;
  const feetRow = Math.floor(feetY / TILE);
  for (let k = 0; k <= 2; k++) {
    const ty = feetRow + gdir * k;
    const row = lv.rows[ty];
    if (row && row[feetCol] === "#") return true;
    for (const bt of (lv.darkZones ?? []).flatMap((d) => d.bridgeTiles)) if (bt.x === feetCol && bt.y === ty) return true;
    for (const ep of lv.explodingPlatforms ?? []) if (ty === ep.y && feetCol >= ep.x && feetCol < ep.x + ep.w && !e.explosionState[ep.id]?.exploded) return true;
    for (const g of lv.gates ?? []) if (!e.isGateOpen(g.id) && feetCol >= g.x && feetCol < g.x + g.w && ty >= g.y && ty < g.y + g.h) return false;
  }
  return false;
}

for (const lv of levels) {
  let solved = false;
  let maxX = 0;
  const exitX = lv.exit.x * TILE;
  for (let attempt = 0; attempt < 60 && !solved; attempt++) {
    const e = new GameEngine(lv);
    e.time = Math.random() * 2.5;
    let deadFor = 0, stuckX = e.player.x, stuckT = 0;
    const dt = 1 / 120;
    for (let step = 0; step < 120 * 22; step++) {
      if (e.status === "won") { solved = true; break; }
      if (e.status === "dead") { deadFor += dt; if (deadFor > 0.15) { e.respawn(); deadFor = 0; } continue; }
      maxX = Math.max(maxX, e.player.x);
      // detect reverse (reverse zone or a rift currently rolling "reverse") so the
      // bot presses the key that actually moves it right.
      const pr = { x: e.player.x, y: e.player.y, w: e.player.w, h: e.player.h };
      const overlaps = (z: { x: number; y: number; w: number; h: number }) =>
        pr.x < (z.x + z.w) * TILE && pr.x + pr.w > z.x * TILE && pr.y < (z.y + z.h) * TILE && pr.y + pr.h > z.y * TILE;
      let reversed = (lv.reverseZones ?? []).some(overlaps);
      for (const c of lv.chaosRifts ?? []) if (e.chaosRiftEffect[c.id] === "reverse" && overlaps(c)) reversed = true;
      let jump = false;
      if (e.player.onGround) {
        if (!isFootingAhead(e, lv)) jump = true;
        for (const m of lv.mimicEnemies ?? []) {
          const st = e.mimicState[m.id];
          if (st?.woken && st.x > e.player.x + TILE * 0.2 && st.x < e.player.x + TILE * 3) jump = true;
        }
        if (Math.abs(e.player.x - stuckX) < 2) { stuckT += dt; if (stuckT > 0.2) { jump = true; stuckT = 0; } }
        else { stuckX = e.player.x; stuckT = 0; }
        if (Math.random() < 0.03) jump = true;
      }
      const goRight = !reversed;
      // steer toward the next required (lowest-order unarmed) switch of any closed
      // gate so the bot can backtrack and solve ordered switch->gate puzzles.
      let targetX = e.player.x + TILE * 6;
      for (const g of lv.gates ?? []) {
        if (e.isGateOpen(g.id)) continue;
        const sws = (lv.switches ?? []).filter((s) => s.gateId === g.id && !e.switchState[s.id]);
        if (!sws.length) continue;
        sws.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        targetX = sws[0].x * TILE;
        break;
      }
      const wantRight = targetX > e.player.x ? goRight : !goRight;
      e.update(dt, { left: !wantRight, right: wantRight, jumpPressed: jump, jumpHeld: jump });
    }
  }
  const reachedEnd = maxX >= exitX - TILE * 2;
  log(solved || reachedEnd, `${lv.id} auto-bot ${solved ? "COMPLETED" : `reached x=${(maxX / TILE).toFixed(1)}/${lv.exit.x}`}  "${lv.name}"`);
}

console.log(`\n${failures === 0 ? "ALL PASS" : failures + " FAILURE(S)"} (${levels.length} levels)`);
process.exit(failures === 0 ? 0 : 1);

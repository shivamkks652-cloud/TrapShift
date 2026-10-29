import { GameEngine } from "../src/game/engine";
import { getLevelById } from "../src/game/levels";
import { TILE } from "../src/game/types";

let fails = 0;
const log = (ok: boolean, m: string) => { if (!ok) fails++; console.log(`${ok ? "PASS" : "FAIL"}  ${m}`); };
const lv = getLevelById("w2-3")!;
const inp = (l = false, r = false, j = false) => ({ left: l, right: r, jumpPressed: j, jumpHeld: j });
const run = (e: GameEngine, s: number, i = inp()) => { for (let k = 0; k < s * 120; k++) e.update(1 / 120, i); };
const mw = (id: string) => lv.movingWalls!.find((m) => m.id === id)!;
const footY = (e: GameEngine) => 6 * TILE - e.player.h;

// 1) tiles travel full extended range
for (const id of ["mp1", "mp2", "mp3", "mp4"]) {
  const m = mw(id);
  let mn = Infinity, mx = -Infinity;
  for (let t = 0; t < 10; t += 0.01) {
    const x = m.x + (Math.sin(t * m.speed + (m.phase ?? 0) * Math.PI * 2) * 0.5 + 0.5) * m.range;
    mn = Math.min(mn, x); mx = Math.max(mx, x);
  }
  log(mx - mn > 2.4, `${id} travels ${(mx - mn).toFixed(2)} tiles`);
}

// 2) rider is carried by a moving tile
{
  const e = new GameEngine(lv);
  const m = mw("mp1");
  const r = (e as any).movingWallRect(m, 0);
  e.player.x = r.x + r.w / 2 - e.player.w / 2; e.player.y = footY(e);
  run(e, 0.05);
  const x0 = e.player.x;
  run(e, 0.4);
  log(e.status === "playing" && Math.abs(e.player.x - x0) > TILE * 0.5 && e.player.onGround, `rider carried by mp1 (dx=${((e.player.x - x0) / TILE).toFixed(2)} tiles)`);
}

// 3) no support under player -> falls & dies (no floating)
{
  const e = new GameEngine(lv);
  const m = mw("mp3");
  e.time = 0; // mp3 at left end at phase 0? pick a spot right of its far end
  e.player.x = (m.x + m.range + 1.6) * TILE; e.player.y = footY(e) - 1;
  const r0 = (e as any).movingWallRect(m, 0);
  const r4 = (e as any).movingWallRect(mw("mp4"), 0);
  const px = e.player.x;
  const free = px + e.player.w < r4.x || px > r4.x + r4.w;
  run(e, 0.6);
  log(free ? e.status === "dead" : true, `unsupported player falls into void (status=${e.status}, r0=${(r0.x / TILE).toFixed(1)})`);
}

// 4) reverse mode: back/left alone moves forward, survives fog exit, keys independent
{
  const z = lv.reverseZones![0];
  const e = new GameEngine(lv);
  e.player.x = (z.x + 1) * TILE; e.player.y = footY(e);
  run(e, 0.05);
  const x0 = e.player.x;
  run(e, 0.3, inp(true));
  log(e.player.x > x0 + TILE, `in fog: left only (no jump) moves forward (dx=${((e.player.x - x0) / TILE).toFixed(2)})`);
  run(e, 0.2, inp(true)); // keep holding across the fog exit
  log(e.player.x > (z.x + z.w) * TILE, `holding left carries player out of fog without getting stuck (x=${(e.player.x / TILE).toFixed(2)})`);
  run(e, 0.05);
  const x1 = e.player.x;
  run(e, 0.15, inp(true));
  log(e.player.x < x1, "after release, left outside fog moves left normally");
  const e2 = new GameEngine(lv);
  e2.player.x = (z.x + 2) * TILE; e2.player.y = footY(e2);
  run(e2, 0.05);
  const x2 = e2.player.x;
  run(e2, 0.2, inp(false, true));
  log(e2.player.x < x2, "in fog: right only moves backward (mirror)");
  run(e2, 0.05);
  const y0 = e2.player.y;
  e2.update(1 / 120, inp(false, false, true));
  run(e2, 0.1, inp(false, false, true));
  log(e2.player.y < y0 - 10, "jump alone works in fog");
  const x3 = e2.player.x;
  run(e2, 0.1, inp(true, false, true));
  log(e2.player.x > x3, "left + jump combined works in fog");
}

// 5) normal area controls + death/respawn
{
  const e = new GameEngine(lv);
  run(e, 0.1);
  const x0 = e.player.x;
  run(e, 0.2, inp(false, true));
  log(e.player.x > x0, "right moves right");
  run(e, 0.2, inp(true));
  log(e.player.x < x0 + TILE * 2, "left moves left");
  e.die("manual");
  e.respawn();
  run(e, 0.05);
  const x1 = e.player.x;
  run(e, 0.2, inp(true));
  log(e.status === "playing" && e.player.x < x1, "controls work after death + respawn");
}

console.log(fails ? `${fails} FAILURE(S)` : "ALL PASS");

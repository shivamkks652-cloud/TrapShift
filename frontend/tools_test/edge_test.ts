import { GameEngine } from "../src/game/engine";
import { getLevelById } from "../src/game/levels";
import { TILE } from "../src/game/types";

const lv = getLevelById("w2-3")!;
const e = new GameEngine(lv);
const gapX = lv.rows[6].lastIndexOf("#..") + 1; // extension gap (no shuttles)
e.player.x = gapX * TILE - e.player.w * 0.25; // only 25% of feet on the tile
e.player.y = 5 * TILE + (TILE - e.player.h);
const idle = { left: false, right: false, jumpPressed: false, jumpHeld: false };
let left = false;
for (let i = 0; i < 90; i++) {
  e.update(1 / 60, idle);
  if (e.player.x > gapX * TILE) left = true;
}
console.log(left ? "PASS edge-slip pushes player off the corner" : "FAIL player stayed on corner", e.player.x / TILE, e.status);

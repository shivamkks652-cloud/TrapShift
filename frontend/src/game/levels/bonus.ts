import type { LevelDef, PatrolDrone, MimicEnemy, MovingWall, LaserGate, SteamVent, ReverseZone, ExplodingPlatform, Checkpoint, Shard, FreezeZone } from "../types";

// Bonus levels (har world ke end me +2) — chhote "segments" jod ke banaye. Ground row = 6.
// F floor · G gap · SH shuttle gap · L laser · V vent · R reverse fog (safe tiles dono taraf)
// X collapsing bridge · Z freeze + laser · C checkpoint floor
type Seg =
  | ["F" | "G" | "C" | "R" | "X" | "D" | "M", number]
  | ["SH", number, number]
  | ["L" | "V" | "Z", number, number];

function build(id: string, world: number, index: number, name: string, ruleTaught: string, segs: Seg[], parTime: number): LevelDef {
  let ground = "######"; // start floor
  const movingWalls: MovingWall[] = [], laserGates: LaserGate[] = [], steamVents: SteamVent[] = [];
  const reverseZones: ReverseZone[] = [], explodingPlatforms: ExplodingPlatform[] = [], freezeZones: FreezeZone[] = [];
  const checkpoints: Checkpoint[] = [], shards: Shard[] = [];
  const patrolDrones: PatrolDrone[] = [], mimicEnemies: MimicEnemy[] = [];
  let n = 0;
  for (const s of segs) {
    const x = ground.length;
    const k = `${id}-${n++}`;
    switch (s[0]) {
      case "F": ground += "#".repeat(s[1]); break;
      case "G": ground += ".".repeat(s[1]); shards.push({ id: k, x: x + Math.floor(s[1] / 2), y: 4 }); break;
      case "C": ground += "#".repeat(s[1]); checkpoints.push({ id: k, x: x + 1, y: 5 }); break;
      case "SH":
        ground += ".".repeat(s[1]);
        movingWalls.push({ id: k, x, y: 6, w: 1.5, h: 0.5, axis: "x", range: s[1] - 1.5, speed: s[2], phase: 0 });
        break;
      case "L":
        ground += "#".repeat(5);
        laserGates.push({ id: k, x: x + 2, y: 3, h: 3, axis: "vertical", onTime: s[1], offTime: s[2] });
        break;
      case "V":
        ground += "#".repeat(5);
        steamVents.push({ id: k, x: x + 2, y: 6, h: 3, warnTime: 0.6, activeTime: s[1], cooldownTime: s[2] });
        break;
      case "Z":
        ground += "#".repeat(6);
        freezeZones.push({ x: x + 1, y: 2, w: 2, h: 4 });
        laserGates.push({ id: k, x: x + 3, y: 3, h: 3, axis: "vertical", onTime: s[1], offTime: s[2] });
        break;
      case "R":
        ground += "#".repeat(s[1] + 4);
        reverseZones.push({ x: x + 2, y: 0, w: s[1], h: 7 });
        shards.push({ id: k, x: x + 2 + Math.floor(s[1] / 2), y: 5 });
        break;
      case "D": // flying drone sweeping over a floor stretch (don't jump into it)
        ground += "#".repeat(s[1]);
        patrolDrones.push({ id: k, x, y: 3, range: s[1] - 1, speed: n % 2 ? 1.3 : 2.1, phase: (n % 4) / 4 }); // slow/fast variants
        break;
      case "M": // chasing robot that lunges when you get close
        ground += "#".repeat(s[1]);
        mimicEnemies.push({ id: k, x: x + s[1] - 2, y: 5, triggerRadius: 3, lungeSpeed: 230 });
        break;
      case "X":
        ground += ".".repeat(s[1]);
        for (let i = 0; i + 2 <= s[1]; i += 2) explodingPlatforms.push({ id: `${k}-${i}`, x: x + i, y: 6, w: 2, delay: 0.6, respawn: 2.5 });
        break;
    }
  }
  ground += "######";
  const empty = ".".repeat(ground.length);
  return {
    id, world, index, name, ruleTaught,
    rows: [empty, empty, empty, empty, empty, empty, ground],
    playerStart: { x: 2, y: 5 },
    exit: { x: ground.length - 2, y: 5 },
    checkpoints, shards: shards.slice(0, 3), movingWalls, laserGates, steamVents, reverseZones, explodingPlatforms, freezeZones, patrolDrones, mimicEnemies,
    parTime,
  };
}

export const bonusLevels: Record<number, LevelDef[]> = {
  1: [
    build("w1-7", 1, 7, "Long Haul", "A longer run — keep your rhythm over every gap.", [["G", 2], ["F", 4], ["G", 3], ["C", 4], ["SH", 4, 1.2], ["F", 4], ["G", 3], ["F", 3]], 24),
    build("w1-8", 1, 8, "Beam Walk", "Shuttles and a beam — wait, ride, then dash.", [["SH", 4, 1.1], ["F", 3], ["L", 1.0, 1.6], ["C", 4], ["G", 3], ["SH", 5, 1.3], ["F", 3]], 26),
  ],
  2: [
    build("w2-8", 2, 8, "Mirror Shuttle", "Ride the shuttle into the fog — hold your key through it.", [["SH", 4, 1.3], ["R", 3], ["C", 4], ["L", 1.0, 1.4], ["SH", 5, 1.5], ["F", 3]], 28),
    build("w2-9", 2, 9, "Collapse Mirror", "Falling slabs, then mirror fog — never stop.", [["X", 4], ["F", 3], ["R", 4], ["C", 4], ["SH", 5, 1.6], ["L", 0.9, 1.3], ["G", 3], ["F", 3]], 32),
  ],
  3: [
    build("w3-7", 3, 7, "Frozen Relay", "Freeze the beam, then ride the shuttle.", [["Z", 1.2, 1.2], ["SH", 4, 1.4], ["C", 4], ["X", 4], ["F", 3], ["G", 3], ["F", 3]], 28),
    build("w3-8", 3, 8, "Cold Mirror", "Fog, freeze and falling slabs — one clean line.", [["R", 3], ["G", 3], ["C", 4], ["Z", 1.2, 1.1], ["X", 6], ["F", 3], ["SH", 5, 1.6], ["F", 3]], 32),
  ],
  4: [
    build("w4-7", 4, 7, "Double Beat", "Two beams on different beats — then the long shuttle.", [["L", 1.0, 1.4], ["F", 2], ["L", 1.2, 1.2], ["C", 4], ["SH", 6, 1.4], ["G", 3], ["F", 3]], 30),
    build("w4-8", 4, 8, "Orbit Lane", "Mirror fog between beams — think before each step.", [["G", 3], ["L", 1.0, 1.3], ["R", 4], ["C", 4], ["SH", 5, 1.7], ["L", 0.9, 1.3], ["F", 3]], 32),
  ],
  5: [
    build("w5-7", 5, 7, "Steam Ferry", "A jet before every shuttle — wait out the hiss.", [["V", 0.8, 1.4], ["SH", 5, 1.4], ["C", 4], ["V", 0.9, 1.2], ["G", 3], ["SH", 5, 1.6], ["F", 3]], 32),
    build("w5-8", 5, 8, "Pressure Mirror", "Jets, fog and a beam — three rhythms, one run.", [["V", 0.8, 1.3], ["R", 3], ["C", 4], ["L", 1.0, 1.3], ["X", 4], ["V", 0.9, 1.2], ["F", 3]], 34),
  ],
  6: [
    build("w6-7", 6, 7, "Firewall Ferry", "Beam, jet and shuttle — the corridor never rests.", [["L", 1.0, 1.3], ["V", 0.8, 1.3], ["C", 4], ["SH", 6, 1.6], ["X", 4], ["F", 3]], 34),
    build("w6-8", 6, 8, "Kernel Panic", "Every trick in the grid, back to back.", [["Z", 1.1, 1.1], ["R", 4], ["C", 4], ["V", 0.9, 1.2], ["SH", 6, 1.7], ["L", 0.9, 1.2], ["G", 3], ["F", 3]], 36),
  ],
  7: [
    build("w7-7", 7, 7, "Rift Runner", "Fast shuttles and mirror fog — adapt without stopping.", [["SH", 5, 1.8], ["R", 4], ["C", 4], ["V", 0.9, 1.1], ["L", 0.9, 1.2], ["X", 6], ["F", 3]], 36),
    build("w7-8", 7, 8, "Final Shift", "The last run — every mechanic, highest pace.", [["L", 0.9, 1.2], ["SH", 6, 1.9], ["C", 4], ["R", 4], ["Z", 1.1, 1.0], ["V", 0.9, 1.1], ["C", 4], ["X", 6], ["SH", 6, 2.0], ["F", 3]], 42),
  ],
};

// ---- Procedural mix: har level me kuch aasaan aur kuch achanak mushkil segments ----
function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h >>> 0) % 10000) / 10000;
  };
}
const segW = (s: Seg) => (s[0] === "L" || s[0] === "V" ? 5 : s[0] === "Z" ? 6 : s[0] === "R" ? (s[1] as number) + 4 : (s[1] as number));

export function mixedSegs(seed: string, world: number, minTiles: number): Seg[] {
  const r = rng(seed);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const easy: Seg[] = [["F", 3], ["G", 2], ["G", 3], ["SH", 4, 1.1], ["F", 4], ["X", 2], ["D", 5], ["D", 6], ["M", 5]];
  const hard: Seg[] = [["SH", 5, 1.25 + world * 0.04], ["L", 0.9, 1.3], ["V", 0.9, 1.2], ["R", 4], ["X", 6], ["Z", 1.1, 1.1], ["SH", 4, 1.7], ["M", 6], ["D", 7], ["M", 5], ["D", 8]];
  const out: Seg[] = [["D", 5], ["F", 2]]; // har stretch me kam se kam ek drone
  let w = 7;
  while (w < minTiles) {
    const s = out.length % 6 === 4 ? (["C", 4] as Seg) : r() < 0.3 + world * 0.05 ? pick(hard) : pick(easy);
    out.push(s, ["F", 2]);
    w += segW(s) + 2;
  }
  return out;
}

const shiftX = <T extends { x: number }>(a: T[] | undefined, dx: number) => (a ?? []).map((o) => ({ ...o, x: o.x + dx }));

// Level ke end me (exit se pehle) utna hi lamba naya mixed stretch jodta hai → ~2× length.
export function extendWithMix(level: LevelDef): LevelDef {
  const gi = level.rows.length - 1;
  const bx = level.rows[gi].length;
  const segs = mixedSegs(level.id, level.world, Math.max(24, bx - 4));
  const part = build(`${level.id}-m`, level.world, 0, "", "", segs, 0);
  const pg = part.rows[6];
  const rows = level.rows.map((row, i) => row + (i === gi ? pg : ".".repeat(pg.length)));
  const dy = gi - 6; // align part ground row to level ground row
  const shiftY = <T extends { y: number }>(a: T[]) => a.map((o) => ({ ...o, y: o.y + dy }));
  return {
    ...level,
    rows,
    exit: { x: bx + part.exit.x, y: part.exit.y + dy },
    checkpoints: [...(level.checkpoints ?? []), ...shiftY(shiftX(part.checkpoints, bx))],
    shards: [...(level.shards ?? []), ...shiftY(shiftX(part.shards, bx))],
    movingWalls: [...(level.movingWalls ?? []), ...shiftY(shiftX(part.movingWalls, bx))],
    laserGates: [...(level.laserGates ?? []), ...shiftY(shiftX(part.laserGates, bx))],
    steamVents: [...(level.steamVents ?? []), ...shiftY(shiftX(part.steamVents, bx))],
    reverseZones: [...(level.reverseZones ?? []), ...shiftY(shiftX(part.reverseZones, bx))],
    explodingPlatforms: [...(level.explodingPlatforms ?? []), ...shiftY(shiftX(part.explodingPlatforms, bx))],
    freezeZones: [...(level.freezeZones ?? []), ...shiftY(shiftX(part.freezeZones, bx))],
    patrolDrones: [...(level.patrolDrones ?? []), ...shiftY(shiftX(part.patrolDrones, bx))],
    mimicEnemies: [...(level.mimicEnemies ?? []), ...shiftY(shiftX(part.mimicEnemies, bx))],
    parTime: level.parTime + Math.round(pg.length * 0.3),
  };
}

const EXTRA_NAMES: Record<number, [string, string][]> = {
  1: [["Foundry Sprint", "Mixed run — easy hops, then a surprise."], ["Forge Finale", "The foundry's last test — stay sharp."]],
  2: [["Voltgrid Marathon", "Long grid run — anything can show up next."]],
  3: [["Glacier Run", "Ice, fog and slabs in a random order."], ["Frostbite", "The cold gets meaner the further you go."]],
  4: [["Event Horizon", "Beams and fog with no warning."], ["Singularity", "The core's final pull."]],
  5: [["Magma Mile", "Jets hide between easy steps."], ["Reactor Core", "Every jet at full pressure."]],
  6: [["Packet Storm", "The grid throws random traps."], ["Root Access", "Break through the final firewall."]],
  7: [["Rift Storm", "Chaos everywhere — read fast."], ["TrapShift", "The ultimate shift."]],
};
for (const [w, names] of Object.entries(EXTRA_NAMES)) {
  const world = Number(w);
  const list = bonusLevels[world];
  names.forEach(([name, rule], i) => {
    const index = (world === 2 ? 9 : 8) + i + 1;
    const id = `w${world}-${index}`;
    list.push(build(id, world, index, name, rule, mixedSegs(id, world, 40 + world * 4), 30 + world * 3));
  });
}

// Levels 11-25 har world me: seeded mix, har level alag aur thoda mushkil.
const THEME: Record<number, string> = { 1: "Foundry", 2: "Voltgrid", 3: "Cryo", 4: "Orbit", 5: "Magma", 6: "Firewall", 7: "Rift" };
const SUFFIX = ["Drift", "Circuit", "Gauntlet", "Overdrive", "Labyrinth", "Pulse", "Vortex", "Breach", "Cascade", "Inferno", "Echo", "Rampage", "Zenith", "Apex", "Omega"];
const RULES = ["Drones above, gaps below — read both.", "A chaser waits somewhere ahead.", "Easy steps hide a sudden spike in danger.", "Faster shuttles, fewer safe tiles.", "Every section is a new surprise."];
for (let world = 1; world <= 7; world++) {
  SUFFIX.forEach((suf, i) => {
    const index = 11 + i;
    const id = `w${world}-${index}`;
    bonusLevels[world].push(build(id, world, index, `${THEME[world]} ${suf}`, RULES[i % RULES.length], mixedSegs(id, world, 48 + i * 3 + world * 3), 36 + i + world * 3));
  });
}

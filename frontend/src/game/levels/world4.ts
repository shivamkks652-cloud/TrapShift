import type { LevelDef } from "../types";

// World 4 — Singularity Core: gravity flips, rotating arms, decoy exits and dense
// combos. Longer corridors, fewer checkpoints, more to read at once. Every level
// has a real (if punishing) route; the difficulty is precision + planning, not luck.
// Grid legend: '#' solid, '.' empty (fall = death), 'S' spike, '~' fake platform.
// Every row is 30 columns wide; ground band is row 6 (playerStart y:5).

export const world4: LevelDef[] = [
  // L20 — ROTATING ARM + gaps + a timed beam. Read the orbit, hop the pits, thread the laser.
  {
    id: "w4-1",
    world: 4,
    index: 1,
    name: "Spin Cycle",
    ruleTaught: "A rotating arm orbits its pivot — read it, and mind the gaps.",
    rows: [
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "########...####...####...#####",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 27, y: 5 },
    rotatingPlatforms: [{ id: "r1", cx: 13, cy: 3, radius: 3, speed: 1.2, armLen: 3 }],
    laserGates: [{ id: "l1", x: 20, y: 1, h: 5, axis: "vertical", onTime: 0.9, offTime: 1.0 }],
    checkpoints: [{ id: "c1", x: 11, y: 5 }],
    shards: [{ id: "s1", x: 13, y: 1 }],
    parTime: 22,
  },

  // L21 — GRAVITY FLIP: the floor drops away; a field flips you onto the ceiling to
  // cross, then drops you back. Plus a decoy exit before the real one.
  {
    id: "w4-2",
    world: 4,
    index: 2,
    name: "Flip Side",
    ruleTaught: "The violet field flips gravity — walk the ceiling across the void.",
    twist: "The first glowing flag is a decoy. Keep going.",
    rows: [
      "..........##########..........",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "##########........############",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 28, y: 5 },
    gravityZones: [{ x: 10, y: 0, w: 8, h: 7 }],
    fakeExits: [{ id: "fx1", x: 22, y: 5 }],
    checkpoints: [{ id: "c1", x: 6, y: 5 }],
    shards: [{ id: "s1", x: 14, y: 1 }],
    parTime: 24,
  },

  // L22 — DENSE READ: three pits, two offset beams, and a mimic guarding the run-out.
  {
    id: "w4-3",
    world: 4,
    index: 3,
    name: "Everything At Once",
    ruleTaught: "Two beams on different beats over three gaps — plan the whole line.",
    rows: [
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "######...####...####...#######",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 28, y: 5 },
    laserGates: [
      { id: "l1", x: 10, y: 1, h: 5, axis: "vertical", onTime: 0.9, offTime: 1.1, phase: 0 },
      { id: "l2", x: 17, y: 1, h: 5, axis: "vertical", onTime: 0.9, offTime: 1.1, phase: 0.5 },
    ],
    mimicEnemies: [{ id: "m1", x: 25, y: 5, triggerRadius: 3, lungeSpeed: 260 }],
    checkpoints: [{ id: "c1", x: 9, y: 5 }],
    shards: [{ id: "s1", x: 18, y: 5 }],
    parTime: 26,
  },

  // L23 — MISDIRECTION: a decoy flag on the middle island; the real exit is guarded
  // by a mimic behind a beam. No checkpoint — commit.
  {
    id: "w4-4",
    world: 4,
    index: 4,
    name: "Trust No Exit",
    ruleTaught: "Two flags glow. Only one is real — and it's the guarded one.",
    twist: "No checkpoint here. One clean run.",
    rows: [
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "########...####...############",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 27, y: 5 },
    fakeExits: [{ id: "fx1", x: 13, y: 5 }],
    laserGates: [{ id: "l1", x: 21, y: 1, h: 5, axis: "vertical", onTime: 0.9, offTime: 1.0 }],
    mimicEnemies: [{ id: "m1", x: 24, y: 5, triggerRadius: 3, lungeSpeed: 270 }],
    shards: [{ id: "s1", x: 12, y: 3 }],
    parTime: 20,
  },

  // L24 — GRAVITY + BEAM: flip onto the ceiling to cross the void, drop back, then
  // thread a fast beam to the flag.
  {
    id: "w4-5",
    world: 4,
    index: 5,
    name: "Dark Orbit",
    ruleTaught: "Flip across the void, land, then time the beam — in sequence.",
    rows: [
      "............########..........",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "############......############",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 28, y: 5 },
    gravityZones: [{ x: 12, y: 0, w: 6, h: 7 }],
    laserGates: [{ id: "l1", x: 23, y: 1, h: 5, axis: "vertical", onTime: 0.8, offTime: 1.0 }],
    checkpoints: [{ id: "c1", x: 8, y: 5 }],
    shards: [{ id: "s1", x: 15, y: 1 }],
    parTime: 26,
  },

  // L25 — FINALE: gravity flip, a mirror-fog stretch, a beam, a decoy flag, and a
  // mimic on the last stretch. One checkpoint after the flip; the rest is a gauntlet.
  {
    id: "w4-6",
    world: 4,
    index: 6,
    name: "Core Breach",
    ruleTaught: "Flip, mirror-fog, beam, mimic — everything Singularity Core taught.",
    twist: "The checkpoint is your only mercy. Read the whole run first.",
    rows: [
      "......##########..............",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "######........######...#######",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 29, y: 5 },
    gravityZones: [{ x: 6, y: 0, w: 8, h: 7 }],
    reverseZones: [{ x: 16, y: 0, w: 4, h: 7 }],
    laserGates: [{ id: "l1", x: 25, y: 1, h: 5, axis: "vertical", onTime: 0.9, offTime: 1.0 }],
    fakeExits: [{ id: "fx1", x: 18, y: 5 }],
    mimicEnemies: [{ id: "m1", x: 27, y: 5, triggerRadius: 3, lungeSpeed: 280 }],
    checkpoints: [{ id: "c1", x: 14, y: 5 }],
    shards: [{ id: "s1", x: 10, y: 1 }, { id: "s2", x: 22, y: 5 }],
    parTime: 32,
  },
];

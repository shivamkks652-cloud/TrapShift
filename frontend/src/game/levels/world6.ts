import type { LevelDef } from "../types";

// World 6 — Cyber Core: firewall sweeps (a lethal band that charges at rest, then
// travels across the corridor) layered over gaps, a spinning arm, a mimic and a
// synced beam. Time your run to be BEHIND the wall, never in front of it.
// Grid legend: '#' solid, '.' empty (fall = death), 'S' spike, '~' fake platform.
// Every row is 30 columns wide; ground band is row 6 (playerStart y:5).

export const world6: LevelDef[] = [
  // L32 — INIT: one charging-then-sweeping wall on a flat corridor.
  {
    id: "w6-1",
    world: 6,
    index: 1,
    name: "Firewall Init",
    ruleTaught: "The wall glows while charging, then sweeps — cross while it rests.",
    rows: [
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "##############################",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 28, y: 5 },
    firewallSweeps: [{ id: "f1", startX: 12, endX: 15, y: 2, h: 4, chargeTime: 1.2, sweepTime: 0.6 }],
    checkpoints: [{ id: "c1", x: 9, y: 5 }],
    shards: [{ id: "s1", x: 20, y: 5 }],
    parTime: 14,
  },

  // L33 — CROSS SWEEP: a long-travel wall over a gap — be behind it, then jump.
  {
    id: "w6-2",
    world: 6,
    index: 2,
    name: "Cross Sweep",
    ruleTaught: "This one travels far — get behind it, then clear the gap.",
    rows: [
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "#############...##############",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 28, y: 5 },
    firewallSweeps: [{ id: "f1", startX: 6, endX: 20, y: 2, h: 4, chargeTime: 1.0, sweepTime: 1.6 }],
    checkpoints: [{ id: "c1", x: 10, y: 5 }],
    shards: [{ id: "s1", x: 22, y: 5 }],
    parTime: 16,
  },

  // L34 — GRID & BLADE: a sweeping wall, a spinning arm and a gap.
  {
    id: "w6-3",
    world: 6,
    index: 3,
    name: "Grid & Blade",
    ruleTaught: "A sweeping wall over a spinning arm — pick your lane, then commit.",
    rows: [
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "########...###################",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 28, y: 5 },
    firewallSweeps: [{ id: "f1", startX: 9, endX: 17, y: 2, h: 4, chargeTime: 0.9, sweepTime: 1.2 }],
    rotatingPlatforms: [{ id: "r1", cx: 20, cy: 3, radius: 3, speed: 1.1, armLen: 2 }],
    checkpoints: [{ id: "c1", x: 11, y: 5 }],
    shards: [{ id: "s1", x: 25, y: 5 }],
    parTime: 18,
  },

  // L35 — DOUBLE SWEEP: two walls crossing opposite ways — find the shared clear beat.
  {
    id: "w6-4",
    world: 6,
    index: 4,
    name: "Double Sweep",
    ruleTaught: "Two walls, opposite directions — find the moment both are clear.",
    twist: "One checkpoint at the start. The whole corridor is one read.",
    rows: [
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "##############################",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 28, y: 5 },
    firewallSweeps: [
      { id: "f1", startX: 6, endX: 14, y: 2, h: 4, chargeTime: 1.4, sweepTime: 0.9, phase: 0 },
      { id: "f2", startX: 22, endX: 14, y: 2, h: 4, chargeTime: 1.4, sweepTime: 0.9, phase: 0.5 },
    ],
    checkpoints: [{ id: "c1", x: 4, y: 5 }],
    shards: [{ id: "s1", x: 17, y: 5 }],
    parTime: 20,
  },

  // L36 — ENCRYPTED CORRIDOR: a sweep through a mimic's turf, plus a gap.
  {
    id: "w6-5",
    world: 6,
    index: 5,
    name: "Encrypted Corridor",
    ruleTaught: "A sweep through a mimic's turf — don't let either surprise you.",
    twist: "Bait the mimic, clear the wall, then cross.",
    rows: [
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "##########...#################",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 28, y: 5 },
    firewallSweeps: [{ id: "f1", startX: 14, endX: 22, y: 2, h: 4, chargeTime: 1.0, sweepTime: 1.3 }],
    mimicEnemies: [{ id: "m1", x: 25, y: 5, triggerRadius: 3, lungeSpeed: 270 }],
    checkpoints: [{ id: "c1", x: 13, y: 5 }],
    shards: [{ id: "s1", x: 17, y: 5 }],
    parTime: 20,
  },

  // L37 — CORE LOCKDOWN FINALE: two sweeps, a synced beam, a spinning arm, gaps and
  // a mimic. No new tricks — just no room to breathe.
  {
    id: "w6-6",
    world: 6,
    index: 6,
    name: "Core Lockdown",
    ruleTaught: "Two sweeps, a synced beam, a spinning arm, gaps and a mimic.",
    twist: "Bank the checkpoint, read the whole room, then run it clean.",
    rows: [
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "######...##########...########",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 28, y: 5 },
    firewallSweeps: [
      { id: "f1", startX: 9, endX: 17, y: 2, h: 4, chargeTime: 1.3, sweepTime: 1.0, phase: 0 },
      { id: "f2", startX: 26, endX: 22, y: 2, h: 4, chargeTime: 1.3, sweepTime: 1.0, phase: 0.5 },
    ],
    laserGates: [{ id: "l1", x: 12, y: 1, h: 5, axis: "vertical", onTime: 1.0, offTime: 1.2 }],
    rotatingPlatforms: [{ id: "r1", cx: 15, cy: 3, radius: 2.5, speed: 1.2, armLen: 2 }],
    mimicEnemies: [{ id: "m1", x: 27, y: 5, triggerRadius: 2.5, lungeSpeed: 250 }],
    checkpoints: [{ id: "c1", x: 9, y: 5 }],
    shards: [{ id: "s1", x: 24, y: 5 }],
    parTime: 32,
  },
];

import type { LevelDef } from "../types";

// World 5 — Dark Reactor: telegraphed steam jets (hiss + glow, then a lethal
// vertical burst) layered over gaps, beams, spinning arms, a mimic and a dark
// stretch. Longer runs, tighter timing, fewer checkpoints.
// Grid legend: '#' solid, '.' empty (fall = death), 'S' spike, '~' fake platform.
// Every row is 30 columns wide; ground band is row 6 (playerStart y:5).

export const world5: LevelDef[] = [
  // L26 — HISS INTRO: one vent on a corridor with two gaps. Wait out the burst, cross.
  {
    id: "w5-1",
    world: 5,
    index: 1,
    name: "First Hiss",
    ruleTaught: "A hiss and glow mean a jet is coming — wait it out, then dash.",
    rows: [
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "########...###########...#####",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 28, y: 5 },
    steamVents: [{ id: "v1", x: 14, y: 6, h: 4, warnTime: 0.8, activeTime: 0.6, cooldownTime: 1.4 }],
    checkpoints: [{ id: "c1", x: 12, y: 5 }],
    shards: [{ id: "s1", x: 14, y: 2 }],
    parTime: 16,
  },

  // L27 — DOUBLE VENT: two jets on offset beats — slip through the moment one cools
  // and the other hasn't warned yet.
  {
    id: "w5-2",
    world: 5,
    index: 2,
    name: "Double Vent",
    ruleTaught: "Two jets, offset beats — read both before you step between them.",
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
    steamVents: [
      { id: "v1", x: 16, y: 6, h: 4, warnTime: 0.8, activeTime: 0.6, cooldownTime: 1.6, phase: 0 },
      { id: "v2", x: 20, y: 6, h: 4, warnTime: 0.8, activeTime: 0.6, cooldownTime: 1.6, phase: 0.5 },
    ],
    checkpoints: [{ id: "c1", x: 13, y: 5 }],
    shards: [{ id: "s1", x: 18, y: 2 }],
    parTime: 18,
  },

  // L28 — VENT & BLADE: a spinning arm, two gaps, a jet and a beam on the run-out.
  {
    id: "w5-3",
    world: 5,
    index: 3,
    name: "Vent & Blade",
    ruleTaught: "A jet under a spinning arm, then a beam — read three rhythms.",
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
    exit: { x: 28, y: 5 },
    rotatingPlatforms: [{ id: "r1", cx: 13, cy: 3, radius: 3, speed: 1.3, armLen: 2 }],
    steamVents: [{ id: "v1", x: 20, y: 6, h: 4, warnTime: 0.7, activeTime: 0.6, cooldownTime: 1.3 }],
    laserGates: [{ id: "l1", x: 24, y: 1, h: 5, axis: "vertical", onTime: 0.9, offTime: 1.0 }],
    checkpoints: [{ id: "c1", x: 11, y: 5 }],
    shards: [{ id: "s1", x: 13, y: 1 }],
    parTime: 22,
  },

  // L29 — THREE-VENT GAUNTLET: a stop-start rhythm down the whole corridor.
  {
    id: "w5-4",
    world: 5,
    index: 4,
    name: "Reactor Gauntlet",
    ruleTaught: "Three jets in a row force a stop-start rhythm — never over-commit.",
    rows: [
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "#########...##################",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 28, y: 5 },
    steamVents: [
      { id: "v1", x: 15, y: 6, h: 4, warnTime: 0.7, activeTime: 0.5, cooldownTime: 1.3, phase: 0 },
      { id: "v2", x: 19, y: 6, h: 4, warnTime: 0.7, activeTime: 0.5, cooldownTime: 1.3, phase: 0.33 },
      { id: "v3", x: 23, y: 6, h: 4, warnTime: 0.7, activeTime: 0.5, cooldownTime: 1.3, phase: 0.66 },
    ],
    checkpoints: [{ id: "c1", x: 13, y: 5 }],
    shards: [{ id: "s1", x: 17, y: 2 }, { id: "s2", x: 25, y: 5 }],
    parTime: 24,
  },

  // L30 — MOLTEN DARK: jets inside a dark memory-stretch — the glow telegraph cuts
  // through the dark just enough, but you still cross an unseen bridge.
  {
    id: "w5-5",
    world: 5,
    index: 5,
    name: "Molten Dark",
    ruleTaught: "Jets in the dark — the glow warns you, but the bridge stays unseen.",
    twist: "Stay on the hidden planks; the burst glow is your only light.",
    rows: [
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "######..............##########",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 28, y: 5 },
    darkZones: [
      {
        id: "d1",
        x: 5,
        y: 0,
        w: 16,
        h: 7,
        bridgeTiles: [
          { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 8, y: 6 }, { x: 9, y: 6 }, { x: 10, y: 6 },
          { x: 11, y: 6 }, { x: 12, y: 6 }, { x: 13, y: 6 }, { x: 14, y: 6 }, { x: 15, y: 6 },
          { x: 16, y: 6 }, { x: 17, y: 6 }, { x: 18, y: 6 }, { x: 19, y: 6 },
        ],
      },
    ],
    steamVents: [
      { id: "v1", x: 10, y: 6, h: 4, warnTime: 0.75, activeTime: 0.55, cooldownTime: 1.4, phase: 0 },
      { id: "v2", x: 15, y: 6, h: 4, warnTime: 0.75, activeTime: 0.55, cooldownTime: 1.4, phase: 0.5 },
    ],
    checkpoints: [{ id: "c1", x: 3, y: 5 }],
    shards: [{ id: "s1", x: 12, y: 3 }],
    parTime: 24,
  },

  // L31 — MELTDOWN FINALE: jets synced with a beam, a spinning arm, three gaps and a
  // mimic on the last band. No new tricks — pure precision.
  {
    id: "w5-6",
    world: 5,
    index: 6,
    name: "Reactor Meltdown",
    ruleTaught: "Jets, a synced beam, a spinning arm, gaps and a mimic — precision only.",
    twist: "The mimic waits on the final band. Bank the checkpoint, then commit.",
    rows: [
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "######...######...####...#####",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 28, y: 5 },
    steamVents: [
      { id: "v1", x: 11, y: 6, h: 4, warnTime: 0.7, activeTime: 0.5, cooldownTime: 1.3, phase: 0 },
      { id: "v2", x: 20, y: 6, h: 4, warnTime: 0.7, activeTime: 0.5, cooldownTime: 1.3, phase: 0.5 },
    ],
    laserGates: [{ id: "l1", x: 13, y: 1, h: 5, axis: "vertical", onTime: 1.0, offTime: 1.1 }],
    rotatingPlatforms: [{ id: "r1", cx: 19, cy: 3, radius: 2.5, speed: 1.2, armLen: 2 }],
    mimicEnemies: [{ id: "m1", x: 27, y: 5, triggerRadius: 3, lungeSpeed: 280 }],
    checkpoints: [{ id: "c1", x: 9, y: 5 }],
    shards: [{ id: "s1", x: 11, y: 1 }, { id: "s2", x: 26, y: 5 }],
    parTime: 30,
  },
];

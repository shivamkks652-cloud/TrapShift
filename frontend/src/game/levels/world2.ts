import type { LevelDef } from "../types";

// World 2 — Voltgrid City: moving traps, reverse-thinking and multi-step brain
// teasers, now longer and denser. Faster pistons, wider reverse fog, an ordered
// two-switch gate that forces a backtrack, and a longer collapse run.
// Grid legend: '#' solid, '.' empty (fall = death), 'S' spike, '~' fake platform.
// Every row is 30 columns wide; ground band is row 6 (playerStart y:5).

export const world2: LevelDef[] = [
  // L7 — MOVING TRAPS: four piston crushers drop on staggered, faster beats, then a gap.
  {
    id: "w2-1",
    world: 2,
    index: 1,
    name: "Piston Alley",
    ruleTaught: "Slam-gates drop on a rhythm — wait for the gap, then move.",
    twist: "Four pistons, four beats, and a gap at the end.",
    rows: [
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "##############...#############",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 28, y: 5 },
    movingWalls: [
      { id: "mw1", x: 6, y: 0, w: 1, h: 4, axis: "y", range: 3, speed: 1.9, phase: 0 },
      { id: "mw2", x: 9, y: 0, w: 1, h: 4, axis: "y", range: 3, speed: 1.9, phase: 0.3 },
      { id: "mw3", x: 12, y: 0, w: 1, h: 4, axis: "y", range: 3, speed: 1.9, phase: 0.6 },
      { id: "mw4", x: 21, y: 0, w: 1, h: 4, axis: "y", range: 3, speed: 1.7, phase: 0.15 },
    ],
    checkpoints: [{ id: "c1", x: 13, y: 5 }],
    shards: [{ id: "s1", x: 24, y: 5 }],
    parTime: 22,
  },

  // L8 — MOVING PLATFORM: a shuttle helps across a gap, then a piston on the far side.
  {
    id: "w2-2",
    world: 2,
    index: 2,
    name: "Swing Shift",
    ruleTaught: "A shuttle rides the gap — take it or leap it, then dodge the piston.",
    rows: [
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "############...###############",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 28, y: 5 },
    movingWalls: [
      { id: "mp1", x: 12, y: 5, w: 2, h: 1, axis: "x", range: 1, speed: 1.2 },
      { id: "mw2", x: 22, y: 0, w: 1, h: 4, axis: "y", range: 3, speed: 1.7, phase: 0 },
    ],
    checkpoints: [{ id: "c1", x: 9, y: 5 }],
    shards: [{ id: "s1", x: 13, y: 4 }],
    parTime: 20,
  },

  // L9 — REVERSE THINKING: wide pink fog flips your controls across two gaps.
  {
    id: "w2-3",
    world: 2,
    index: 3,
    name: "Backwards Alley",
    ruleTaught: "Pink fog reverses left/right — think in a mirror, and mind the gaps.",
    twist: "The pits are inside the fog. Commit to the mirror.",
    rows: [
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "##########...######...########",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 28, y: 5 },
    reverseZones: [{ x: 8, y: 0, w: 13, h: 7 }],
    checkpoints: [{ id: "c1", x: 5, y: 5 }],
    shards: [{ id: "s1", x: 16, y: 5 }],
    parTime: 22,
  },

  // L10 — ORDERED SWITCHES (BACKTRACK): arm the FAR switch first, backtrack to the
  // near one, then thread a beam to reach the powered-down gate. No mid checkpoint.
  {
    id: "w2-4",
    world: 2,
    index: 4,
    name: "Double Lock",
    ruleTaught: "Two switches, one gate — arm the far one first, then the near one.",
    twist: "The near switch stays locked until the far one is armed. Backtrack.",
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
    switches: [
      { id: "swA", x: 15, y: 5, gateId: "g1", order: 1 },
      { id: "swB", x: 6, y: 5, gateId: "g1", order: 2 },
    ],
    gates: [{ id: "g1", x: 22, y: 1, w: 1, h: 5 }],
    laserGates: [{ id: "l1", x: 19, y: 1, h: 5, axis: "vertical", onTime: 1.0, offTime: 1.1 }],
    checkpoints: [{ id: "c1", x: 3, y: 5 }],
    shards: [{ id: "s1", x: 26, y: 5 }],
    parTime: 28,
  },

  // L11 — COMBINATION: a tall beam, a gap, then a piston — solve them in sequence.
  {
    id: "w2-5",
    world: 2,
    index: 5,
    name: "Crossfire",
    ruleTaught: "Beam, gap, piston — read and solve them in order.",
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
    laserGates: [{ id: "l1", x: 8, y: 1, h: 6, axis: "vertical", onTime: 1.0, offTime: 1.2 }],
    movingWalls: [{ id: "mw1", x: 20, y: 0, w: 1, h: 4, axis: "y", range: 3, speed: 1.7 }],
    checkpoints: [{ id: "c1", x: 11, y: 5 }],
    shards: [{ id: "s1", x: 17, y: 5 }],
    parTime: 24,
  },

  // L12 — TRAP CHAIN: a long collapse run — the slabs fall the instant you land.
  {
    id: "w2-6",
    world: 2,
    index: 6,
    name: "Collapse Run",
    ruleTaught: "These slabs fall the instant you land — don't stop moving.",
    rows: [
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "#######..............#########",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 28, y: 5 },
    explodingPlatforms: [
      { id: "e1", x: 8, y: 6, w: 2, delay: 0.6, respawn: 2.5 },
      { id: "e2", x: 11, y: 6, w: 2, delay: 0.6, respawn: 2.5 },
      { id: "e3", x: 14, y: 6, w: 2, delay: 0.6, respawn: 2.5 },
      { id: "e4", x: 17, y: 6, w: 2, delay: 0.6, respawn: 2.5 },
    ],
    checkpoints: [{ id: "c1", x: 4, y: 5 }],
    shards: [{ id: "s1", x: 24, y: 5 }],
    parTime: 22,
  },

  // L13 — FINALE: a beam, a mirror-fog pit, then power the gate — everything at once.
  {
    id: "w2-7",
    world: 2,
    index: 7,
    name: "Voltgrid Gauntlet",
    ruleTaught: "Beam, mirror-fog over a pit, then power the gate — plan it all first.",
    twist: "Commit to the whole run before you step in.",
    rows: [
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "###########...################",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 28, y: 5 },
    laserGates: [{ id: "l1", x: 5, y: 1, h: 6, axis: "vertical", onTime: 1.0, offTime: 1.2 }],
    reverseZones: [{ x: 8, y: 0, w: 8, h: 7 }],
    switches: [{ id: "g7s", x: 18, y: 5, gateId: "g7" }],
    gates: [{ id: "g7", x: 24, y: 1, w: 1, h: 5 }],
    checkpoints: [{ id: "c1", x: 16, y: 5 }],
    shards: [{ id: "s1", x: 21, y: 5 }],
    parTime: 30,
  },
];

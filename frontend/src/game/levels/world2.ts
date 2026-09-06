import type { LevelDef } from "../types";

// World 2 — Voltgrid City: moving traps, reverse-thinking, and the first
// multi-step brain-teasers. Reuses the existing engine mechanics (moving walls,
// reverse zones, laser gates, exploding platforms) plus the ordered switch/gate.
// Grid legend: '#' solid, '.' empty (fall = death), 'S' spike, '~' fake platform.
// Ground band is row 6; player stands on it (playerStart y:5).

export const world2: LevelDef[] = [
  // L7 — MOVING TRAPS: piston walls drop into the corridor on staggered rhythms.
  {
    id: "w2-1",
    world: 2,
    index: 1,
    name: "Piston Alley",
    ruleTaught: "Slam-gates drop on a rhythm — wait for the gap, then move.",
    twist: "Three pistons, three different beats.",
    rows: [
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..P.......................",
      "##########################",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 24, y: 5 },
    movingWalls: [
      { id: "mw1", x: 8, y: 0, w: 1, h: 4, axis: "y", range: 3, speed: 1.5, phase: 0 },
      { id: "mw2", x: 13, y: 0, w: 1, h: 4, axis: "y", range: 3, speed: 1.5, phase: 0.34 },
      { id: "mw3", x: 18, y: 0, w: 1, h: 4, axis: "y", range: 3, speed: 1.5, phase: 0.68 },
    ],
    checkpoints: [{ id: "c1", x: 11, y: 5 }],
    shards: [{ id: "s1", x: 15, y: 5 }],
    parTime: 20,
  },

  // L8 — MOVING PLATFORM: a shuttle glides across the chasm. Ride it, or dare the leap.
  {
    id: "w2-2",
    world: 2,
    index: 2,
    name: "Swing Shift",
    ruleTaught: "A shuttle platform crosses the gap — ride it or leap it.",
    rows: [
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..P.......................",
      "########....##############",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 24, y: 5 },
    movingWalls: [{ id: "mp1", x: 8, y: 5, w: 3, h: 1, axis: "x", range: 2, speed: 1.2 }],
    checkpoints: [{ id: "c1", x: 13, y: 5 }],
    shards: [{ id: "s1", x: 9, y: 4 }],
    parTime: 18,
  },

  // L9 — REVERSE THINKING: the fog flips your controls; commit to the gap anyway.
  {
    id: "w2-3",
    world: 2,
    index: 3,
    name: "Backwards Alley",
    ruleTaught: "Pink fog reverses left/right — think in a mirror.",
    twist: "The pit is inside the fog. Jump toward it to go forward.",
    rows: [
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..P.......................",
      "###########...############",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 24, y: 5 },
    reverseZones: [{ x: 7, y: 0, w: 12, h: 7 }],
    checkpoints: [{ id: "c1", x: 5, y: 5 }],
    shards: [{ id: "s1", x: 16, y: 5 }],
    parTime: 18,
  },

  // L10 — MULTI-STEP / ORDERED SWITCHES: two switches, one gate. Arm them in the
  // RIGHT order (the far one first, then the near one) to power down the gate.
  {
    id: "w2-4",
    world: 2,
    index: 4,
    name: "Double Lock",
    ruleTaught: "Two switches, one gate — arm them in the right order.",
    twist: "The near switch stays locked until the far one is armed first.",
    rows: [
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..P.......................",
      "##########################",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 23, y: 5 },
    switches: [
      { id: "swA", x: 13, y: 5, gateId: "g1", order: 1 },
      { id: "swB", x: 6, y: 5, gateId: "g1", order: 2 },
    ],
    gates: [{ id: "g1", x: 18, y: 0, w: 1, h: 5 }],
    checkpoints: [{ id: "c1", x: 20, y: 5 }],
    shards: [{ id: "s1", x: 22, y: 5 }],
    parTime: 26,
  },

  // L11 — COMBINATION: laser rhythm, then a jump, then a piston. Read all three.
  {
    id: "w2-5",
    world: 2,
    index: 5,
    name: "Crossfire",
    ruleTaught: "Beam, gap, piston — solve them in sequence.",
    rows: [
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..P.......................",
      "#############...##########",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 24, y: 5 },
    laserGates: [{ id: "l1", x: 8, y: 1, h: 6, axis: "vertical", onTime: 1.0, offTime: 1.4 }],
    movingWalls: [{ id: "mw1", x: 19, y: 0, w: 1, h: 4, axis: "y", range: 3, speed: 1.6 }],
    checkpoints: [{ id: "c1", x: 11, y: 5 }],
    shards: [{ id: "s1", x: 17, y: 5 }],
    parTime: 22,
  },

  // L12 — TRAP CHAIN: the floor collapses behind you. Keep moving, never stop.
  {
    id: "w2-6",
    world: 2,
    index: 6,
    name: "Collapse Run",
    ruleTaught: "These slabs fall the instant you land — don't stop moving.",
    rows: [
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..P.......................",
      "#######............#######",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 24, y: 5 },
    explodingPlatforms: [
      { id: "e1", x: 8, y: 6, w: 2, delay: 0.7, respawn: 2.5 },
      { id: "e2", x: 11, y: 6, w: 2, delay: 0.7, respawn: 2.5 },
      { id: "e3", x: 14, y: 6, w: 2, delay: 0.7, respawn: 2.5 },
      { id: "e4", x: 17, y: 6, w: 2, delay: 0.7, respawn: 2.5 },
    ],
    checkpoints: [{ id: "c1", x: 20, y: 5 }],
    shards: [{ id: "s1", x: 5, y: 5 }],
    parTime: 20,
  },

  // L13 — ADVANCED COMBINATION: beam, reverse-fog pit, then a switch-gate finale.
  {
    id: "w2-7",
    world: 2,
    index: 7,
    name: "Voltgrid Gauntlet",
    ruleTaught: "Everything at once — beam, mirror-fog, then power the gate.",
    twist: "Plan the whole run before you commit.",
    rows: [
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..P.......................",
      "###########..#############",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 24, y: 5 },
    laserGates: [{ id: "l1", x: 5, y: 1, h: 6, axis: "vertical", onTime: 1.0, offTime: 1.4 }],
    reverseZones: [{ x: 8, y: 0, w: 7, h: 7 }],
    switches: [{ id: "g7s", x: 16, y: 5, gateId: "g7" }],
    gates: [{ id: "g7", x: 20, y: 0, w: 1, h: 5 }],
    checkpoints: [{ id: "c1", x: 15, y: 5 }],
    shards: [{ id: "s1", x: 18, y: 5 }],
    parTime: 28,
  },
];

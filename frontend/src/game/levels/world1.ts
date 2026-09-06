import type { LevelDef } from "../types";

// World 1 — Neon Foundry: a hand-tuned puzzle curriculum. Each level teaches ONE
// idea and asks the player to THINK, not just react.
// Grid legend: '#' solid, '.' empty (fall = death), 'S' spike, '~' fake platform
// (shimmers/dashed — looks solid but has no collision).

export const world1: LevelDef[] = [
  // ---------------------------------------------------------------------------
  // LEVEL 1 — LEARN: run + jump the gaps. Safe, generous, teaches movement.
  // ---------------------------------------------------------------------------
  {
    id: "w1-1",
    world: 1,
    index: 1,
    name: "First Steps",
    ruleTaught: "Run and jump across the gaps to reach the flag.",
    rows: [
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..P.......................",
      "####...####...####...#####",
      "####...####...####...#####",
    ],
    playerStart: { x: 2, y: 4 },
    exit: { x: 24, y: 4 },
    shards: [{ id: "s1", x: 8, y: 4 }, { id: "s2", x: 15, y: 4 }],
    parTime: 10,
  },

  // ---------------------------------------------------------------------------
  // LEVEL 2 — TIMING: two laser gates on offset rhythms. Read the beat, wait,
  // then dash through the gap. Ground is solid, so the whole challenge is timing.
  // ---------------------------------------------------------------------------
  {
    id: "w1-2",
    world: 1,
    index: 2,
    name: "Rhythm Gate",
    ruleTaught: "Wait for the beam to drop, then dash through.",
    twist: "The second gate beats to a different rhythm.",
    rows: [
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..P.......................",
      "##########################",
      "##########################",
    ],
    playerStart: { x: 2, y: 4 },
    exit: { x: 24, y: 4 },
    laserGates: [
      { id: "l1", x: 10, y: 1, h: 5, axis: "vertical", onTime: 1.0, offTime: 1.6, phase: 0 },
      { id: "l2", x: 16, y: 1, h: 5, axis: "vertical", onTime: 1.0, offTime: 1.6, phase: 0.55 },
    ],
    shards: [{ id: "s1", x: 13, y: 4 }],
    parTime: 14,
  },

  // ---------------------------------------------------------------------------
  // LEVEL 3 — FAKE SAFE TILE: real platforms and fake ones (shimmering, dashed)
  // look almost identical. Observe the tell; land only on the solid ones. Fall =
  // death, but a checkpoint mid-way keeps it fair.
  // ---------------------------------------------------------------------------
  {
    id: "w1-3",
    world: 1,
    index: 3,
    name: "Watch Your Step",
    ruleTaught: "Fake tiles shimmer and are hollow — observe before you leap.",
    twist: "If it flickers, it will NOT hold your weight.",
    rows: [
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..P.....C.................",
      "####~~~####~~~####~~~#####",
      "####...####...####...#####",
    ],
    playerStart: { x: 2, y: 4 },
    exit: { x: 24, y: 4 },
    checkpoints: [{ id: "c1", x: 8, y: 4 }],
    shards: [{ id: "s1", x: 15, y: 4 }],
    parTime: 20,
  },

  // ---------------------------------------------------------------------------
  // LEVEL 4 — CHOICE: two ways across the chasm. The LOW road is a safe chain of
  // stepping stones; the HIGH road is a single bold leap to a shortcut ledge that
  // also holds a shard. Pick your risk.
  // ---------------------------------------------------------------------------
  {
    id: "w1-4",
    world: 1,
    index: 4,
    name: "Two Roads",
    ruleTaught: "Grab the shard the bold way, or play it safe across the stones.",
    rows: [
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..P.......C.....$.........",
      "######...###...###...#####",
      "######...............#####",
    ],
    playerStart: { x: 2, y: 4 },
    exit: { x: 24, y: 4 },
    checkpoints: [{ id: "c1", x: 10, y: 4 }],
    shards: [{ id: "s1", x: 16, y: 3 }],
    parTime: 20,
  },

  // ---------------------------------------------------------------------------
  // LEVEL 5 — MEMORY: an unlit chasm. Invisible bridge tiles form the only safe
  // path — your torch reveals just a step ahead, so watch, remember, and keep
  // your nerve. A checkpoint sits at the midpoint.
  // ---------------------------------------------------------------------------
  {
    id: "w1-5",
    world: 1,
    index: 5,
    name: "Blind Bridge",
    ruleTaught: "The bridge is hidden in the dark — remember where it holds.",
    twist: "Your light only reaches the next step.",
    rows: [
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..P........C..............",
      "######..............######",
      "######..............######",
    ],
    playerStart: { x: 2, y: 4 },
    exit: { x: 24, y: 4 },
    darkZones: [
      {
        id: "dz1",
        x: 6,
        y: 0,
        w: 14,
        h: 7,
        bridgeTiles: [
          { x: 8, y: 5 }, { x: 9, y: 5 }, { x: 10, y: 5 },
          { x: 14, y: 5 }, { x: 15, y: 5 }, { x: 16, y: 5 },
        ],
      },
    ],
    checkpoints: [{ id: "c1", x: 9, y: 4 }],
    parTime: 22,
  },

  // ---------------------------------------------------------------------------
  // LEVEL 6 — SWITCH PUZZLE: a power gate blocks the exit. Stand on the switch to
  // power it down (cause -> effect), then clear the final gap to the flag.
  // ---------------------------------------------------------------------------
  {
    id: "w1-6",
    world: 1,
    index: 6,
    name: "The Lever",
    ruleTaught: "Stand on the switch to power down the gate blocking your path.",
    twist: "Cause and effect — the switch opens the way.",
    rows: [
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..P.........C.............",
      "###################..#####",
      "###################..#####",
    ],
    playerStart: { x: 2, y: 4 },
    exit: { x: 23, y: 4 },
    switches: [{ id: "sw1", x: 9, y: 4, gateId: "g1" }],
    gates: [{ id: "g1", x: 15, y: 0, w: 1, h: 5 }],
    checkpoints: [{ id: "c1", x: 12, y: 4 }],
    shards: [{ id: "s1", x: 22, y: 4 }],
    parTime: 18,
  },
];

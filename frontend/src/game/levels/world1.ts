import type { LevelDef } from "../types";

// World 1 — Neon Foundry: the teaching world, now with more bite. Level 1 stays a
// gentle movement tutorial; from there each level adds obstacles, faster rhythms
// and fewer safety nets while still teaching ONE clear idea.
// Grid legend: '#' solid, '.' empty (fall = death), 'S' spike, '~' fake platform
// (shimmers/dashed — looks solid but has no collision).
// Every row is 30 columns wide; ground band is row 6 (playerStart y:5).

export const world1: LevelDef[] = [
  // L1 — LEARN: run + jump two gaps. Safe, generous, teaches movement.
  {
    id: "w1-1",
    world: 1,
    index: 1,
    name: "First Steps",
    ruleTaught: "Run and jump across the gaps to reach the flag.",
    rows: [
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "########...########...########",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 28, y: 5 },
    shards: [{ id: "s1", x: 5, y: 5 }, { id: "s2", x: 15, y: 5 }],
    parTime: 12,
  },

  // L2 — TIMING: three laser gates on offset beats over solid ground. Read the
  // rhythm and thread all three — the beats are faster and closer than before.
  {
    id: "w1-2",
    world: 1,
    index: 2,
    name: "Rhythm Gate",
    ruleTaught: "Wait for each beam to drop, then dash — three beats, one line.",
    twist: "Each gate beats to its own rhythm.",
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
    laserGates: [
      { id: "l1", x: 9, y: 1, h: 5, axis: "vertical", onTime: 1.0, offTime: 1.1, phase: 0 },
      { id: "l2", x: 15, y: 1, h: 5, axis: "vertical", onTime: 1.0, offTime: 1.1, phase: 0.4 },
      { id: "l3", x: 21, y: 1, h: 5, axis: "vertical", onTime: 1.0, offTime: 1.1, phase: 0.75 },
    ],
    checkpoints: [{ id: "c1", x: 6, y: 5 }],
    shards: [{ id: "s1", x: 12, y: 4 }],
    parTime: 18,
  },

  // L3 — FAKE SAFE TILES: the floor looks continuous but every few tiles shimmer
  // and are hollow. Observe the tell and hop the fakes — four of them now.
  {
    id: "w1-3",
    world: 1,
    index: 3,
    name: "Watch Your Step",
    ruleTaught: "Shimmering tiles are hollow — observe, then hop over them.",
    twist: "If it flickers, it will NOT hold your weight.",
    rows: [
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "#####~~####~~####~~####~~#####",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 28, y: 5 },
    checkpoints: [{ id: "c1", x: 13, y: 5 }],
    shards: [{ id: "s1", x: 20, y: 4 }],
    parTime: 20,
  },

  // L4 — CHOICE: a long chain of stepping stones with a shard on a bold high hop.
  // More gaps, no mid-air mercy between them.
  {
    id: "w1-4",
    world: 1,
    index: 4,
    name: "Two Roads",
    ruleTaught: "Hop the stones — grab the shard the bold way, or skip it.",
    rows: [
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "######...###...###...###...###",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 28, y: 5 },
    checkpoints: [{ id: "c1", x: 10, y: 5 }],
    shards: [{ id: "s1", x: 16, y: 3 }],
    parTime: 20,
  },

  // L5 — MEMORY: a long unlit chasm. Invisible bridge planks form the only path,
  // with several missing gaps to remember. Your torch reveals just a step ahead.
  {
    id: "w1-5",
    world: 1,
    index: 5,
    name: "Blind Bridge",
    ruleTaught: "The bridge is hidden in the dark — remember where it holds.",
    twist: "Your light only reaches the next step.",
    rows: [
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "######..................######",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 28, y: 5 },
    darkZones: [
      {
        id: "dz1",
        x: 5,
        y: 0,
        w: 20,
        h: 7,
        bridgeTiles: [
          { x: 7, y: 6 }, { x: 8, y: 6 }, { x: 9, y: 6 },
          { x: 11, y: 6 }, { x: 12, y: 6 }, { x: 13, y: 6 },
          { x: 15, y: 6 }, { x: 16, y: 6 }, { x: 17, y: 6 },
          { x: 19, y: 6 }, { x: 20, y: 6 }, { x: 21, y: 6 },
        ],
      },
    ],
    checkpoints: [{ id: "c1", x: 3, y: 5 }],
    shards: [{ id: "s1", x: 16, y: 4 }],
    parTime: 24,
  },

  // L6 — SWITCH PUZZLE: power down the gate blocking the exit, but a live beam and
  // a gap sit between you and the flag.
  {
    id: "w1-6",
    world: 1,
    index: 6,
    name: "The Lever",
    ruleTaught: "Hit the switch to power down the gate — then clear the beam and gap.",
    twist: "Cause and effect — the switch opens the way.",
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
    switches: [{ id: "sw1", x: 8, y: 5, gateId: "g1" }],
    gates: [{ id: "g1", x: 20, y: 1, w: 1, h: 5 }],
    laserGates: [{ id: "l1", x: 16, y: 1, h: 5, axis: "vertical", onTime: 1.0, offTime: 1.1 }],
    checkpoints: [{ id: "c1", x: 13, y: 5 }],
    shards: [{ id: "s1", x: 24, y: 5 }],
    parTime: 22,
  },
];

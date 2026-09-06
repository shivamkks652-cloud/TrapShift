import type { LevelDef } from "../types";

// World 3 — The Undergate: the underground puzzle wing. Signature mechanics are
// FREEZE fields (halt hazards while you stand in them), DARK memory-bridges
// (invisible-but-solid tiles you must remember), CRUMBLING platforms (fall a beat
// after you land) and MIMICS (still crates that lunge). Each level teaches or
// combines one idea and asks the player to THINK, not just react.
// Grid legend: '#' solid, '.' empty (fall = death), 'S' spike, '~' fake platform.
// Every row is exactly 26 columns wide; ground band is row 6 (playerStart y:5).

export const world3: LevelDef[] = [
  // ---------------------------------------------------------------------------
  // L14 — FREEZE INTRO: a fast beam blocks the corridor. Step into the blue
  // field to FREEZE it — but it freezes in whatever state it's in, so enter
  // while the beam is OFF, then walk under it.
  // ---------------------------------------------------------------------------
  {
    id: "w3-1",
    world: 3,
    index: 1,
    name: "Cold Open",
    ruleTaught: "Blue fields freeze hazards while you stand in them.",
    twist: "The beam freezes as-is — step in only when it's dark.",
    rows: [
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "##########################",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 24, y: 5 },
    laserGates: [{ id: "l1", x: 13, y: 1, h: 5, axis: "vertical", onTime: 1.4, offTime: 0.5 }],
    freezeZones: [{ x: 11, y: 0, w: 4, h: 7 }],
    checkpoints: [{ id: "c1", x: 8, y: 5 }],
    shards: [{ id: "s1", x: 13, y: 5 }],
    parTime: 14,
  },

  // ---------------------------------------------------------------------------
  // L15 — MEMORY: an unlit pit. The only footing is an invisible bridge with two
  // missing planks — your torch shows just a step ahead, so watch, remember the
  // gaps, and hop them blind.
  // ---------------------------------------------------------------------------
  {
    id: "w3-2",
    world: 3,
    index: 2,
    name: "Blind Descent",
    ruleTaught: "In the dark, the bridge is solid but unseen — remember the gaps.",
    twist: "Two planks are missing. Hop where you can't see.",
    rows: [
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "######..............######",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 24, y: 5 },
    darkZones: [
      {
        id: "d1",
        x: 5,
        y: 0,
        w: 15,
        h: 7,
        bridgeTiles: [
          { x: 7, y: 6 }, { x: 8, y: 6 }, { x: 9, y: 6 }, { x: 10, y: 6 },
          { x: 12, y: 6 }, { x: 13, y: 6 }, { x: 14, y: 6 },
          { x: 16, y: 6 }, { x: 17, y: 6 }, { x: 18, y: 6 }, { x: 19, y: 6 },
        ],
      },
    ],
    checkpoints: [{ id: "c1", x: 3, y: 5 }],
    shards: [{ id: "s1", x: 13, y: 4 }],
    parTime: 20,
  },

  // ---------------------------------------------------------------------------
  // L16 — CRUMBLING CHAIN: stepping stones over a pit that collapse a beat after
  // you land. Never stop — read the next hop before you make the last one.
  // ---------------------------------------------------------------------------
  {
    id: "w3-3",
    world: 3,
    index: 3,
    name: "Don't Linger",
    ruleTaught: "These slabs fall the instant you land — keep moving.",
    rows: [
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "#####................#####",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 24, y: 5 },
    explodingPlatforms: [
      { id: "e1", x: 6, y: 6, w: 2, delay: 0.6, respawn: 2.5 },
      { id: "e2", x: 9, y: 6, w: 2, delay: 0.6, respawn: 2.5 },
      { id: "e3", x: 12, y: 6, w: 2, delay: 0.6, respawn: 2.5 },
      { id: "e4", x: 15, y: 6, w: 2, delay: 0.6, respawn: 2.5 },
      { id: "e5", x: 18, y: 6, w: 2, delay: 0.6, respawn: 2.5 },
    ],
    checkpoints: [{ id: "c1", x: 3, y: 5 }],
    shards: [{ id: "s1", x: 12, y: 4 }],
    parTime: 18,
  },

  // ---------------------------------------------------------------------------
  // L17 — MIMIC / OBSERVATION: two "crates" sit in the corridor. They wake and
  // lunge the moment you get close. Don't panic — a mimic only slides along the
  // floor, so jump over the lunge and outrun it (you're faster).
  // ---------------------------------------------------------------------------
  {
    id: "w3-4",
    world: 3,
    index: 4,
    name: "The Sleeper",
    ruleTaught: "Still crates lunge when you get close — jump over, then outrun.",
    twist: "A mimic hugs the floor. Leap it, don't fight it.",
    rows: [
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "##########################",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 24, y: 5 },
    mimicEnemies: [
      { id: "m1", x: 11, y: 5, triggerRadius: 3, lungeSpeed: 260 },
      { id: "m2", x: 18, y: 5, triggerRadius: 3, lungeSpeed: 275 },
    ],
    checkpoints: [{ id: "c1", x: 6, y: 5 }],
    shards: [{ id: "s1", x: 15, y: 3 }],
    parTime: 16,
  },

  // ---------------------------------------------------------------------------
  // L18 — COMBINATION: crumbling stones over a pit AND a beam across the middle.
  // A freeze field stops the beam but NOT the crumble — so freeze the beam and
  // keep hopping. Two problems, one window.
  // ---------------------------------------------------------------------------
  {
    id: "w3-5",
    world: 3,
    index: 5,
    name: "Deep Freeze",
    ruleTaught: "Freeze stops the beam — but the slabs still fall. Don't stop.",
    twist: "One field, two threats: solve the beam and the floor together.",
    rows: [
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "#####................#####",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 24, y: 5 },
    explodingPlatforms: [
      { id: "e1", x: 6, y: 6, w: 2, delay: 0.7, respawn: 2.5 },
      { id: "e2", x: 10, y: 6, w: 2, delay: 0.7, respawn: 2.5 },
      { id: "e3", x: 14, y: 6, w: 2, delay: 0.7, respawn: 2.5 },
      { id: "e4", x: 18, y: 6, w: 2, delay: 0.7, respawn: 2.5 },
    ],
    laserGates: [{ id: "l1", x: 12, y: 1, h: 5, axis: "vertical", onTime: 0.7, offTime: 0.9 }],
    freezeZones: [{ x: 9, y: 0, w: 6, h: 7 }],
    checkpoints: [{ id: "c1", x: 3, y: 5 }],
    shards: [{ id: "s1", x: 14, y: 4 }],
    parTime: 24,
  },

  // ---------------------------------------------------------------------------
  // L19 — FINALE / MULTI-STEP: cross a crumbling entry pit, bank the checkpoint,
  // hit the power switch — but a mimic guards the way to the gate it opens. Hit
  // the switch, leap the mimic, then walk through the powered-down gate.
  // ---------------------------------------------------------------------------
  {
    id: "w3-6",
    world: 3,
    index: 6,
    name: "The Undergate",
    ruleTaught: "Power the gate, then get past its guard to reach the flag.",
    twist: "The switch opens the gate — but wakes the mimic between you and it.",
    rows: [
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "..........................",
      "####..####################",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 24, y: 5 },
    switches: [{ id: "sw1", x: 14, y: 5, gateId: "g1" }],
    gates: [{ id: "g1", x: 20, y: 1, w: 1, h: 5 }],
    mimicEnemies: [{ id: "m1", x: 16, y: 5, triggerRadius: 3, lungeSpeed: 280 }],
    checkpoints: [{ id: "c1", x: 11, y: 5 }],
    shards: [{ id: "s1", x: 13, y: 4 }],
    parTime: 28,
  },
];

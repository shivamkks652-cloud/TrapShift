import type { LevelDef } from "../types";

// World 7 — Chaos Rift: the finale. A chaos rift is safe to touch but randomly
// rolls ONE of two effects per attempt — flip gravity, or reverse your controls —
// so no two runs play the same. Rifts always sit over SOLID ground (both effects
// are survivable there), combined with every hazard from Worlds 1-6.
// Grid legend: '#' solid, '.' empty (fall = death), 'S' spike, '~' fake platform.
// Every row is 30 columns wide; ground band is row 6 (playerStart y:5).

export const world7: LevelDef[] = [
  // L38 — INTRO: one rift over solid ground, then a gap. Adapt to whatever it rolls.
  {
    id: "w7-1",
    world: 7,
    index: 1,
    name: "Unstable Ground",
    ruleTaught: "A rift randomly flips gravity or reverses controls — adapt fast.",
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
    chaosRifts: [{ id: "c1", x: 8, y: 0, w: 6, h: 7 }],
    checkpoints: [{ id: "c1cp", x: 6, y: 5 }],
    shards: [{ id: "s1", x: 20, y: 5 }],
    parTime: 18,
  },

  // L39 — DOUBLE TEAR: two rifts, each rolling independently, with gaps between.
  {
    id: "w7-2",
    world: 7,
    index: 2,
    name: "Double Tear",
    ruleTaught: "Two rifts, each rolls its own effect — re-read after every one.",
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
    chaosRifts: [
      { id: "c1", x: 3, y: 0, w: 5, h: 7 },
      { id: "c2", x: 14, y: 0, w: 4, h: 7 },
    ],
    checkpoints: [{ id: "c2cp", x: 13, y: 5 }],
    shards: [{ id: "s1", x: 16, y: 5 }],
    parTime: 22,
  },

  // L40 — RIFT & VENT: a rift feeding into a steam jet — whatever it rolls changes
  // how you dodge the burst.
  {
    id: "w7-3",
    world: 7,
    index: 3,
    name: "Rift & Vent",
    ruleTaught: "A rift into a jet — the effect you get changes your dodge.",
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
    chaosRifts: [{ id: "c1", x: 4, y: 0, w: 5, h: 7 }],
    steamVents: [{ id: "v1", x: 20, y: 6, h: 4, warnTime: 0.75, activeTime: 0.55, cooldownTime: 1.4 }],
    checkpoints: [{ id: "c3cp", x: 10, y: 5 }],
    shards: [{ id: "s1", x: 24, y: 5 }],
    parTime: 22,
  },

  // L41 — FIREWALL CHAOS: a rift straight into a firewall sweep — the safe timing
  // doesn't move, but your controls might.
  {
    id: "w7-4",
    world: 7,
    index: 4,
    name: "Firewall Chaos",
    ruleTaught: "A rift into a sweep — the wall's beat is fixed, your controls aren't.",
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
    chaosRifts: [{ id: "c1", x: 5, y: 0, w: 5, h: 7 }],
    firewallSweeps: [{ id: "f1", startX: 14, endX: 22, y: 2, h: 4, chargeTime: 1.0, sweepTime: 1.3 }],
    checkpoints: [{ id: "c4cp", x: 11, y: 5 }],
    shards: [{ id: "s1", x: 26, y: 5 }],
    parTime: 24,
  },

  // L42 — FULL SPECTRUM: rift, spinning arm, beam, gaps and a mimic. Read the space,
  // not just the rift. No mid checkpoint after the beam.
  {
    id: "w7-5",
    world: 7,
    index: 5,
    name: "Full Spectrum",
    ruleTaught: "Rift, arm, beam, gaps and a mimic — read the space, not just the rift.",
    twist: "The mimic waits on the final band. One read, one run.",
    rows: [
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "##########...#########...#####",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 28, y: 5 },
    chaosRifts: [{ id: "c1", x: 4, y: 0, w: 5, h: 7 }],
    rotatingPlatforms: [{ id: "r1", cx: 15, cy: 3, radius: 3, speed: 1.3, armLen: 2 }],
    laserGates: [{ id: "l1", x: 18, y: 1, h: 5, axis: "vertical", onTime: 1.0, offTime: 1.2 }],
    mimicEnemies: [{ id: "m1", x: 27, y: 5, triggerRadius: 3, lungeSpeed: 280 }],
    checkpoints: [{ id: "c5cp", x: 13, y: 5 }],
    shards: [{ id: "s1", x: 8, y: 5 }],
    parTime: 28,
  },

  // L43 — THE LAST RIFT: three rifts in sequence (each re-rolled), a jet, a sweep, a
  // spinning arm and a beam over four gaps. The hardest run in the game.
  {
    id: "w7-6",
    world: 7,
    index: 6,
    name: "The Last Rift",
    ruleTaught: "Three rifts, a jet, a sweep, an arm and a beam over four gaps.",
    twist: "Each rift re-rolls — no two runs are the same. Read, adapt, finish.",
    rows: [
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "..............................",
      "######...######...######...###",
    ],
    playerStart: { x: 2, y: 5 },
    exit: { x: 28, y: 5 },
    chaosRifts: [
      { id: "c1", x: 9, y: 0, w: 6, h: 7 },
      { id: "c2", x: 18, y: 0, w: 6, h: 7 },
    ],
    steamVents: [{ id: "v1", x: 11, y: 6, h: 4, warnTime: 0.7, activeTime: 0.5, cooldownTime: 1.3 }],
    firewallSweeps: [{ id: "f1", startX: 18, endX: 23, y: 2, h: 4, chargeTime: 0.9, sweepTime: 1.0 }],
    rotatingPlatforms: [{ id: "r1", cx: 4, cy: 3, radius: 2.5, speed: 1.2, armLen: 2 }],
    laserGates: [{ id: "l1", x: 13, y: 1, h: 5, axis: "vertical", onTime: 1.0, offTime: 1.1 }],
    checkpoints: [{ id: "c6cp", x: 9, y: 5 }],
    shards: [{ id: "s1", x: 20, y: 1 }],
    parTime: 34,
  },
];

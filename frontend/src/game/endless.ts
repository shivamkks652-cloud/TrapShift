import type { LevelDef } from "./types";

// Deterministic pseudo-random generator so daily challenges are seeded and repeatable.
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEGMENT_WIDTH = 14;
const ROWS = 7;

type SegmentKind = "flat" | "gap" | "laser" | "movingWall" | "gravity" | "exploding";

function buildSegment(rand: () => number, index: number): { rows: string[][]; level: Partial<LevelDef> } {
  const kinds: SegmentKind[] = ["flat", "gap", "laser", "movingWall", "gravity", "exploding"];
  const kind = index < 2 ? "flat" : kinds[Math.floor(rand() * kinds.length)];
  const rows: string[][] = Array.from({ length: ROWS }, () => Array(SEGMENT_WIDTH).fill("."));
  for (let x = 0; x < SEGMENT_WIDTH; x++) rows[ROWS - 1][x] = "#";

  const extra: Partial<LevelDef> = {};
  if (kind === "gap") {
    const gapStart = 4 + Math.floor(rand() * 4);
    const gapLen = 2 + Math.floor(rand() * 2);
    for (let x = gapStart; x < gapStart + gapLen && x < SEGMENT_WIDTH; x++) rows[ROWS - 1][x] = ".";
  } else if (kind === "laser") {
    // handled via extra.laserGates by caller with offset
    (extra as any)._laserAt = 6 + Math.floor(rand() * 4);
  } else if (kind === "movingWall") {
    (extra as any)._wallAt = 6 + Math.floor(rand() * 4);
  } else if (kind === "gravity") {
    (extra as any)._gravityAt = 4 + Math.floor(rand() * 4);
  } else if (kind === "exploding") {
    const pStart = 5 + Math.floor(rand() * 3);
    for (let x = pStart; x < pStart + 3 && x < SEGMENT_WIDTH; x++) rows[ROWS - 1][x] = "~";
    (extra as any)._explodeAt = pStart;
  }
  return { rows, level: extra };
}

export function generateEndlessLevel(seed: number, segmentCount = 40): LevelDef {
  const rand = mulberry32(seed);
  const rows: string[][] = Array.from({ length: ROWS }, () => []);
  const laserGates: any[] = [];
  const movingWalls: any[] = [];
  const gravityZones: any[] = [];
  const explodingPlatforms: any[] = [];
  const shards: any[] = [];

  for (let i = 0; i < segmentCount; i++) {
    const { rows: segRows, level } = buildSegment(rand, i);
    const offset = i * SEGMENT_WIDTH;
    for (let r = 0; r < ROWS; r++) rows[r].push(...segRows[r]);

    const anyLevel = level as any;
    if (anyLevel._laserAt !== undefined) {
      laserGates.push({
        id: `laser-${i}`,
        x: offset + anyLevel._laserAt,
        y: 1,
        h: 6,
        axis: "vertical",
        onTime: 0.8 + rand() * 0.5,
        offTime: 0.8 + rand() * 0.6,
        phase: rand(),
      });
    }
    if (anyLevel._wallAt !== undefined) {
      movingWalls.push({
        id: `wall-${i}`,
        x: offset + anyLevel._wallAt,
        y: 1,
        w: 1,
        h: 5,
        axis: "y",
        range: 4,
        speed: 1 + rand() * 1.4,
        phase: rand(),
      });
    }
    if (anyLevel._gravityAt !== undefined) {
      gravityZones.push({ x: offset + anyLevel._gravityAt, y: 0, w: 4, h: ROWS });
    }
    if (anyLevel._explodeAt !== undefined) {
      explodingPlatforms.push({
        id: `exp-${i}`,
        x: offset + anyLevel._explodeAt,
        y: ROWS - 1,
        w: 3,
        delay: 0.45,
        respawn: 2,
      });
    }
    if (rand() > 0.5) {
      shards.push({ id: `shard-${i}`, x: offset + Math.floor(SEGMENT_WIDTH / 2), y: ROWS - 3 });
    }
  }

  const rowStrings = rows.map((r) => r.join(""));
  const totalWidth = segmentCount * SEGMENT_WIDTH;

  return {
    id: `endless-${seed}`,
    world: 1,
    index: 0,
    name: "Endless Survival",
    ruleTaught: "Survive as long as you can. Every run is different.",
    rows: rowStrings,
    playerStart: { x: 2, y: ROWS - 2 },
    exit: { x: totalWidth - 2, y: ROWS - 2 },
    laserGates,
    movingWalls,
    gravityZones,
    explodingPlatforms,
    shards,
    parTime: 999,
  };
}

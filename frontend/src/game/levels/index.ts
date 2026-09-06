import { world1 } from "./world1";
import { world2 } from "./world2";
import { world3 } from "./world3";
import { world4 } from "./world4";
import { world5 } from "./world5";
import { world6 } from "./world6";
import { world7 } from "./world7";
import type { LevelDef, WorldDef } from "../types";
import { WORLD_THEME } from "../constants";

// --- Safe-start runway + progressive length -------------------------------------
// Every level gets a guaranteed obstacle-free solid runway prepended to its LEFT so
// the player never spawns on/next to a hazard or a gap. The runway grows with world
// number, so later worlds are longer (more play duration as you progress).
// This shifts ALL x-coordinates right by `pad` and pads the ASCII grid.
const runwayFor = (world: number) => 4 + Math.max(0, world - 1); // W1=4 ... W7=10

function withRunway(level: LevelDef, pad: number): LevelDef {
  if (pad <= 0) return level;
  const groundRow = level.rows.length - 1;
  const rows = level.rows.map((r, i) => (i === groundRow ? "#".repeat(pad) : ".".repeat(pad)) + r);
  const sx = <T extends { x: number }>(o: T): T => ({ ...o, x: o.x + pad });
  const map = <T extends { x: number }>(arr?: T[]) => arr?.map(sx);

  return {
    ...level,
    rows,
    playerStart: { ...level.playerStart, x: level.playerStart.x + pad },
    exit: { ...level.exit, x: level.exit.x + pad },
    checkpoints: map(level.checkpoints),
    shards: map(level.shards),
    movingWalls: map(level.movingWalls),
    gravityZones: map(level.gravityZones),
    reverseZones: map(level.reverseZones),
    freezeZones: map(level.freezeZones),
    darkZones: level.darkZones?.map((d) => ({
      ...d,
      x: d.x + pad,
      bridgeTiles: d.bridgeTiles.map((b) => ({ ...b, x: b.x + pad })),
    })),
    laserGates: map(level.laserGates),
    portals: map(level.portals),
    explodingPlatforms: map(level.explodingPlatforms),
    rotatingPlatforms: level.rotatingPlatforms?.map((r) => ({ ...r, cx: r.cx + pad })),
    fakeCheckpoints: map(level.fakeCheckpoints),
    fakeExits: map(level.fakeExits),
    switches: map(level.switches),
    gates: map(level.gates),
    mimicEnemies: map(level.mimicEnemies),
    steamVents: map(level.steamVents),
    firewallSweeps: level.firewallSweeps?.map((f) => ({ ...f, startX: f.startX + pad, endX: f.endX + pad })),
    chaosRifts: map(level.chaosRifts),
    parTime: level.parTime + Math.round(pad * 0.4),
  };
}

const applyRunway = (levels: LevelDef[]) => levels.map((l) => withRunway(l, runwayFor(l.world)));

export const WORLDS: WorldDef[] = [
  { id: 1, name: WORLD_THEME[0].name, colorFrom: WORLD_THEME[0].from, colorTo: WORLD_THEME[0].to, accent: WORLD_THEME[0].accent, levels: applyRunway(world1) },
  { id: 2, name: WORLD_THEME[1].name, colorFrom: WORLD_THEME[1].from, colorTo: WORLD_THEME[1].to, accent: WORLD_THEME[1].accent, levels: applyRunway(world2) },
  { id: 3, name: WORLD_THEME[2].name, colorFrom: WORLD_THEME[2].from, colorTo: WORLD_THEME[2].to, accent: WORLD_THEME[2].accent, levels: applyRunway(world3) },
  { id: 4, name: WORLD_THEME[3].name, colorFrom: WORLD_THEME[3].from, colorTo: WORLD_THEME[3].to, accent: WORLD_THEME[3].accent, levels: applyRunway(world4) },
  { id: 5, name: WORLD_THEME[4].name, colorFrom: WORLD_THEME[4].from, colorTo: WORLD_THEME[4].to, accent: WORLD_THEME[4].accent, levels: applyRunway(world5) },
  { id: 6, name: WORLD_THEME[5].name, colorFrom: WORLD_THEME[5].from, colorTo: WORLD_THEME[5].to, accent: WORLD_THEME[5].accent, levels: applyRunway(world6) },
  { id: 7, name: WORLD_THEME[6].name, colorFrom: WORLD_THEME[6].from, colorTo: WORLD_THEME[6].to, accent: WORLD_THEME[6].accent, levels: applyRunway(world7) },
];

export const ALL_LEVELS: LevelDef[] = WORLDS.flatMap((w) => w.levels);
export const ALL_LEVEL_IDS = ALL_LEVELS.map((l) => l.id);

export function getLevelById(id: string): LevelDef | undefined {
  return ALL_LEVELS.find((l) => l.id === id);
}

export function getNextLevelId(id: string): string | null {
  const idx = ALL_LEVEL_IDS.indexOf(id);
  if (idx === -1 || idx === ALL_LEVEL_IDS.length - 1) return null;
  return ALL_LEVEL_IDS[idx + 1];
}

export function getWorldOfLevel(id: string): WorldDef | undefined {
  return WORLDS.find((w) => w.levels.some((l) => l.id === id));
}

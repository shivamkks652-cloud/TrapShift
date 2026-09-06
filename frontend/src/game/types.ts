// Core shared types for the TrapShift game engine.
// A level is a tile grid (terrain) plus typed overlay objects (traps, hazards, pickups).

export type Vec2 = { x: number; y: number };

export const TILE = 48; // logical pixel size of one grid tile

// Terrain tile characters used inside level ASCII maps.
// '.' empty, '#' solid ground, 'S' spike hazard, '~' fake platform (looks solid, isn't)
export type TerrainChar = "." | "#" | "S" | "~";

export type TrapType =
  | "movingWall"
  | "gravityZone"
  | "reverseZone"
  | "freezeZone"
  | "darkZone"
  | "laserGate"
  | "portal"
  | "explodingPlatform"
  | "rotatingPlatform"
  | "fakeCheckpoint"
  | "fakeExit"
  | "mimicEnemy"
  | "steamVent"
  | "firewallSweep"
  | "chaosRift";

export interface RectZone {
  x: number; // tile coords
  y: number;
  w: number;
  h: number;
}

export interface MovingWall {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  axis: "x" | "y";
  range: number; // tiles of travel
  speed: number; // tiles/sec
  phase?: number; // 0..1 start offset
}

export interface GravityZone extends RectZone {
  id?: string;
}

export interface ReverseZone extends RectZone {
  id?: string;
}

export interface FreezeZone extends RectZone {
  id?: string;
}

export interface DarkZone extends RectZone {
  id: string;
  // tiles that are only solid/visible while inside light radius of a torch pickup
  bridgeTiles: Vec2[];
}

export interface LaserGate {
  id: string;
  x: number;
  y: number;
  h: number; // vertical extent in tiles (beam is vertical) or w for horizontal
  axis: "vertical" | "horizontal";
  onTime: number; // seconds on
  offTime: number; // seconds off
  phase?: number;
}

export interface Portal {
  id: string;
  x: number;
  y: number;
  linkId: string; // id of paired portal
  color: "cyan" | "magenta";
}

export interface ExplodingPlatform {
  id: string;
  x: number;
  y: number;
  w: number;
  delay: number; // seconds after step before exploding
  respawn: number; // seconds until it reforms
}

export interface RotatingPlatform {
  id: string;
  cx: number; // pivot tile x
  cy: number; // pivot tile y
  radius: number; // tiles
  speed: number; // radians/sec
  armLen: number; // platform length in tiles
  phase?: number;
}

export interface FakeCheckpoint {
  id: string;
  x: number;
  y: number;
}

export interface FakeExit {
  id: string;
  x: number;
  y: number;
}

export interface MimicEnemy {
  id: string;
  x: number;
  y: number;
  triggerRadius: number; // tiles
  lungeSpeed: number;
}

export interface SteamVent {
  id: string;
  x: number; // tile x (base of the jet)
  y: number; // tile y (floor tile the jet erupts from)
  h: number; // jet height in tiles when active
  warnTime: number; // seconds of hiss/glow warning before it erupts
  activeTime: number; // seconds the jet is lethal
  cooldownTime: number; // seconds fully idle before the next warning starts
  phase?: number; // 0..1 cycle start offset
}

export interface FirewallSweep {
  id: string;
  startX: number; // tile x where the wall charges/idles
  endX: number; // tile x it sweeps to
  y: number; // top tile y of the lethal band
  h: number; // lethal band height in tiles (leave a gap elsewhere in the column for the player to dodge through)
  chargeTime: number; // seconds parked at startX, glowing brighter (telegraph) before it moves
  sweepTime: number; // seconds to travel from startX to endX
  phase?: number; // 0..1 cycle start offset
}

export interface ChaosRift extends RectZone {
  id: string;
}

export interface Checkpoint {
  id: string;
  x: number;
  y: number;
}

export interface Shard {
  id: string;
  x: number;
  y: number;
}

export interface Exit {
  x: number;
  y: number;
}

export interface PlayerStart {
  x: number;
  y: number;
}

export interface LevelDef {
  id: string;
  world: number;
  index: number; // level number within world
  name: string;
  ruleTaught: string; // one-line rule text shown at level start
  twist?: string; // one-line twist text shown when the twist first appears (toast)
  rows: string[]; // ASCII terrain grid, each string one row
  playerStart: PlayerStart;
  exit: Exit;
  checkpoints?: Checkpoint[];
  shards?: Shard[];
  movingWalls?: MovingWall[];
  gravityZones?: GravityZone[];
  reverseZones?: ReverseZone[];
  freezeZones?: FreezeZone[];
  darkZones?: DarkZone[];
  laserGates?: LaserGate[];
  portals?: Portal[];
  explodingPlatforms?: ExplodingPlatform[];
  rotatingPlatforms?: RotatingPlatform[];
  fakeCheckpoints?: FakeCheckpoint[];
  fakeExits?: FakeExit[];
  mimicEnemies?: MimicEnemy[];
  steamVents?: SteamVent[];
  firewallSweeps?: FirewallSweep[];
  chaosRifts?: ChaosRift[];
  parTime: number; // seconds for 3-star rating threshold
}

export interface WorldDef {
  id: number;
  name: string;
  colorFrom: string;
  colorTo: string;
  accent: string;
  levels: LevelDef[];
}

export type GameStatus = "playing" | "dead" | "won" | "paused";

export interface LevelResult {
  levelId: string;
  timeMs: number;
  shardsCollected: number;
  shardsTotal: number;
  stars: 1 | 2 | 3;
  deaths: number;
}

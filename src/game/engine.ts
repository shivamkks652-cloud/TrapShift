import {
  AIR_CONTROL,
  BOUNCE_PAD_VELOCITY,
  COYOTE_TIME,
  GRAVITY,
  ICE_FRICTION_MULT,
  JUMP_BUFFER_TIME,
  JUMP_CUT_MULT,
  JUMP_VELOCITY,
  MAX_FALL_SPEED,
  MAX_RUN_SPEED,
  MIN_JUMP_VELOCITY,
  MOVE_ACCEL,
  MOVE_DECEL,
  SPEED_PAD_VELOCITY,
} from "./constants";
import { sfx, gateHumStart, gateHumStop, gravityHumStart, gravityHumStop } from "./audio";
import { vibrate } from "./haptics";
import type {
  ChaosRift,
  DarkZone,
  ExplodingPlatform,
  FirewallSweep,
  GravityZone,
  LaserGate,
  LevelDef,
  MimicEnemy,
  MovingWall,
  Portal,
  ReverseZone,
  RotatingPlatform,
  SteamVent,
  Vec2,
} from "./types";
import { TILE } from "./types";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  // Visual-only rendering shape, purely cosmetic (defaults to "circle" in the renderer).
  shape?: "circle" | "square" | "shard" | "line";
  rotation?: number;
}

// Purely cosmetic geometry-based classification of a MovingWall into one of
// three visual families ("moving crushers" / "plasma walls" / "moving platforms").
// This never touches physics/collision — collectSolids() still treats every
// MovingWall identically regardless of this label. Shared by engine (for sfx
// cues) and the renderer (for art), so the two stay in sync.
export type MovingWallKind = "crusher" | "plasmaWall" | "platform";

export function classifyMovingWall(m: MovingWall): MovingWallKind {
  const ratio = m.w / m.h;
  if (ratio > 0.55 && ratio < 1.8) return "crusher"; // roughly square/blocky
  if (ratio <= 0.55) return "plasmaWall"; // tall & thin
  return "platform"; // wide & flat
}

export interface InputState {
  left: boolean;
  right: boolean;
  jumpPressed: boolean; // edge-triggered, consumed by engine
  jumpHeld: boolean;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function tileRect(tx: number, ty: number): Rect {
  return { x: tx * TILE, y: ty * TILE, w: TILE, h: TILE };
}

export type ExplosionState = { exploded: boolean; timer: number };
export type MimicState = { woken: boolean; x: number; y: number; vx: number };
export type LaserState = { on: boolean };
export type SteamVentPhase = "idle" | "warn" | "active";
export type SteamVentState = { phase: SteamVentPhase };
export type FirewallPhase = "charge" | "sweep";
export type FirewallState = { phase: FirewallPhase };
export type ChaosEffect = "gravity" | "reverse";

export class GameEngine {
  level: LevelDef;
  player: { x: number; y: number; vx: number; vy: number; w: number; h: number; onGround: boolean; facing: 1 | -1 };
  gravityDir: 1 | -1 = 1;
  coyoteTimer = 0;
  jumpBufferTimer = 0;
  jumpHoldReleased = true; // internal edge tracker for variable jump height
  jumpingUp = false; // true while ascending from a jump (used to gate jump-cut)
  bouncedPads = new Set<string>(); // per-cycle debounce so a single frame doesn't re-trigger
  speedPads = new Set<string>();
  keysCollected = new Set<string>();
  wasOnGround = false;
  time = 0;
  status: "playing" | "dead" | "won" = "playing";
  deaths = 0;
  shardsCollected = new Set<string>();
  collectedShardIds: string[] = [];
  activeCheckpoint: { x: number; y: number } | null = null;
  particles: Particle[] = [];
  cameraShake = 0;
  squash = 0; // -1..1 for squash/stretch visual, engine tracks landing impact
  fakeCheckpointPulses: string[] = [];
  fakeExitPulses: string[] = [];
  torchRadius = 3.2; // tiles, always-on soft light so dark zones are playable but mysterious
  explosionState: Record<string, ExplosionState> = {};
  mimicState: Record<string, MimicState> = {};
  laserState: Record<string, LaserState> = {};
  rotatingAngle: Record<string, number> = {};
  steamVentState: Record<string, SteamVentState> = {};
  firewallState: Record<string, FirewallState> = {};
  chaosRiftEffect: Record<string, ChaosEffect> = {};
  lastLandingImpact = 0;
  onEvent?: (event: { type: string; data?: any }) => void;
  shakeMultiplier = 1;
  sensitivity = 1;
  // Visual-only wall contact state, used purely for player animation (wall-slide / wall-jump pose).
  // Never read by movement/physics code, so it cannot change gameplay behavior.
  touchingWallDir: 1 | -1 | 0 = 0;
  wallPushOffTimer = 0;

  // --- Cosmetic-only juice state below. None of these fields are ever read by
  // physics/collision/input code — they exist purely to drive premium visual
  // and audio feedback (glow, warnings, screen flash, ambient hums, haptics).
  screenFlash: { color: string; alpha: number } = { color: "#ffffff", alpha: 0 };
  lastDeathCause: string = "";
  movingWallDirState: Record<string, { lastDist: number; dir: 1 | -1 }> = {};
  wasInGravityZone = false;
  fakePlatformPulses: string[] = [];
  fakePlatformCooldown: Record<string, number> = {};
  private laserHumOn: Record<string, boolean> = {};

  constructor(level: LevelDef, opts?: { reducedShake?: boolean; sensitivity?: number }) {
    this.level = level;
    this.shakeMultiplier = opts?.reducedShake ? 0.35 : 1;
    this.sensitivity = opts?.sensitivity ?? 1;
    this.player = {
      x: level.playerStart.x * TILE,
      y: level.playerStart.y * TILE,
      vx: 0,
      vy: 0,
      w: TILE * 0.55,
      h: TILE * 0.85,
      onGround: false,
      facing: 1,
    };
    for (const m of level.movingWalls ?? []) this.explosionState[m.id] = { exploded: false, timer: 0 };
    for (const e of level.explodingPlatforms ?? []) this.explosionState[e.id] = { exploded: false, timer: 0 };
    for (const m of level.mimicEnemies ?? [])
      this.mimicState[m.id] = { woken: false, x: m.x * TILE, y: m.y * TILE, vx: 0 };
    for (const l of level.laserGates ?? []) this.laserState[l.id] = { on: true };
    for (const r of level.rotatingPlatforms ?? []) this.rotatingAngle[r.id] = (r.phase ?? 0) * Math.PI * 2;
    for (const v of level.steamVents ?? []) this.steamVentState[v.id] = { phase: "idle" };
    for (const f of level.firewallSweeps ?? []) this.firewallState[f.id] = { phase: "charge" };
    // Randomized once per attempt so replays feel different — a chaos rift's effect
    // (gravity flip or control reverse) is not knowable in advance, only that it is
    // one of the two, and it is always safe (never lethal on its own).
    for (const c of level.chaosRifts ?? [])
      this.chaosRiftEffect[c.id] = Math.random() < 0.5 ? "gravity" : "reverse";
  }

  private rows() {
    return this.level.rows;
  }

  private tileAt(tx: number, ty: number): string {
    const rows = this.rows();
    if (ty < 0 || ty >= rows.length) return "#"; // solid ceiling/floor cap outside level
    const row = rows[ty];
    if (tx < 0 || tx >= row.length) return "#";
    return row[tx];
  }

  private isSolidTerrain(tx: number, ty: number): boolean {
    const c = this.tileAt(tx, ty);
    // Physical solids: plain ground, ice, bounce pad, and both speed-pad arrows.
    // Ice acts like normal ground for collision — the friction change is handled elsewhere.
    return c === "#" || c === "I" || c === "B" || c === ">" || c === "<";
  }

  private isFakeTerrain(tx: number, ty: number): boolean {
    return this.tileAt(tx, ty) === "~";
  }

  private isHazardTerrain(tx: number, ty: number): boolean {
    // Spikes and lava/fire tiles are instantly lethal on any touch.
    const c = this.tileAt(tx, ty);
    return c === "S" || c === "L";
  }

  private isBouncePad(tx: number, ty: number): boolean {
    return this.tileAt(tx, ty) === "B";
  }

  private speedPadDir(tx: number, ty: number): 1 | -1 | 0 {
    const c = this.tileAt(tx, ty);
    if (c === ">") return 1;
    if (c === "<") return -1;
    return 0;
  }

  private inZone(zones: { x: number; y: number; w: number; h: number }[] | undefined, px: number, py: number): boolean {
    if (!zones) return false;
    const p = { x: px, y: py, w: this.player.w, h: this.player.h };
    return zones.some((z) => rectsOverlap(p, tileRectRange(z)));
  }

  private movingWallRect(m: MovingWall, t: number): Rect {
    const dist = (Math.sin(t * m.speed + (m.phase ?? 0) * Math.PI * 2) * 0.5 + 0.5) * m.range;
    const x = m.axis === "x" ? m.x + dist : m.x;
    const y = m.axis === "y" ? m.y + dist : m.y;
    return { x: x * TILE, y: y * TILE, w: m.w * TILE, h: m.h * TILE };
  }

  private explodingRect(e: ExplodingPlatform): Rect | null {
    const st = this.explosionState[e.id];
    if (st.exploded) return null;
    return { x: e.x * TILE, y: e.y * TILE, w: e.w * TILE, h: TILE * 0.5 };
  }

  // Steam vent lethal rect — only meaningful while the vent is in its "active" phase.
  // The jet erupts upward from its floor tile, spanning v.h tiles.
  private steamVentRect(v: SteamVent): Rect {
    return { x: v.x * TILE + TILE * 0.3, y: (v.y - v.h + 1) * TILE, w: TILE * 0.4, h: v.h * TILE };
  }

  // Firewall sweep lethal rect — a vertical band that idles at startX while charging,
  // then travels linearly to endX over sweepTime. h/y leave a deliberate safe gap
  // elsewhere in the column so a well-timed jump can pass through it.
  firewallRectPublic(f: FirewallSweep, t: number): { rect: Rect; phase: FirewallPhase; sweepProgress: number } {
    return this.firewallRect(f, t);
  }

  private firewallRect(f: FirewallSweep, t: number): { rect: Rect; phase: FirewallPhase; sweepProgress: number } {
    const cycle = f.chargeTime + f.sweepTime;
    const tOff = (t + (f.phase ?? 0) * cycle) % cycle;
    if (tOff < f.chargeTime) {
      return { rect: { x: f.startX * TILE, y: f.y * TILE, w: TILE * 0.22, h: f.h * TILE }, phase: "charge", sweepProgress: 0 };
    }
    const progress = (tOff - f.chargeTime) / f.sweepTime;
    const x = f.startX + (f.endX - f.startX) * progress;
    return { rect: { x: x * TILE, y: f.y * TILE, w: TILE * 0.22, h: f.h * TILE }, phase: "sweep", sweepProgress: progress };
  }

  private rotatingRect(r: RotatingPlatform, t: number): Rect {
    const angle = this.rotatingAngle[r.id];
    const cx = r.cx * TILE;
    const cy = r.cy * TILE;
    const ex = cx + Math.cos(angle) * r.radius * TILE;
    const ey = cy + Math.sin(angle) * r.radius * TILE;
    const len = r.armLen * TILE;
    return { x: ex - len / 2, y: ey - TILE * 0.25, w: len, h: TILE * 0.5 };
  }

  private spawnParticles(
    x: number,
    y: number,
    count: number,
    color: string,
    speed = 200,
    spread = Math.PI * 2,
    shape: Particle["shape"] = "circle",
  ) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * spread - spread / 2;
      const s = speed * (0.4 + Math.random() * 0.8);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * s,
        vy: Math.sin(angle) * s - 100,
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.8,
        size: 3 + Math.random() * 4,
        color,
        shape,
        rotation: Math.random() * Math.PI * 2,
      });
    }
  }

  private emit(type: string, data?: any) {
    this.onEvent?.({ type, data });
  }

  update(dt: number, input: InputState) {
    if (this.status !== "playing") return;
    this.time += dt;

    // update particles
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 600 * dt;
    }
    if (this.cameraShake > 0) this.cameraShake = Math.max(0, this.cameraShake - dt * 3);
    this.squash = this.squash * Math.max(0, 1 - dt * 8);
    if (this.screenFlash.alpha > 0) {
      this.screenFlash = { ...this.screenFlash, alpha: Math.max(0, this.screenFlash.alpha - dt * 2.2) };
    }

    const px0 = this.player.x;
    const py0 = this.player.y;

    // determine current zone effects
    const playerRect0 = { x: px0, y: py0, w: this.player.w, h: this.player.h };
    // Chaos rifts (World 7) apply one of the two existing zone effects, randomized
    // per attempt in the constructor — they never introduce new physics, just
    // unpredictability about which familiar effect a rift will apply this run.
    const chaosReverseZones = (this.level.chaosRifts ?? []).filter((c) => this.chaosRiftEffect[c.id] === "reverse");
    const chaosGravityZones = (this.level.chaosRifts ?? []).filter((c) => this.chaosRiftEffect[c.id] === "gravity");
    const inReverse = this.inZone(this.level.reverseZones, px0, py0) || this.inZone(chaosReverseZones, px0, py0);
    const inFreeze = this.inZone(this.level.freezeZones, px0, py0);
    const inGravity =
      (this.level.gravityZones ?? []).find((z) => rectsOverlap(playerRect0, tileRectRange(z))) ||
      chaosGravityZones.find((z) => rectsOverlap(playerRect0, tileRectRange(z)));
    this.gravityDir = inGravity ? -1 : 1;

    // cosmetic-only: gravity portal ambient hum + entry ripple, purely reactive to the
    // already-computed inGravity value above — does not affect gravityDir/physics.
    const nowInGravity = !!inGravity;
    if (nowInGravity && !this.wasInGravityZone) {
      gravityHumStart();
      sfx.portal();
      this.spawnParticles(px0 + this.player.w / 2, py0 + this.player.h / 2, 12, "#a06bff", 160, Math.PI * 2, "circle");
      this.emit("gravityPortalEnter");
    } else if (!nowInGravity && this.wasInGravityZone) {
      gravityHumStop();
    }
    this.wasInGravityZone = nowInGravity;

    // input with reverse zone applied
    let left = input.left;
    let right = input.right;
    if (inReverse) {
      [left, right] = [right, left];
    }

    // Terrain-modifier awareness: does the player's feet-tile match ice/speed/bounce/spike surfaces?
    // These are pure terrain reads (single-tile lookups just below the player rect).
    const feetTx = Math.floor((this.player.x + this.player.w / 2) / TILE);
    const feetTy = Math.floor((this.player.y + this.player.h + 0.5) / TILE);
    const feetTile = this.tileAt(feetTx, feetTy);
    const onIce = this.player.onGround && feetTile === "I";

    // horizontal movement
    const targetDir = (right ? 1 : 0) - (left ? 1 : 0);
    const groundAccel = onIce ? MOVE_ACCEL * 0.55 : MOVE_ACCEL;
    const groundDecel = onIce ? MOVE_DECEL * ICE_FRICTION_MULT : MOVE_DECEL;
    const accel = (this.player.onGround ? groundAccel : MOVE_ACCEL * AIR_CONTROL) * this.sensitivity;
    const decel = (this.player.onGround ? groundDecel : MOVE_DECEL * AIR_CONTROL) * this.sensitivity;
    if (targetDir !== 0) {
      this.player.vx += targetDir * accel * dt;
      this.player.vx = Math.max(-MAX_RUN_SPEED, Math.min(MAX_RUN_SPEED, this.player.vx));
      this.player.facing = targetDir > 0 ? 1 : -1;
    } else {
      const sign = Math.sign(this.player.vx);
      const mag = Math.max(0, Math.abs(this.player.vx) - decel * dt);
      this.player.vx = sign * mag;
    }

    // jump buffering + coyote time
    if (input.jumpPressed) {
      this.jumpBufferTimer = JUMP_BUFFER_TIME;
      this.jumpHoldReleased = false;
    }
    else this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);

    if (this.player.onGround) this.coyoteTimer = COYOTE_TIME;
    else this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);

    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.player.vy = -JUMP_VELOCITY * this.gravityDir;
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      this.player.onGround = false;
      this.jumpingUp = true;
      sfx.jump();
      this.spawnParticles(
        this.player.x + this.player.w / 2,
        this.player.y + (this.gravityDir === 1 ? this.player.h : 0),
        6,
        "#9be9ff",
        150,
        Math.PI,
      );
    }

    // Variable jump height — if the player releases jump while still ascending, cut the
    // upward velocity so a quick tap produces a short hop and a hold produces a full jump.
    // Only applied on the release edge (jumpHeld transitions to false), and only while
    // still moving upward relative to current gravity direction.
    if (!input.jumpHeld && !this.jumpHoldReleased) {
      this.jumpHoldReleased = true;
      if (this.jumpingUp) {
        const ascending = this.gravityDir === 1 ? this.player.vy < 0 : this.player.vy > 0;
        if (ascending) {
          const minVy = -MIN_JUMP_VELOCITY * this.gravityDir;
          if (this.gravityDir === 1) {
            this.player.vy = Math.max(this.player.vy * JUMP_CUT_MULT, minVy);
          } else {
            this.player.vy = Math.min(this.player.vy * JUMP_CUT_MULT, minVy);
          }
        }
      }
    }
    // Reset jumpingUp once we're past the apex or grounded.
    if (this.player.onGround || (this.gravityDir === 1 ? this.player.vy > 0 : this.player.vy < 0)) {
      this.jumpingUp = false;
    }

    // gravity (frozen zones halt hazards but not player gravity — player still must navigate)
    if (!inFreeze) {
      this.player.vy += GRAVITY * this.gravityDir * dt;
    }
    this.player.vy = Math.max(-MAX_FALL_SPEED, Math.min(MAX_FALL_SPEED, this.player.vy));

    // move + collide, axis separated
    this.moveAxis("x", this.player.vx * dt);
    const wasOnGround = this.player.onGround;
    this.player.onGround = false;
    this.moveAxis("y", this.player.vy * dt);

    if (!wasOnGround && this.player.onGround) {
      const impact = Math.min(1, Math.abs(this.player.vy) / MAX_FALL_SPEED);
      if (impact > 0.15) {
        sfx.land();
        this.squash = -impact;
        this.spawnParticles(
          this.player.x + this.player.w / 2,
          this.player.y + (this.gravityDir === 1 ? this.player.h : 0),
          Math.round(4 + impact * 8),
          "#cfd9ff",
          180,
        );
      }
    }

    // ── Terrain-pad triggers ──────────────────────────────────────────────
    // Bounce pad: on landing on a 'B' tile, launch the player upward with a
    // strong pre-set velocity. Only fires the frame we actually contact it,
    // and we set jumpingUp so variable-jump-cut can still throttle a released
    // hold on the way up (feels intentional, not glitchy).
    if (this.player.onGround) {
      const footTx = Math.floor((this.player.x + this.player.w / 2) / TILE);
      const footTy = Math.floor(
        this.gravityDir === 1
          ? (this.player.y + this.player.h + 0.5) / TILE
          : (this.player.y - 0.5) / TILE
      );
      if (this.isBouncePad(footTx, footTy)) {
        this.player.vy = -BOUNCE_PAD_VELOCITY * this.gravityDir;
        this.player.onGround = false;
        this.jumpingUp = true;
        this.jumpHoldReleased = true; // player didn't press jump; no variable cut window
        sfx.jump();
        this.spawnParticles(
          this.player.x + this.player.w / 2,
          footTy * TILE + TILE * 0.5,
          14,
          "#ffe45c",
          260,
          Math.PI,
        );
        this.squash = -0.6;
        vibrate(30);
        this.emit("bounce");
      }
    }

    // Speed pad: on any contact with the player rect (feet or mid-body), snap
    // horizontal velocity to the pad's boost speed in its arrow direction.
    // Cheap linear scan of pad tiles under the player rect — plenty for the
    // small worlds we ship.
    {
      const rectMinTx = Math.floor(this.player.x / TILE);
      const rectMaxTx = Math.floor((this.player.x + this.player.w) / TILE);
      const rectMinTy = Math.floor(this.player.y / TILE);
      const rectMaxTy = Math.floor((this.player.y + this.player.h) / TILE);
      for (let tx = rectMinTx; tx <= rectMaxTx; tx++) {
        for (let ty = rectMinTy; ty <= rectMaxTy; ty++) {
          const dir = this.speedPadDir(tx, ty);
          if (dir === 0) continue;
          const boost = SPEED_PAD_VELOCITY * dir;
          if ((dir === 1 && this.player.vx < boost) || (dir === -1 && this.player.vx > boost)) {
            this.player.vx = boost;
            this.player.facing = dir;
          }
          const padKey = `sp:${tx}:${ty}`;
          if (!this.speedPads.has(padKey)) {
            this.speedPads.add(padKey);
            sfx.portal();
            this.spawnParticles(
              tx * TILE + TILE / 2,
              ty * TILE + TILE * 0.5,
              10,
              "#5cffe4",
              240,
              Math.PI * 0.4,
            );
            this.emit("speedPad");
          }
        }
      }
      // Ambient cleanup: as the player moves away from a triggered pad, drop the
      // debounce so re-entering later still plays the whoosh.
      if (this.speedPads.size > 0) {
        for (const key of Array.from(this.speedPads)) {
          const [, tx, ty] = key.split(":").map(Number);
          if (
            tx < rectMinTx - 1 || tx > rectMaxTx + 1 ||
            ty < rectMinTy - 1 || ty > rectMaxTy + 1
          ) {
            this.speedPads.delete(key);
          }
        }
      }
    }
    // ──────────────────────────────────────────────────────────────────────

    // update dynamic hazards
    this.updateMovingHazards(dt);

    // check death conditions
    this.checkHazards();
    this.checkTerrainHazards();

    // cosmetic-only reaction to already-non-solid fake terrain
    this.checkFakePlatformCrumble(dt);

    // checkpoints / fake checkpoints
    this.checkCheckpoints();
    this.checkFakeCheckpoints();

    // shards
    this.checkShards();

    // portals
    this.checkPortals();

    // exploding platforms trigger on step
    this.checkExplodingPlatforms(dt);

    // mimic enemies
    this.checkMimics(dt);

    // fake exits
    this.checkFakeExits();

    // real exit
    this.checkExit();

    // fell off level
    if (this.player.y > this.rows().length * TILE + TILE * 4 || this.player.y < -TILE * 6) {
      this.die("fell");
    }

    // visual-only wall contact tracking (drives wall-slide / wall-jump animation, no physics effect)
    this.updateWallTouchAnim(dt);
  }

  private updateWallTouchAnim(dt: number) {
    const prevDir = this.touchingWallDir;
    let dir: 1 | -1 | 0 = 0;
    if (!this.player.onGround) {
      const solids = this.collectSolids();
      const probe = (d: 1 | -1): boolean => {
        const r: Rect = {
          x: this.player.x + (d === 1 ? this.player.w : -1),
          y: this.player.y + 2,
          w: 1,
          h: Math.max(1, this.player.h - 4),
        };
        return solids.some((s) => rectsOverlap(r, s));
      };
      if (probe(1)) dir = 1;
      else if (probe(-1)) dir = -1;
    }
    if (prevDir !== 0 && dir === 0 && !this.player.onGround) {
      // cosmetic push-off pose right after leaving a wall while airborne (visual "wall jump" beat)
      this.wallPushOffTimer = 0.22;
    }
    this.touchingWallDir = dir;
    if (this.wallPushOffTimer > 0) this.wallPushOffTimer = Math.max(0, this.wallPushOffTimer - dt);
  }

  private moveAxis(axis: "x" | "y", delta: number) {
    if (axis === "x") this.player.x += delta;
    else this.player.y += delta;

    const solids = this.collectSolids();
    const p = () => ({ x: this.player.x, y: this.player.y, w: this.player.w, h: this.player.h });

    for (const s of solids) {
      if (!rectsOverlap(p(), s)) continue;
      const player = p();
      if (axis === "x") {
        if (delta > 0) this.player.x = s.x - player.w;
        else if (delta < 0) this.player.x = s.x + s.w;
        this.player.vx = 0;
      } else {
        if (delta > 0) {
          this.player.y = s.y - player.h;
          if (this.gravityDir === 1) this.player.onGround = true;
          this.player.vy = 0;
        } else if (delta < 0) {
          this.player.y = s.y + s.h;
          if (this.gravityDir === -1) this.player.onGround = true;
          this.player.vy = 0;
        }
      }
    }
  }

  private collectSolids(): Rect[] {
    const rects: Rect[] = [];
    const rows = this.rows();
    const startTx = Math.floor(this.player.x / TILE) - 2;
    const endTx = Math.floor((this.player.x + this.player.w) / TILE) + 2;
    const startTy = Math.floor(this.player.y / TILE) - 2;
    const endTy = Math.floor((this.player.y + this.player.h) / TILE) + 2;
    for (let ty = startTy; ty <= endTy; ty++) {
      for (let tx = startTx; tx <= endTx; tx++) {
        if (this.isSolidTerrain(tx, ty)) rects.push(tileRect(tx, ty));
      }
    }
    for (const m of this.level.movingWalls ?? []) rects.push(this.movingWallRect(m, this.time));
    for (const e of this.level.explodingPlatforms ?? []) {
      const r = this.explodingRect(e);
      if (r) rects.push(r);
    }
    for (const r of this.level.rotatingPlatforms ?? []) rects.push(this.rotatingRect(r, this.time));

    // dark zone bridge tiles only solid within torch radius of player (always-lit halo)
    for (const dz of this.level.darkZones ?? []) {
      for (const bt of dz.bridgeTiles) {
        rects.push(tileRect(bt.x, bt.y));
      }
    }
    return rects;
  }

  private updateMovingHazards(dt: number) {
    for (const l of this.level.laserGates ?? []) {
      const st = this.laserState[l.id];
      const cycle = l.onTime + l.offTime;
      const tOff = ((this.time + (l.phase ?? 0) * cycle) % cycle);
      const nowOn = tOff < l.onTime;
      const electric = l.axis === "horizontal";
      if (nowOn && !st.on) {
        electric ? sfx.electricGate() : sfx.laserZap();
        gateHumStart(l.id, electric);
        this.laserHumOn[l.id] = true;
      } else if (!nowOn && st.on) {
        gateHumStop(l.id);
        this.laserHumOn[l.id] = false;
      }
      st.on = nowOn;
    }
    for (const r of this.level.rotatingPlatforms ?? []) {
      this.rotatingAngle[r.id] += r.speed * dt;
    }
    for (const e of this.level.explodingPlatforms ?? []) {
      const st = this.explosionState[e.id];
      if (st.exploded) {
        st.timer -= dt;
        if (st.timer <= 0) {
          st.exploded = false;
        }
      }
    }
    // cosmetic-only: "moving crusher" clunk sfx when a chunky moving wall reaches
    // either end of its travel range. Purely a sound/feedback cue — the wall's
    // actual rect/collision (movingWallRect) is computed identically regardless.
    for (const m of this.level.movingWalls ?? []) {
      if (classifyMovingWall(m) !== "crusher") continue;
      const dist = (Math.sin(this.time * m.speed + (m.phase ?? 0) * Math.PI * 2) * 0.5 + 0.5) * m.range;
      const prev = this.movingWallDirState[m.id];
      const dir: 1 | -1 = dist >= (prev?.lastDist ?? 0) ? 1 : -1;
      if (prev && prev.dir !== dir && (dist < m.range * 0.03 || dist > m.range * 0.97)) {
        sfx.crusherClunk();
      }
      this.movingWallDirState[m.id] = { lastDist: dist, dir };
    }
    // steam vents — idle -> warn (hiss/glow telegraph) -> active (lethal burst) -> idle
    for (const v of this.level.steamVents ?? []) {
      const st = this.steamVentState[v.id];
      const cycle = v.warnTime + v.activeTime + v.cooldownTime;
      const tOff = (this.time + (v.phase ?? 0) * cycle) % cycle;
      let phase: SteamVentPhase = "idle";
      if (tOff < v.warnTime) phase = "warn";
      else if (tOff < v.warnTime + v.activeTime) phase = "active";
      if (phase !== st.phase) {
        if (phase === "warn") sfx.steamHiss();
        else if (phase === "active") {
          sfx.steamBurst();
          vibrate([20]);
          this.spawnParticles(v.x * TILE + TILE / 2, v.y * TILE, 14, "#bff2ff", 240, Math.PI * 0.6, "circle");
        }
        st.phase = phase;
      }
    }
    // firewall sweeps — charge (telegraph glow at rest) -> sweep (lethal traveling wall) -> repeat
    for (const f of this.level.firewallSweeps ?? []) {
      const st = this.firewallState[f.id];
      const { phase } = this.firewallRect(f, this.time);
      if (phase !== st.phase) {
        if (phase === "sweep") sfx.firewallSweepStart();
        else sfx.firewallCharge();
        st.phase = phase;
      }
    }
  }

  // cosmetic-only: fake platform crumble reaction. Fake terrain ('~') was never
  // solid to begin with (see isFakeTerrain/isSolidTerrain), so this only reacts
  // to the player already falling through it — it never makes the tile solid or
  // otherwise changes collision.
  private checkFakePlatformCrumble(dt: number) {
    const tx0 = Math.floor(this.player.x / TILE);
    const tx1 = Math.floor((this.player.x + this.player.w) / TILE);
    const ty0 = Math.floor(this.player.y / TILE);
    const ty1 = Math.floor((this.player.y + this.player.h) / TILE);
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        if (!this.isFakeTerrain(tx, ty)) continue;
        const key = `${tx},${ty}`;
        const cd = this.fakePlatformCooldown[key] ?? 0;
        if (cd > 0) continue;
        this.fakePlatformCooldown[key] = 1.2;
        if (!this.fakePlatformPulses.includes(key)) this.fakePlatformPulses.push(key);
        sfx.fakeCrumble();
        this.spawnParticles(tx * TILE + TILE / 2, ty * TILE + TILE / 2, 8, "#ff8a3d", 140, Math.PI * 2, "square");
        this.emit("fakePlatformCrumble", { tx, ty });
      }
    }
    for (const key of Object.keys(this.fakePlatformCooldown)) {
      this.fakePlatformCooldown[key] = Math.max(0, this.fakePlatformCooldown[key] - dt);
    }
  }

  private checkTerrainHazards() {
    const tx0 = Math.floor(this.player.x / TILE);
    const tx1 = Math.floor((this.player.x + this.player.w) / TILE);
    const ty0 = Math.floor(this.player.y / TILE);
    const ty1 = Math.floor((this.player.y + this.player.h) / TILE);
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        if (this.isHazardTerrain(tx, ty)) {
          this.die("spike");
          return;
        }
      }
    }
  }

  private checkHazards() {
    for (const l of this.level.laserGates ?? []) {
      const st = this.laserState[l.id];
      if (!st.on) continue;
      const rect: Rect =
        l.axis === "vertical"
          ? { x: l.x * TILE + TILE * 0.4, y: l.y * TILE, w: TILE * 0.2, h: l.h * TILE }
          : { x: l.x * TILE, y: l.y * TILE + TILE * 0.4, w: l.h * TILE, h: TILE * 0.2 };
      if (rectsOverlap({ x: this.player.x, y: this.player.y, w: this.player.w, h: this.player.h }, rect)) {
        this.die(l.axis === "horizontal" ? "laser-horizontal" : "laser-vertical");
        return;
      }
    }
    const playerRect = { x: this.player.x, y: this.player.y, w: this.player.w, h: this.player.h };
    for (const v of this.level.steamVents ?? []) {
      if (this.steamVentState[v.id].phase !== "active") continue;
      if (rectsOverlap(playerRect, this.steamVentRect(v))) {
        this.die("steam");
        return;
      }
    }
    for (const f of this.level.firewallSweeps ?? []) {
      const { rect, phase } = this.firewallRect(f, this.time);
      if (phase !== "sweep") continue;
      if (rectsOverlap(playerRect, rect)) {
        this.die("firewall");
        return;
      }
    }
  }

  private checkCheckpoints() {
    for (const c of this.level.checkpoints ?? []) {
      const rect = tileRect(c.x, c.y);
      if (rectsOverlap({ x: this.player.x, y: this.player.y, w: this.player.w, h: this.player.h }, rect)) {
        if (!this.activeCheckpoint || this.activeCheckpoint.x !== c.x || this.activeCheckpoint.y !== c.y) {
          this.activeCheckpoint = { x: c.x, y: c.y };
          sfx.checkpoint();
          this.emit("checkpoint");
        }
      }
    }
  }

  private checkFakeCheckpoints() {
    for (const c of this.level.fakeCheckpoints ?? []) {
      const rect = tileRect(c.x, c.y);
      if (
        rectsOverlap({ x: this.player.x, y: this.player.y, w: this.player.w, h: this.player.h }, rect) &&
        !this.fakeCheckpointPulses.includes(c.id)
      ) {
        this.fakeCheckpointPulses.push(c.id);
        sfx.fakeOut();
        this.emit("fakeCheckpoint");
      }
    }
  }

  private checkShards() {
    for (const s of this.level.shards ?? []) {
      if (this.shardsCollected.has(s.id)) continue;
      const rect = tileRect(s.x, s.y);
      if (rectsOverlap({ x: this.player.x, y: this.player.y, w: this.player.w, h: this.player.h }, rect)) {
        this.shardsCollected.add(s.id);
        this.collectedShardIds.push(s.id);
        sfx.shard();
        this.spawnParticles(s.x * TILE + TILE / 2, s.y * TILE + TILE / 2, 10, "#ffe37d", 220);
        this.emit("shard");
      }
    }
  }

  private checkPortals() {
    for (const p of this.level.portals ?? []) {
      const rect = tileRect(p.x, p.y);
      if (rectsOverlap({ x: this.player.x, y: this.player.y, w: this.player.w, h: this.player.h }, rect)) {
        const target = (this.level.portals ?? []).find((o) => o.id === p.linkId);
        if (target && this._lastPortalUsed !== p.id) {
          this.player.x = target.x * TILE + TILE / 2 - this.player.w / 2;
          this.player.y = target.y * TILE + TILE / 2 - this.player.h / 2;
          this._lastPortalUsed = target.id;
          sfx.portal();
          this.spawnParticles(target.x * TILE + TILE / 2, target.y * TILE + TILE / 2, 14, p.color === "cyan" ? "#4bf3ff" : "#ff3df0");
          this.emit("portal");
          return;
        }
      } else if (this._lastPortalUsed === p.id) {
        this._lastPortalUsed = null;
      }
    }
  }
  private _lastPortalUsed: string | null = null;

  private checkExplodingPlatforms(_dt: number) {
    for (const e of this.level.explodingPlatforms ?? []) {
      const st = this.explosionState[e.id];
      if (st.exploded) continue;
      const rect = this.explodingRect(e);
      if (!rect) continue;
      const feetRect = { x: this.player.x, y: this.player.y + this.player.h - 2, w: this.player.w, h: 4 };
      const standing = rectsOverlap(feetRect, rect) && this.player.onGround;
      if (standing) {
        if (st.timer <= 0) st.timer = e.delay;
      }
    }
    for (const e of this.level.explodingPlatforms ?? []) {
      const st = this.explosionState[e.id];
      if (st.exploded) continue;
      if (st.timer > 0) {
        st.timer -= _dt;
        if (st.timer <= 0) {
          st.exploded = true;
          st.timer = e.respawn;
          sfx.platformCollapse();
          this.cameraShake = 1 * this.shakeMultiplier;
          this.spawnParticles(e.x * TILE + (e.w * TILE) / 2, e.y * TILE, 16, "#ff8a3d", 260, Math.PI * 2, "square");
          vibrate([15, 15]);
          this.emit("explosion");
        }
      }
    }
  }

  private checkMimics(dt: number) {
    for (const m of this.level.mimicEnemies ?? []) {
      const st = this.mimicState[m.id];
      const dx = this.player.x - st.x;
      const dy = this.player.y - st.y;
      const dist = Math.sqrt(dx * dx + dy * dy) / TILE;
      if (!st.woken && dist < m.triggerRadius) {
        st.woken = true;
        sfx.trapReveal();
        this.emit("mimicWake");
      }
      if (st.woken) {
        const dir = Math.sign(dx);
        st.vx = dir * m.lungeSpeed;
        st.x += st.vx * dt;
        const rect = { x: st.x, y: st.y, w: TILE * 0.7, h: TILE * 0.7 };
        if (rectsOverlap({ x: this.player.x, y: this.player.y, w: this.player.w, h: this.player.h }, rect)) {
          this.die("mimic");
        }
      }
    }
  }

  private checkFakeExits() {
    for (const fe of this.level.fakeExits ?? []) {
      const rect = tileRect(fe.x, fe.y);
      if (
        rectsOverlap({ x: this.player.x, y: this.player.y, w: this.player.w, h: this.player.h }, rect) &&
        !this.fakeExitPulses.includes(fe.id)
      ) {
        this.fakeExitPulses.push(fe.id);
        sfx.fakeOut();
        this.emit("fakeExit");
      }
    }
  }

  private checkExit() {
    // Forgiving exit hitbox: the visible flag lives inside a single tile, but on
    // touch devices players routinely jump-hop through the goal column (peak
    // jump ≈ 3 tiles above ground) or overshoot horizontally. Expand the
    // trigger to cover the full vertical column at the exit's x — anyone who
    // reaches this x is meant to finish the level. Also inflate horizontally
    // by half a tile on each side so brushing the flag on a running dismount
    // still counts. The flag itself remains a decorative single-tile sprite.
    const ex = this.level.exit.x * TILE;
    const rect: Rect = {
      x: ex - TILE * 0.5,
      y: 0,
      w: TILE * 2,
      h: this.rows().length * TILE,
    };
    if (rectsOverlap({ x: this.player.x, y: this.player.y, w: this.player.w, h: this.player.h }, rect)) {
      this.win();
    }
  }

  die(cause: string) {
    if (this.status !== "playing") return;
    this.status = "dead";
    this.deaths++;
    this.lastDeathCause = cause;
    const cx = this.player.x + this.player.w / 2;
    const cy = this.player.y + this.player.h / 2;

    // Per-cause death treatment: sfx stinger, particle shape/color, screen flash
    // color, and haptic pattern. Only already-lethal hazards get a unique
    // treatment here; anything else (fell/manual/unknown) uses the generic one.
    switch (cause) {
      case "spike":
        sfx.deathSpike();
        this.spawnParticles(cx, cy, 22, "#ff5c7a", 320, Math.PI * 2, "shard");
        this.screenFlash = { color: "#ff5c7a", alpha: 0.55 };
        vibrate([30]);
        break;
      case "laser-vertical":
      case "laser-horizontal":
        sfx.deathLaser();
        this.spawnParticles(cx, cy, 26, "#ff3d81", 300, Math.PI * 2, "line");
        this.screenFlash = { color: "#ff3d81", alpha: 0.6 };
        vibrate([15, 30, 15]);
        break;
      case "mimic":
        sfx.deathMimic();
        this.spawnParticles(cx, cy, 24, "#c04cff", 280, Math.PI * 2, "square");
        this.screenFlash = { color: "#c04cff", alpha: 0.55 };
        vibrate([50]);
        break;
      case "steam":
        sfx.deathSteam();
        this.spawnParticles(cx, cy, 24, "#bff2ff", 300, Math.PI * 2, "circle");
        this.screenFlash = { color: "#bff2ff", alpha: 0.5 };
        vibrate([35]);
        break;
      case "firewall":
        sfx.deathFirewall();
        this.spawnParticles(cx, cy, 26, "#39ffb0", 320, Math.PI * 2, "square");
        this.screenFlash = { color: "#39ffb0", alpha: 0.6 };
        vibrate([15, 25, 15]);
        break;
      default:
        sfx.death();
        this.spawnParticles(cx, cy, 20, "#ff5c7a", 260, Math.PI * 2, "circle");
        this.screenFlash = { color: "#ffffff", alpha: 0.3 };
        vibrate([25]);
        break;
    }

    this.cameraShake = 1.6 * this.shakeMultiplier;
    this.emit("death", { cause });
  }

  win() {
    if (this.status !== "playing") return;
    this.status = "won";
    sfx.win();
    this.spawnParticles(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, 30, "#7dff5c", 300);
    vibrate([20, 40, 20]);
    this.emit("win");
  }

  respawn() {
    const spawn = this.activeCheckpoint ?? { x: this.level.playerStart.x, y: this.level.playerStart.y };
    this.player.x = spawn.x * TILE;
    this.player.y = spawn.y * TILE;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.onGround = false;
    this.status = "playing";
  }
}

function tileRectRange(z: { x: number; y: number; w: number; h: number }): Rect {
  return { x: z.x * TILE, y: z.y * TILE, w: z.w * TILE, h: z.h * TILE };
}

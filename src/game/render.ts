import type { GameEngine } from "./engine";
import { classifyMovingWall } from "./engine";
import { TILE } from "./types";
import { SKINS } from "./storage";
import { fxTick, getSmoothedCamX, drawTrapHalos, updateAndDrawShockwaves, updateAndDrawAmbientDust, updateAndDrawPlayerTrail, getCachedBackgroundGradient, getCachedTerrainTileBitmap } from "./renderFx";
import playerSpriteUrl from "@/assets/player-sprite.png";

const playerSprite = new Image();
playerSprite.src = playerSpriteUrl;

// Sprite sheet layout: 5 columns x 3 rows, uniform cell grid.
const SPRITE_COLS = 5;
const SPRITE_ROWS = 3;
const SPRITE_SHEET_W = 1280;
const SPRITE_SHEET_H = 896;
const CELL_W = SPRITE_SHEET_W / SPRITE_COLS;
const CELL_H = SPRITE_SHEET_H / SPRITE_ROWS;

// Row 0: idle/walk cycle (5 frames), Row 1: run cycle (5 frames)
// Row 2: air poses -> [0]=crouch anticipation, [1]=rise/tuck, [2]=rise cont., [3]=fall A, [4]=fall B
const ROW_IDLE_WALK = 0;
const ROW_RUN = 1;
const ROW_AIR = 2;
const AIR_CROUCH = 0;
const AIR_RISE = 1;
const AIR_FALL_A = 3;
const AIR_FALL_B = 4;

function playerAnimFrame(engine: GameEngine, frame: number): { row: number; col: number; lean: number } {
  const speed = Math.abs(engine.player.vx);
  const RUN_THRESHOLD = 140; // px/s — below this we show the walk cycle, above it the run cycle

  if (!engine.player.onGround) {
    if (engine.wallPushOffTimer > 0) {
      return { row: ROW_AIR, col: AIR_RISE, lean: 0 };
    }
    if (engine.touchingWallDir !== 0 && engine.player.vy * engine.gravityDir > 0) {
      // sliding down a wall: lean the idle pose into the wall for a cheap, readable wall-slide read
      return { row: ROW_IDLE_WALK, col: 0, lean: engine.touchingWallDir * 0.22 };
    }
    if (engine.player.vy * engine.gravityDir < -30) {
      const col = Math.floor(frame / 6) % 2 === 0 ? AIR_CROUCH + 1 : AIR_RISE;
      return { row: ROW_AIR, col, lean: 0 };
    }
    const col = Math.floor(frame / 8) % 2 === 0 ? AIR_FALL_A : AIR_FALL_B;
    return { row: ROW_AIR, col, lean: 0 };
  }

  if (speed < 8) {
    // idle breathing: hold a single frame, breathing handled via scale in the caller
    return { row: ROW_IDLE_WALK, col: 0, lean: 0 };
  }

  if (speed < RUN_THRESHOLD) {
    const col = Math.floor(frame / 8) % SPRITE_COLS;
    return { row: ROW_IDLE_WALK, col, lean: 0 };
  }

  const col = Math.floor(frame / 5) % SPRITE_COLS;
  return { row: ROW_RUN, col, lean: 0 };
}

interface RenderOptions {
  width: number;
  height: number;
  worldAccent: string;
  worldFrom: string;
  worldTo: string;
  skinId: string;
  frame: number;
  colorblindMode?: boolean;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function render(ctx: CanvasRenderingContext2D, engine: GameEngine, opts: RenderOptions) {
  const { width, height, worldAccent, skinId, frame } = opts;
  const cb = !!opts.colorblindMode;
  // Fx clock — must be ticked exactly once per render frame.
  const fxDt = fxTick(engine);
  // Colorblind-safe palette: swap red/green pairs for orange/blue, which stay
  // distinguishable for protanopia/deuteranopia (the most common forms).
  const dangerColor = cb ? "#ff8a3d" : "#ff3d5c";
  const goalColor = cb ? "#4bf3ff" : "#7dff5c";
  const fakeRevealColor = cb ? "#ffe37d" : "#ff3d5c";
  ctx.save();

  // camera follows player, with shake
  const shakeX = engine.cameraShake > 0 ? (Math.random() - 0.5) * engine.cameraShake * 14 : 0;
  const shakeY = engine.cameraShake > 0 ? (Math.random() - 0.5) * engine.cameraShake * 14 : 0;

  const levelPxWidth = engine.level.rows[0].length * TILE;
  const targetCamX = Math.max(0, Math.min(levelPxWidth - width, engine.player.x + engine.player.w / 2 - width / 2));
  const camX = getSmoothedCamX(engine, targetCamX, fxDt);
  const camY = 0;

  // background gradient (cached per engine — same colours every frame)
  ctx.fillStyle = getCachedBackgroundGradient(ctx, engine, width, height, opts.worldFrom, opts.worldTo);
  ctx.fillRect(0, 0, width, height);

  // parallax glow orbs
  for (let i = 0; i < 5; i++) {
    const px = ((i * 220 - camX * 0.25) % (width + 300)) - 150;
    const py = 60 + i * 90 + Math.sin(frame / 90 + i) * 10;
    const r = 60 + i * 12;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
    grad.addColorStop(0, worldAccent + "33");
    grad.addColorStop(1, worldAccent + "00");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // parallax grid lines (far layer)
  ctx.strokeStyle = worldAccent + "14";
  ctx.lineWidth = 1;
  const gridOffset = -((camX * 0.5) % 60);
  for (let x = gridOffset; x < width; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Ambient dust motes (Fx layer) — screen-space, drawn BEFORE the world-space
  // translate so they float independently of level scroll with subtle parallax.
  updateAndDrawAmbientDust(ctx, engine, fxDt, {
    width,
    height,
    camX,
    accent: worldAccent,
  });

  ctx.translate(-camX + shakeX, -camY + shakeY);

  const rows = engine.level.rows;
  const startTx = Math.max(0, Math.floor(camX / TILE) - 1);
  const endTx = Math.min(rows[0].length, Math.ceil((camX + width) / TILE) + 1);

  // dark zones drawn first as darkness overlays computed after terrain, so render terrain then punch holes
  const terrainTile = getCachedTerrainTileBitmap(engine, TILE, worldAccent);
  for (let ty = 0; ty < rows.length; ty++) {
    for (let tx = startTx; tx < endTx; tx++) {
      const c = rows[ty][tx];
      const x = tx * TILE;
      const y = ty * TILE;
      if (c === "#") {
        // Cached bitmap: same gradient + accent border as before, one image blit
        // per tile instead of one createLinearGradient + fillRect + strokeRect.
        ctx.drawImage(terrainTile, x, y);
      } else if (c === "S") {
        drawNeonSpikes(ctx, x, y, dangerColor, frame);
      } else if (c === "~") {
        drawFakePlatform(ctx, x, y, tx, ty, worldAccent, dangerColor, engine, frame);
      }
    }
  }

  // gravity zones — swirling portal energy field
  for (const z of engine.level.gravityZones ?? []) {
    drawGravityZone(ctx, z, frame, engine);
  }
  // reverse zones
  for (const z of engine.level.reverseZones ?? []) {
    ctx.fillStyle = "#ff3df022";
    ctx.fillRect(z.x * TILE, z.y * TILE, z.w * TILE, z.h * TILE);
    ctx.strokeStyle = "#ff3df088";
    ctx.strokeRect(z.x * TILE, z.y * TILE, z.w * TILE, z.h * TILE);
  }
  // freeze zones
  for (const z of engine.level.freezeZones ?? []) {
    ctx.fillStyle = "#4bd8ff1c";
    ctx.fillRect(z.x * TILE, z.y * TILE, z.w * TILE, z.h * TILE);
    ctx.strokeStyle = "#4bd8ff77";
    ctx.strokeRect(z.x * TILE, z.y * TILE, z.w * TILE, z.h * TILE);
  }

  // moving walls — split into crusher / plasma wall / platform visual families
  for (const m of engine.level.movingWalls ?? []) {
    const dist = (Math.sin(engine.time * m.speed + (m.phase ?? 0) * Math.PI * 2) * 0.5 + 0.5) * m.range;
    const x = (m.axis === "x" ? m.x + dist : m.x) * TILE;
    const y = (m.axis === "y" ? m.y + dist : m.y) * TILE;
    const w = m.w * TILE;
    const h = m.h * TILE;
    const kind = classifyMovingWall(m);
    const nearEnd = dist < m.range * 0.06 || dist > m.range * 0.94;
    if (kind === "crusher") drawCrusher(ctx, x, y, w, h, frame, nearEnd);
    else if (kind === "plasmaWall") drawPlasmaWall(ctx, x, y, w, h, frame);
    else drawMovingPlatform(ctx, x, y, w, h, frame);
  }

  // rotating platforms — neon saw blade
  for (const r of engine.level.rotatingPlatforms ?? []) {
    const angle = engine.rotatingAngle[r.id] ?? 0;
    const cx = r.cx * TILE;
    const cy = r.cy * TILE;
    const ex = cx + Math.cos(angle) * r.radius * TILE;
    const ey = cy + Math.sin(angle) * r.radius * TILE;
    ctx.strokeStyle = worldAccent + "30";
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(cx, cy, r.radius * TILE, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    drawSawBlade(ctx, ex, ey, r.armLen * TILE, angle, worldAccent, frame);
  }

  // exploding (falling) platforms — glowing sci-fi slab with warning shudder + crumble
  for (const e of engine.level.explodingPlatforms ?? []) {
    const st = engine.explosionState[e.id];
    if (st?.exploded) continue;
    drawFallingPlatform(ctx, e, st, frame, worldAccent);
  }

  // laser gates — vertical = neon laser blade, horizontal = electric gate
  for (const l of engine.level.laserGates ?? []) {
    const st = engine.laserState[l.id];
    const cycle = l.onTime + l.offTime;
    const tOff = (engine.time + (l.phase ?? 0) * cycle) % cycle;
    const warnWindow = 0.35;
    const warning = !st?.on && l.offTime - tOff < warnWindow && l.offTime - tOff > 0;
    if (l.axis === "vertical") {
      drawLaserGate(ctx, l, !!st?.on, warning, dangerColor, frame);
    } else {
      drawElectricGate(ctx, l, !!st?.on, warning, dangerColor, frame);
    }
  }

  // steam vents (World 5 — Dark Reactor)
  for (const v of engine.level.steamVents ?? []) {
    const st = engine.steamVentState[v.id];
    drawSteamVent(ctx, v, st?.phase ?? "idle", frame);
  }

  // firewall sweeps (World 6 — Cyber Core)
  for (const f of engine.level.firewallSweeps ?? []) {
    const { rect, phase } = engine.firewallRectPublic(f, engine.time);
    drawFirewallSweep(ctx, rect, phase, dangerColor, frame);
  }

  // chaos rifts (World 7 — Chaos Rift) — safe zone, randomized gravity/reverse effect per attempt
  for (const cr of engine.level.chaosRifts ?? []) {
    drawChaosRift(ctx, cr, engine.chaosRiftEffect[cr.id] ?? "gravity", frame);
  }

  // Additive lethal-hazard halos (Fx layer) — draws bloom on top of the existing
  // trap art without repainting it. Purely cosmetic, reads engine hazard state.
  drawTrapHalos(ctx, engine, frame, dangerColor);

  // portals
  for (const p of engine.level.portals ?? []) {
    const x = p.x * TILE + TILE / 2;
    const y = p.y * TILE + TILE / 2;
    const color = p.color === "cyan" ? "#4bf3ff" : "#ff3df0";
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.ellipse(x, y, TILE * 0.32, TILE * 0.45, 0, 0, Math.PI * 2 + Math.sin(frame / 20));
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // dark zone overlay (draw AFTER terrain to occlude, punching holes near player + bridge tiles)
  for (const dz of engine.level.darkZones ?? []) {
    ctx.save();
    ctx.fillStyle = "rgba(2,3,12,0.92)";
    ctx.fillRect(dz.x * TILE, dz.y * TILE, dz.w * TILE, dz.h * TILE);
    // torch halo cut-out around player
    const px = engine.player.x + engine.player.w / 2;
    const py = engine.player.y + engine.player.h / 2;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, engine.torchRadius * TILE);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(2,3,12,0.92)");
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(px, py, engine.torchRadius * TILE, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
    // bridge tiles glow
    for (const bt of dz.bridgeTiles) {
      ctx.fillStyle = "#4bf3ff55";
      ctx.strokeStyle = "#4bf3ffaa";
      ctx.fillRect(bt.x * TILE, bt.y * TILE, TILE, TILE);
      ctx.strokeRect(bt.x * TILE, bt.y * TILE, TILE, TILE);
    }
  }

  // fake checkpoints / fake exits (visually identical to real ones until touched)
  for (const c of engine.level.checkpoints ?? []) {
    drawBeacon(ctx, c.x * TILE + TILE / 2, c.y * TILE, worldAccent, engine.activeCheckpoint?.x === c.x);
  }
  for (const c of engine.level.fakeCheckpoints ?? []) {
    const revealed = engine.fakeCheckpointPulses.includes(c.id);
    drawBeacon(ctx, c.x * TILE + TILE / 2, c.y * TILE, revealed ? dangerColor : worldAccent, false);
  }

  // shards
  for (const s of engine.level.shards ?? []) {
    if (engine.shardsCollected.has(s.id)) continue;
    const x = s.x * TILE + TILE / 2;
    const y = s.y * TILE + TILE / 2 + Math.sin(frame / 15 + s.x) * 4;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(frame / 40);
    ctx.fillStyle = "#ffe37d";
    ctx.shadowColor = "#ffe37d";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    const r = TILE * 0.22;
    for (let i = 0; i < 4; i++) {
      const ang = (Math.PI / 2) * i;
      const px = Math.cos(ang) * r;
      const py = Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // mimic enemies
  for (const m of engine.level.mimicEnemies ?? []) {
    const st = engine.mimicState[m.id];
    const x = st.x;
    const y = st.y;
    const pulse = st.woken ? 1 : 0.6 + Math.sin(frame / 12) * 0.15;
    ctx.fillStyle = st.woken ? dangerColor : "#5b3d7a";
    ctx.shadowColor = st.woken ? dangerColor : "#5b3d7a";
    ctx.shadowBlur = st.woken ? 20 : 6 * pulse;
    ctx.fillRect(x, y, TILE * 0.7, TILE * 0.7);
    ctx.shadowBlur = 0;
    if (st.woken) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x + TILE * 0.15, y + TILE * 0.2, 5, 5);
      ctx.fillRect(x + TILE * 0.45, y + TILE * 0.2, 5, 5);
    }
  }

  // fake exits + real exit
  for (const fe of engine.level.fakeExits ?? []) {
    const revealed = engine.fakeExitPulses.includes(fe.id);
    drawFlag(ctx, fe.x * TILE, fe.y * TILE, revealed ? fakeRevealColor : "#ffd23d", frame);
  }
  drawFlag(ctx, engine.level.exit.x * TILE, engine.level.exit.y * TILE, goalColor, frame);

  // particles — shape-aware rendering (circle / square / shard / line)
  for (const p of engine.particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.strokeStyle = p.color;
    const sz = p.size * alpha;
    switch (p.shape) {
      case "square":
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation ?? 0);
        ctx.fillRect(-sz / 2, -sz / 2, sz, sz);
        break;
      case "shard":
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation ?? 0);
        ctx.beginPath();
        ctx.moveTo(0, -sz);
        ctx.lineTo(sz * 0.5, sz * 0.5);
        ctx.lineTo(-sz * 0.5, sz * 0.5);
        ctx.closePath();
        ctx.fill();
        break;
      case "line":
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation ?? 0);
        ctx.lineWidth = Math.max(1, sz * 0.35);
        ctx.beginPath();
        ctx.moveTo(-sz, 0);
        ctx.lineTo(sz, 0);
        ctx.stroke();
        break;
      default:
        ctx.beginPath();
        ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // Death shockwave (Fx layer) — additive ring drawn where the player died;
  // spawns on rising edge of engine.status==='dead', then fades over ~450ms.
  updateAndDrawShockwaves(ctx, engine, fxDt, dangerColor);

  // player with squash & stretch, flipped when gravity inverted
  const skin = SKINS.find((s) => s.id === skinId) ?? SKINS[0];

  // Player after-image trail (Fx layer) — subtle rounded silhouettes trailing
  // behind the player when fast or airborne. Read-only sampling; drawn BEFORE
  // the player so ghosts sit behind.
  updateAndDrawPlayerTrail(ctx, engine, fxDt, skin.primary);

  const squashAmt = engine.squash;
  const breathe = engine.player.onGround && Math.abs(engine.player.vx) < 8 ? Math.sin(frame / 28) * 0.03 : 0;
  const stretchY = 1 - squashAmt * 0.35 + breathe;
  const stretchX = 1 + squashAmt * 0.35 - breathe * 0.6;
  const px = engine.player.x + engine.player.w / 2;
  const py = engine.player.y + engine.player.h / 2;
  // during the brief post-death freeze window (status !== "playing"), read-only
  // cosmetic treatment: freeze the pose and let it fade slightly, no state change.
  const isDead = engine.status === "dead";
  ctx.globalAlpha = isDead ? 0.85 : 1;
  const { row, col, lean } = playerAnimFrame(engine, frame);
  ctx.save();
  ctx.translate(px, py);
  if (engine.gravityDir === -1) ctx.scale(1, -1);
  ctx.scale(engine.player.facing === -1 ? -stretchX : stretchX, stretchY);
  if (lean) ctx.rotate(lean);
  const w = engine.player.w;
  // sprite hitbox anchor: draw taller than the collision box so the robot silhouette reads
  // clearly, but keep the box itself (used for physics) completely unchanged.
  const h = engine.player.h * 1.55;
  const hOffset = -engine.player.h * 0.5 - (h - engine.player.h) * 0.72;
  if (!isDead && playerSprite.complete && playerSprite.naturalWidth > 0) {
    ctx.drawImage(playerSprite, col * CELL_W, row * CELL_H, CELL_W, CELL_H, -w * 0.85, hOffset, w * 1.7, h);
    if (skin.id !== "default") {
      ctx.save();
      ctx.globalCompositeOperation = "source-atop";
      ctx.globalAlpha = 0.38;
      ctx.fillStyle = skin.primary;
      ctx.fillRect(-w * 0.85, hOffset, w * 1.7, h);
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  } else if (!isDead) {
    // sprite still loading — fall back to the simple silhouette so the player is never invisible
    ctx.fillStyle = skin.primary;
    roundRect(ctx, -w / 2, -engine.player.h / 2, w, engine.player.h, 8);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  ctx.restore();

  // screen flash overlay — drawn in screen space (after the camera-space ctx.restore
  // above) so it isn't affected by camera shake translation. Cosmetic-only, reads
  // engine.screenFlash which decays over time in the engine update loop.
  if (engine.screenFlash.alpha > 0) {
    ctx.save();
    ctx.globalAlpha = engine.screenFlash.alpha;
    ctx.fillStyle = engine.screenFlash.color;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}

function drawNeonSpikes(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, frame: number) {
  const pulse = 0.75 + Math.sin(frame / 10) * 0.25;
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10 + pulse * 8;
  const spikeCount = 3;
  for (let s = 0; s < spikeCount; s++) {
    const sw = TILE / spikeCount;
    ctx.beginPath();
    ctx.moveTo(x + s * sw, y + TILE);
    ctx.lineTo(x + s * sw + sw / 2, y + TILE * 0.35);
    ctx.lineTo(x + s * sw + sw, y + TILE);
    ctx.closePath();
    ctx.fill();
  }
  // bright edge highlight for a glassy neon look
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#ffffff88";
  ctx.lineWidth = 1;
  for (let s = 0; s < spikeCount; s++) {
    const sw = TILE / spikeCount;
    ctx.beginPath();
    ctx.moveTo(x + s * sw + sw / 2, y + TILE * 0.35);
    ctx.lineTo(x + s * sw + sw, y + TILE);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFakePlatform(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tx: number,
  ty: number,
  worldAccent: string,
  dangerColor: string,
  engine: GameEngine,
  frame: number,
) {
  const key = `${tx},${ty}`;
  const crumbling = engine.fakePlatformPulses.includes(key);
  ctx.save();
  if (crumbling) {
    ctx.globalAlpha = 0.45 + Math.sin(frame / 4) * 0.15;
    ctx.fillStyle = dangerColor + "55";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.strokeStyle = dangerColor + "aa";
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
    ctx.setLineDash([]);
  } else {
    // idle shimmer so an attentive player can eventually learn the tell without changing solidity
    const shimmer = 0.5 + Math.sin(frame / 30 + tx * 0.7) * 0.08;
    ctx.globalAlpha = shimmer;
    ctx.fillStyle = "#232a52aa";
    ctx.fillRect(x, y, TILE, TILE);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = worldAccent + "40";
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(x + 1, y + 1, TILE - 2, TILE - 2);
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawGravityZone(ctx: CanvasRenderingContext2D, z: { x: number; y: number; w: number; h: number }, frame: number, engine: GameEngine) {
  const x = z.x * TILE;
  const y = z.y * TILE;
  const w = z.w * TILE;
  const h = z.h * TILE;
  ctx.save();
  ctx.fillStyle = "#7c3dff1c";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#a06bff88";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  // swirling particle rings to sell the "portal" feel
  const cx = x + w / 2;
  const cy = y + h / 2;
  const ringCount = 3;
  for (let i = 0; i < ringCount; i++) {
    const t = frame / 40 + (i * Math.PI * 2) / ringCount;
    const rx = Math.min(w, h) * 0.35;
    const px = cx + Math.cos(t) * rx * 0.9;
    const py = cy + Math.sin(t * 1.4) * Math.min(h / 2 - 6, rx * 0.5);
    ctx.fillStyle = "#a06bff";
    ctx.shadowColor = "#a06bff";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(px, py, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawCrusher(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, frame: number, nearEnd: boolean) {
  ctx.save();
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, "#ff8a3d");
  grad.addColorStop(1, "#ff3d5c");
  ctx.fillStyle = grad;
  ctx.shadowColor = nearEnd ? "#ffffff" : "#ff5c3d";
  ctx.shadowBlur = nearEnd ? 26 : 16;
  ctx.fillRect(x, y, w, h);
  ctx.shadowBlur = 0;
  // hazard stripes for readability
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = "#00000030";
  ctx.lineWidth = 6;
  for (let i = -h; i < w + h; i += 16) {
    ctx.beginPath();
    ctx.moveTo(x + i, y + h);
    ctx.lineTo(x + i + h, y);
    ctx.stroke();
  }
  ctx.restore();
  if (nearEnd) {
    ctx.strokeStyle = "#ffffffaa";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  }
  ctx.restore();
}

function drawPlasmaWall(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, frame: number) {
  ctx.save();
  const flicker = 0.75 + Math.sin(frame / 6) * 0.25;
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, "#4bf3ff");
  grad.addColorStop(0.5, "#a06bff");
  grad.addColorStop(1, "#4bf3ff");
  ctx.fillStyle = grad;
  ctx.shadowColor = "#7dd8ff";
  ctx.shadowBlur = 20 * flicker;
  ctx.globalAlpha = 0.85;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  // energy core line down the middle
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = flicker;
  if (w < h) {
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w / 2, y + h);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x, y + h / 2);
    ctx.lineTo(x + w, y + h / 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawMovingPlatform(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, frame: number) {
  ctx.save();
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, "#2c3968");
  grad.addColorStop(1, "#161c3a");
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  const glow = 0.6 + Math.sin(frame / 20) * 0.2;
  ctx.strokeStyle = "#4bf3ff";
  ctx.shadowColor = "#4bf3ff";
  ctx.shadowBlur = 10 * glow;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawSawBlade(ctx: CanvasRenderingContext2D, ex: number, ey: number, len: number, angle: number, worldAccent: string, frame: number) {
  ctx.save();
  ctx.translate(ex, ey);
  ctx.rotate(frame / 6);
  ctx.fillStyle = worldAccent;
  ctx.shadowColor = worldAccent;
  ctx.shadowBlur = 18;
  const teeth = 8;
  const rOuter = len / 2;
  const rInner = rOuter * 0.7;
  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = (Math.PI / teeth) * i;
    const tx = Math.cos(a) * r;
    const ty = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(tx, ty);
    else ctx.lineTo(tx, ty);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#0b0e1f";
  ctx.beginPath();
  ctx.arc(0, 0, rOuter * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFallingPlatform(
  ctx: CanvasRenderingContext2D,
  e: { x: number; y: number; w: number },
  st: { exploded: boolean; timer: number } | undefined,
  frame: number,
  worldAccent: string,
) {
  const x = e.x * TILE;
  const y = e.y * TILE;
  const w = e.w * TILE;
  const warn = (st?.timer ?? 0) > 0;
  const shake = warn ? (Math.random() - 0.5) * 3 : 0;
  ctx.save();
  ctx.translate(shake, 0);
  const grad = ctx.createLinearGradient(x, y, x, y + TILE * 0.5);
  grad.addColorStop(0, warn ? "#ff8a3d" : "#2c3968");
  grad.addColorStop(1, warn ? "#ff3d5c" : "#161c3a");
  ctx.fillStyle = grad;
  ctx.shadowColor = warn ? "#ff8a3d" : worldAccent;
  ctx.shadowBlur = warn ? 18 + Math.sin(frame / 4) * 6 : 6;
  ctx.fillRect(x, y, w, TILE * 0.5);
  ctx.shadowBlur = 0;
  if (warn) {
    // hairline cracks that grow as the timer counts down
    const progress = 1 - (st?.timer ?? 0) / 1;
    ctx.strokeStyle = "#00000066";
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const cx = x + (w / 4) * i;
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.lineTo(cx + Math.sin(i) * 4 * progress, y + TILE * 0.5 * Math.min(1, progress + 0.3));
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawLaserGate(
  ctx: CanvasRenderingContext2D,
  l: { x: number; y: number; h: number },
  on: boolean,
  warning: boolean,
  dangerColor: string,
  frame: number,
) {
  const x = l.x * TILE + TILE * 0.4;
  const y = l.y * TILE;
  const w = TILE * 0.2;
  const h = l.h * TILE;
  ctx.save();
  if (on) {
    const flicker = 0.85 + Math.sin(frame * 1.4) * 0.15;
    ctx.fillStyle = dangerColor;
    ctx.shadowColor = dangerColor;
    ctx.shadowBlur = 22 * flicker;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#ffffffcc";
    ctx.fillRect(x + w * 0.35, y, w * 0.3, h);
    ctx.shadowBlur = 0;
    // emitter nodes top/bottom
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x + w / 2, y, 5, 0, Math.PI * 2);
    ctx.arc(x + w / 2, y + h, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // idle emitter posts, dim
    ctx.fillStyle = dangerColor + "33";
    ctx.beginPath();
    ctx.arc(x + w / 2, y, 4, 0, Math.PI * 2);
    ctx.arc(x + w / 2, y + h, 4, 0, Math.PI * 2);
    ctx.fill();
    if (warning) {
      // pre-activation warning flicker so players can react
      const t = 0.3 + Math.sin(frame * 3) * 0.3;
      ctx.globalAlpha = Math.max(0, t);
      ctx.fillStyle = dangerColor;
      ctx.shadowColor = dangerColor;
      ctx.shadowBlur = 10;
      ctx.fillRect(x, y, w, h);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}

function drawElectricGate(
  ctx: CanvasRenderingContext2D,
  l: { x: number; y: number; h: number },
  on: boolean,
  warning: boolean,
  dangerColor: string,
  frame: number,
) {
  const x = l.x * TILE;
  const y = l.y * TILE + TILE * 0.4;
  const w = l.h * TILE;
  const h = TILE * 0.2;
  ctx.save();
  // support posts
  ctx.fillStyle = "#3a4270";
  ctx.fillRect(x - 3, y - TILE * 0.15, 6, h + TILE * 0.3);
  ctx.fillRect(x + w - 3, y - TILE * 0.15, 6, h + TILE * 0.3);
  if (on) {
    ctx.strokeStyle = dangerColor;
    ctx.shadowColor = dangerColor;
    ctx.shadowBlur = 16;
    ctx.lineWidth = 2.5;
    // jagged electric arc between the posts, redrawn each frame for a crackling look
    ctx.beginPath();
    const segs = 10;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const px = x + w * t;
      const py = y + h / 2 + (Math.sin(frame * 2 + i * 1.7) * h * 0.9) * (i > 0 && i < segs ? 1 : 0.15);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else {
    ctx.fillStyle = dangerColor + "33";
    ctx.fillRect(x, y + h * 0.3, w, h * 0.4);
    if (warning) {
      const t = 0.3 + Math.sin(frame * 3) * 0.3;
      ctx.strokeStyle = dangerColor;
      ctx.globalAlpha = Math.max(0, t);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y + h / 2);
      ctx.lineTo(x + w, y + h / 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}

function drawSteamVent(
  ctx: CanvasRenderingContext2D,
  v: { x: number; y: number; h: number },
  phase: "idle" | "warn" | "active",
  frame: number,
) {
  const baseX = v.x * TILE;
  const baseY = v.y * TILE + TILE;
  ctx.save();
  // nozzle
  ctx.fillStyle = "#3a2420";
  ctx.fillRect(baseX + TILE * 0.15, baseY - TILE * 0.3, TILE * 0.7, TILE * 0.3);
  ctx.strokeStyle = "#ff4d2e88";
  ctx.lineWidth = 2;
  ctx.strokeRect(baseX + TILE * 0.15, baseY - TILE * 0.3, TILE * 0.7, TILE * 0.3);
  if (phase === "warn") {
    const t = 0.35 + Math.sin(frame * 2.2) * 0.3;
    ctx.globalAlpha = Math.max(0, t);
    ctx.fillStyle = "#ff8a5c";
    ctx.shadowColor = "#ff8a5c";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(baseX + TILE / 2, baseY - TILE * 0.32, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (phase === "active") {
    const top = baseY - v.h * TILE;
    const grad = ctx.createLinearGradient(baseX, baseY, baseX, top);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.4, "#bff2ff");
    grad.addColorStop(1, "#bff2ff00");
    ctx.fillStyle = grad;
    ctx.shadowColor = "#bff2ff";
    ctx.shadowBlur = 18;
    const wob = Math.sin(frame / 3) * TILE * 0.06;
    ctx.beginPath();
    ctx.moveTo(baseX + TILE * 0.35 + wob, baseY - TILE * 0.3);
    ctx.lineTo(baseX + TILE * 0.65 - wob, baseY - TILE * 0.3);
    ctx.lineTo(baseX + TILE * 0.5, top);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

function drawFirewallSweep(
  ctx: CanvasRenderingContext2D,
  rect: { x: number; y: number; w: number; h: number },
  phase: "charge" | "sweep",
  dangerColor: string,
  frame: number,
) {
  ctx.save();
  if (phase === "sweep") {
    const flicker = 0.85 + Math.sin(frame * 1.6) * 0.15;
    const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y);
    grad.addColorStop(0, "#39ffb000");
    grad.addColorStop(0.5, "#39ffb0");
    grad.addColorStop(1, "#39ffb000");
    ctx.fillStyle = grad;
    ctx.shadowColor = "#39ffb0";
    ctx.shadowBlur = 24 * flicker;
    ctx.fillRect(rect.x - rect.w, rect.y, rect.w * 3, rect.h);
    ctx.fillStyle = "#ffffffcc";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.shadowBlur = 0;
  } else {
    const t = 0.4 + Math.sin(frame * 2) * 0.3;
    ctx.globalAlpha = Math.max(0.15, t);
    ctx.fillStyle = dangerColor;
    ctx.shadowColor = dangerColor;
    ctx.shadowBlur = 16;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

function drawChaosRift(
  ctx: CanvasRenderingContext2D,
  z: { x: number; y: number; w: number; h: number },
  effect: "gravity" | "reverse",
  frame: number,
) {
  const x = z.x * TILE;
  const y = z.y * TILE;
  const w = z.w * TILE;
  const h = z.h * TILE;
  ctx.save();
  ctx.fillStyle = "#e23dff18";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#e23dff77";
  ctx.setLineDash([5, 4]);
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);
  // glitchy tearing shards drifting inside the zone — visually communicates
  // "something unstable/unpredictable happens here" without revealing the effect
  const shardCount = 5;
  for (let i = 0; i < shardCount; i++) {
    const t = frame / 20 + i * 1.3;
    const px = x + ((Math.sin(t) * 0.5 + 0.5) * w);
    const py = y + ((i / shardCount) * h + Math.sin(t * 1.7) * 6);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(t);
    ctx.fillStyle = i % 2 === 0 ? "#e23dff" : "#9be9ff";
    ctx.shadowColor = ctx.fillStyle as string;
    ctx.shadowBlur = 8;
    ctx.fillRect(-3, -8, 6, 16);
    ctx.restore();
  }
  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawBeacon(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, active: boolean) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.shadowColor = color;
  ctx.shadowBlur = active ? 20 : 10;
  ctx.beginPath();
  ctx.moveTo(x, y + TILE);
  ctx.lineTo(x, y + TILE * 0.2);
  ctx.stroke();
  ctx.fillStyle = active ? color : color + "66";
  ctx.beginPath();
  ctx.arc(x, y + TILE * 0.15, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFlag(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, frame: number) {
  ctx.save();
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + TILE * 0.2, y + TILE);
  ctx.lineTo(x + TILE * 0.2, y);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  const wave = Math.sin(frame / 10) * 4;
  ctx.beginPath();
  ctx.moveTo(x + TILE * 0.2, y + 4);
  ctx.lineTo(x + TILE * 0.85 + wave, y + TILE * 0.2);
  ctx.lineTo(x + TILE * 0.2, y + TILE * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

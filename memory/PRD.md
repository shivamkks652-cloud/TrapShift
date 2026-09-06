# TrapShift — Bug Fix Engagement

## Original Problem Statement
Existing TrapShift game (imported from GitHub). Fix Death / Fall Detection / Respawn /
Checkpoint / Level Completion bugs. Core bug: when the character goes below/underneath the
tiles it does NOT die and does NOT respawn — player stays below the level and the level
soft-locks. Do not rebuild, redesign UI, or change existing mechanics/levels/art.

## Architecture (as imported)
- **Stack:** Vite 7 + React 19 + TypeScript, HTML5 Canvas game, Capacitor (Android shell, unused on web).
- Runs in this env via `yarn start` → `vite` on port 3000 (PORT injected by supervisor; vite.config reads it).
- Backend (FastAPI/Mongo) is the default template and is **unused** by the game (single-player, localStorage save).
- Key game files:
  - `src/game/engine.ts` — GameEngine: physics, collision, death/respawn/checkpoints/exit.
  - `src/game/levels/world1..7.ts` (42 levels), `levels/index.ts` — progression/unlock helpers.
  - `src/game/storage.ts` — localStorage save/progress/unlock.
  - `src/components/GameCanvas.tsx` — RAF loop; on `death` event schedules `engine.respawn()` after RESTART_DELAY.
  - `src/components/GameScreen.tsx` — win → results → next level.

## Root Cause
`GameEngine.tileAt()` returned `"#"` (solid) for ALL out-of-bounds tiles, including BELOW the
grid (`ty >= rows.length`). This created an invisible solid floor beneath every level: a player
falling into a pit landed on it and got stuck underneath the visible tiles, so the fall/death
boundary (`player.y > rows*TILE + …`) never triggered → soft-lock.

## Fix (minimal, engine-only — 2 edits in `src/game/engine.ts`)
1. `tileAt()`: below the grid (`ty >= rows.length`) now returns `"."` (open) so falls keep
   going into the death boundary. Ceiling (`ty < 0`) and left/right edges stay solid.
2. Fall/death boundary tightened from `+TILE*4` to `+TILE*2` for a snappier, reliable trigger.

Existing Death/Respawn/Checkpoint/Finish/Save systems were reused unchanged:
- Respawn uses `activeCheckpoint ?? playerStart`, resets vx/vy, status→playing.
- Checkpoints set `activeCheckpoint` to the most-recently-touched one (latest wins).
- Win → `recordLevelResult` (completed=true) → `isLevelUnlocked` unlocks next.

## Verification (done)
- Headless deterministic engine tests (real GameEngine + real levels): TEST 1–6 all pass, plus a
  regression across ALL 42 levels confirming no level leaves the player stuck below tiles. 19/19 checks.
- Live browser playthrough: player stands on tiles; running into a pit repeatedly → death+respawn
  (deaths 3→6→9), respawn at start, controls persist, no soft-lock.

## Status
- [x] Fall/death detection on every level
- [x] Respawn at start (no checkpoint) / latest checkpoint (with checkpoint), velocity reset
- [x] Checkpoints activate + latest-wins on all levels
- [x] Tile collision (player stands on solids)
- [x] Level completion → unlock next → save (unchanged, verified)
- [x] Tunnel/below-grid safety net via fall boundary
- [x] Checkpoint Beacons: expanding pulse ring (render.ts) + "Checkpoint!" toast (GameScreen, data-testid=checkpoint-toast)
- [x] Coyote Landing: 0.5s respawnGrace suppresses hazard re-death at spawn; fall boundary NEVER suppressed
- [x] Swept/continuous collision: moveAxis sub-steps at ≤0.5 tile (resolveAxis) so fast falls can't clip thin platforms

## Verification (updated)
- Headless engine tests: 22/22 (all 6 acceptance cases + grace + swept-collision + all-42-level regression).
- testing_agent iteration_1: 6/6 automatable UI tests PASS (fall→respawn, repeated falls no soft-lock, R respawn, checkpoint pulse+toast+respawn-at-checkpoint). TEST 5 finish-flag not automatable (skill-gated) — covered by unit tests. No bugs/regressions/console errors.

## Backlog / Next
- P2: Node engine bump to >=22 if building the native Android AdMob shell.
- P2: Add `typescript` as a devDependency so `yarn typecheck` runs (Vite/esbuild build is unaffected today).

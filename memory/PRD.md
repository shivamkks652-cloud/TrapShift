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
- P1: Redesign Worlds 3-7 into puzzle sets, escalating (misdirection, combinations, chaos rifts).
- P2: Toast queue so a rapid 'Locked'->'armed' pair doesn't overwrite; derive toast testid from event type not copy.
- P2: Node engine bump to >=22 for the native Android AdMob shell; add `typescript` devDep for `yarn typecheck`.

## World 2 Puzzle Redesign (2026-06, Voltgrid City) — DONE
Extended switch/gate to ORDERED multi-switch (Switch.order; isGateOpen now requires ALL switches armed; out-of-order press emits 'switchDenied' -> 'Locked — wrong order!' toast). 7 levels: w2-1 Piston Alley (moving-trap timing), w2-2 Swing Shift (moving platform/gap), w2-3 Backwards Alley (reverse zone + pit), w2-4 Double Lock (ORDERED two-switch gate — far switch first, backtrack to near), w2-5 Crossfire (laser+pit+piston combo), w2-6 Collapse Run (exploding-platform trap chain), w2-7 Voltgrid Gauntlet (laser+reverse+switch finale).
Verified: headless controller proved all 7 physically solvable; death/respawn on each; ordered-gate logic (locked->arm->open) = 19/19. testing_agent iteration_3: ordered gate (Locked/armed/opened), single-switch regression, and death/respawn all PASS live, no console errors.

## World 1 Puzzle Redesign (2026-06, Neon Foundry) — DONE
NEW switch->gate mechanic (types Switch/Gate; engine switchState/checkSwitches/isGateOpen + gates in collectSolids; render drawGate/drawSwitch; GameScreen 'Gate opened!' toast, data-testid=gate-toast). World 1 = 6 distinct brain-puzzles:
- w1-1 First Steps (LEARN run+jump) | w1-2 Rhythm Gate (TIMING, 2 offset laser gates) | w1-3 Watch Your Step (FAKE tiles/observe) | w1-4 Two Roads (CHOICE stones vs bold shard) | w1-5 Blind Bridge (MEMORY hidden dark-zone bridge) | w1-6 The Lever (SWITCH opens energy gate).
Verified: headless informed-bot proved all 6 physically solvable (0 deaths); death/respawn + checkpoint + switch->gate(persist) + exit/progression = 21/21. testing_agent iteration_2: death/respawn, checkpoint-respawn, switch->gate all PASS live, no console errors. Level-select cards now have data-testid=level-card-<id>.

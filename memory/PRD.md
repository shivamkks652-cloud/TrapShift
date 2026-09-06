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

## Branding + Play Store Asset Pack (2026-06) — DONE
Neon identity (cyan #4bf3ff + magenta #ff3df0 on #020814). Generated + composited via PIL:
- App icon (512 + 1024, opaque), adaptive icon foreground/background, splash 2732 — Capacitor sources in `/app/frontend/assets/` (generate natively with `npx @capacitor/assets generate --android`, needs Node>=22 locally; see assets/README.md).
- Play Store pack in `/app/store_assets/`: app_icon_512, feature_graphic_1024x500, logo wordmark + emblem (transparent), splash preview, screenshots/ (phone 1920x1080 x5, tablet7 2048x1200 x4, tablet10 2560x1600 x4), plus README.md with listing copy.
- Web: public/ PNG icons (32/180/192/512) + manifest.webmanifest + og-image; index.html meta/OG/apple-touch/manifest updated.
- In-app: MainMenu now shows the neon emblem logo (data-testid=main-menu-logo) above the wordmark.
Verified: typecheck clean, app serves 200, manifest + icon-512 reachable, menu renders logo (mobile screenshot).

## Full-Game Difficulty Pass (2026-06) — DONE (all 7 worlds, 43 story levels)
User asked to raise difficulty/obstacles across the WHOLE game — tough but fair, no bugs. Delivered:
- Worlds 4-7 were BROKEN (a 20-tile un-crossable pit placeholder) and are now fully rebuilt into solvable, obstacle-dense puzzle levels; Worlds 1-3 hardened (more obstacles, faster hazards, longer 30-col corridors, fewer checkpoints, new combos). World 3 kept its puzzle set + mimic speed bump.
- W4 Singularity Core: gravity-flip (ceiling walk), rotating arms, decoy exits, mimics, reverse combos.
- W5 Dark Reactor: telegraphed steam-jet gauntlets + dark stretch + synced beam finale.
- W6 Cyber Core: charging/sweeping firewalls, double sweeps, mimic + synced beam finale.
- W7 Chaos Rift: rifts (random gravity-flip OR reverse per attempt) ALWAYS over solid ground (both effects survivable) + every prior hazard.
- Engine fairness fix (all worlds): respawn() resets crumbling platforms to solid.
- Levels now 30 cols wide (W3=26), 7 rows tall, camera scrolls horizontally (verified render OK on gravity level).
Verification: headless harness `tools_test/all_test.ts` (run: `node tools_test/run.mjs tools_test/all_test.ts [filter]`) = ALL 43 levels pass (uniform row widths, below-grid fall->death+respawn on every level, gravity/reverse/ordered-switch-aware auto-bot reaches/completes the exit on every level). testing_agent iteration_5: all 43 level cards render/clickable across 7 worlds, 15+ levels loaded non-blank with ZERO console errors, death/respawn never soft-locks, checkpoint-toast (w1-2) + gate-toast (w1-6) fire, gravity/fake-exit/reverse/steam/firewall/rift all render, w1-1 completed E2E with progression saved.

## Backlog / Next
- P2: Toast queue so a rapid 'Locked'->'armed' pair doesn't overwrite; derive toast testid from event type not copy (GameScreen.tsx line 97).
- P2: Optional per-level hint icon; widen w1-1 shard placement so 3-star requires intentional shard collection.

## World 3 Puzzle Redesign (2026-06, The Undergate) — DONE
6 distinct brain-puzzles using the world's signature mechanics (freeze fields, dark memory-bridge, crumbling platforms, mimics) + switch/gate:
- w3-1 Cold Open (FREEZE — freeze the beam while it's off, tightened zone x11 w4, beam onTime1.4/offTime0.5)
- w3-2 Blind Descent (MEMORY — invisible dark bridge with 2 missing planks)
- w3-3 Don't Linger (CRUMBLING chain over a pit)
- w3-4 The Sleeper (MIMIC — two lunging crates, leap them & outrun)
- w3-5 Deep Freeze (COMBINATION — freeze stops the beam but not the crumble)
- w3-6 The Undergate (FINALE — clean gap opener, checkpoint, switch opens a gate while a mimic guards it)
Engine fairness fix (all worlds): respawn() now resets every explodingPlatform to solid so the player never respawns onto a mid-collapse slab and dies again.
Verified: headless harness tools_test/w3_test.ts (run: `node tools_test/run.mjs tools_test/w3_test.ts`) = all rows 26-wide, below-grid fall->death+respawn on all 6, auto-bot completes all 6 (3/3 stable). testing_agent iteration_4: all 6 level cards render/clickable, every level loads, checkpoint-toast (w3-2) + gate-toast (w3-6) fire, mimics render/wake, freeze+beam+crumble render, death/respawn stable across 12+ repeated deaths (no soft-lock, no stuck-below-tiles), w3-1 completed end-to-end w/ progression saved, no console errors.

## World 2 Puzzle Redesign (2026-06, Voltgrid City) — DONE
Extended switch/gate to ORDERED multi-switch (Switch.order; isGateOpen now requires ALL switches armed; out-of-order press emits 'switchDenied' -> 'Locked — wrong order!' toast). 7 levels: w2-1 Piston Alley (moving-trap timing), w2-2 Swing Shift (moving platform/gap), w2-3 Backwards Alley (reverse zone + pit), w2-4 Double Lock (ORDERED two-switch gate — far switch first, backtrack to near), w2-5 Crossfire (laser+pit+piston combo), w2-6 Collapse Run (exploding-platform trap chain), w2-7 Voltgrid Gauntlet (laser+reverse+switch finale).
Verified: headless controller proved all 7 physically solvable; death/respawn on each; ordered-gate logic (locked->arm->open) = 19/19. testing_agent iteration_3: ordered gate (Locked/armed/opened), single-switch regression, and death/respawn all PASS live, no console errors.

## World 1 Puzzle Redesign (2026-06, Neon Foundry) — DONE
NEW switch->gate mechanic (types Switch/Gate; engine switchState/checkSwitches/isGateOpen + gates in collectSolids; render drawGate/drawSwitch; GameScreen 'Gate opened!' toast, data-testid=gate-toast). World 1 = 6 distinct brain-puzzles:
- w1-1 First Steps (LEARN run+jump) | w1-2 Rhythm Gate (TIMING, 2 offset laser gates) | w1-3 Watch Your Step (FAKE tiles/observe) | w1-4 Two Roads (CHOICE stones vs bold shard) | w1-5 Blind Bridge (MEMORY hidden dark-zone bridge) | w1-6 The Lever (SWITCH opens energy gate).
Verified: headless informed-bot proved all 6 physically solvable (0 deaths); death/respawn + checkpoint + switch->gate(persist) + exit/progression = 21/21. testing_agent iteration_2: death/respawn, checkpoint-respawn, switch->gate all PASS live, no console errors. Level-select cards now have data-testid=level-card-<id>.

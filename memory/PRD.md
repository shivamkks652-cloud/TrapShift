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

## Launch Polish: Win Juice + Audio/Touch Settings (2026-06) — DONE
- Level Complete overlay upgraded (`ResultsOverlay.tsx`): 3-star zoom-in, confetti burst (CSS `ts-confetti`), SPEED RUN medal (time<=parTime) + PERFECT badge (3 stars), win fanfare on mount. testids: results-overlay, result-star-1/2/3, result-medals.
- Settings (`SettingsScreen.tsx`): separate MUSIC + SFX volume sliders, TOUCH SIZE + OPACITY sliders, plus existing sensitivity + toggles; all persisted (storage GameSettings: musicVolume/sfxVolume/touchScale/touchOpacity, getSettings merges defaults). testids: music-volume-slider, sfx-volume-slider, touch-scale-slider, touch-opacity-slider, sensitivity-slider, settings-back-btn.
- Audio (`audio.ts`): setMusicVolume/setSfxVolume applied over BASE_MUSIC 0.34 / BASE_SFX 0.9; GameScreen applies stored volumes on mount. Touch controls (`GameCanvas.tsx`) scale+opacity from settings.
Verified: typecheck clean, headless harness 43/43, testing_agent iteration_6 = ZERO console errors, 5 sliders persist, touch controls reflect settings live, all 7 worlds smoke-pass + Endless loads; win-juice UI visually confirmed by main agent (stars+SPEED RUN+PERFECT+confetti on w1-1).
Known minor (not a bug): stored music/sfx volume is applied on GameScreen mount; MainMenu/Endless music uses defaults until a story level is entered — could be lifted to app root later.

## Safe-Start Runway + Duration Ramp + Louder Audio (2026-06) — DONE
User bugs: obstacles appearing at the spawn point; wanted longer levels with progress and stronger sound.
- `levels/index.ts` now wraps every level through `withRunway(level, pad)` where `pad = 4 + (world-1)` (W1=4 … W7=10 tiles). It prepends an obstacle-free SOLID ground runway on the left and shifts ALL x-coords (playerStart, exit, checkpoints, shards, every hazard/zone incl. darkZone bridgeTiles, firewall startX/endX, rotating cx). Guarantees a safe spawn on solid ground with no hazard/gap, and makes later worlds longer (more duration as you progress). parTime nudged by ~pad*0.4.
- Audio strengthened in `audio.ts`: sfxGain 0.5→0.9, musicGain 0.22→0.34, bass 0.12→0.17, melody note 0.08→0.12 (mute path updated to match).
Verified: typecheck clean, headless harness ALL 43 levels still solvable with the runway (w3-4 stochastic, passes 3/3), and in-game screenshot confirms a long safe runway before the first obstacle (w7-1 rift now well right of spawn).

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

## Daily Streak + Audio Boot Fix (2026-09-10) — DONE
User asked (Hinglish): "Daily streak" feature for retention; plan confirmed via ask_human (flame counter, standard reset rule, no shard rewards for now, plus audio fix in same round).
- storage.ts: new `DailyStreak { count, lastLoginDate }` in SaveData (old saves auto-migrate via default merge) + `recordDailyLogin()` — same day = no-op, yesterday = +1, gap = reset to 1 (local date based).
- MainMenu.tsx: flame (Lucide) + streak count pill with orange neon glow in bottom bar (`data-testid="daily-streak-counter"`); also added data-testids to Play/Endless/Daily/Skins/Settings/Mute buttons (P2 backlog item done).
- App.tsx: audio boot fix — `setMusicVolume`/`setSfxVolume` from saved settings now applied at app root on mount, so MainMenu/endless music respects user volume before entering any story level.
Verified: tsc clean, streak logic unit test 4/4 (fresh=1, same-day no-op, consecutive +1, gap reset), screenshots (mobile 390 + desktop 1920) show flame counter rendering. Headless 43-level bot unaffected (no level/physics changes).

## Backlog / Next
- P1: "New Best!" celebration in Endless mode (high-score badge + confetti).
- P2: Skin unlock celebration juice; promo video storyboard; toast queue fix (GameScreen.tsx).
- P2 (streak): optional daily-login shard rewards / 7-day milestone bonus (user deferred).

## Audio Fixes: Background Beep + Weak Volume (2026-09-10) — DONE
User reported (Hinglish): ek beep sound lagatar bajta hai (app minimize ke baad bhi), aur overall sound weak hai.
- Root cause: AudioContext kabhi suspend nahi hota tha — music loop (setTimeout arpeggio) + gate/gravity hums background mein bajte rehte the. Koi visibilitychange handler nahi tha.
- audio.ts: `initAudioLifecycle()` added — document.hidden / window blur par ctx.suspend(), wapas aane par (visible/focus + not muted) ctx.resume(). App.tsx root useEffect se call hota hai.
- Volume boost: BASE_MUSIC 0.34→0.52, BASE_SFX 0.9→1.0, music bass gain 0.17→0.22, melody peak 0.12→0.16, melody attack 0.01→0.02 (beep thoda softer).
Verified: tsc clean, level entry + canvas render OK, zero console errors. Minimize behavior real device par verify karna hai (code standard Web Audio lifecycle use karta hai).

## Music Redesign + Per-Level Sound + Strong Haptics (2026-09-10) — DONE
User asked (Hinglish): beep sound change karo, har level ka game sound alag ho, haptics strong karo. Plan confirmed via ask_human (Soft Synthwave, per-level flavor, navigator.vibrate boost).
- audio.ts: music engine REWRITTEN — old beep arpeggio replaced with synthwave layers: warm pad chords (slow swell, chord progression i-VI-III-VII rotated per level), deep bass pulse per bar, soft lowpass-filtered pluck melody, high-passed noise hat on off-beats. WORLD_MOOD per world (filter/pad/pluck/tempo), W7 keeps glitch-skip + wider detune.
- Per-level variation: startMusic(world, variant) — GameScreen passes level number from id (w3-2 -> variant 2); tempo 0.86-1.14x, melody octave, 6 melody contours, chord rotation => 43 unique feels. Endless=variant 0, Daily=variant 3.
- haptics.ts: central 2.6x boost (cap 260ms); strong single hits (>=30ms, deaths) become double-buzz [0, x, 60, 1.6x]. All 10 engine call sites automatically stronger.
- USER ACTION NEEDED (local): AndroidManifest.xml mein `<uses-permission android:name="android.permission.VIBRATE" />` add karna hai, warna real device par vibration nahi chalega.
Verified: tsc clean, mock-AudioContext run of all 7 worlds x 3 variants OK, headless bot 43/43 pass (2/3 runs clean; 1 flaky W7 random-rift bot run, no physics change), live level w1-1 runs with zero console errors.

## Automatic Capacitor Haptics Plugin (2026-09-10) — DONE
User asked: Kya AndroidManifest wala bhi automatic ho jayega?
- Installed `@capacitor/haptics` plugin (v8.0.2).
- Rewrote `src/game/haptics.ts` to use `@capacitor/haptics` (`ImpactStyle.Heavy` for deaths >=30ms, Medium for switches/bursts, Light for small impacts) with automatic fallback to `navigator.vibrate`.
- Benefit: Capacitor automatically injects native Android haptics bindings & permissions during `npx cap sync` / Android Gradle build. Zero manual XML edits needed by the user.
Verified: tsc clean, 43/43 levels auto-bot pass.

## Music Redesign v2: No-Beep Per-Level Loops (2026-09-10) — DONE
User feedback: "Beep sound abhi bhi aa raha hai level 2 se, har level par alag sound chahiye, beep nahi."
- audio.ts: music engine rewritten with 6 LEVEL_FLAVORS (calm_pad, chime, bass_pulse, soft_rhythm, dreamy_arp, atmospheric).
- Melody patterns are seeded-random (mulberry32) per world+level, so every level has a unique 8-note contour.
- Instruments restricted to soft sine/triangle with lowpass filter, long attack/decay — no harsh square/sawtooth beeps.
- World mood still controls tempo/filter (e.g., World 5 dark slow, World 6 digital bright), level flavor controls instrument mix/pattern.
- GameScreen passes level number as variant; Endless=0, Daily=3.
Verified: tsc clean, 49 mock configs run clean, headless bot 43/43 PASS.

## Music Redesign v3: Pure Ambient (2026-09-10) — DONE
User feedback: "Beep sound nhi fix ho rha, bilkul nahi chahiye."
- Root cause: previous versions still had repeating melody notes (plucks) that sounded like beeps.
- audio.ts: COMPLETE rewrite to pure ambient system — NO repeating melody, NO step-based pattern.
- Now: slow evolving pad chords (3-6s interval), continuous deep bass drone or slow pulse, very rare soft chime (10-20% chance per chord).
- 6 AMBIENT_FLAVORS (calm, dream, deep, glow, mist, pulse) with different instruments/gains/tempo per level.
- World mood controls chord interval, filter cutoff, root offset.
- GameScreen/EndlessScreen still pass variant; each level gets different flavor + chord rotation.
Verified: tsc clean, 49 mock configs run clean, 43/43 levels solver PASS.

## Beep + Crackling ROOT FIX (2026-09-10) — DONE
User feedback: "Level 2 se beep chal raha hai + sound crack ho raha hai."
- ROOT CAUSE 1 (beep): Laser/electric gate hums were 2600-3800Hz sawtooth/square (literal beep), started from w1-2 "Rhythm Gate" (first level with laser gates) — AND gateHumStop was never called on level exit, so hums played FOREVER across screens.
- ROOT CAUSE 2 (crackling): musicGain (0.52) + sfxGain (1.0) both fed destination directly; stacked SFX+music clipped past 1.0.
- Fixes in audio.ts: (a) gate hums now low energy rumble 115Hz sine / 170Hz triangle; (b) new stopAllHums() exported, called from GameCanvas unmount cleanup; (c) master DynamicsCompressor (-12dB threshold, 12:1) inserted before destination; BASE_MUSIC 0.45, BASE_SFX 0.85; (d) ambient chime capped at 2x octave with soft 0.15s attack.
Verified: tsc clean, mock audio test (49 configs + hum lifecycle) clean, headless bot 43/43 PASS.

## Piston Lethality + Audio Toggles + Full E2E (2026-06-11) — DONE
User feedback (Hinglish): "Piston Alley me kuch nahi hota, piston ke paas jaane par player marna chahiye; respawn checkpoint se ho start se nahi; sound fix; Music/SFX on-off; full E2E test."
- ENGINE FIX (real bug): moving crusher/piston walls were solid-only, never lethal. Now checkHazards() kills on overlap of any non-"platform" MovingWall with cause "crush" (sfx.crusherClunk+death, orange particles, vibrate). collectSolids() no longer adds non-platform walls as solids (prevents eject-through-floor "fell" deaths). Verified via headless engine test: w2-1 piston crushes a standing player (cause=crush); respawn uses latest activeCheckpoint else level start.
- LEVEL TUNING: w2-1 "Piston Alley" piston speed 1.9→1.1 for fair, telegraphed timing (hard-but-fair). Verified solvable.
- AUTO-BOT: all_test.ts bot upgraded with stop-and-go navigation for lethal moving walls (sit in safe column left of nearest wall, dash across only when it stays retracted ~0.75s). Result: ALL 43 levels PASS again.
- AUDIO: added Music ON/OFF (musicEnabled) + SFX ON/OFF (sfxEnabled) to GameSettings (default true), gated via setMusicEnabled/setSfxEnabled (musicGain/sfxGain=0 when off), persisted in localStorage, applied at App boot. SettingsScreen has music-toggle + sfx-toggle. (Beep/crackling already root-fixed earlier: low-freq gate hums + master compressor + pure-ambient music.)
- HUD data-testids added: hud-timer, hud-shards, hud-death-counter, hud-pause-btn.
- Testing: tsc clean; headless 43/43 PASS; testing_agent iteration_7 = ZERO bugs, 100% acceptance criteria (menu testids, settings toggle persistence, w1-1 death/respawn via HUD death counter, w2-1 loads/pistons animate, no console errors).

## Piston Danger Glow + Endless New Best (2026-06-11) — DONE
User approved two enhancements.
- PISTON TELEGRAPH (render.ts): for lethal crusher/plasmaWall moving walls (axis "y"), when the piston is retracted but about to slam down (velocity>0 and dist<range*0.6), drawPistonWarning() pulses a red-orange floor glow strip + rising danger column + chevron markers at the piston's landing point. Also brightens the crusher (nearEnd||slammingSoon). Makes the timing window readable = hard-but-fair. Verified visually in w2-1 (red glow under pistons; HUD "1 deaths" confirmed piston crush + respawn working live).
- ENDLESS NEW BEST (EndlessScreen.tsx): on game over, detect score>prevBest (before persisting) -> isNewBest state -> show a glowing "NEW BEST!" trophy badge (data-testid=new-best-badge) + confetti burst (reuses global .ts-confetti-piece CSS) + sfx.win(). Resets on retry. Works for both endless and daily modes.
Verified: tsc clean, headless 43/43 PASS, w2-1 piston glow + crush/respawn visually confirmed, no console errors.

# TrapShift

A premium mobile-first 2D neon sci-fi platformer where nothing is what it looks like — fake platforms, gravity flips, mimic enemies, and other traps punish careless players across 24 handcrafted levels plus endless/daily challenge modes.

**Version:** v1.0.0

## Product

- **Story mode** — 24 handcrafted levels across 4 neon-themed worlds (6 levels each), each with unique trap mechanics, shards to collect, and star ratings based on time/deaths.
- **Endless mode** — seeded procedural level generator with escalating difficulty and a running best score.
- **Daily mode** — a shared daily seed so all players face the same procedural run, with a daily best score.
- **Skins** — unlockable player skins purchased with shards earned from level completion.
- Premium game feel: particle effects, camera shake, squash/stretch animation on the player.

## Stack

- React + Vite + TypeScript
- Canvas 2D rendering — custom physics/collision engine (no third-party game engine)
- Procedural WebAudio for all SFX and music (no audio files)
- localStorage for all persistence (no backend/DB)
- Capacitor for Android packaging, `@capacitor-community/admob` for ads

## Run locally

```bash
npm install
npm run dev
```

`PORT` and `BASE_PATH` are optional — they default to `5173` and `/` if not set, so this works on any OS out of the box.

## Build

```bash
npm run build
npm run typecheck
```

## Android / Play Store

See [BUILD.md](./BUILD.md) for the full Android build and signing guide, including AdMob production setup.

## Where things live

- `src/game/engine.ts` — core physics/collision/trap simulation loop
- `src/game/render.ts` — canvas rendering (terrain, traps, particles, player)
- `src/game/types.ts` — shared type defs for levels, traps, zones
- `src/game/constants.ts` — tuning constants (tile size, physics, etc.)
- `src/game/storage.ts` — localStorage save data, skins, progression
- `src/game/audio.ts` — procedural WebAudio SFX/music
- `src/game/ads.ts` — AdMob ad manager (banner/interstitial/rewarded)
- `src/game/levels/` — 24 handcrafted levels across 4 worlds
- `src/game/endless.ts` — seeded procedural level generator for endless/daily modes
- `src/components/` — React UI: menu, world/level select, game screen, HUD, overlays, skin shop
- `src/App.tsx` — internal screen-state machine (no router)
- `android/` — Capacitor-generated native Android project

## License

MIT — see [LICENSE](./LICENSE).

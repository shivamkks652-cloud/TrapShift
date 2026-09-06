# TrapShift — Play Store Asset Pack

All graphics use the game's neon identity: electric cyan (#4bf3ff) + magenta (#ff3df0)
glow on a deep near-black cyber background (#020814 / #0b1026).

## Contents

### Icons / Logo
- `app_icon_512.png` — **512×512** Google Play store icon (32-bit PNG, opaque). Upload as the app icon.
- `app_icon_1024.png` — 1024×1024 hi-res master.
- `logo_wordmark_transparent.png` — TRAPSHIFT wordmark (transparent PNG) for marketing.
- `logo_emblem_transparent.png` — icon-only shift emblem (transparent PNG).

### Feature graphic
- `feature_graphic_1024x500.png` — **1024×500** Play Store feature graphic (key art + logo + tagline).

### Icon previews (how it looks masked)
- `icon_preview_circle.png`, `icon_preview_squircle.png` — 1024 masked previews.

### Promo
- `promo.gif` — short looping slideshow of the screenshots (for social/store preview; Play Store's promo-video slot needs a YouTube link).

### Android icon kit (fixes the default-icon problem)
- See `/app/frontend/android-icon-kit/` — a drop-in `res/` tree (all mipmap densities +
  adaptive icon XML + background color). Copy it over your local
  `frontend/android/app/src/main/res/` and rebuild — no tooling needed. Full steps in
  that folder's `README.md`.

### Feature graphic

### Splash / marketing
- `splash_preview_1080x1920.png` — portrait splash/marketing render.

### Screenshots (`/screenshots`)
Phone (landscape 16:9, 1920×1080):
- `phone_01_title.png`, `phone_02.png` … `phone_05.png`

7-inch tablet (2048×1200):
- `tablet7_01_title.png`, `tablet7_02.png`, `tablet7_03.png`, `tablet7_04.png`

10-inch tablet (2560×1600):
- `tablet10_01_title.png`, `tablet10_02.png`, `tablet10_03.png`, `tablet10_04.png`

> Play Store requires **min 2** screenshots per form factor. All sizes above are within
> Play's accepted range (min 320px, max 3840px, ratio between 1:2 and 2:1).

## Suggested store listing copy

**App name:** TrapShift

**Short description (80 chars max):**
> Nothing is what it looks like. Think first, then shift — a neon puzzle platformer.

**Full description:**
> TrapShift is a neon puzzle-platformer where every level hides a trick. Fake tiles,
> laser gates, gravity flips, steam jets, firewalls and reality-bending chaos rifts —
> observe, plan, time your move, then shift.
>
> • 7 neon worlds, 42 handcrafted brain-teaser levels
> • Learn one idea per level, then combine them under pressure
> • Fair-but-tough: fast respawns and smart checkpoints keep it addictive
> • Simple one-thumb controls; difficulty comes from thinking, not fiddly inputs
> • Endless and Daily challenge modes, unlockable runner skins
>
> Easy to understand. Hard to master. Every level has a new idea.

## Content rating / category
- Category: Games → Puzzle (or Arcade)
- No ads/IAP wired in this build (AdMob was removed).

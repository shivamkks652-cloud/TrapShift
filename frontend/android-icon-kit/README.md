# TrapShift — Android App Icon Kit (no tooling needed)

Your local APK still shows the default Capacitor icon because the native `android/`
project lives only on your machine and was never given the TrapShift icon. This kit
fixes that with a simple **copy-paste** — no Node 22, no `@capacitor/assets` required.

## What's inside
`res/` — a drop-in Android resource tree:
- `mipmap-mdpi|hdpi|xhdpi|xxhdpi|xxxhdpi/`
  - `ic_launcher.png` (square legacy icon)
  - `ic_launcher_round.png` (round legacy icon)
  - `ic_launcher_foreground.png` (adaptive foreground, 108dp)
- `mipmap-anydpi-v26/ic_launcher.xml` + `ic_launcher_round.xml` (adaptive icon)
- `values/ic_launcher_background.xml` (adaptive background color `#0b1026`)

`playstore-icon-512.png` — 512×512 Google Play store icon.

## How to apply (2 minutes)

1. Open your local project's Android res folder:
   `frontend/android/app/src/main/res/`
2. Copy EVERYTHING from this kit's `res/` folder into that folder, **overwriting**
   the existing `mipmap-*`, `mipmap-anydpi-v26` and `values` files when asked.
   (macOS/Linux, from the `frontend/` folder:)
   ```bash
   cp -R android-icon-kit/res/* android/app/src/main/res/
   ```
3. Make sure `AndroidManifest.xml` references the launcher icon (Capacitor's default
   already does):
   ```xml
   android:icon="@mipmap/ic_launcher"
   android:roundIcon="@mipmap/ic_launcher_round"
   ```
4. Rebuild in Android Studio (Build → Clean Project, then Run). The new neon icon
   will appear. If the launcher still shows the old icon, uninstall the app once and
   reinstall (Android caches launcher icons).

## Splash screen
Splash source images are in `frontend/assets/` — regenerate splash + icons together
later with `npx @capacitor/assets generate --android` (needs Node ≥ 22) if you prefer
the automated route; see `frontend/assets/README.md`.

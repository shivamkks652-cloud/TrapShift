# App Icon & Splash — Capacitor source assets

These are the SOURCE images for generating the Android app icon (adaptive + legacy)
and the native splash screen. `capacitor.config.ts` already points the splash plugin
at the resource name `splash` and uses background `#020814`.

## Files
- `icon.png` / `icon-only.png` — 1024×1024 opaque app icon (emblem on dark tile).
- `icon-foreground.png` — 1024×1024 transparent adaptive-icon foreground (emblem, centred in safe zone).
- `icon-background.png` — 1024×1024 adaptive-icon background (dark cyber tile).
- `splash.png` / `splash-dark.png` — 2732×2732 splash (logo centred on dark bg).

## Generate the native resources (run LOCALLY — needs Node >= 22)

From the `frontend/` folder, after `npx cap add android`:

```bash
# one-time
npm i -D @capacitor/assets      # or: yarn add -D @capacitor/assets

# generate all Android icon densities, adaptive icons and splash screens
npx @capacitor/assets generate --android \
  --iconBackgroundColor '#020814' \
  --iconBackgroundColorDark '#020814' \
  --splashBackgroundColor '#020814' \
  --splashBackgroundColorDark '#020814'

npx cap sync android
```

This writes into `android/app/src/main/res/mipmap-*` (ic_launcher / adaptive) and the
splash drawables automatically. Then build the APK/AAB in Android Studio.

> Note: this container runs Node 20, so `@capacitor/assets` (needs Node >= 22) can't run
> here — run the command on your local machine where you build the APK.

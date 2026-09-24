# Build Guide — Android APK/AAB

This project uses [Capacitor](https://capacitorjs.com/) to package the web game as a native Android app. The `android/` directory in this repo is a fully configured native project (manifest, icons, splash screens, orientation, permissions, signing scaffold, and the `capacitor-cordova-android-plugins` module) — it opens directly in Android Studio.

## Prerequisites

- Node.js 18+ and npm/pnpm
- JDK 17
- Android Studio (or just the Android command-line SDK + Gradle)
- `ANDROID_HOME`/`ANDROID_SDK_ROOT` pointing at your SDK install

## 1. Install dependencies and build the web bundle

```bash
npm install
npm run build
```

`PORT`/`BASE_PATH` are optional (default to `5173`/`/`), so this works unmodified on Windows, macOS, and Linux. This produces `dist/public`, which `capacitor.config.ts` points to as the Android app's web assets.

## 2. Sync the web build into the Android project

```bash
npx cap sync android
```

**Always run this after `npm install` and after any web app change, and before opening/building in Android Studio.** It copies the fresh web build into `android/app/src/main/assets/public` and regenerates the `capacitor-cordova-android-plugins` Gradle module (including `cordova.variables.gradle`) that `android/settings.gradle` depends on.

This repo already ships a copy of `android/capacitor-cordova-android-plugins/` committed to git as a safety net, so Android Studio can open the project even before you run `cap sync` for the first time. There are no real Cordova plugins in this project (only Capacitor plugins), so this folder's contents are static boilerplate and safe to regenerate at any time — `cap sync` will overwrite it identically.

If you ever see an error like:

```
Could not read script: android/capacitor-cordova-android-plugins/cordova.variables.gradle
```

it means that folder is missing or stale — just re-run `npx cap sync android` before opening/building in Android Studio.

## 3. Configure release signing

Real Play Store builds must be signed with a persistent upload keystore — never commit it.

```bash
keytool -genkey -v -keystore trapshift-release.keystore -alias trapshift \
  -keyalg RSA -keysize 2048 -validity 10000
```

Copy `android/keystore.properties.example` to `android/keystore.properties` and fill in the real values:

```properties
storeFile=../trapshift-release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=trapshift
keyPassword=YOUR_KEY_PASSWORD
```

`keystore.properties` is gitignored. Without it, `android/app/build.gradle` produces an **unsigned** release build.

## 4. Build the APK or AAB

Either open the `android/` folder directly in Android Studio and let Gradle Sync run, or use the command line:

```bash
cd android

# Debug APK (for local testing on a device/emulator, not for Play Store)
./gradlew assembleDebug

# Release APK (signed, sideloadable)
./gradlew assembleRelease

# Release AAB (required for Play Store upload)
./gradlew bundleRelease
```

Output locations:

- Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release APK: `android/app/build/outputs/apk/release/app-release.apk`
- Release AAB: `android/app/build/outputs/bundle/release/app-release.aab`

## 5. AdMob configuration

AdMob is wired via `@capacitor-community/admob` (see `src/game/ads.ts`). Real ads run only on the native build; the web preview simulates them.

- **Ad units** (rewarded `…/2262699194`, banner `…/3575780862`) already live in `src/game/ads.ts`. Dev/debug builds automatically use Google's official TEST units (`import.meta.env.PROD` switch); production builds use the real units.
- **App ID — AUTOMATIC**: `npm run cap:sync` chalao (ye `cap sync android` ke saath `scripts/patch-admob-manifest.mjs` bhi chalata hai jo `android/app/src/main/AndroidManifest.xml` me App ID meta-data khud inject kar deta hai — idempotent, har baar safe). Kabhi manually manifest edit karne ki zaroorat nahi. Sirf manifest patch karna ho to `npm run patch:admob`.

Debug builds show test ads — do not click real production ads from your own device during testing (AdMob policy).

## 6. Play Store checklist

- [ ] Real AdMob App ID + ad unit IDs (not test IDs)
- [ ] Real signing keystore, `versionCode` bumped for each upload
- [ ] Privacy policy URL (required if using ads/analytics)
- [ ] Store listing assets: screenshots, feature graphic, short/full description
- [ ] Content rating questionnaire completed in Play Console
- [ ] Target API level meets current Play Store requirements

## Notes

- App ID (package name): `com.trapshift.app` — cannot change after first Play Store upload.
- Orientation is locked to landscape.
- The app icon source (`src/assets/app-icon-source.png`) was AI-generated and resized into all density buckets already committed under `android/app/src/main/res/`.

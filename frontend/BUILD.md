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

## 5. Switch AdMob to production ad units

Before submitting to the Play Store:

1. Create an AdMob app + ad units at [admob.google.com](https://admob.google.com) (banner, interstitial, rewarded).
2. In `src/game/ads.ts`, set `USE_TEST_ADS = false` and fill in `PROD_AD_UNIT_IDS` with your real IDs.
3. In `android/app/src/main/res/values/strings.xml`, replace `admob_app_id` with your real AdMob **App ID** (not an ad unit ID).
4. Rebuild (`npm run build && npx cap sync android`) and re-run the Gradle build.

Shipping with the default test IDs is safe (Google's official test units) but earns no revenue and must not be submitted to Play as final.

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

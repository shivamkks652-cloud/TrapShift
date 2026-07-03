# Build Guide — Android APK/AAB

This project uses [Capacitor](https://capacitorjs.com/) to package the web game as a native Android app. The `android/` directory in this repo is a fully configured native project (manifest, icons, splash screens, orientation, permissions, signing scaffold). It has **not** been compiled into an APK/AAB in this repository — that step requires a machine with the Android SDK/Gradle installed, which this authoring environment did not have.

## Prerequisites

- Node.js 18+ and npm/pnpm
- JDK 17
- Android Studio (or just the Android command-line SDK + Gradle)
- `ANDROID_HOME`/`ANDROID_SDK_ROOT` pointing at your SDK install

## 1. Install dependencies and build the web bundle

```bash
npm install
PORT=5000 BASE_PATH=/ npm run build
```

This produces `dist/public`, which `capacitor.config.ts` points to as the Android app's web assets.

## 2. Sync the web build into the Android project

```bash
npx cap sync android
```

Run this every time the web app changes and you need a new native build.

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

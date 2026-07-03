// AdMob integration for the Android build.
//
// TrapShift itself is a plain web app (Vite + Canvas). To run AdMob's real
// native SDK it must be wrapped in a native shell — see the Capacitor
// android/ project generated alongside this file. In the browser preview
// (no native shell present) every call below is a safe no-op so the web
// build keeps working normally in dev and on any non-Android platform.
//
// Swapping to production ad units: fill in `PROD_AD_UNIT_IDS` below and
// flip `USE_TEST_ADS` to false once you have real AdMob ad unit IDs.

import { Capacitor } from "@capacitor/core";

// Official Google-provided test ad unit IDs (safe to ship, never earn revenue).
const TEST_AD_UNIT_IDS = {
  banner: "ca-app-pub-3940256099942544/6300978111",
  interstitial: "ca-app-pub-3940256099942544/1033173712",
  rewarded: "ca-app-pub-3940256099942544/5224354917",
};

// Fill these in with real AdMob ad unit IDs before a production release.
const PROD_AD_UNIT_IDS = {
  banner: "",
  interstitial: "",
  rewarded: "",
};

// Keep true until real ad unit IDs are set in PROD_AD_UNIT_IDS above.
const USE_TEST_ADS = true;

function adUnitIds() {
  if (!USE_TEST_ADS && PROD_AD_UNIT_IDS.banner && PROD_AD_UNIT_IDS.interstitial && PROD_AD_UNIT_IDS.rewarded) {
    return PROD_AD_UNIT_IDS;
  }
  return TEST_AD_UNIT_IDS;
}

function isNativeAndroid(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  } catch {
    return false;
  }
}

let initialized = false;
let initPromise: Promise<void> | null = null;
let bannerVisible = false;
let interstitialReady = false;
let rewardedReady = false;

async function getPlugin() {
  const mod = await import("@capacitor-community/admob");
  return mod.AdMob;
}

export async function initAds(): Promise<void> {
  if (!isNativeAndroid()) return;
  if (initialized) return;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      const AdMob = await getPlugin();
      await AdMob.initialize({
        initializeForTesting: USE_TEST_ADS,
        testingDevices: [],
        maxAdContentRating: "General" as never,
      });
      initialized = true;
    } catch {
      // Ads are a non-critical enhancement — never let init failure affect gameplay.
      initialized = false;
    }
  })();
  return initPromise;
}

// --- Banner: menus only ---

export async function showMenuBanner(): Promise<void> {
  if (!isNativeAndroid()) return;
  await initAds();
  if (!initialized || bannerVisible) return;
  try {
    const AdMob = await getPlugin();
    const { BannerAdPosition, BannerAdSize } = await import("@capacitor-community/admob");
    await AdMob.showBanner({
      adId: adUnitIds().banner,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: USE_TEST_ADS,
    });
    bannerVisible = true;
  } catch {
    bannerVisible = false;
  }
}

export async function hideMenuBanner(): Promise<void> {
  if (!isNativeAndroid() || !bannerVisible) return;
  try {
    const AdMob = await getPlugin();
    await AdMob.hideBanner();
  } catch {
    /* ignore */
  } finally {
    bannerVisible = false;
  }
}

// --- Interstitial: after appropriate gameplay intervals, frequency-capped ---

const INTERSTITIAL_META_KEY = "trapshift.ads.meta.v1";
const LEVELS_BETWEEN_INTERSTITIALS = 3;
const MIN_MS_BETWEEN_INTERSTITIALS = 90_000;

interface AdsMeta {
  completionsSinceLastAd: number;
  lastInterstitialAt: number;
}

function loadAdsMeta(): AdsMeta {
  try {
    const raw = localStorage.getItem(INTERSTITIAL_META_KEY);
    if (raw) return { completionsSinceLastAd: 0, lastInterstitialAt: 0, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { completionsSinceLastAd: 0, lastInterstitialAt: 0 };
}

function saveAdsMeta(meta: AdsMeta) {
  try {
    localStorage.setItem(INTERSTITIAL_META_KEY, JSON.stringify(meta));
  } catch {
    /* ignore */
  }
}

async function prepareInterstitial(): Promise<void> {
  if (!isNativeAndroid()) return;
  await initAds();
  if (!initialized || interstitialReady) return;
  try {
    const AdMob = await getPlugin();
    await AdMob.prepareInterstitial({ adId: adUnitIds().interstitial, isTesting: USE_TEST_ADS });
    interstitialReady = true;
  } catch {
    interstitialReady = false;
  }
}

// Call after a level is completed and the player returns to level select.
// Never call this on death/retry — only on genuine level completion, so ads
// never interrupt an active attempt.
export async function maybeShowInterstitialAfterLevelComplete(): Promise<void> {
  if (!isNativeAndroid()) return;
  const meta = loadAdsMeta();
  meta.completionsSinceLastAd += 1;
  const now = Date.now();
  const dueByCount = meta.completionsSinceLastAd >= LEVELS_BETWEEN_INTERSTITIALS;
  const dueByTime = now - meta.lastInterstitialAt >= MIN_MS_BETWEEN_INTERSTITIALS;
  if (!dueByCount || !dueByTime) {
    saveAdsMeta(meta);
    return;
  }
  await prepareInterstitial();
  if (!interstitialReady) {
    saveAdsMeta(meta);
    return;
  }
  try {
    const AdMob = await getPlugin();
    await AdMob.showInterstitial();
    meta.completionsSinceLastAd = 0;
    meta.lastInterstitialAt = now;
  } catch {
    /* ad failed to show — try again next time it's due */
  } finally {
    interstitialReady = false;
    saveAdsMeta(meta);
  }
}

// --- Rewarded: optional bonus-shards reward only, never gates progression ---

async function prepareRewarded(): Promise<void> {
  if (!isNativeAndroid()) return;
  await initAds();
  if (!initialized || rewardedReady) return;
  try {
    const AdMob = await getPlugin();
    await AdMob.prepareRewardVideoAd({ adId: adUnitIds().rewarded, isTesting: USE_TEST_ADS });
    rewardedReady = true;
  } catch {
    rewardedReady = false;
  }
}

export async function isRewardedAdAvailable(): Promise<boolean> {
  if (!isNativeAndroid()) return false;
  await prepareRewarded();
  return rewardedReady;
}

// Resolves true if the player watched the ad to completion and earned the reward.
export async function showRewardedBonus(): Promise<boolean> {
  if (!isNativeAndroid()) return false;
  await prepareRewarded();
  if (!rewardedReady) return false;
  try {
    const AdMob = await getPlugin();
    const reward = await AdMob.showRewardVideoAd();
    return !!reward;
  } catch {
    return false;
  } finally {
    rewardedReady = false;
  }
}

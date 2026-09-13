// Central AdMob boundary for TrapShift. Real ads run ONLY on the native Android
// build; on web preview every call is a safe simulation (Capacitor.isNativePlatform
// guard) so the full death -> rewarded-continue flow stays testable in a browser.
// Uses Google TEST ad units in dev and the real production units in a production
// build. Reward is granted ONLY when the SDK confirms the Rewarded event — never
// on show/dismiss/fail.
import { Capacitor } from "@capacitor/core";

const isProd = import.meta.env.PROD;

// Production AdMob IDs (publisher 3735972538807236). App ID goes in
// android/app/src/main/AndroidManifest.xml as com.google.android.gms.ads.APPLICATION_ID.
export const AdConfig = {
  appId: "ca-app-pub-3735972538807236~2413074131",
  rewardedAdId: isProd
    ? "ca-app-pub-3735972538807236/2262699194"
    : "ca-app-pub-3940256099942544/5224354917", // Google TEST rewarded
  bannerAdId: isProd
    ? "ca-app-pub-3735972538807236/3575780862"
    : "ca-app-pub-3940256099942544/9214589741", // Google TEST banner
  isTesting: !isProd,
};

const native = Capacitor.isNativePlatform();
let initialized = false;
let canRequestAds = false;
let rewardInFlight = false;

export async function initAds(): Promise<void> {
  if (!native || initialized) return;
  try {
    const { AdMob, AdmobConsentStatus } = await import("@capacitor-community/admob");
    await AdMob.initialize();
    let info = await AdMob.requestConsentInfo();
    if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) {
      info = await AdMob.showConsentForm();
    }
    canRequestAds = !!info.canRequestAds;
    initialized = true;
  } catch (e) {
    // Ads are optional — never block launch or gameplay.
    console.warn("[ads] init failed:", e);
  }
}

function usable(): boolean {
  return native && initialized && canRequestAds;
}

export async function showMenuBanner(): Promise<void> {
  if (!usable()) return;
  try {
    const { AdMob, BannerAdPosition, BannerAdSize } = await import("@capacitor-community/admob");
    await AdMob.showBanner({
      adId: AdConfig.bannerAdId,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: AdConfig.isTesting,
    });
  } catch (e) {
    console.warn("[ads] banner failed:", e);
  }
}

export async function hideMenuBanner(): Promise<void> {
  if (!native) return;
  try {
    const { AdMob } = await import("@capacitor-community/admob");
    await AdMob.hideBanner();
  } catch { /* ignore */ }
}

// Resolves true ONLY after the SDK confirms the reward. Fail/dismiss/unavailable
// -> false (caller then offers a normal respawn). One-at-a-time via rewardInFlight.
// On web preview this simulates a successfully watched ad after a short delay so
// the entire UI flow can be tested without a native build.
export async function showRewardedContinue(): Promise<boolean> {
  if (rewardInFlight) return false;
  rewardInFlight = true;
  try {
    if (!native) {
      await new Promise((r) => setTimeout(r, 1200));
      return true;
    }
    if (!usable()) return false;
    const { AdMob, RewardAdPluginEvents } = await import("@capacitor-community/admob");
    return await new Promise<boolean>(async (resolve) => {
      let settled = false;
      const done = (v: boolean) => { if (!settled) { settled = true; resolve(v); } };
      const rewarded = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => done(true));
      const failed = await AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => done(false));
      const dismissed = await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => done(false));
      const cleanup = () => { void rewarded.remove(); void failed.remove(); void dismissed.remove(); };
      try {
        await AdMob.prepareRewardVideoAd({ adId: AdConfig.rewardedAdId, isTesting: AdConfig.isTesting });
        await AdMob.showRewardVideoAd();
      } catch (e) {
        console.warn("[ads] rewarded failed:", e);
        done(false);
      }
      setTimeout(cleanup, 500);
    });
  } finally {
    rewardInFlight = false;
  }
}

// Reports whether a rewarded continue can be offered right now (drives the
// "Watch Ad & Continue" button visibility). Always true on web (simulated).
export async function isRewardedAdAvailable(): Promise<boolean> {
  if (!native) return true;
  return usable();
}

// Legacy bonus hook kept for ResultsOverlay compatibility.
export async function showRewardedBonus(): Promise<boolean> {
  return showRewardedContinue();
}

export async function maybeShowInterstitialAfterLevelComplete(): Promise<void> {
  // Intentionally no interstitials for now (rewarded-only monetization).
}

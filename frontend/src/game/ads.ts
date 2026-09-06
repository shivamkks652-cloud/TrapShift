// AdMob removed. TrapShift is a single-player game and does not need ads.
//
// The native @capacitor-community/admob plugin auto-registers a startup
// ContentProvider (MobileAdsInitProvider) that CRASHES the app on launch when
// no AdMob "Application ID" is present in AndroidManifest.xml. Since the game
// doesn't use ads, we drop the dependency entirely and keep these exports as
// safe no-ops so the rest of the app (menus, results, level flow) is unchanged.
// If you ever want ads back: `npm i @capacitor-community/admob`, add a valid
// APPLICATION_ID meta-data to AndroidManifest.xml, and restore the real calls.

export async function initAds(): Promise<void> {}

export async function showMenuBanner(): Promise<void> {}

export async function hideMenuBanner(): Promise<void> {}

export async function maybeShowInterstitialAfterLevelComplete(): Promise<void> {}

export async function isRewardedAdAvailable(): Promise<boolean> {
  return false;
}

export async function showRewardedBonus(): Promise<boolean> {
  return false;
}

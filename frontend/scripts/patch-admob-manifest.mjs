// Auto-injects AdMob configuration into native Android project files:
// 1. android/app/src/main/AndroidManifest.xml -> <meta-data com.google.android.gms.ads.APPLICATION_ID>
// 2. android/app/src/main/res/values/strings.xml -> <string name="admob_app_id">
// 3. android/app/src/main/res/values/strings.xml -> <string name="admob_banner_id">, <string name="admob_rewarded_id">
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_ID = "ca-app-pub-3735972538807236~2413074131";
const BANNER_ID = "ca-app-pub-3735972538807236/3575780862";
const REWARDED_ID = "ca-app-pub-3735972538807236/2262699194";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const androidRoot = path.join(__dirname, "..", "android");
const manifestPath = path.join(androidRoot, "app", "src", "main", "AndroidManifest.xml");
const stringsPath = path.join(androidRoot, "app", "src", "main", "res", "values", "strings.xml");

if (!fs.existsSync(androidRoot)) {
  console.log("[patch-admob] android/ folder nahi mila — pehle `npx cap add android` ya `git pull` chalao.");
  process.exit(0);
}

// --- 1. Patch AndroidManifest.xml ---
if (fs.existsSync(manifestPath)) {
  let xml = fs.readFileSync(manifestPath, "utf8");
  if (xml.includes("com.google.android.gms.ads.APPLICATION_ID")) {
    if (xml.includes(APP_ID)) {
      console.log("[patch-admob] AndroidManifest: App ID already correct.");
    } else {
      xml = xml.replace(
        /(android:name="com\.google\.android\.gms\.ads\.APPLICATION_ID"[\s\S]*?android:value=")[^"]*(")/,
        `$1${APP_ID}$2`
      );
      fs.writeFileSync(manifestPath, xml);
      console.log(`[patch-admob] AndroidManifest: App ID updated to ${APP_ID}`);
    }
  } else if (xml.includes("</application>")) {
    const metaData = `\n        <meta-data\n            android:name="com.google.android.gms.ads.APPLICATION_ID"\n            android:value="${APP_ID}"/>\n`;
    xml = xml.replace("</application>", `${metaData}    </application>`);
    fs.writeFileSync(manifestPath, xml);
    console.log(`[patch-admob] AndroidManifest: App ID injected (${APP_ID})`);
  }
}

// --- 2. Patch strings.xml (used by some Capacitor AdMob plugin versions) ---
if (fs.existsSync(stringsPath)) {
  let strXml = fs.readFileSync(stringsPath, "utf8");
  const entries = [
    { key: "admob_app_id", val: APP_ID },
    { key: "admob_banner_id", val: BANNER_ID },
    { key: "admob_rewarded_id", val: REWARDED_ID },
  ];

  for (const { key, val } of entries) {
    const regex = new RegExp(`<string name="${key}">[^<]*</string>`);
    if (regex.test(strXml)) {
      strXml = strXml.replace(regex, `<string name="${key}">${val}</string>`);
    } else if (strXml.includes("</resources>")) {
      strXml = strXml.replace("</resources>", `    <string name="${key}">${val}</string>\n</resources>`);
    }
  }
  fs.writeFileSync(stringsPath, strXml);
  console.log("[patch-admob] strings.xml: AdMob strings injected/updated.");
}

console.log("[patch-admob] SUCCESS: All AdMob configs patched.");

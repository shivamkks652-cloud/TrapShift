// Auto-injects AdMob configuration into native Android project files:
// 1. android/app/src/main/AndroidManifest.xml -> <meta-data com.google.android.gms.ads.APPLICATION_ID>
//    with xmlns:tools namespace + tools:replace="android:value" (zaroori — warna manifest merger
//    dependency ka empty value use karta hai aur app crash hoti hai)
// 2. android/app/src/main/res/values/strings.xml -> admob_app_id / admob_banner_id / admob_rewarded_id
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
  let changed = false;

  // 1a. xmlns:tools namespace (tools:replace ke liye zaroori)
  if (!xml.includes("xmlns:tools=")) {
    xml = xml.replace(
      /<manifest([^>]*)>/,
      '<manifest$1\n    xmlns:tools="http://schemas.android.com/tools">'
    );
    changed = true;
    console.log("[patch-admob] xmlns:tools namespace add kiya.");
  }

  // 1b. App ID meta-data (inject ya repair, hamesha tools:replace ke saath)
  if (xml.includes("com.google.android.gms.ads.APPLICATION_ID")) {
    if (!xml.includes(APP_ID)) {
      xml = xml.replace(
        /(android:name="com\.google\.android\.gms\.ads\.APPLICATION_ID"[\s\S]*?android:value=")[^"]*(")/,
        `$1${APP_ID}$2`
      );
      changed = true;
      console.log(`[patch-admob] App ID value update ki: ${APP_ID}`);
    }
    if (!xml.includes('tools:replace="android:value"')) {
      xml = xml.replace(
        /(android:name="com\.google\.android\.gms\.ads\.APPLICATION_ID"[^>]*?)(\s*\/>)/,
        '$1\n            tools:replace="android:value"$2'
      );
      changed = true;
      console.log("[patch-admob] tools:replace add kiya (merger conflict fix).");
    }
  } else if (xml.includes("</application>")) {
    const metaData = `\n        <meta-data\n            android:name="com.google.android.gms.ads.APPLICATION_ID"\n            android:value="${APP_ID}"\n            tools:replace="android:value"/>\n`;
    xml = xml.replace("</application>", `${metaData}    </application>`);
    changed = true;
    console.log(`[patch-admob] App ID inject kiya with tools:replace (${APP_ID})`);
  }

  if (changed) fs.writeFileSync(manifestPath, xml);
  else console.log("[patch-admob] AndroidManifest already fully patched.");
}

// --- 2. Patch strings.xml ---
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
  console.log("[patch-admob] strings.xml patched.");
}

console.log("[patch-admob] SUCCESS: All AdMob configs patched.");

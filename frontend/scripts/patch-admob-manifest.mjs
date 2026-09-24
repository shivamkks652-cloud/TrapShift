// Auto-injects the AdMob App ID meta-data into android/app/src/main/AndroidManifest.xml
// Runs after `cap sync android` via `npm run cap:sync` — idempotent, safe to run repeatedly.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_ID = "ca-app-pub-3735972538807236~2413074131";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(__dirname, "..", "android", "app", "src", "main", "AndroidManifest.xml");

if (!fs.existsSync(manifestPath)) {
  console.log("[patch-admob] android/ folder nahi mila — pehle `npx cap add android` chalao. Skip.");
  process.exit(0);
}

let xml = fs.readFileSync(manifestPath, "utf8");

if (xml.includes("com.google.android.gms.ads.APPLICATION_ID")) {
  if (xml.includes(APP_ID)) {
    console.log("[patch-admob] AdMob App ID pehle se present hai. OK.");
  } else {
    // Purana/galat App ID replace karo
    xml = xml.replace(
      /(android:name="com\.google\.android\.gms\.ads\.APPLICATION_ID"[\s\S]*?android:value=")[^"]*(")/,
      `$1${APP_ID}$2`
    );
    fs.writeFileSync(manifestPath, xml);
    console.log(`[patch-admob] AdMob App ID update kar diya: ${APP_ID}`);
  }
  process.exit(0);
}

const metaData = `\n        <meta-data\n            android:name="com.google.android.gms.ads.APPLICATION_ID"\n            android:value="${APP_ID}"/>\n`;

if (!xml.includes("</application>")) {
  console.error("[patch-admob] ERROR: </application> tag nahi mila manifest me. Manually add karo.");
  process.exit(1);
}

xml = xml.replace("</application>", `${metaData}    </application>`);
fs.writeFileSync(manifestPath, xml);
console.log(`[patch-admob] AdMob App ID inject ho gaya: ${APP_ID}`);
console.log("[patch-admob] Ab app build/run karo — crash fix ho jayega.");

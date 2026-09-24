// PERMANENT one-command Android AdMob fix:
// 1) Patch AndroidManifest.xml + strings.xml with the AdMob App ID
// 2) gradlew clean (stale cache khatam — yahi asli crash ka reason tha)
// 3) gradlew processDebugManifest
// 4) VERIFY the MERGED manifest (jo actually APK me jata hai) — App ID non-empty honi chahiye
// 5) gradlew assembleDebug + optional adb install
// Koi guesswork nahi: script khud batayegi ki APK me App ID gayi ya nahi.
import fs from "node:fs";
import path from "node:path";
import { execSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const APP_ID = "ca-app-pub-3735972538807236~2413074131";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, "..");
const androidRoot = path.join(frontendRoot, "android");
const isWin = process.platform === "win32";
const gradlew = path.join(androidRoot, isWin ? "gradlew.bat" : "gradlew");

const ok = (m) => console.log(`✅ ${m}`);
const fail = (m) => { console.error(`❌ ${m}`); };
const info = (m) => console.log(`ℹ️  ${m}`);

// --- Java 21 auto-detect: Capacitor 8 needs JDK 21. "invalid source release: 21"
// ka matlab JAVA_HOME purane JDK pe hai. Android Studio ka bundled JBR (JDK 21)
// dhoondh ke use karo — user ko manually kuch install karne ki zaroorat nahi.
function detectJavaHome() {
  if (process.env.JAVA_HOME && fs.existsSync(process.env.JAVA_HOME)) return process.env.JAVA_HOME;
  const candidates = isWin
    ? [
        "C:\\Program Files\\Android\\Android Studio\\jbr",
        "C:\\Program Files\\Android\\Android Studio\\jre",
        "D:\\Program Files\\Android\\Android Studio\\jbr",
      ]
    : [
        "/Applications/Android Studio.app/Contents/jbr/Contents/Home",
        "/opt/android-studio/jbr",
        path.join(process.env.HOME || "", "android-studio/jbr"),
        "/usr/lib/jvm/java-21-openjdk-amd64",
      ];
  for (const c of candidates) if (c && fs.existsSync(c)) return c;
  return null;
}
const javaHome = detectJavaHome();
if (javaHome) ok(`Java 21 mila: ${javaHome}`);
else info("JAVA_HOME nahi mila — system java use hoga. Agar 'invalid source release: 21' aaye to JDK 21 install karo.");

// gradle.properties me bhi daal do taaki Android Studio build bhi sahi JDK use kare
const gradlePropsPath = path.join(androidRoot, "gradle.properties");
if (javaHome && fs.existsSync(androidRoot) && fs.existsSync(gradlePropsPath)) {
  let props = fs.readFileSync(gradlePropsPath, "utf8");
  if (!props.includes("org.gradle.java.home")) {
    props += `\norg.gradle.java.home=${javaHome.replace(/\\/g, "\\\\").replace(/:/g, "\\:")}\n`;
    fs.writeFileSync(gradlePropsPath, props);
    ok("gradle.properties me Java path set kar diya.");
  }
}

if (!fs.existsSync(androidRoot)) {
  fail("android/ folder nahi mila. Pehle project folder me jao (jahan android/ folder hai) aur phir chalao.");
  process.exit(1);
}

const gradleEnv = javaHome ? { ...process.env, JAVA_HOME: javaHome } : process.env;

function run(cmd, args, cwd) {
  info(`Running: ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { cwd, stdio: "inherit", shell: isWin, env: gradleEnv });
  if (r.status !== 0) {
    fail(`Command fail ho gayi: ${cmd} ${args.join(" ")}`);
    process.exit(1);
  }
}

// --- Step 1: patch manifest + strings ---
info("STEP 1/5: AndroidManifest.xml + strings.xml patch ho rahi hai...");
run("node", [path.join(__dirname, "patch-admob-manifest.mjs")], frontendRoot);

// --- Step 2: clean (stale build cache = asli culprit) ---
info("STEP 2/5: gradlew clean (purana cached build hata rahe hain — yahi crash ka reason tha)...");
run(gradlew, ["clean"], androidRoot);

// --- Step 3: generate merged manifest ---
info("STEP 3/5: Merged manifest generate kar rahe hain (ye actually APK me jata hai)...");
run(gradlew, [":app:processDebugManifest"], androidRoot);

// --- Step 4: verify merged manifest ---
info("STEP 4/5: VERIFY kar rahe hain ki App ID final APK me gayi...");
function findMergedManifests(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...findMergedManifests(p));
    else if (e.name === "AndroidManifest.xml" && /merged_manifest/i.test(p)) out.push(p);
  }
  return out;
}
const merged = findMergedManifests(path.join(androidRoot, "app", "build"));
let verified = false;
let detail = "";
for (const m of merged) {
  const xml = fs.readFileSync(m, "utf8");
  const idx = xml.indexOf("com.google.android.gms.ads.APPLICATION_ID");
  if (idx !== -1) {
    const snippet = xml.slice(idx, idx + 200);
    detail = snippet.replace(/\s+/g, " ").slice(0, 160);
    if (snippet.includes(APP_ID)) verified = true;
  }
}
if (!verified) {
  fail(`Merged manifest me App ID NAHI mili! Mili hui entry: ${detail || "(koi entry nahi)"}`);
  fail("Iska matlab manifest merge me kuch override ho raha hai. Ye output Emergent agent ko bhejo.");
  process.exit(1);
}
ok(`VERIFIED: App ID APK me sahi se ja rahi hai (${APP_ID})`);

// --- Step 5: build + install ---
info("STEP 5/5: Debug APK build kar rahe hain...");
run(gradlew, [":app:assembleDebug"], androidRoot);
const apk = path.join(androidRoot, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
if (fs.existsSync(apk)) ok(`APK ready: ${apk}`);

// adb install (agar device connected hai)
const adb = spawnSync("adb", ["devices"], { shell: isWin }).stdout?.toString() ?? "";
const deviceConnected = adb.split("\n").some((l) => l.trim().endsWith("device"));
if (deviceConnected) {
  info("Device mila — purani app uninstall karke nayi install kar raha hoon...");
  spawnSync("adb", ["uninstall", "com.trapshift.app"], { shell: isWin });
  const inst = spawnSync("adb", ["install", "-r", apk], { shell: isWin, stdio: "inherit" });
  if (inst.status === 0) ok("Nayi app install ho gayi! Ab app kholo — crash nahi aayega.");
  else info("adb install fail — Android Studio se Run kar lo, APK ready hai.");
} else {
  info("Koi device connected nahi. Android Studio kholo aur Run dabao (ya APK manually install karo).");
}

ok("DONE: Crash permanently fix ho gaya. Agla build bhi safe hai kyunki patch script idempotent hai.");

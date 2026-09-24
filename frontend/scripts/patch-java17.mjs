// Java 17 compatibility patch: Capacitor 8 ka default Java compilation 21 hai,
// jo sirf JDK 21 pe chalti hai. Ye script saari build.gradle files me
// JavaVersion.VERSION_21 → VERSION_17 kar deti hai (app template + node_modules
// me Capacitor library/plugins) taaki project JDK 17 pe compile ho.
// Idempotent — jitni baar chahiye chalao.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, "..");

let patchedCount = 0;

function patchGradleFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  if (!content.includes("VERSION_21") && !content.includes("sourceCompatibility = 21")) return;
  const before = content;
  content = content.replace(/JavaVersion\.VERSION_21/g, "JavaVersion.VERSION_17");
  content = content.replace(/sourceCompatibility\s*=\s*21/g, "sourceCompatibility = 17");
  content = content.replace(/targetCompatibility\s*=\s*21/g, "targetCompatibility = 17");
  content = content.replace(/sourceCompatibility\s+21/g, "sourceCompatibility 17");
  content = content.replace(/targetCompatibility\s+21/g, "targetCompatibility 17");
  if (content !== before) {
    fs.writeFileSync(filePath, content);
    patchedCount++;
    console.log(`[patch-java17] patched: ${path.relative(frontendRoot, filePath)}`);
  }
}

function walk(dir, onFile) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "build" || e.name === ".gradle") continue;
      walk(p, onFile);
    } else if (e.name === "build.gradle") {
      onFile(p);
    }
  }
}

// 1) android/ project (app template + generated modules)
walk(path.join(frontendRoot, "android"), patchGradleFile);

// 2) node_modules me Capacitor library + plugins (inke build.gradle bhi 21 maangte hain)
// NOTE: core @capacitor/android ka build.gradle `capacitor/` subfolder me hota hai,
// isliye poore package ko walk karo (sirf android/ subfolder ko nahi).
const nm = path.join(frontendRoot, "node_modules");
for (const scope of ["@capacitor", "@capacitor-community"]) {
  const scopeDir = path.join(nm, scope);
  if (!fs.existsSync(scopeDir)) continue;
  for (const pkg of fs.readdirSync(scopeDir)) {
    walk(path.join(scopeDir, pkg), patchGradleFile);
  }
}

// 3) variables.gradle me agar javaVersion jaisa var ho to handle karo
const variablesGradle = path.join(frontendRoot, "android", "variables.gradle");
if (fs.existsSync(variablesGradle)) {
  let v = fs.readFileSync(variablesGradle, "utf8");
  if (v.includes("21")) {
    const nv = v.replace(/VERSION_21/g, "VERSION_17").replace(/javaVersion\s*=\s*21/g, "javaVersion = 17");
    if (nv !== v) {
      fs.writeFileSync(variablesGradle, nv);
      patchedCount++;
      console.log("[patch-java17] patched: android/variables.gradle");
    }
  }
}

console.log(patchedCount > 0
  ? `[patch-java17] DONE: ${patchedCount} files Java 17 compatible ho gayi.`
  : "[patch-java17] Koi VERSION_21 nahi mila — sab pehle se Java 17 compatible hai.");

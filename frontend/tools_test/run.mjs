import { build } from "esbuild";
import { pathToFileURL } from "url";
import { writeFileSync } from "fs";

const entry = process.argv[2];
if (!entry) { console.error("usage: node run.mjs <test.ts>"); process.exit(2); }

// Stub browser-only modules (audio/haptics) so the real engine runs headless.
const stubPlugin = {
  name: "stub-browser",
  setup(b) {
    b.onResolve({ filter: /\/(audio|haptics)$/ }, (a) => ({ path: a.path, namespace: "stub" }));
    b.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
      contents: `
        const noop = () => {};
        export const sfx = new Proxy({}, { get: () => noop });
        export const gateHumStart = noop, gateHumStop = noop;
        export const gravityHumStart = noop, gravityHumStop = noop;
        export const vibrate = noop;
      `,
      loader: "js",
    }));
  },
};

const out = "/tmp/w3_bundle.mjs";
await build({
  entryPoints: [entry],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: out,
  plugins: [stubPlugin],
  logLevel: "error",
});
await import(pathToFileURL(out).href);

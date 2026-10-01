// Copies the Astro build into the folder Capacitor ships inside the native
// apps, minus the pieces that only make sense on the public website.
import { cp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const SRC = "dist";
const OUT = "dist-native";

// The app bundle is already on the device, so it needs no service worker cache,
// and app launches should not be counted as website visits.
const WEB_ONLY = [
  "sw.js",
  "CNAME",
  "sitemap-index.xml",
  "sitemap-0.xml",
  "sitepins-manifest.json",
];
const BEACON = /<script\b[^>]*static\.cloudflareinsights\.com[^>]*><\/script>/g;

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(full)));
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

if (!existsSync(path.join(SRC, "index.html"))) {
  console.error(`prepare-native: ${SRC}/index.html not found; run "npm run build" first.`);
  process.exit(1);
}

await rm(OUT, { recursive: true, force: true });
await cp(SRC, OUT, { recursive: true });
for (const file of WEB_ONLY) await rm(path.join(OUT, file), { force: true });

const pages = await htmlFiles(OUT);
for (const file of pages) {
  const html = await readFile(file, "utf8");
  const stripped = html.replace(BEACON, "");
  if (stripped.includes("cloudflareinsights")) {
    console.error(`prepare-native: analytics beacon still present in ${file}`);
    process.exit(1);
  }
  if (stripped !== html) await writeFile(file, stripped, "utf8");
}

console.log(`prepare-native: ${pages.length} pages copied to ${OUT}/ (web-only files removed)`);

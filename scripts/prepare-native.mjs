// Copies the Astro build into the folder Capacitor ships inside the native
// apps, minus the pieces that only make sense on the public website.
import { cp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const SRC = "dist";
const OUT = "dist-native";

// The app bundle is already on the device, so it needs no service worker (file
// or registration), and app launches should not be counted as website visits.
const WEB_ONLY = [
  "sw.js",
  "CNAME",
  "sitemap-index.xml",
  "sitemap-0.xml",
  "sitepins-manifest.json",
];
const BEACON = /<script\b[^>]*static\.cloudflareinsights\.com[^>]*><\/script>/g;
const SW_REGISTRATION = /<script>(?:(?!<\/script>)[\s\S])*?serviceWorker\s*\.register\(["']\/sw\.js["']\)[\s\S]*?<\/script>/g;
// The splash screen stays up (see capacitor.config.ts) until the first page
// has painted, so launch never shows a blank web view.
const HIDE_SPLASH =
  "<script>addEventListener('load',()=>requestAnimationFrame(()=>window.Capacitor?.Plugins?.SplashScreen?.hide()))</script>";
// Fills the strip behind the status bar with the header's color and picks
// light or dark status bar icons. Follows the site's own theme setting, which
// can differ from the system's, and re-runs when the theme toggle changes it.
const SYNC_CHROME = `<script>(()=>{
const plugin=window.Capacitor?.Plugins?.FieldGuideChrome;
if(!plugin)return;
const hex=(c)=>{const m=c.match(/[\\d.]+/g);if(!m||m.length<3||m[3]==="0")return null;return "#"+m.slice(0,3).map((n)=>Math.round(+n).toString(16).padStart(2,"0")).join("")};
const sync=()=>{const header=document.querySelector("header.header");const color=(header&&hex(getComputedStyle(header).backgroundColor))||hex(getComputedStyle(document.body).backgroundColor);if(color)plugin.set({color,dark:document.documentElement.dataset.theme==="dark"}).catch(()=>{})};
sync();
new MutationObserver(()=>requestAnimationFrame(sync)).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
document.querySelector("header.header")?.addEventListener("transitionend",sync);
addEventListener("resize",sync);
})()</script>`;

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
  const stripped = html.replace(BEACON, "").replace(SW_REGISTRATION, "");
  if (stripped.includes("cloudflareinsights") || stripped.includes("/sw.js")) {
    console.error(`prepare-native: analytics beacon or service worker still present in ${file}`);
    process.exit(1);
  }
  if (!stripped.includes("</body>")) {
    console.error(`prepare-native: no </body> in ${file}`);
    process.exit(1);
  }
  await writeFile(file, stripped.replace("</body>", `${SYNC_CHROME}${HIDE_SPLASH}</body>`), "utf8");
}

console.log(`prepare-native: ${pages.length} pages copied to ${OUT}/ (web-only files removed)`);

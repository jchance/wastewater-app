import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

/** Files that are never worth carrying offline. */
const SKIP = [/^sitemap/, /\.map$/, /^CNAME$/, /^sitepins-manifest\.json$/];

async function walk(dir, base = dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full, base)));
    } else {
      out.push(path.relative(base, full).split(path.sep).join("/"));
    }
  }
  return out;
}

/**
 * Writes a service worker that precaches the real build output. The cache name
 * embeds a hash of that file list, so every deploy that changes any asset
 * produces a new cache and retires the old one.
 */
export function serviceWorker() {
  return {
    name: "wastewater-service-worker",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        const files = (await walk(outDir))
          .filter((f) => !SKIP.some((re) => re.test(f)))
          .filter((f) => f !== "sw.js");

        const urls = files
          .map((f) =>
            f === "index.html"
              ? "/"
              : f.endsWith("/index.html")
                ? `/${f.slice(0, -"index.html".length)}`
                : `/${f}`
          )
          .sort();

        const version = createHash("sha256")
          .update(urls.join("\n"))
          .digest("hex")
          .slice(0, 12);

        const template = await readFile(
          new URL("./sw-template.js", import.meta.url),
          "utf8"
        );
        const sw = template
          .replace("__CACHE_VERSION__", version)
          .replace("__PRECACHE_URLS__", JSON.stringify(urls, null, 2));

        await writeFile(path.join(outDir, "sw.js"), sw, "utf8");
        logger.info(`service worker: ${urls.length} URLs precached (${version})`);
      },
    },
  };
}

/* Wastewater Field Guide service worker.
 * Generated at build time by integrations/service-worker.mjs — the cache
 * version and URL list below are substituted from the real build output.
 */

const VERSION = "__CACHE_VERSION__";
const CACHE = `wastewater-${VERSION}`;
const PRECACHE = __PRECACHE_URLS__;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Add one at a time: cache.addAll() rejects the whole batch if any single
      // request fails, which would leave the operator with no offline copy.
      await Promise.all(
        PRECACHE.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => {})
        )
      );
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("wastewater-") && k !== CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

/** Hashed build assets never change contents, so cache wins and saves the radio. */
function isImmutable(url) {
  return url.pathname.startsWith("/_astro/") || url.pathname.startsWith("/pagefind/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isImmutable(url)) {
    event.respondWith(
      caches.match(request).then((hit) => hit || fetch(request))
    );
    return;
  }

  // Pages: try the network so a fresh deploy is picked up, fall back to the
  // cached copy when there's no signal.
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        if (response.ok && response.type === "basic") {
          const cache = await caches.open(CACHE);
          cache.put(request, response.clone());
        }
        return response;
      } catch {
        const cached =
          (await caches.match(request)) ||
          (await caches.match(new URL(request.url).pathname));
        if (cached) return cached;
        if (request.mode === "navigate") {
          const offline = await caches.match("/offline/");
          if (offline) return offline;
        }
        throw new Error("offline and not cached");
      }
    })()
  );
});

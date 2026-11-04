/* eslint-disable no-console */
/**
 * Generates out/sw.js after `next build` (static export).
 * Every file produced by Next is precached, so the full app — including
 * every facility details page — works offline after the first visit.
 */
const fs = require("fs");
const path = require("path");

const outDir = path.join(process.cwd(), "out");

if (!fs.existsSync(outDir)) {
  console.error("generate-sw: out/ not found. Run `next build` first.");
  process.exit(1);
}

const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else {
      const rel = path.relative(outDir, full).split(path.sep).join("/");
      if (rel === "sw.js" || rel.endsWith(".map")) continue;
      files.push(rel);
    }
  }
}

walk(outDir);

const precache = new Set();

for (const rel of files) {
  if (rel === "index.html") {
    precache.add("/");
  } else if (rel.endsWith("/index.html")) {
    precache.add("/" + rel.slice(0, -"index.html".length));
  } else if (rel === "404.html") {
    // Not a real route; keep it available as a fallback only.
    precache.add("/404.html");
  } else {
    precache.add("/" + rel);
  }
}

const version = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);

const sw = `/* CarePath service worker — generated ${new Date().toISOString()} */
const CACHE = "carepath-${version}";
const PRECACHE = ${JSON.stringify([...precache].sort(), null, 0)};

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.allSettled(
        PRECACHE.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch(() => {})
        )
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("carepath-") && key !== CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Map tiles and other third-party content stay online-only.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request, { ignoreSearch: true });
      if (cached) {
        // Stale-while-revalidate: keep the cached copy usable offline.
        fetch(request)
          .then((response) => {
            if (response && response.ok) cache.put(request, response.clone());
          })
          .catch(() => {});
        return cached;
      }

      try {
        const response = await fetch(request);
        if (response && response.ok) cache.put(request, response.clone());
        return response;
      } catch (error) {
        if (request.mode === "navigate") {
          const home =
            (await cache.match("/")) ||
            (await cache.match("/index.html")) ||
            (await cache.match("/404.html"));
          if (home) return home;
        }
        return new Response("أنت غير متصل بالإنترنت، والصفحة غير محفوظة بعد.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
    })()
  );
});
`;

fs.writeFileSync(path.join(outDir, "sw.js"), sw);
console.log(
  `generate-sw: wrote out/sw.js (${precache.size} precached files, cache carepath-${version})`
);

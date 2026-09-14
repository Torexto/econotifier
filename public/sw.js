const APP_CACHE = "econotifier-shell-v1";
const DATA_CACHE = "econotifier-data-v1";
const APP_SHELL = ["/manifest.webmanifest", "/pwa-icon-192.png"];

const cacheResponse = async (cacheName, request, response) => {
  if (response.ok) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  }
  return response;
};

const precacheAppShell = async () => {
  const cache = await caches.open(APP_CACHE);
  const response = await fetch("/");
  if (!response.ok) throw new Error("Unable to cache the application shell");

  const markup = await response.clone().text();
  const assets = [...markup.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map(([, asset]) => asset)
    .filter((asset) => asset.startsWith("/") && asset !== "/sw.js");

  await cache.put("/", response.clone());
  await cache.put("/index.html", response);
  await cache.addAll([...new Set([...APP_SHELL, ...assets])]);
};

self.addEventListener("install", (event) => {
  event.waitUntil(precacheAppShell());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== APP_CACHE && key !== DATA_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/pse/")) {
    event.respondWith(
      fetch(request)
        .then((response) => cacheResponse(DATA_CACHE, request, response))
        .catch(async () => (await caches.match(request)) ?? Response.error()),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => cacheResponse(APP_CACHE, "/index.html", response))
        .catch(async () => (await caches.match("/index.html")) ?? Response.error()),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ?? fetch(request).then((response) => cacheResponse(APP_CACHE, request, response)),
    ),
  );
});

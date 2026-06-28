const CACHE_NAME = "chat-static-assets-20260628-v1";
const CACHE_PREFIX = "chat-static-assets-";
const CACHE_STATIC_ASSETS = "CACHE_STATIC_ASSETS";
const LOCAL_VISUAL_ASSET_PATTERN = /\/(?:avatars|memes|viral-assets|jojo-assets|wechat-ui|dingtalk-ui)\//;
const LOCAL_ICON_PATTERN = /\/(?:site-icon|favicon-(?:viral|jojo))\.svg$/;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME)
        .map((cacheName) => caches.delete(cacheName))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type !== CACHE_STATIC_ASSETS || !Array.isArray(data.urls)) return;

  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(
      data.urls
        .filter((url) => typeof url === "string")
        .map((url) => fetchAndCache(cache, new Request(url, { credentials: "same-origin" })))
    );
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || !isLocalVisualAsset(request.url)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) {
      event.waitUntil(fetchAndCache(cache, request).catch(() => undefined));
      return cached;
    }

    return fetchAndCache(cache, request);
  })());
});

function isLocalVisualAsset(requestUrl) {
  const url = new URL(requestUrl);
  if (url.origin !== self.location.origin) return false;
  return LOCAL_VISUAL_ASSET_PATTERN.test(url.pathname) || LOCAL_ICON_PATTERN.test(url.pathname);
}

async function fetchAndCache(cache, request) {
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

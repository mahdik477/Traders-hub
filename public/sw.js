// Minimal service worker: exists so browsers treat the site as installable.
// It deliberately caches NOTHING — every request goes straight to the
// network — because prices and promo codes change and a stale cached page
// would show the wrong number. If offline support is ever wanted, add a
// cache strategy here on purpose.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Intentionally empty: default network behaviour.
});

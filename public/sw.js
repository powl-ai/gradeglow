const CACHE_VERSION = "gradeglow-v60";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const MASCOT_ASSETS = ["focused", "happy", "sleepy", "panic", "celebrate"]
  .map((mood) => `/mascots/anglerfish-${mood}.webp?v=60`);

const APP_SHELL = [
  "/",
  "/settings",
  "/info",
  "/insights",
  "/friends",
  "/exams",
  "/planning",
  "/modules",
  "/backup",
  "/feedback",
  "/premium",
  "/timer",
  "/schedule",
  "/manifest.webmanifest",
  "/offline.html",
  "/icons/icon-192.png?v=2",
  "/icons/icon-512.png?v=2",
  "/icons/maskable-512.png?v=2",
  "/icons/apple-touch-icon.png?v=2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => Promise.allSettled([
        cache.addAll(APP_SHELL),
        ...MASCOT_ASSETS.map((url) => cache.add(url)),
      ]))
      .catch(() => undefined),
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("notificationclick", (event) => {
  if (event.notification.data?.kind !== "gradeglow-focus") return;
  event.notification.close();
  event.waitUntil((async () => {
    const url = new URL("/timer", self.location.origin).href;
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
    if (existing) {
      await existing.navigate(url);
      await existing.focus();
    } else {
      await self.clients.openWindow(url);
    }
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  // Firebase Auth helper must never be cached/intercepted by the PWA.
  if (url.pathname.startsWith("/__/auth/")) return;

  // Versioned small sprites are immutable: changing tabs needs no new network request.
  if (url.pathname.startsWith("/mascots/")) {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })());
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();

          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone).catch(() => undefined);
          });

          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match("/offline.html")),
        ),
    );

    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) {
              const responseClone = response.clone();

              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseClone).catch(() => undefined);
              });
            }

            return response;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      }),
    );
  }
});

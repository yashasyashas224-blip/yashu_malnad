/*
 * Offline support for the MCE campus navigator.
 *
 * What is cached
 *  - The app shell (HTML, JS, CSS, fonts from Google) and, with it, the bundled
 *    campus data: places, route network, classrooms, accessibility features,
 *    facilities and events. Those datasets are compiled into the JS bundle, so
 *    they are available offline as soon as the bundle is cached.
 *
 * What is NOT cached
 *  - Map tiles from OpenStreetMap and Esri. The OSM tile usage policy forbids
 *    bulk downloading and offline tile caching, and Esri's terms restrict it
 *    too. Tile requests are passed straight to the network; when the device is
 *    offline the app explains that the map needs a connection and keeps the
 *    campus information usable.
 */

const VERSION = 'mce-campus-v3';
const SHELL_CACHE = `${VERSION}-shell`;
const SHELL_ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('mce-campus-') && key !== SHELL_CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

const isMapTile = (url) =>
  url.hostname.endsWith('tile.openstreetmap.org') ||
  url.hostname.endsWith('arcgisonline.com') ||
  url.hostname.endsWith('basemaps.cartocdn.com');

const isAsset = (url) => url.pathname.startsWith('/assets/');

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Never cache map imagery: provider licences forbid offline tile storage.
  if (isMapTile(url)) return;

  // Navigations: network first, cached shell as the offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          const cache = await caches.open(SHELL_CACHE);
          cache.put('/index.html', response.clone());
          return response;
        } catch {
          const cache = await caches.open(SHELL_CACHE);
          return (
            (await cache.match('/index.html')) ??
            (await cache.match('/')) ??
            new Response('Offline', { status: 503, statusText: 'Offline' })
          );
        }
      })(),
    );
    return;
  }

  // Hashed build assets and fonts: cache first, they never change in place.
  if (isAsset(url) || url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })(),
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        }
      })(),
    );
  }
});

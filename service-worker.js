const CACHE_NAME = 'raymessco-v2';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// ── INSTALL: pre-cachear todos los assets ──────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: limpiar cachés viejas ───────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH: Cache First para assets, Network First para navegación ──────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Cache First: iconos, imágenes, manifest
  if (
    e.request.destination === 'image' ||
    url.pathname.endsWith('manifest.json')
  ) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
    return;
  }

  // Network First con fallback a caché (HTML y demás)
  e.respondWith(
    fetch(e.request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request)
        .then(cached => cached || caches.match('./index.html'))
      )
  );
});

// ── BACKGROUND SYNC ───────────────────────────────────────────────────────
self.addEventListener('sync', e => {
  if (e.tag === 'sync-services') {
    console.log('[SW] Background sync: sincronizando servicios...');
  }
});

// ── PUSH NOTIFICATIONS ────────────────────────────────────────────────────
self.addEventListener('push', e => {
  const data = e.data
    ? e.data.json()
    : { title: 'Ray Mess Co', body: 'Tienes una actualización.' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icon-192.png',
      badge: './icon-192.png'
    })
  );
});

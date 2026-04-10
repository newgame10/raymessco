const CACHE_NAME = 'raymessco-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalar y cachear recursos
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activar y limpiar cachés viejas
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  e.waitUntil(self.clients.claim());
});

// Estrategia: Network first, fallback a caché (offline support)
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Guardar copia en caché si es una respuesta válida
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});

// Background Sync (para registrar servicios offline)
self.addEventListener('sync', e => {
  if (e.tag === 'sync-services') {
    console.log('[SW] Background sync ejecutado');
  }
});

// Push Notifications (base lista para usar)
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'Ray Mess Co', body: 'Tienes una actualización.' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icon-192.png',
      badge: './icon-192.png'
    })
  );
});

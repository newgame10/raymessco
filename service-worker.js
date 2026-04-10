// service-worker.js - Ray Mess Co PWA
const CACHE_NAME = 'raymess-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalación: guarda los recursos esenciales en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Archivos cacheados correctamente');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('❌ Error al cachear:', err))
  );
  // Forzar a que el nuevo SW tome control inmediatamente
  self.skipWaiting();
});

// Activación: limpia cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('🗑️ Eliminando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim(); // tomar control de todas las pestañas
});

// Estrategia: Stale-while-revalidate (primero caché, luego red)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // Si está en caché, lo devolvemos y actualizamos en segundo plano
          fetch(event.request).then(freshResponse => {
            if (freshResponse && freshResponse.status === 200) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, freshResponse);
              });
            }
          }).catch(() => {});
          return response;
        }
        // Si no está en caché, vamos a la red
        return fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        }).catch(() => {
          // Opcional: página de fallback offline (puedes crear un offline.html)
          return new Response('⚠️ Sin conexión a internet. Algunos recursos no están disponibles.', {
            status: 503,
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
      })
  );
});

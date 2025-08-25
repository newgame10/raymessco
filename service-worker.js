const CACHE_NAME = "ray-mess-co-v2";
const STATIC_ASSETS = [
  "index.html",
  "manifest.json",
  "icon-192.png",
  "icon-512.png"
];

// Instalar y cachear archivos estáticos
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

// Activar y limpiar caches viejos
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});

// Estrategia cache-first con cache dinámico
self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(resp => {
      return (
        resp ||
        fetch(e.request).then(fetchResp => {
          // Cache dinámico: imágenes o recursos externos
          if (e.request.url.startsWith("http") && e.request.destination === "image") {
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(e.request, fetchResp.clone());
              return fetchResp;
            });
          }
          return fetchResp;
        })
      );
    })
  );
});

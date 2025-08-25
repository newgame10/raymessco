const CACHE_NAME = "ray-mess-co-v2";
const STATIC_ASSETS = [
  "index.html",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

// Instalar y cachear archivos básicos
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

// Estrategia de fetch (cache first + dynamic cache)
self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(resp => {
      return (
        resp ||
        fetch(e.request).then(fetchResp => {
          // Si es una imagen subida o recurso externo, también se cachea
          if (
            e.request.url.startsWith("http") &&
            (e.request.destination === "image" || e.request.url.includes("data:image"))
          ) {
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

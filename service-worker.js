// service-worker.js
const CACHE_NAME = "ray-mess-co-v3";
const STATIC_ASSETS = [
  "index.html",
  "manifest.json",
  "icon-192.png",
  "icon-512.png",
  "/" // por si el servidor sirve en la raíz
];

// Instalar: cachear assets estáticos
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activar: limpiar caches viejos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Escuchar mensajes (SKIP_WAITING)
self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Fetch: cache-first para assets, dynamic cache para imágenes y fallback razonable
self.addEventListener("fetch", event => {
  const req = event.request;

  // Sólo manejamos GET
  if (req.method !== "GET") return;

  // Si es navegación (SPA), tratar de servir index.html desde cache para modo offline
  if (req.mode === "navigate") {
    event.respondWith(
      caches.match("index.html").then(cached => {
        return cached || fetch(req).catch(() => caches.match("index.html"));
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cachedResp => {
      if (cachedResp) return cachedResp;

      return fetch(req).then(fetchResp => {
        // Si la respuesta es válida y queremos cachearla dinámicamente:
        const contentType = fetchResp.headers.get("content-type") || "";

        // Cachear imágenes (requests con destination 'image' o respuesta content-type image)
        if (req.destination === "image" || contentType.includes("image")) {
          const respClone = fetchResp.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(req, respClone).catch(() => {/* noop */});
          });
        }

        // También podríamos cachear otros recursos dinámicos si lo deseamos

        return fetchResp;
      }).catch(err => {
        // Fallback si falla la red: si es imagen, intentar devolver un icono cached
        if (req.destination === "image") {
          return caches.match("icon-192.png");
        }
        // Para otros recursos, intentar devolver lo que haya en cache (si algo)
        return caches.match(req);
      });
    })
  );
});

// Service worker: guarda la aplicación en el equipo para que abra aunque no haya internet.
// Los datos los maneja Firestore con su propia copia local; acá solo se cachea la app (HTML, JS, CSS, imágenes).
const CACHE = 'crm-app-v1';
const SHELL = ['/', '/index.html'];
const MAX_ENTRIES = 120;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

const trim = async cache => {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_ENTRIES; i++) await cache.delete(keys[i]);
};

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Firestore, fuentes y APIs externas no pasan por acá
  if (url.pathname.startsWith('/api/')) return;

  // Páginas: primero la red (para tener siempre la última versión); sin internet, la copia guardada
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('/index.html', copy));
          return res;
        })
        .catch(() => caches.match('/index.html').then(r => r || caches.match('/')))
    );
    return;
  }

  // Archivos estáticos (con hash en el nombre): primero la copia guardada
  event.respondWith(
    caches.match(req).then(
      hit =>
        hit ||
        fetch(req).then(res => {
          if (res.ok && (url.pathname.startsWith('/assets/') || /\.(js|css|png|jpe?g|webp|svg|woff2?)$/.test(url.pathname))) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy).then(() => trim(c)));
          }
          return res;
        })
    )
  );
});

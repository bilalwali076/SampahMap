const CACHE_NAME = 'sampahmap-v6';
const ASSETS = [
  './', './index.html', './peta.html', './lapor.html', './edukasi.html', './tentang.html',
  './style.css', './home.css', './pages.css', './greenearth.css', './lapor.css', './tentang.css',
  './config.js', './theme.js', './tps-data.js', './reports-core.js',
  './home.js', './map.js', './lapor.js',
  './manifest.json', './icon.svg'
];
// Pustaka luar yang jarang berubah: disimpan agar buka berikutnya instan.
const CDN_HOSTS = ['unpkg.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null))
  )));
  self.clients.claim();
});

// Stale-while-revalidate: tampil langsung dari cache, lalu diperbarui di latar belakang
// (pembaruan terlihat pada kunjungan berikutnya). Supabase, tile dan layanan rute tidak di-cache.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && !CDN_HOSTS.includes(url.hostname)) return;

  e.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
            return res;
          })
          .catch(() => cached || (req.mode === 'navigate' ? cache.match('./index.html') : undefined));
        return cached || network;
      })
    )
  );
});

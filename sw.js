const CACHE_NAME = 'sampahmap-v1';
const ASSETS = [
  './', './index.html', './laporan.html', './tentang.html',
  './style.css', './laporan.css', './tentang.css',
  './app.js', './laporan.js', './manifest.json', './icon.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(
    keys.map(key => { if (key !== CACHE_NAME) return caches.delete(key); })
  )));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Biarkan request ke Supabase/API lewat tanpa cache
  if (e.request.url.includes('supabase') || e.request.url.includes('openstreetmap')) return;
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
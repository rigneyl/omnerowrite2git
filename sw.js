const CACHE = 'omnero-write-web-0.2.13';
const SHELL = [
  '/', '/index.html', '/app/', '/app/index.html', '/support/', '/support/index.html',
  '/support/thanks/', '/support/thanks/index.html', '/404.html',
  '/assets/app.js', '/assets/app.css', '/manifest.webmanifest', '/icons/icon.svg',
  '/stripe-links.js',
];

self.addEventListener('install', event => event.waitUntil(
  caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()),
));

self.addEventListener('activate', event => event.waitUntil(
  caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('omnero-write-web-') && key !== CACHE)
      .map(key => caches.delete(key)),
  )).then(() => self.clients.claim()),
));

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  let fallback = request;
  if (request.mode === 'navigate') {
    fallback = url.pathname.startsWith('/app/')
      ? '/app/index.html'
      : url.pathname.startsWith('/support/thanks/')
        ? '/support/thanks/index.html'
        : url.pathname.startsWith('/support/')
          ? '/support/index.html'
          : '/index.html';
  }

  event.respondWith(fetch(request).then(response => {
    if (response.ok) caches.open(CACHE).then(cache => cache.put(fallback, response.clone()));
    return response;
  }).catch(() => caches.match(fallback)));
});

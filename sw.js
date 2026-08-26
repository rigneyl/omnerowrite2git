const CACHE = 'omnero-write-web-0.2.6';
const BASE = new URL('./', self.registration.scope).pathname.replace(/\/$/, '');
const withinBase = path => `${BASE}${path}`;
const SHELL = [
  '/', '/index.html', '/App/', '/App/index.html', '/Support/', '/Support/index.html',
  '/Support/Thanks/', '/Support/Thanks/index.html',
  '/assets/app.js', '/assets/app.css', '/manifest.webmanifest', '/icons/icon.svg',
  '/stripe-links.js',
].map(withinBase);

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
    fallback = url.pathname.startsWith(withinBase('/App/'))
      ? withinBase('/App/index.html')
      : url.pathname.startsWith(withinBase('/Support/Thanks/'))
        ? withinBase('/Support/Thanks/index.html')
        : url.pathname.startsWith(withinBase('/Support/'))
          ? withinBase('/Support/index.html')
          : withinBase('/index.html');
  }

  event.respondWith(fetch(request).then(response => {
    if (response.ok) caches.open(CACHE).then(cache => cache.put(fallback, response.clone()));
    return response;
  }).catch(() => caches.match(fallback)));
});

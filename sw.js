/* Math Wizard: service worker. The game keeps a saved copy so it opens quickly and works offline, but it always checks for a newer version first. */
const CACHE = 'mw-v63';
const CORE = ['./', 'index.html', 'math.js', 'spells.js', 'combat.js', 'brew.js', 'shop.js', 'helper.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;   // the Google script (progress saving) is never touched
  const page = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html') || url.pathname.endsWith('.js');
  if (page) {   // pages and code: ask the network first (so a new game version arrives at once), fall back to the saved copy when offline
    e.respondWith(fetch(req).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return r; }).catch(() => caches.match(req, { ignoreSearch: true }).then(m => m || caches.match('index.html', { ignoreSearch: true }))));
    return;
  }
  // icons and other files: use the saved copy when there is one, and refresh it quietly in the background
  e.respondWith(caches.match(req).then(m => { const net = fetch(req).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return r; }).catch(() => m); return m || net; }));
});

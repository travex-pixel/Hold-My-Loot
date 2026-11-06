// Hold My Loot service worker. One job: the installed app opens with no signal, and a new build still arrives the
// moment there is one. The page is always fetched from the network first; the cached copy is only for when the network
// is missing or slower than SLOW_MS. The in-page update check (?t=...) is never answered from here.
const CACHE = 'hml-shell-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
const SLOW_MS = 4000;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('hml-') && k !== CACHE && k !== CACHE + '-fonts').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (url.searchParams.has('t')) return;                              // self-update check: straight to the network
    if (url.pathname.endsWith('/sw.js')) return;
    const isGame = url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
    // other pages (privacy.html) are network first with their own cache entry, never stored as the game
    e.respondWith(isGame ? page(req, e) : req.mode === 'navigate' ? other(req) : asset(req));
    return;
  }
  if (/^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) e.respondWith(font(req, e));
  // everything else (analytics, leaderboard, Ko-fi) is left to the network and never cached
});

// Network first. If the network is slow, answer from cache now and let the fetch finish in the background, so the
// next launch (and the page's own update check, which reloads to ?v=N) gets the new build.
function page(req, e) {
  const net = fetch(req.url, { cache: 'no-store', credentials: 'same-origin' }).then(res => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); }
    return res;
  });
  e.waitUntil(net.catch(() => {}));
  const cached = () => caches.open(CACHE).then(c => c.match('./index.html')).then(r => r || caches.match(req, { ignoreSearch: true }));
  const slow = new Promise(res => setTimeout(res, SLOW_MS, 'slow'));
  return Promise.race([net.catch(() => 'offline'), slow]).then(r => {
    if (r instanceof Response && r.ok) return r;
    return cached().then(c => c || (r instanceof Response ? r : net));
  });
}
function other(req) {
  return fetch(req).then(res => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })
    .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html')));
}
function asset(req) {
  return caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }));
}
function font(req, e) {
  return caches.open(CACHE + '-fonts').then(c => c.match(req).then(hit => {
    const net = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone()); return res; });
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net;
  }));
}

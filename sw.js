// Cache hors-ligne : l'appli fonctionne sans Internet une fois ouverte une première fois.
// Code : réseau d'abord (pour recevoir les mises à jour). Sons : cache d'abord (ils ne changent pas).
const CACHE = 'kidmidi-v6';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'etiquettes.html',
               'js/app.js', 'js/themes.js', 'sounds/bank.js'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const isSound = /\/sounds\/.+\.ogg$/.test(new URL(e.request.url).pathname);
  const save = r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return r; };
  e.respondWith(isSound
    ? caches.match(e.request).then(hit => hit || fetch(e.request).then(save))
    : fetch(e.request).then(save).catch(() => caches.match(e.request)));
});

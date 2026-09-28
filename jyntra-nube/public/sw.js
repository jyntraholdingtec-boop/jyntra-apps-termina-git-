/* ================================================================
   JYNTRA · trabajador de servicio (app instalable y sin conexión)
   ----------------------------------------------------------------
   · Primero la red: siempre se usa la versión más nueva publicada.
   · Si no hay red: se sirve la última copia guardada, así la app
     abre igual (los datos los trae la caché propia de Firestore).
   · Sólo toca archivos de este mismo sitio; nunca las llamadas a
     Firebase/Google, que se manejan solas.
   Para forzar que todos reciban una versión nueva: sube VERSION.
   ================================================================ */
var VERSION = 'jyntra-v2';   // v2: logo y paleta nuevos
var BASICOS = ['/', '/index.html', '/nube-config.js', '/nube-backend.js', '/vendor/firebase-jyntra.js',
               '/manifest.webmanifest', '/iconos/icono-192.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(BASICOS); }).catch(function () {}));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var r = e.request;
  if (r.method !== 'GET') return;
  var u = new URL(r.url);
  if (u.origin !== self.location.origin) return;       // Firebase, Google Fonts, etc.: sin tocar
  if (u.pathname.indexOf('/__') === 0) return;          // rutas internas de Firebase Hosting
  e.respondWith(
    fetch(r).then(function (resp) {
      if (resp && resp.ok && resp.type === 'basic') {
        var copia = resp.clone();
        /* una copia por archivo (sin ?parámetros): las herramientas se abren
           con ?jyfoco=... distinto cada vez */
        caches.open(VERSION).then(function (c) { c.put(u.origin + u.pathname, copia); });
      }
      return resp;
    }).catch(function () {
      return caches.match(u.origin + u.pathname, { ignoreSearch: true })
        .then(function (m) { return m || (r.mode === 'navigate' ? caches.match('/index.html') : undefined); });
    })
  );
});

/* ================================================================
   JYNTRA · conectores de la nube
   ----------------------------------------------------------------
   La cáscara no habla directo con Firebase: habla con este conector,
   que ofrece siempre las mismas operaciones:

     auth.onCambio(cb)            cb({uid,email,verificado} | null)
     auth.crear(correo, clave)    → Promise<usuario>
     auth.entrar(correo, clave)   → Promise<usuario>
     auth.salir()                 → Promise
     auth.recuperar(correo)       → Promise   (correo para nueva clave)
     auth.verificar()             → Promise   (correo de verificación)
     auth.refrescar()             → Promise<usuario> (relee la verificación)
     auth.google()                → Promise<usuario+{nuevo}>  (sólo administrador;
                                    sesión que muere al cerrar el navegador)
     auth.proveedor()             → Promise<'google.com'|'password'|null>
     auth.eliminar()              → Promise   (borra la cuenta recién creada)
     auth.leerCodigo(modo, oob)   → Promise<correo>  (enlace del correo: revisa y,
                                    si es verificar/recuperar correo, lo aplica)
     auth.nuevaClave(oob, clave)  → Promise   (fija la contraseña nueva)
     set(ruta, datos)             → Promise
     del(ruta)                    → Promise
     escuchar(consulta, ok, mal)  → función para dejar de escuchar
        consulta = {col:'ruta', donde:[campo, valor]} | {doc:'ruta'}
        ok([{id, ruta, datos}])

   'firebase' es el de producción. 'mock' existe sólo para las pruebas
   automáticas (un servidor local que imita a Firestore y sus reglas).
   ================================================================ */
window.JYNUBE_BACKENDS = window.JYNUBE_BACKENDS || {};

window.JYNUBE_BACKENDS.firebase = function (cfg) {
  var F = window.JYFB;
  if (!F) throw new Error('No cargó la librería de Firebase (vendor/firebase-jyntra.js).');
  var app  = F.initializeApp(cfg.firebase);
  var auth = F.getAuth(app);
  try { auth.languageCode = 'es'; } catch (e) {}

  /* Caché persistente: la app abre y muestra datos aunque no haya red,
     y las escrituras sin conexión se envían solas al volver. */
  var db;
  try {
    db = F.initializeFirestore(app, {
      localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() })
    });
  } catch (e) {
    db = F.initializeFirestore(app, {});
  }

  try { F.getRedirectResult(auth).catch(function () {}); } catch (e) {}

  function usuarioDe(u) {
    return u ? { uid: u.uid, email: String(u.email || '').toLowerCase(), verificado: !!u.emailVerified } : null;
  }

  return {
    tipo: 'firebase',
    auth: {
      onCambio : function (cb) { return F.onAuthStateChanged(auth, function (u) { cb(usuarioDe(u)); }); },
      crear    : function (c, k) { return F.createUserWithEmailAndPassword(auth, c, k).then(function (r) { return usuarioDe(r.user); }); },
      entrar   : function (c, k) {
        return F.setPersistence(auth, F.browserLocalPersistence).catch(function () {})
          .then(function () { return F.signInWithEmailAndPassword(auth, c, k); })
          .then(function (r) { return usuarioDe(r.user); });
      },
      /* Administrador: sólo con Google (y su verificación en 2 pasos).
         La sesión vive en esta pestaña: al cerrar el navegador se cierra. */
      google   : function () {
        var p = new F.GoogleAuthProvider();
        p.setCustomParameters({ prompt: 'select_account' });
        return F.setPersistence(auth, F.browserSessionPersistence).catch(function () {})
          .then(function () { return F.signInWithPopup(auth, p); })
          .then(function (r) {
            var info = null; try { info = F.getAdditionalUserInfo(r); } catch (e) {}
            var u = usuarioDe(r.user); u.nuevo = !!(info && info.isNewUser); return u;
          })
          .catch(function (e) {
            if (/popup-blocked|operation-not-supported/.test(e && e.code || '')) {
              return F.signInWithRedirect(auth, p).then(function () { return null; });
            }
            throw e;
          });
      },
      proveedor: function () {
        var u = auth.currentUser;
        if (!u) return Promise.resolve(null);
        return u.getIdTokenResult().then(function (r) { return r.signInProvider || null; });
      },
      eliminar : function () { return auth.currentUser ? F.deleteUser(auth.currentUser) : Promise.resolve(); },
      salir    : function () { return F.signOut(auth); },
      /* correo real de Firebase. Si el enlace del correo apunta a Firebase (plantilla
         sin cambiar), su página muestra «Continuar» y vuelve a JYNTRA. */
      recuperar: function (c) {
        var vuelta = { url: location.origin + '/', handleCodeInApp: false };
        return F.sendPasswordResetEmail(auth, c, vuelta).catch(function (e) {
          /* dirección de prueba no autorizada como «vuelta»: se envía igual, sin vuelta */
          if (/unauthorized-continue-uri|invalid-continue-uri|missing-continue-uri/.test(e && e.code || '')) return F.sendPasswordResetEmail(auth, c);
          throw e;
        });
      },
      leerCodigo: function (modo, oob) {
        if (modo === 'resetPassword') return F.verifyPasswordResetCode(auth, oob);
        if (modo === 'verifyEmail') return F.checkActionCode(auth, oob).then(function (i) {
          return F.applyActionCode(auth, oob).then(function () { return (i.data && i.data.email) || ''; });
        });
        if (modo === 'recoverEmail') return F.checkActionCode(auth, oob).then(function (i) {
          return F.applyActionCode(auth, oob).then(function () { return (i.data && i.data.email) || ''; });
        });
        var e = new Error('modo desconocido'); e.code = 'auth/invalid-action-code'; return Promise.reject(e);
      },
      nuevaClave: function (oob, k) { return F.confirmPasswordReset(auth, oob, k); },
      verificar: function () {
        return auth.currentUser ? F.sendEmailVerification(auth.currentUser) : Promise.resolve();
      },
      refrescar: function () {
        var u = auth.currentUser;
        if (!u) return Promise.resolve(null);
        return F.reload(u).then(function () { return u.getIdToken(true); })
                          .then(function () { return usuarioDe(auth.currentUser); });
      },
      actual   : function () { return usuarioDe(auth.currentUser); }
    },
    set: function (ruta, datos) { return F.setDoc(F.doc(db, ruta), datos); },
    del: function (ruta) { return F.deleteDoc(F.doc(db, ruta)); },
    escuchar: function (q, ok, mal) {
      if (q.doc) {
        return F.onSnapshot(F.doc(db, q.doc), function (s) {
          ok(s.exists() ? [{ id: s.id, ruta: s.ref.path, datos: s.data() }] : []);
        }, mal);
      }
      var ref = F.collection(db, q.col);
      var qq  = q.donde ? F.query(ref, F.where(q.donde[0], '==', q.donde[1])) : ref;
      return F.onSnapshot(qq, function (s) {
        var l = [];
        s.forEach(function (d) { l.push({ id: d.id, ruta: d.ref.path, datos: d.data() }); });
        ok(l);
      }, mal);
    }
  };
};

/* ---------------------------------------------------------------
   Conector de pruebas: habla con el servidor local /__mock
   --------------------------------------------------------------- */
window.JYNUBE_BACKENDS.mock = function (cfg) {
  var BASE = (cfg.url || '') + '/__mock';
  var tok  = null, usr = null;
  try { tok = localStorage.getItem('jymock.tok'); usr = JSON.parse(localStorage.getItem('jymock.usr') || 'null'); } catch (e) {}
  var oyentes = [];
  function guardarSesion() {
    try {
      if (tok) { localStorage.setItem('jymock.tok', tok); localStorage.setItem('jymock.usr', JSON.stringify(usr)); }
      else { localStorage.removeItem('jymock.tok'); localStorage.removeItem('jymock.usr'); }
    } catch (e) {}
  }
  function emitir() { oyentes.forEach(function (f) { try { f(usr); } catch (e) { console.error(e); } }); }
  function post(p, body) {
    return fetch(BASE + p, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-tok': tok || '' },
      body: JSON.stringify(body || {})
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (j.error) { var e = new Error(j.error); e.code = j.code; throw e; }
      return j;
    });
  }
  /* escrituras en orden, como el SDK de Firestore */
  var cola = Promise.resolve();
  function enCola(fn) {
    var p = cola.then(fn);
    cola = p.catch(function () {});
    return p;
  }
  var cid = 'c' + Math.random().toString(36).slice(2), canal = null, canalTok = null, contador = 0, manejadores = {};
  function abrirCanal() {
    if (canal && canalTok === tok) return canal.listo;
    if (canal) { try { canal.es.close(); } catch (e) {} }
    cid = 'c' + Math.random().toString(36).slice(2);
    var es = new EventSource(BASE + '/stream?cid=' + cid + '&tok=' + encodeURIComponent(tok || ''));
    canalTok = tok;
    canal = { es: es, listo: new Promise(function (ok) { es.onopen = function () { ok(); }; }) };
    es.onmessage = function (ev) {
      var j = JSON.parse(ev.data); var h = manejadores[j.id]; if (!h) return;
      if (j.r.error) { delete manejadores[j.id]; var e = new Error(j.r.error); e.code = j.r.code; if (h.mal) h.mal(e); return; }
      h.ok(j.r.docs);
    };
    return canal.listo;
  }
  function sesion(j) { tok = j.tok; usr = j.usr; guardarSesion(); setTimeout(emitir, 0); return usr; }

  return {
    tipo: 'mock',
    auth: {
      onCambio : function (cb) { oyentes.push(cb); setTimeout(function () { cb(usr); }, 20); return function () {}; },
      crear    : function (c, k) { return post('/auth/crear', { email: c, pass: k }).then(sesion); },
      entrar   : function (c, k) { return post('/auth/entrar', { email: c, pass: k }).then(sesion); },
      /* en las pruebas, la «ventana de Google» es window.JYMOCK_GOOGLE (el correo elegido) */
      google   : function () {
        var c = window.JYMOCK_GOOGLE;
        if (!c) { var e = new Error('cancelado'); e.code = 'auth/popup-closed-by-user'; return Promise.reject(e); }
        return post('/auth/google', { email: c }).then(function (j) { var n = j.nuevo; var u = sesion(j); u = Object.assign({}, u, { nuevo: !!n }); return u; });
      },
      proveedor: function () { return Promise.resolve(usr ? (usr.prov || 'password') : null); },
      eliminar : function () { return post('/auth/eliminar', {}).then(function () { tok = null; usr = null; guardarSesion(); setTimeout(emitir, 0); }); },
      salir    : function () { tok = null; usr = null; guardarSesion(); setTimeout(emitir, 0); return Promise.resolve(); },
      recuperar: function (c) { return post('/auth/recuperar', { email: c }); },
      leerCodigo: function (modo, oob) { return post('/auth/codigo', { modo: modo, oob: oob }).then(function (j) { return j.email; }); },
      nuevaClave: function (oob, k) { return post('/auth/nuevaclave', { oob: oob, pass: k }); },
      verificar: function () { return post('/auth/verificar', {}); },
      refrescar: function () { return post('/auth/yo', {}).then(function (j) { usr = j.usr; guardarSesion(); return usr; }); },
      actual   : function () { return usr; }
    },
    set: function (ruta, datos) { return enCola(function () { return post('/set', { ruta: ruta, datos: datos }); }); },
    del: function (ruta) { return enCola(function () { return post('/del', { ruta: ruta }); }); },
    escuchar: function (q, ok, mal) {
      /* un solo canal por pestaña (como Firestore): el navegador limita
         las conexiones simultáneas a un mismo servidor */
      var id = 's' + (++contador);
      manejadores[id] = { ok: ok, mal: mal };
      abrirCanal().then(function () {
        if (!manejadores[id]) return;
        fetch(BASE + '/sub', { method: 'POST', headers: { 'content-type': 'application/json', 'x-tok': tok || '' },
          body: JSON.stringify({ cid: cid, id: id, q: q }) });
      });
      return function () {
        delete manejadores[id];
        fetch(BASE + '/unsub', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ cid: cid, id: id }) });
      };
    }
  };
};

/* ================================================================
   JYNTRA · configuración de la nube
   ----------------------------------------------------------------
   activa  : true  → cuentas reales (Firebase Auth) y datos
                     sincronizados entre dispositivos (Firestore).
             false → modo local de siempre (todo en el navegador).
   Los datos de "firebase" son los de la app web registrada en el
   proyecto jintra-db (no son secretos: identifican al proyecto; la
   protección real está en firestore.rules).
   ================================================================ */
window.JYNTRA_NUBE = {
  activa : true,
  backend: 'firebase',
  firebase: {
    apiKey           : 'AIzaSyAS6QcVFrIkAhOxaMa2IGpqLgoUXUwpQTw',
    authDomain       : 'jintra-db.firebaseapp.com',
    projectId        : 'jintra-db',
    storageBucket    : 'jintra-db.firebasestorage.app',
    messagingSenderId: '928873571708',
    appId            : '1:928873571708:web:a5ad16712a58925ebe70f9'
  }
};

/* Sólo para pruebas automáticas: un entorno de prueba puede forzar
   otro backend antes de que cargue la página. En producción no existe. */
if (window.JYNTRA_NUBE_FORZAR) {
  for (var k in window.JYNTRA_NUBE_FORZAR) window.JYNTRA_NUBE[k] = window.JYNTRA_NUBE_FORZAR[k];
}

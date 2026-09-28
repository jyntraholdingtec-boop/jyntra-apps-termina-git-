// ==========================================
// 1. CONFIGURACIÓN E INICIALIZACIÓN DE FIREBASE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAS6QcVFrIkAhOxaMa2IGpqLgoUXUwpQTw",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "jintra-db",
  storageBucket:"jintra-db.firebasestorage.app",
  messagingSenderId:  "928873571708",
  appId: "1:928873571708:web:a5ad16712a58925ebe70f9",
};

// Inicializar servicios
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// Variable global para almacenar el usuario activo
let usuarioActual = null;

// ==========================================
// 2. CONTROL DE AUTENTICACIÓN / SESIÓN
// ==========================================
auth.onAuthStateChanged((user) => {
  if (user) {
    usuarioActual = user;
    console.log("Usuario autenticado correctamente:", user.uid);
    // Ejecutar callback si la vista lo requiere al cargar
    if (typeof alCargarSesion === "function") {
      alCargarSesion(user);
    }
  } else {
    usuarioActual = null;
    console.warn("No hay sesión activa.");
    // Redirigir al login si no está en la página principal
    if (!window.location.pathname.endsWith("index.html") && window.location.pathname !== "/") {
      window.location.href = "../index.html";
    }
  }
});

// ==========================================
// 3. FUNCIONES DE FIRESTORE (GUARDAR Y LLEER)
// ==========================================

/**
 * Guarda datos de un módulo (Anamnesis, Cineantropometría, Nutrición) para un atleta en específico.
 * @param {string} atletaId - ID único del atleta o cliente.
 * @param {string} modulo - Nombre del módulo ('anamnesis', 'cineantropometria', 'nutricion').
 * @param {object} datos - Objeto JSON con la información recopilada del formulario.
 */
async function guardarDatosModulo(atletaId, modulo, datos) {
  if (!usuarioActual) {
    alert("Debes iniciar sesión para guardar información.");
    return false;
  }

  try {
    const docRef = db
      .collection("usuarios")
      .doc(usuarioActual.uid)
      .collection("atletas")
      .doc(atletaId)
      .collection("evaluaciones")
      .doc(modulo);

    await docRef.set({
      ...datos,
      ultimaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`Datos de ${modulo} guardados correctamente.`);
    return true;
  } catch (error) {
    console.error(`Error guardando datos en ${modulo}:`, error);
    alert("Ocurrió un error al guardar los datos.");
    return false;
  }
}

/**
 * Carga los datos registrados de un módulo para un atleta en específico.
 * @param {string} atletaId - ID único del atleta.
 * @param {string} modulo - Nombre del módulo ('anamnesis', 'cineantropometria', 'nutricion').
 */
async function obtenerDatosModulo(atletaId, modulo) {
  if (!usuarioActual) return null;

  try {
    const docRef = db
      .collection("usuarios")
      .doc(usuarioActual.uid)
      .collection("atletas")
      .doc(atletaId)
      .collection("evaluaciones")
      .doc(modulo);

    const snapshot = await docRef.get();
    if (snapshot.exists) {
      return snapshot.data();
    } else {
      console.log(`No se encontraron datos previos para ${modulo}.`);
      return null;
    }
  } catch (error) {
    console.error(`Error al leer datos de ${modulo}:`, error);
    return null;
  }
}

# JYNTRA · versión en la nube (Fase 1)

Cuentas reales (Firebase Auth) y datos sincronizados entre dispositivos (Firestore).

```
jyntra-nube/
├── firebase.json          ← publica public/ y las reglas de Firestore
├── .firebaserc            ← proyecto jintra-db
├── firestore.rules        ← SEGURIDAD: quién puede leer y escribir qué
└── public/
    ├── index.html         ← la cáscara (ahora sincroniza con la nube)
    ├── nube-config.js     ← activa:true/false + datos del proyecto
    ├── nube-backend.js    ← conector con Firebase
    ├── vendor/firebase-jyntra.js   ← librería de Firebase (local, sin CDN)
    └── herramientas/      ← las mismas herramientas, sin cambios
```

## Antes de publicar (una sola vez, en la consola de Firebase)

1. Authentication → Método de acceso → **Correo electrónico/contraseña** activado.
2. Firestore Database **creada** (edición Standard, ubicación Santiago o São Paulo).

## Publicar

Siempre desde esta carpeta:

```powershell
cd "C:\Users\jyntr\Downloads\Jyntra apps\jyntra-nube"

# 1) reglas de seguridad (primero)
firebase deploy --only firestore:rules

# 2) versión de PRUEBA en una dirección aparte (no toca la app publicada)
firebase hosting:channel:deploy prueba --expires 7d

# 3) cuando la prueba sale bien: la app de verdad
firebase deploy --only hosting
```

## Volver atrás

Si algo sale mal, en `public/nube-config.js` cambia `activa: true` por `activa: false`
y publica de nuevo: la app vuelve al modo local de antes.

## Diagnóstico

En el navegador (F12 → Consola) escribe `JYNUBE.estado()` y copia el resultado.

## Seguridad (resumen de firestore.rules)

- Sin sesión no se lee ni escribe nada.
- Datos de salud: en `/alumnos/{id}/...`. Los ven solo el alumno y sus profesionales con vínculo activo.
- Correo, teléfono y nacimiento: en `/privado/{id}`. Los ven la persona, sus conexiones activas y el administrador.
- El administrador no lee datos de salud.
- **Administrador: una sola cuenta, y sólo entrando con Google** (con la verificación en 2 pasos de esa cuenta de Google).
  Aunque alguien supiera una contraseña de ese correo, entrando con correo/contraseña no obtiene ningún permiso.
  Nadie, ni el propio administrador, puede nombrar a un segundo administrador.
  La sesión del administrador se cierra al cerrar el navegador y tras 15 minutos sin actividad.
  El correo autorizado no aparece en el código público de la página (sólo su huella SHA-256, `ADMIN_HUELLA`).
- Nadie puede cambiarse el rol a sí mismo.
- Un vínculo activo nace solo de una solicitud aceptada o de una invitación aceptada.

## Fase 2 · app instalable y sin dependencias externas

- `manifest.webmanifest`, `sw.js` e `iconos/`: la app se instala en el celular y abre sin conexión.
  El trabajador `sw.js` usa primero la red (siempre la versión nueva) y, si no hay red, la última copia.
- `public/vendor/`: todas las librerías viven en el proyecto (Firebase, Chart.js, jsPDF, html2canvas,
  Font Awesome, Tailwind compilado para la cineantropometría y el Perfil del atleta precompilado).
  Solo las tipografías siguen viniendo de Google Fonts.

### Si modificas el Perfil del atleta o las clases de la cineantropometría

El código fuente está en `fuentes/`. Para regenerar lo que va en `public/vendor/`:

```powershell
cd "C:\Users\jyntr\Downloads\Jyntra apps\jyntra-nube\fuentes"
npm install        # solo la primera vez
npm run compilar
```

## Identidad visual (logo y paleta)

| Color | Código | Uso |
|---|---|---|
| Blanco | `#FFFFFF` | logo, títulos, letras destacadas |
| Negro | `#171717` | fondo general |
| Rojo | `#DD2C37` | botones principales, menú activo, indicadores, alertas |
| Blanco 2 | `#EEF1F3` | texto de lectura |

Tarjetas y bordes usan grises neutros derivados del negro. Solo se conservan los colores con significado
(verde = guardado/correcto, ámbar = advertencia y los colores de proteínas, carbohidratos y grasas).

El logo está en `fuentes/logo/`: el original y versiones vectoriales (SVG) del logo completo, el símbolo
y la palabra, en blanco y en negro, listas para la web, la Play Store o impresión.

## Colores por perfil

Botones y logo: rojo de la marca. Cada perfil tiene además su color, que aparece en el portal
al pasar el cursor y dentro del perfil como líneas (franja del menú, línea bajo la barra superior,
opción activa, indicadores, títulos):

| Perfil | Color |
|---|---|
| Alumno | rojo `#DD2C37` |
| Profesor | mostaza `#D9A21E` |
| Nutricionista | verde `#2DB36A` |
| Administrador | azul `#2F7FE8` |

Para cambiarlos: en `public/index.html`, bloque «colores de perfil» (`--r-alumno`, `--r-profesor`, …).

## Recuperar contraseña

«¿Olvidaste tu contraseña?» está en Alumno, Profesor y Nutricionista. El Administrador no tiene
contraseña en JYNTRA: su acceso es su cuenta de Google.

El correo lo envía Firebase de verdad (desde noreply@jintra-db.firebaseapp.com). Para que lleve
la marca JYNTRA y su enlace abra la pantalla propia «Crea tu contraseña nueva» (sección §25 de
index.html), en la consola de Firebase — DESPUÉS de publicar esta versión:

1. ⚙ Configuración del proyecto → General → Nombre público: `JYNTRA`.
2. Authentication → Plantillas → Restablecimiento de contraseña → ✏:
   nombre del remitente `JYNTRA`, asunto `Crea tu contraseña nueva de JYNTRA`, mensaje en español.
3. En esa misma plantilla: «Personalizar URL de acción» → `https://jintra-db.web.app/` (vale para todas las plantillas).
4. Idioma de las plantillas: Español.

Si el paso 3 no se hace, el enlace abre la página genérica de Firebase, que igual funciona.

## Ver la contraseña

Todos los campos de contraseña tienen un ojo para mostrarla u ocultarla. Al enviar el formulario
vuelve a ocultarse sola.

## Protección contra borrados (v6)

La app sólo borra de la nube lo que alguien quitó a propósito y que la nube todavía muestra.
Si una conexión se corta, los datos pueden desaparecer de la pantalla un momento, pero nunca
se borran de la base de datos. El administrador no puede borrar a más de una persona de una vez.

Respaldo recomendado (consola de Firebase → Firestore Database → Recuperación ante desastres):
activar la recuperación de un momento determinado (PITR, 7 días) y copias de seguridad diarias.

## Consentimiento y pestañas (v7)

- El aviso de consentimiento sólo aparece cuando la nube ya respondió que esa cuenta no tiene
  uno guardado. Aceptado en una sesión, no se vuelve a pedir en esa sesión aunque la nube tarde.
- Si la nube rechaza guardarlo, se muestra «No se pudo guardar (consentimientos)…» en vez de
  volver a preguntar en silencio.
- El canal entre pestañas de la versión local (copiaba datos por localStorage cada 4 s) queda
  apagado con la nube: mezclaba sesiones de personas distintas abiertas en el mismo navegador.
- Diagnóstico: F12 → Consola → `JYNUBE.estado()` (incluye cuántos consentimientos tiene la cuenta).

## v8 · Perfiles: ya no se pueden enumerar

Hallazgo de seguridad: cualquier persona registrada podía leer/listar todos los perfiles de `usuarios`.
Ahora (`firestore.rules`):
- Cada persona lee **su** perfil. El administrador (Google) lee todos.
- El directorio público **lista sólo profesionales** (la consulta debe filtrar por `rol`).
- Un **alumno** sólo lo lee su profesional cuando existe un vínculo (incluso pendiente). Un alumno no ve a otro ni puede listar la colección.
- Correo, teléfono y nacimiento siguen en `privado/{uid}` (ya estaba acotado).
Publica **las reglas** (`firebase deploy --only firestore:rules`) junto con el sitio: reglas y app van en pareja.

### v8 (mejorada) · pantallas
- Marca: sin «Technologies»; eslogan **«Tu progreso conectado»** en el portal y en la pantalla de acceso.
- Agenda: cada bloque queda dentro de su día (nombre largo se corta con «…», el detalle se ajusta), etiqueta «sin publicar / publicado», días que se acomodan en filas según el ancho.
- Celular (Android / iOS): ninguna tabla empuja la pantalla (se desplazan dentro de su caja), márgenes de muesca (safe-area), sin zoom al escribir en iPhone, botón «Privacidad» dentro del menú.
- Huecos de desarrollo (ranuras, pilares, contratos de montaje) sólo los ve el administrador.
- Alumno: «Mi coach», «Mi nutricionista» o «Mi equipo multidisciplinario» según con quién esté conectado.
- Fechas en hora de Chile (antes, «Hoy» podía mostrar el día anterior o el siguiente).

### v9
- Ortografía: tildes y voseo corregidos en toda la app y en las herramientas (Elige, Haz clic, Aquí, Hábitos, Análisis, Tríceps, Bíceps…). Eslogan «Tu progreso conectado».
- Sesiones por plan: Base y Pro hasta 4 sesiones por alumno; Elite sin límite. Alumno sin coach: hasta 4 sesiones propias (con aviso claro al llegar al tope).
- «Guardar mi pauta» sólo aparece si el alumno está conectado con un profesional.
- Los marcos de las herramientas miden lo que mide su contenido (sin franjas vacías).
- Planilla de entrenamiento (PDF / imprimir): logo negro sobre la hoja blanca; en celular la hoja se ajusta.

### v9.1
- Nuevo grupo muscular **Deltoides** en el planificador (profesional y alumno): 65 GIFs de la carpeta de Drive, repartidos en Barra, Mancuernas, Polea, Máquina y Manguito rotador. Sale en el selector de grupo, en la leyenda (DEL) y se detecta solo al subir GIFs propios.
- No borra ni cambia nada de lo ya guardado (no se tocó la versión del catálogo).

### v9.2
- **Google Calendar eliminado** por completo (función `calendario`, reglas y pantallas). Hay que borrar la función ya desplegada: `firebase functions:delete calendario --region us-central1 --force`.
- **Carga rápida de clases** (profesor, en Agenda): eliges alumno, días y horas y se crean todas las clases de una vez.
- **Modo día / noche**: botón arriba a la derecha (y en la pantalla de acceso). Se recuerda por dispositivo y lo siguen las herramientas. Contraste revisado pantalla por pantalla; logo negro sobre fondo claro; cada perfil mantiene su color (alumno rojo, profesor mostaza, nutricionista verde), también al pasar el cursor.
- **Eliminar mi perfil y mis datos** (Ley 21.719) en Perfil → «Privacidad y eliminación», para alumno, profesor y nutricionista; pide la contraseña. El administrador no puede autoeliminarse.
- Reglas de Firestore: cada persona puede borrar su propio perfil, consentimientos y datos privados. Desplegar con `firebase deploy --only firestore:rules`.

### v9.2.2
- Portal de perfiles con botón **Modo día / Modo noche** (por defecto siempre noche).
- Eliminar perfil: se confirma **sólo con la contraseña** (ya no hay que escribir ELIMINAR) y la persona puede elegir un **motivo** y escribir una breve descripción (opcional, máx. 300 caracteres).
- Los motivos se guardan **anónimos** en la colección `bajas` (rol, motivo, detalle, fecha; sin nombre, correo ni id). Sólo el administrador puede leerlos. Requiere `firebase deploy --only firestore:rules`.

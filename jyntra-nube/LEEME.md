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
- El administrador no lee datos de salud. Solo `jyntra.holding.tec@gmail.com`, con el correo verificado, puede ser administrador.
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

# JYNTRA · carpeta de publicación (Firebase Hosting)

Esta carpeta es **lo único que se publica**. No depende de Vite, React ni `npm`.

```
jyntra-hosting/
├── firebase.json        ← publica la carpeta public/ (proyecto jintra-db)
├── .firebaserc
└── public/
    ├── index.html       ← la cáscara (4 perfiles, 8 pilares)
    └── herramientas/
        ├── _puente.js            ← contexto de cada herramienta (NO reemplazar)
        ├── anamnesis.html        ← Evaluación del profesor
        ├── anamnesis-alu.html    ← Mi evaluación del alumno
        ├── perfil-atleta.html    ← Perfil del atleta + 1RM
        ├── planificador-pro.html / planificador-alu.html
        ├── cineantropometria.html
        └── nutricion.html        ← anamnesis nutricional + plan + recetas
```

## Probar en tu computador

```powershell
cd "C:\Users\jyntr\Downloads\Jyntra apps\jyntra-hosting"
firebase serve --only hosting
```

Abre http://localhost:5000. No abras `index.html` con doble clic: las herramientas necesitan un servidor.

## Publicar

```powershell
cd "C:\Users\jyntr\Downloads\Jyntra apps\jyntra-hosting"
firebase deploy --only hosting
```

Siempre desde **esta** carpeta. Desde otra, Firebase usa otro `firebase.json` y publica lo que no es.

## Cuenta de administrador

La primera vez: tarjeta **Administrador** → Crear cuenta, con `jyntra.holding.tec@gmail.com`.
Solo los correos de `ADMIN_CORREOS` (en `index.html`) pueden crear un administrador.

## Límite actual (siguiente fase)

Los datos viven en el navegador de cada persona (localStorage). Una cuenta creada en el celular
no existe en el computador, y profesor y alumno solo comparten datos si usan el mismo navegador.
Para conectarlos entre dispositivos falta la fase de **Firebase Auth + Firestore + reglas**.


import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Dumbbell, Activity, Ruler as RulerIcon, HeartPulse, Calculator, Save, FileDown,
  Send, User, CheckCircle2, TrendingUp, TrendingDown, Minus, Gauge as GaugeIcon,
  ChevronDown
} from 'lucide-react';

/* ============================================================================
   JYNTRA — Evaluaciones (Perfil Alumnos · 1RM · VO2 Máx · Flexibilidad)
   Métricas y fórmulas idénticas al original. Rediseño visual + PDF instrumentado.
   ========================================================================== */

/* ============================ PUENTE JYNTRA ================================
   La cáscara (jyntra_app / perfil profesional) inyecta window.__JY_CTX en la
   cabecera del iframe antes de que arranque React. Desde ahí sacamos el alumno
   en pantalla y su última evaluación guardada, y por postMessage devolvemos
   cada registro al pilar 5 (Datos) de la ficha.
   ========================================================================== */

const JY   = (typeof window !== 'undefined' && window.__JY_CTX) || null;
const JYA  = (JY && JY.alumno) || {};
const JYEV = (JY && JY.evaluacion) || null;
const EMBEBIDO = !!JY || (typeof window !== 'undefined' && window.parent && window.parent !== window);

/* Devuelve un registro a la ficha del alumno. true si la cáscara lo recibió. */
function jyGuardar(registro) {
  try {
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage({ jyntra: true, accion: 'guardar', registro }, '*');
      return true;
    }
  } catch (e) { /* fuera de la cáscara: sigue funcionando como app suelta */ }
  return false;
}

/* Perfil rehidratado desde el último registro guardado en la ficha. */
function jyPerfilGuardado() {
  if (JYEV && JYEV.perfil && JYEV.perfil.name) {
    return Object.assign({}, JYEV.perfil, { records: JYEV.registros || {} });
  }
  return null;
}

/* ---------------------------------- Datos --------------------------------- */

const OBJECTIVES = ['Fuerza Máxima', 'Hipertrofia', 'Resistencia', 'Salud General', 'Rehabilitación'];

const EXERCISES = [
  'Sentadilla Profunda con Barra Olímpica', 'Press de Banca Recta', 'Peso Muerto Convencional',
  'Peso Muerto Rumano', 'Peso Muerto Sumo', 'Hip Thrust con Barra',
  'Fondos de Tríceps (Weighted)', 'Remo con Barra Prono', 'Remo con Barra Supino',
  'Press de Hombro Sentado', 'Push Press'
];

const RM_AUTHORS = ['Brzycki', 'Epley', 'Lander'];

const VO2_PROTOCOLS = [
  {
    id: 'BRUCE', n: 'Bruce', unit: 'Tiempo hasta el agotamiento',
    d: 'Incrementos exigentes de velocidad y pendiente cada 3 minutos. Es el más usado para evaluar capacidad cardiorrespiratoria.',
    material: 'Cinta rodante con control de velocidad e inclinación, cronómetro, monitor de frecuencia cardíaca.',
    steps: [
      'Anamnesis breve y verificación de que el evaluado está en condiciones de realizar esfuerzo máximo.',
      'Calentamiento de 5 min a baja intensidad y colocación del monitor de frecuencia cardíaca.',
      'Etapa 1 (0–3 min): 2,7 km/h al 10% de pendiente.',
      'Etapa 2 (3–6 min): 4,0 km/h al 12% de pendiente.',
      'Etapa 3 (6–9 min): 5,5 km/h al 14% de pendiente.',
      'Etapa 4 (9–12 min): 6,8 km/h al 16% de pendiente.',
      'Etapa 5 en adelante: +1,3 km/h y +2% de pendiente cada 3 minutos, hasta el agotamiento voluntario o el criterio de detención.',
      'Detener el test ante agotamiento voluntario, FC máxima teórica alcanzada, o signos de intolerancia al esfuerzo.',
      'Registrar el tiempo total transcurrido (min:seg) en el momento exacto de la detención: ese valor se ingresa en la calculadora.'
    ]
  },
  {
    id: 'BALKE', n: 'Balke', unit: 'Tiempo hasta el agotamiento',
    d: 'Velocidad constante con aumento suave de pendiente. Ideal para personas poco entrenadas o pacientes cardíacos.',
    material: 'Cinta rodante con control de inclinación, cronómetro, monitor de frecuencia cardíaca.',
    steps: [
      'Calentamiento de 5 min y colocación del monitor de frecuencia cardíaca.',
      'Fijar la velocidad constante de la cinta en 5,3 km/h (3,3 mph) durante toda la prueba.',
      'Iniciar con pendiente 0% y aumentarla en 1% cada minuto, manteniendo la velocidad fija.',
      'El evaluado camina/trota a ritmo constante mientras la exigencia sube solo por la inclinación.',
      'Detener el test ante agotamiento voluntario, FC máxima teórica alcanzada, o signos de intolerancia al esfuerzo.',
      'Registrar el tiempo total transcurrido (min:seg) en el momento exacto de la detención: ese valor se ingresa en la calculadora.'
    ]
  },
  {
    id: 'RUFFIER', n: 'Ruffier', unit: 'Pulso en 3 momentos',
    d: 'Prueba de campo de esfuerzo submáximo (30 sentadillas) que mide la capacidad de recuperación cardíaca. No requiere cinta ni estima VO₂ máx directamente.',
    material: 'Cronómetro, superficie plana para sentadillas, silla (opcional para el reposo).',
    steps: [
      'Con el evaluado sentado y en reposo durante al menos 5 minutos, contar el pulso durante 15 segundos y multiplicar por 4. Ese valor es P0 (pulso en reposo).',
      'Realizar 30 sentadillas completas en 45 segundos, a ritmo constante.',
      'Inmediatamente al terminar la última sentadilla, contar el pulso durante 15 segundos y multiplicar por 4. Ese valor es P1 (pulso post-esfuerzo).',
      'Sentar al evaluado y dejar transcurrir exactamente 1 minuto de recuperación.',
      'Al cumplirse el minuto, contar el pulso durante 15 segundos y multiplicar por 4. Ese valor es P2 (pulso post-recuperación).',
      'Ingresar P0, P1 y P2 en la calculadora: el índice se obtiene con IR = (P0 + P1 + P2 − 200) / 10.'
    ]
  }
];

const RM_ZONES = [
  { name: 'Fuerza',      range: '85% - 100%', reps: '1 a 5 reps',  tone: 'bad',  percents: [100, 95, 90, 85] },
  { name: 'Hipertrofia', range: '70% - 80%',  reps: '6 a 12 reps', tone: 'ok',   percents: [80, 75, 70] },
  { name: 'Resistencia', range: '50% - 65%',  reps: '15+ reps',    tone: 'warn', percents: [65, 60, 50] }
];

/* --------------------------------- Fórmulas -------------------------------- */

const calculate1RM = (weight, reps, author) => {
  if (!weight || !reps || reps < 1) return 0;
  if (parseInt(reps) === 1) return parseFloat(weight);
  const w = parseFloat(weight);
  const r = parseInt(reps);
  switch (author) {
    case 'Brzycki': return w * (36 / (37 - r));
    case 'Epley':   return w * (1 + (r / 30));
    case 'Lander':  return (100 * w) / (101.3 - (2.67123 * r));
    default:        return w;
  }
};

const getRelativeStrength = (rm, bodyweight) => {
  if (!rm || !bodyweight || bodyweight <= 0) return { cat: '-', tone: 'mu' };
  const ratio = rm / bodyweight;
  if (ratio < 0.7) return { cat: 'Principiante', tone: 'bad' };
  if (ratio < 1.2) return { cat: 'Intermedio',   tone: 'warn' };
  if (ratio < 1.8) return { cat: 'Avanzado',     tone: 'info' };
  return { cat: 'Élite', tone: 'ok' };
};

const calculateBruce = (timeMinutes, gender) => {
  const t = parseFloat(timeMinutes);
  if (!t) return 0;
  if (gender === 'M') return 14.8 - (1.379 * t) + (0.451 * Math.pow(t, 2)) - (0.012 * Math.pow(t, 3));
  return (4.38 * t) - 3.9;
};

const calculateBalke = (timeMinutes, gender) => {
  const t = parseFloat(timeMinutes);
  if (!t) return 0;
  if (gender === 'M') return (1.444 * t) + 14.99;
  return (1.38 * t) + 5.22;
};

const calculateRuffier = (p0, p1, p2) => {
  const a = parseFloat(p0), b = parseFloat(p1), c = parseFloat(p2);
  if (!a || !b || !c) return null;
  return ((a + b + c) - 200) / 10;
};

const getRuffierRating = (index) => {
  if (index === null || index === undefined || isNaN(index)) return '-';
  if (index <= 5)  return 'Excelente';
  if (index <= 10) return 'Bueno';
  if (index <= 15) return 'Insuficiente';
  return 'Deficiente';
};

const getKarvonenZones = (age, measuredFcMax, measuredFcRep) => {
  const ageNum = parseInt(age) || 30;
  const fcMax = measuredFcMax ? parseInt(measuredFcMax) : (220 - ageNum);
  const fcRep = measuredFcRep ? parseInt(measuredFcRep) : 70;
  const fcRes = fcMax - fcRep;
  return {
    calentamiento: { min: Math.round(fcRep + fcRes * 0.50), max: Math.round(fcRep + fcRes * 0.60) },
    grasa:         { min: Math.round(fcRep + fcRes * 0.60), max: Math.round(fcRep + fcRes * 0.70) },
    resistencia:   { min: Math.round(fcRep + fcRes * 0.70), max: Math.round(fcRep + fcRes * 0.80) },
    maximo:        { min: Math.round(fcRep + fcRes * 0.80), max: Math.round(fcRep + fcRes * 0.95) }
  };
};

const getVO2Rating = (vo2, gen) => {
  if (!vo2) return '-';
  if (gen === 'M') {
    if (vo2 < 35) return 'Pobre';
    if (vo2 < 43) return 'Regular';
    if (vo2 < 52) return 'Bueno';
    return 'Excelente';
  }
  if (vo2 < 30) return 'Pobre';
  if (vo2 < 37) return 'Regular';
  if (vo2 < 45) return 'Bueno';
  return 'Excelente';
};

/* ------------------------------ Tonos / escalas ---------------------------- */

const TONE = {
  ok:   { hex: '#3FBF7F', soft: 'rgba(63,191,127,.14)',  rgb: [63, 191, 127],  bgPdf: [222, 246, 234], txPdf: [21, 92, 60] },
  info: { hex: '#4A9CF6', soft: 'rgba(74,156,246,.14)',  rgb: [74, 156, 246],  bgPdf: [222, 236, 253], txPdf: [26, 71, 130] },
  warn: { hex: '#E8B03A', soft: 'rgba(232,176,58,.14)',  rgb: [232, 176, 58],  bgPdf: [253, 241, 216], txPdf: [141, 92, 12] },
  bad:  { hex: '#E5484D', soft: 'rgba(229,72,77,.14)',   rgb: [229, 72, 77],   bgPdf: [253, 226, 227], txPdf: [140, 26, 30] },
  gold: { hex: '#DD2C37', soft: 'rgba(221,44,55,.14)',  rgb: [221, 44, 55],  bgPdf: [251, 226, 228], txPdf: [140, 26, 30] },
  mu:   { hex: '#8B877E', soft: 'rgba(139,135,126,.14)', rgb: [139, 135, 126], bgPdf: [238, 238, 238], txPdf: [70, 70, 70] }
};

const toneOf = (cat) => {
  const c = (cat || '').toLowerCase();
  if (c.includes('excelente') || c.includes('élite') || c.includes('elite') || c.includes('bajo')) return 'ok';
  if (c.includes('bueno') || c.includes('avanzado')) return 'info';
  if (c.includes('regular') || c.includes('intermedio') || c.includes('moderado') || c.includes('insuficiente')) return 'warn';
  if (c.includes('pobre') || c.includes('principiante') || c.includes('alto') || c.includes('deficiente')) return 'bad';
  return 'mu';
};

const SCALES = {
  relStrength: { min: 0, max: 2.4, unit: '× peso corporal', decimals: 2, segments: [
    { from: 0,   to: 0.7, label: 'Principiante', tone: 'bad'  },
    { from: 0.7, to: 1.2, label: 'Intermedio',   tone: 'warn' },
    { from: 1.2, to: 1.8, label: 'Avanzado',     tone: 'info' },
    { from: 1.8, to: 2.4, label: 'Élite',        tone: 'ok'   }
  ]},
  vo2M: { min: 20, max: 65, unit: 'ml/kg/min', decimals: 1, segments: [
    { from: 20, to: 35, label: 'Pobre',     tone: 'bad'  },
    { from: 35, to: 43, label: 'Regular',   tone: 'warn' },
    { from: 43, to: 52, label: 'Bueno',     tone: 'info' },
    { from: 52, to: 65, label: 'Excelente', tone: 'ok'   }
  ]},
  vo2F: { min: 15, max: 60, unit: 'ml/kg/min', decimals: 1, segments: [
    { from: 15, to: 30, label: 'Pobre',     tone: 'bad'  },
    { from: 30, to: 37, label: 'Regular',   tone: 'warn' },
    { from: 37, to: 45, label: 'Bueno',     tone: 'info' },
    { from: 45, to: 60, label: 'Excelente', tone: 'ok'   }
  ]},
  ruffier: { min: 0, max: 20, unit: 'índice IR', decimals: 1, segments: [
    { from: 0,  to: 5,  label: 'Excelente',    tone: 'ok'   },
    { from: 5,  to: 10, label: 'Bueno',        tone: 'info' },
    { from: 10, to: 15, label: 'Insuficiente', tone: 'warn' },
    { from: 15, to: 20, label: 'Deficiente',   tone: 'bad'  }
  ]},
  sitReach: { min: -15, max: 30, unit: 'cm', decimals: 1, segments: [
    { from: -15, to: 0,  label: 'Pobre',     tone: 'bad'  },
    { from: 0,   to: 6,  label: 'Regular',   tone: 'warn' },
    { from: 6,   to: 15, label: 'Bueno',     tone: 'info' },
    { from: 15,  to: 30, label: 'Excelente', tone: 'ok'   }
  ]},
  escapular: { min: 0, max: 25, unit: 'cm', decimals: 1, segments: [
    { from: 0,  to: 5,  label: 'Excelente', tone: 'ok'   },
    { from: 5,  to: 10, label: 'Bueno',     tone: 'info' },
    { from: 10, to: 15, label: 'Regular',   tone: 'warn' },
    { from: 15, to: 25, label: 'Pobre',     tone: 'bad'  }
  ]},
  estres: { min: 1, max: 10, unit: '/ 10', decimals: 0, segments: [
    { from: 1, to: 4,  label: 'Bajo',      tone: 'ok'   },
    { from: 4, to: 7,  label: 'Moderado',  tone: 'warn' },
    { from: 7, to: 10, label: 'Alto',      tone: 'bad'  }
  ]}
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = (n, d = 1) => (isFinite(n) ? Number(n).toFixed(d) : '-');

/* ================================ PDF ENGINE ==============================
   Motor de reporte con jsPDF. Mantiene el encabezado original (banda negra +
   filete dorado + wordmark) y agrega el instrumento de medición vectorial.
   ========================================================================= */

const P = {
  gold: [221, 44, 55], ink: [23, 23, 23], soft: [245, 246, 247],
  line: [224, 226, 228], text: [23, 23, 23], mute: [120, 124, 128],
  L: 14, R: 196, W: 182
};

/* Logo oficial JYNTRA (símbolo en blanco, fondo transparente).
   Se usa tanto en el encabezado de la herramienta como en el PDF exportado,
   para que ambos documentos compartan la misma identidad visual. */
const LOGO_ICON_B64 = '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';
const LOGO_ICON_SRC = 'data:image/png;base64,' + LOGO_ICON_B64;
/* palabra JYNTRA del logo oficial (blanco) */
const LOGO_PALABRA_SRC = 'data:image/png;base64,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';

const pdfReady = () => typeof window !== 'undefined' && !!window.jspdf;

function newDoc() {
  const { jsPDF } = window.jspdf;
  return new jsPDF({ unit: 'mm', format: 'a4' });
}

function pdfHeader(doc, title) {
  doc.setFillColor(...P.ink);
  doc.rect(0, 0, 210, 42, 'F');
  doc.setFillColor(...P.gold);
  doc.rect(0, 42, 210, 1.5, 'F');

  // Logo oficial (imagen), a la izquierda del texto de marca
  try {
    doc.addImage(LOGO_ICON_SRC, 'PNG', P.L, 8, 13, 13);
  } catch (e) { /* si la imagen falla, el texto de marca sigue siendo legible */ }

  const textX = P.L + 16;
  doc.setTextColor(...P.gold);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('JYNTRA', textX, 17);

  doc.setTextColor(200, 200, 200);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('PERFORMANCE & DATA ANALYSIS', textX, 23);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(String(title).toUpperCase(), P.R, 20, { align: 'right' });

  doc.setTextColor(150, 150, 150);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('FECHA DE EMISIÓN: ' + new Date().toLocaleDateString('es-CL'), P.R, 26, { align: 'right' });
}

function pdfAthlete(doc, patient, y) {
  doc.setFillColor(...P.soft);
  doc.roundedRect(P.L, y, P.W, 22, 2, 2, 'F');
  doc.setFillColor(...P.gold);
  doc.rect(P.L, y, 2, 22, 'F');

  doc.setTextColor(...P.text);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ATLETA: ' + String(patient.name || '').toUpperCase(), P.L + 8, y + 8);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...P.mute);
  const line = [
    patient.age ? patient.age + ' años' : null,
    patient.weight ? patient.weight + ' kg' : null,
    patient.objective || null,
    patient.phone || null
  ].filter(Boolean).join('   |   ');
  doc.text(line, P.L + 8, y + 14);
  doc.text('REPORTE CONFIDENCIAL · GENERADO POR EL SISTEMA JYNTRA', P.L + 8, y + 19);
  return y + 30;
}

function pdfFooter(doc) {
  const n = doc.internal.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFillColor(...P.gold);
    doc.rect(0, 283.5, 210, 0.8, 'F');
    doc.setFillColor(...P.ink);
    doc.rect(0, 284.3, 210, 12.7, 'F');
    doc.setTextColor(205, 205, 205);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('JYNTRA · SOFTWARE DE EVALUACIÓN DEPORTIVA', P.L, 291);
    doc.setTextColor(...P.gold);
    doc.text('Página ' + i + ' de ' + n, P.R, 291, { align: 'right' });
  }
}

function ensureRoom(doc, ctx, need) {
  if (ctx.y + need > 276) { doc.addPage(); ctx.y = 22; }
}

function pdfSection(doc, ctx, label) {
  ensureRoom(doc, ctx, 16);
  ctx.y += 3;
  doc.setFillColor(...P.gold);
  doc.rect(P.L, ctx.y - 3.5, 3, 8, 'F');
  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(String(label).toUpperCase(), P.L + 6, ctx.y + 2.2);
  doc.setDrawColor(...P.line);
  doc.setLineWidth(0.3);
  doc.line(P.L + 6 + doc.getTextWidth(String(label).toUpperCase()) + 4, ctx.y + 1, P.R, ctx.y + 1);
  ctx.y += 11;
}

function pdfHero(doc, ctx, { value, unit, caption, badge, badgeTone, extras = [] }) {
  ensureRoom(doc, ctx, 34);
  const h = 28;
  doc.setFillColor(...P.ink);
  doc.roundedRect(P.L, ctx.y, P.W, h, 2.5, 2.5, 'F');
  doc.setFillColor(...P.gold);
  doc.rect(P.L, ctx.y, P.W, 1.2, 'F');

  doc.setTextColor(150, 148, 140);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(String(caption).toUpperCase(), P.L + 8, ctx.y + 10);

  doc.setTextColor(...P.gold);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.text(String(value), P.L + 8, ctx.y + 22);
  const vw = doc.getTextWidth(String(value));
  doc.setFontSize(9);
  doc.setTextColor(210, 208, 200);
  doc.setFont('helvetica', 'normal');
  if (unit) doc.text(unit, P.L + 10 + vw, ctx.y + 22);

  if (badge) {
    const t = TONE[badgeTone] || TONE.gold;
    const bw = 52;
    doc.setFillColor(...t.rgb);
    doc.roundedRect(P.R - bw - 6, ctx.y + 9, bw, 10, 5, 5, 'F');
    doc.setTextColor(10, 10, 10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(String(badge).toUpperCase(), P.R - bw / 2 - 6, ctx.y + 15.7, { align: 'center' });
  }

  if (extras.length) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 158, 150);
    doc.text(extras.join('     '), P.R - 6, ctx.y + 24.5, { align: 'right' });
  }
  ctx.y += h + 8;
}

/* Instrumento de medición: barra normativa con segmentos, ticks y aguja. */
function pdfScale(doc, ctx, { scale, value, title }) {
  ensureRoom(doc, ctx, 32);
  const { min, max, segments, unit, decimals } = scale;
  const x0 = P.L, w = P.W, barY = ctx.y + 8, barH = 7;

  if (title) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...P.mute);
    doc.text(String(title).toUpperCase(), x0, ctx.y + 3.5);
  }

  segments.forEach((s) => {
    const sx = x0 + ((s.from - min) / (max - min)) * w;
    const sw = ((s.to - s.from) / (max - min)) * w;
    const t = TONE[s.tone];
    doc.setFillColor(t.rgb[0], t.rgb[1], t.rgb[2]);
    doc.rect(sx, barY, sw, barH, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    if (sw > 16) doc.text(s.label.toUpperCase(), sx + sw / 2, barY + 4.6, { align: 'center' });
    doc.setTextColor(...P.mute);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.text(String(s.from), sx, barY + barH + 4);
  });
  doc.setTextColor(...P.mute);
  doc.setFontSize(6);
  doc.text(String(max), x0 + w, barY + barH + 4, { align: 'right' });

  const v = clamp(Number(value), min, max);
  const mx = x0 + ((v - min) / (max - min)) * w;
  doc.setFillColor(...P.ink);
  doc.triangle(mx, barY - 1.2, mx - 2.6, barY - 5.4, mx + 2.6, barY - 5.4, 'F');
  doc.setDrawColor(...P.ink);
  doc.setLineWidth(0.8);
  doc.line(mx, barY, mx, barY + barH);

  const lab = fmt(value, decimals) + ' ' + (unit || '');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  const lw = doc.getTextWidth(lab) + 6;
  const lx = clamp(mx - lw / 2, x0, x0 + w - lw);
  doc.setFillColor(...P.ink);
  doc.roundedRect(lx, barY - 12, lw, 6.5, 1.5, 1.5, 'F');
  doc.setTextColor(...P.gold);
  doc.text(lab, lx + lw / 2, barY - 7.6, { align: 'center' });

  ctx.y = barY + barH + 12;
}

function pdfKV(doc, ctx, rows) {
  rows.forEach((r, i) => {
    const label = String(r.label);
    const value = String(r.value == null || r.value === '' ? '-' : r.value);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const vLines = doc.splitTextToSize(value, 86);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    const lLines = doc.splitTextToSize(label, 76);
    const h = Math.max(lLines.length, vLines.length) * 4.6 + 5;
    ensureRoom(doc, ctx, h + 2);

    if (i % 2 === 0) {
      doc.setFillColor(250, 249, 246);
      doc.rect(P.L, ctx.y - 4, P.W, h, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...P.mute);
    doc.text(lLines, P.L + 3, ctx.y);

    if (r.tone) {
      const t = TONE[r.tone];
      doc.setFillColor(...t.bgPdf);
      doc.roundedRect(P.L + 92, ctx.y - 4.4, 54, 7.5, 3.5, 3.5, 'F');
      doc.setTextColor(...t.txPdf);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(value.toUpperCase(), P.L + 119, ctx.y + 0.7, { align: 'center' });
    } else {
      doc.setFont('helvetica', r.strong ? 'bold' : 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...P.text);
      doc.text(vLines, P.L + 92, ctx.y);
    }
    ctx.y += h;
  });
  ctx.y += 4;
}

/* Rejilla de cargas por porcentaje, agrupada por zona de trabajo */
function pdfLoadGrid(doc, ctx, rm) {
  RM_ZONES.forEach((z) => {
    const cells = z.percents.length;
    ensureRoom(doc, ctx, 24);
    const t = TONE[z.tone];
    doc.setFillColor(...t.bgPdf);
    doc.roundedRect(P.L, ctx.y, P.W, 20, 2, 2, 'F');
    doc.setFillColor(...t.rgb);
    doc.rect(P.L, ctx.y, 2, 20, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...t.txPdf);
    doc.text(z.name.toUpperCase(), P.L + 6, ctx.y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(z.range + ' · ' + z.reps, P.L + 6, ctx.y + 12);

    const gx = P.L + 62, gw = P.W - 68, cw = gw / cells;
    z.percents.forEach((p, i) => {
      const cx = gx + i * cw;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(cx + 1.5, ctx.y + 3, cw - 3, 14, 1.5, 1.5, 'F');
      doc.setFontSize(6.5);
      doc.setTextColor(...P.mute);
      doc.setFont('helvetica', 'normal');
      doc.text(p + '%', cx + cw / 2, ctx.y + 8, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...P.text);
      doc.text(fmt(rm * (p / 100), 1) + ' kg', cx + cw / 2, ctx.y + 14, { align: 'center' });
    });
    ctx.y += 24;
  });
  ctx.y += 2;
}

function pdfTable(doc, ctx, head, rows) {
  if (!rows.length) return;
  const cols = head.length;
  const cw = P.W / cols;
  ensureRoom(doc, ctx, 16);
  doc.setFillColor(...P.ink);
  doc.rect(P.L, ctx.y - 4, P.W, 8, 'F');
  doc.setTextColor(...P.gold);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  head.forEach((h, i) => doc.text(String(h).toUpperCase(), P.L + 3 + i * cw, ctx.y + 1));
  ctx.y += 8;

  const fs = cols >= 4 ? 7.8 : 8.5;
  rows.forEach((r, ri) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fs);
    const cells = r.map((c) => doc.splitTextToSize(String(c), cw - 5));
    const lines = Math.max.apply(null, cells.map((c) => c.length));
    const h = lines * 4.2 + 3.6;
    ensureRoom(doc, ctx, h + 2);
    if (ri % 2 === 0) {
      doc.setFillColor(250, 249, 246);
      doc.rect(P.L, ctx.y - 4, P.W, h, 'F');
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fs);
    doc.setTextColor(...P.text);
    cells.forEach((c, i) => doc.text(c, P.L + 3 + i * cw, ctx.y + 0.8));
    ctx.y += h;
  });
  ctx.y += 6;
}

function pdfNote(doc, ctx, text) {
  const lines = doc.splitTextToSize(text, P.W - 12);
  const h = lines.length * 4.4 + 9;
  ensureRoom(doc, ctx, h + 4);
  doc.setFillColor(252, 249, 238);
  doc.roundedRect(P.L, ctx.y - 4, P.W, h, 2, 2, 'F');
  doc.setFillColor(...P.gold);
  doc.rect(P.L, ctx.y - 4, 2, h, 'F');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(90, 80, 45);
  doc.text(lines, P.L + 6, ctx.y + 1.5);
  ctx.y += h + 4;
}

/* Compositor: recibe un "reporte" declarativo y lo dibuja. */
function buildPDF(report) {
  const doc = newDoc();
  pdfHeader(doc, report.title);
  const ctx = { y: pdfAthlete(doc, report.patient, 52) };

  report.blocks.forEach((b) => {
    if (b.type === 'section') pdfSection(doc, ctx, b.label);
    if (b.type === 'hero')    pdfHero(doc, ctx, b);
    if (b.type === 'scale')   pdfScale(doc, ctx, b);
    if (b.type === 'kv')      pdfKV(doc, ctx, b.rows);
    if (b.type === 'loads')   pdfLoadGrid(doc, ctx, b.rm);
    if (b.type === 'table')   pdfTable(doc, ctx, b.head, b.rows);
    if (b.type === 'note')    pdfNote(doc, ctx, b.text);
  });

  pdfFooter(doc);
  const clean = (s) => String(s || 'atleta').replace(/\s+/g, '_').replace(/[^\w\-]/g, '');
  doc.save('JYNTRA_' + clean(report.title) + '_' + clean(report.patient.name) + '.pdf');
}

/* -------------------------------- WhatsApp -------------------------------- */

const sendWhats = (phone, msg) => {
  const fallback = '+56999826310';
  const use = (phone && phone.trim() !== '') ? phone : fallback;
  const clean = use.replace(/\D/g, '');
  const text = msg + '\n\n_(Adjunta el PDF descargado a este chat)_';
  window.open('https://wa.me/' + clean + '?text=' + encodeURIComponent(text), '_blank');
};

/* ============================== Componentes UI ============================= */

function Ruler({ scale, value, label, compact }) {
  const { min, max, segments, unit, decimals } = scale;
  const has = value !== '' && value !== null && value !== undefined && isFinite(Number(value));
  const v = has ? clamp(Number(value), min, max) : null;
  const pct = has ? ((v - min) / (max - min)) * 100 : 0;

  return (
    <div className={'jt-ruler' + (compact ? ' is-compact' : '')}>
      {label && <div className="jt-ruler-title">{label}</div>}
      <div className="jt-ruler-track">
        {segments.map((s) => (
          <div
            key={s.label}
            className="jt-ruler-seg"
            style={{
              width: ((s.to - s.from) / (max - min)) * 100 + '%',
              background: TONE[s.tone].hex
            }}
          >
            <span>{s.label}</span>
          </div>
        ))}
        {has && (
          <div className="jt-ruler-needle" style={{ left: pct + '%' }}>
            <div className="jt-ruler-chip">{fmt(v, decimals)}<em>{unit}</em></div>
          </div>
        )}
      </div>
      <div className="jt-ruler-ticks">
        {segments.map((s) => (
          <span key={'t' + s.from} style={{ left: ((s.from - min) / (max - min)) * 100 + '%' }}>{s.from}</span>
        ))}
        <span style={{ left: '100%' }} className="is-end">{max}</span>
      </div>
    </div>
  );
}

function Gauge({ value, scale, unit, caption, decimals = 1 }) {
  const { min, max, segments } = scale;
  const has = value !== '' && value !== null && isFinite(Number(value)) && Number(value) !== 0;
  const v = has ? clamp(Number(value), min, max) : min;
  const R = 78, CX = 100, CY = 96, SW = 16;

  const polar = (r, ang) => {
    const a = (Math.PI * (180 - ang)) / 180;
    return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
  };
  const arc = (r, a0, a1) => {
    const [x0, y0] = polar(r, a0);
    const [x1, y1] = polar(r, a1);
    return 'M ' + x0 + ' ' + y0 + ' A ' + r + ' ' + r + ' 0 0 1 ' + x1 + ' ' + y1;
  };
  const toAng = (val) => ((clamp(val, min, max) - min) / (max - min)) * 180;
  const needle = toAng(v);
  const [nx, ny] = polar(R - 24, needle);

  return (
    <div className="jt-gauge">
      <svg viewBox="0 0 200 118" className="jt-gauge-svg">
        <path d={arc(R, 0, 180)} stroke="rgba(255,255,255,.05)" strokeWidth={SW} fill="none" strokeLinecap="round" />
        {segments.map((s) => (
          <path
            key={s.label}
            d={arc(R, toAng(s.from), toAng(s.to))}
            stroke={TONE[s.tone].hex}
            strokeWidth={SW}
            fill="none"
            opacity={has ? 1 : 0.35}
          />
        ))}
        {has && (
          <g className="jt-needle">
            <line x1={CX} y1={CY} x2={nx} y2={ny} stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
            <circle cx={CX} cy={CY} r="6" fill="#1C1C1C" stroke="#FFFFFF" strokeWidth="2.5" />
          </g>
        )}
      </svg>
      <div className="jt-gauge-read">
        <strong>{has ? fmt(v, decimals) : '--'}</strong>
        <span>{unit}</span>
      </div>
      <div className="jt-gauge-cap">{caption}</div>
    </div>
  );
}

function Verdict({ cat }) {
  if (!cat || cat === '-') {
    return <div className="jt-verdict is-empty">Ingresa los datos para obtener la clasificación</div>;
  }
  const t = TONE[toneOf(cat)];
  return (
    <div className="jt-verdict" style={{ borderColor: t.hex, background: t.soft, color: t.hex }}>
      <CheckCircle2 size={18} /> {cat}
    </div>
  );
}

function Delta({ current, previous, unit, invert }) {
  if (previous == null || !isFinite(previous)) return null;
  const d = Number(current) - Number(previous);
  const better = invert ? d < 0 : d > 0;
  if (Math.abs(d) < 0.05) {
    return <span className="jt-delta is-flat"><Minus size={12} /> sin cambios vs. registro anterior</span>;
  }
  return (
    <span className={'jt-delta ' + (better ? 'is-up' : 'is-down')}>
      {better ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {(d > 0 ? '+' : '') + fmt(d, 1)} {unit} vs. registro anterior
    </span>
  );
}

function Spark({ values }) {
  if (!values || values.length < 2) return null;
  const max = Math.max(...values), min = Math.min(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 30 - ((v - min) / span) * 26 - 2;
    return x + ',' + y;
  }).join(' ');
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="jt-spark">
      <polyline points={pts} fill="none" stroke="#FFFFFF" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Panel({ title, sub, icon, children, tone }) {
  return (
    <section className="jt-panel">
      {title && (
        <header className="jt-panel-h">
          <span className="jt-panel-icon" style={tone ? { color: TONE[tone].hex } : null}>{icon}</span>
          <div>
            <h3>{title}</h3>
            {sub && <p>{sub}</p>}
          </div>
        </header>
      )}
      <div className="jt-panel-b">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="jt-field">
      <span className="jt-field-l">{label}{hint && <em>{hint}</em>}</span>
      {children}
    </label>
  );
}

/* Barra de acciones: guardar / PDF / WhatsApp, cada uno por separado. */
function Actions({ onSave, onPdf, onWhats, saveLabel = 'Guardar registro', disabled, ready }) {
  return (
    <div className="jt-actions">
      <button className="jt-btn jt-btn-save" onClick={onSave} disabled={disabled}>
        <Save size={17} /> {saveLabel}
      </button>
      <button className="jt-btn jt-btn-pdf" onClick={onPdf} disabled={disabled || !ready}>
        <FileDown size={17} /> {ready ? 'Descargar PDF' : 'Preparando PDF…'}
      </button>
      <button className="jt-btn jt-btn-wa" onClick={onWhats} disabled={disabled}>
        <Send size={16} /> Enviar por WhatsApp
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="jt-empty">
      <User size={28} />
      <h3>Primero registra al atleta</h3>
      <p>Abre la pestaña Perfil Alumnos, completa nombre, edad y peso, y guarda el perfil. Las evaluaciones usan esos datos para calcular fuerza relativa y zonas cardíacas.</p>
    </div>
  );
}

/* ================================== APP =================================== */

export default function App() {
  const [tab, setTab] = useState('gestion');
  /* Rehidrata el perfil desde la ficha del alumno, si la cáscara lo mandó. */
  const [patient, setPatient] = useState(() => jyPerfilGuardado());
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    if (window.jspdf) { setReady(true); return; }
    const s = document.createElement('script');
    s.src = '../vendor/jspdf.umd.min.js';   /* local: antes venía de cdnjs */
    s.async = true;
    s.onload = () => setReady(true);
    document.body.appendChild(s);
    return () => { if (s.parentNode) s.parentNode.removeChild(s); };
  }, []);

  const notify = (msg, kind = 'ok') => {
    setToast({ msg, kind });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2600);
  };

  const exportPDF = (report) => {
    if (!pdfReady()) { notify('La librería PDF todavía se está cargando. Intenta en un segundo.', 'bad'); return; }
    try {
      buildPDF(report);
      notify('PDF descargado');
    } catch (e) {
      notify('No se pudo generar el PDF: ' + e.message, 'bad');
    }
  };

  const TABS = [
    { id: 'gestion',      label: 'Perfil Alumnos', short: 'Perfil', icon: <User size={19} />,       n: '01' },
    { id: 'rm',           label: 'Fuerza 1RM',     short: '1RM',    icon: <Dumbbell size={19} />,   n: '02' }
  ];

  const activeTabInfo = TABS.find((t) => t.id === tab);

  const done = {
    gestion: !!patient,
    rm: (patient?.records?.RM || []).length > 0
  };

  const shared = { patient, setPatient, notify, exportPDF, ready };

  const navBar = (
    <nav className="jt-nav" aria-label="Navegación principal">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setTab(t.id)}
          className={'jt-tab' + (tab === t.id ? ' is-active' : '') + (done[t.id] ? ' is-done' : '')}
        >
          <span className="jt-tab-ico">
            {t.icon}
            {done[t.id] && <CheckCircle2 size={11} className="jt-tab-ok" />}
          </span>
          <span className="jt-tab-l">{t.short}</span>
        </button>
      ))}
    </nav>
  );

  return (
    <div className={'jt-shell' + (EMBEBIDO ? ' is-embed' : '')}>
      <Styles />

      <header className="jt-top">
        <div className="jt-top-in">
          <div className="jt-brand">
            <img src={LOGO_ICON_SRC} alt="JYNTRA" className="jt-brand-logo" />
            <div className="jt-brand-txt">
              <span className="jt-brand-mark"><img src={LOGO_PALABRA_SRC} alt="JYNTRA" style={{ height: 17, width: "auto", display: "block" }} /></span>
              <span className="jt-brand-sub">
                {(activeTabInfo ? activeTabInfo.label : 'Performance & Data Analysis')
                  + (JYA.nombre ? ' · ' + JYA.nombre : '')}
              </span>
            </div>
          </div>
          <div className="jt-top-meta">
            <span className={'jt-dot ' + (ready ? 'is-on' : '')} />
          </div>
        </div>
      </header>

      {patient && (
        <div className="jt-athlete">
          <div className="jt-avatar">{patient.name.charAt(0).toUpperCase()}</div>
          <div className="jt-athlete-id">
            <h2>{patient.name}</h2>
            <p>{patient.age} años · {patient.weight} kg</p>
          </div>
          <div className="jt-athlete-tags">
            <span className="jt-tag is-gold">{patient.objective}</span>
            <span className="jt-tag">
              {(patient.records?.RM?.length || 0) + (patient.records?.VO2?.length || 0) + (patient.records?.Flex?.length || 0)} eval.
            </span>
          </div>
        </div>
      )}

      {EMBEBIDO && navBar}

      <main className="jt-main">
        {tab === 'gestion' && <Gestion {...shared} />}
        {tab === 'rm' && (patient ? <RM {...shared} /> : <EmptyState />)}

        <p className="jt-foot">JYNTRA · Software de evaluación deportiva. Los reportes se descargan en PDF con el mismo encabezado de la herramienta.</p>
      </main>

      {!EMBEBIDO && navBar}

      {toast && <div className={'jt-toast is-' + toast.kind}>{toast.msg}</div>}
    </div>
  );
}

/* -------------------- Zonas de FC · acordeón desplegable ------------------- */

function HeartRateZones({ zones, zoneRows, fcMaxShown, fcRep }) {
  const [open, setOpen] = useState(() => new Set([zoneRows[0]?.k]));

  const toggle = (k) => {
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  };

  return (
    <div className="jt-zones jt-zones-acc">
      {zoneRows.map((z) => {
        const isOpen = open.has(z.k);
        const total = fcMaxShown - (parseInt(fcRep) || 70);
        const w = ((zones[z.k].max - zones[z.k].min) / (total || 1)) * 100;
        return (
          <div key={z.k} className={'jt-zone jt-zone-acc' + (isOpen ? ' is-open' : '')} style={{ borderColor: TONE[z.tone].hex, background: TONE[z.tone].soft }}>
            <button type="button" className="jt-zone-acc-h" onClick={() => toggle(z.k)} aria-expanded={isOpen}>
              <div className="jt-zone-t">
                <span style={{ color: TONE[z.tone].hex }}>{z.label}</span>
                <em>{z.pct}</em>
              </div>
              <div className="jt-zone-acc-r">
                <strong>{zones[z.k].min}<i>–</i>{zones[z.k].max}<em>lpm</em></strong>
                <ChevronDown size={16} className="jt-zone-chev" />
              </div>
            </button>
            {isOpen && (
              <div className="jt-zone-acc-body">
                <div className="jt-zone-bar"><span style={{ width: clamp(w * 3, 12, 100) + '%', background: TONE[z.tone].hex }} /></div>
                <p>{z.use}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------- 01 · GESTIÓN ------------------------------ */

function Gestion({ patient, setPatient, notify, exportPDF, ready }) {
  /* Si la herramienta va montada en la cáscara, el formulario parte con los
     datos que ya tiene la ficha del alumno (nombre, edad, peso, objetivo). */
  const [form, setForm] = useState(patient || {
    name: JYA.nombre || '',
    age: JYA.edad ? String(JYA.edad) : '',
    weight: JYA.peso ? String(JYA.peso) : '',
    phone: JYA.telefono || '+56999826310',
    objective: (JYA.objetivo && OBJECTIVES.indexOf(JYA.objetivo) >= 0) ? JYA.objetivo : OBJECTIVES[0],
    fcRep: '', fcMax: ''
  });

  const zones = form.age ? getKarvonenZones(form.age, form.fcMax, form.fcRep) : null;
  const fcMaxShown = form.fcMax ? parseInt(form.fcMax) : (form.age ? 220 - parseInt(form.age) : null);
  const valid = form.name && form.age && form.weight;

  const zoneRows = zones ? [
    { k: 'calentamiento', label: 'Calentamiento', pct: '50–60%', tone: 'info', use: 'Activación y vuelta a la calma' },
    { k: 'grasa',         label: 'Quema de grasa', pct: '60–70%', tone: 'ok',   use: 'Trabajo aeróbico base, larga duración' },
    { k: 'resistencia',   label: 'Resistencia',    pct: '70–80%', tone: 'warn', use: 'Umbral aeróbico, ritmo sostenido' },
    { k: 'maximo',        label: 'Máximo',         pct: '80–95%', tone: 'bad',  use: 'Intervalos y potencia aeróbica' }
  ] : [];

  const save = () => {
    if (!valid) { notify('Completa nombre, edad y peso para guardar el perfil.', 'bad'); return; }
    const registros = patient?.records || {};
    setPatient({ ...form, records: registros });
    /* puente JYNTRA: el perfil queda en la ficha del alumno (pilar 5) */
    const enFicha = jyGuardar({
      modulo: 'evaluacion', tipo: 'Perfil del atleta',
      datos: {
        nombre: form.name, edad: form.age, peso: form.weight,
        telefono: form.phone, objetivo: form.objective,
        fcReposo: form.fcRep, fcMaxMedida: form.fcMax,
        fcMaxTrabajo: fcMaxShown || '',
        zonas: zones ? {
          calentamiento: zones.calentamiento.min + '-' + zones.calentamiento.max,
          grasa:         zones.grasa.min + '-' + zones.grasa.max,
          resistencia:   zones.resistencia.min + '-' + zones.resistencia.max,
          maximo:        zones.maximo.min + '-' + zones.maximo.max
        } : null,
        perfil: Object.assign({}, form, { records: undefined }),
        registros
      }
    });
    notify(enFicha ? 'Perfil guardado en la ficha del alumno' : 'Perfil guardado');
  };

  const pdf = () => {
    if (!valid) { notify('Completa nombre, edad y peso antes de generar el PDF.', 'bad'); return; }
    const blocks = [
      { type: 'hero', caption: 'Frecuencia cardíaca máxima de trabajo', value: String(fcMaxShown || '-'), unit: 'lpm',
        badge: form.objective, badgeTone: 'gold',
        extras: ['FC reposo ' + (form.fcRep || '—') + ' lpm', 'Reserva ' + (fcMaxShown && form.fcRep ? fcMaxShown - parseInt(form.fcRep) : '—') + ' lpm'] },
      { type: 'section', label: 'Información personal' },
      { type: 'kv', rows: [
        { label: 'Nombre completo', value: form.name, strong: true },
        { label: 'Edad', value: form.age + ' años' },
        { label: 'Peso corporal', value: form.weight + ' kg' },
        { label: 'Teléfono de contacto', value: form.phone },
        { label: 'Objetivo principal', value: form.objective, tone: 'gold' }
      ]},
      { type: 'section', label: 'Métricas cardíacas' },
      { type: 'kv', rows: [
        { label: 'Frecuencia de reposo', value: form.fcRep ? form.fcRep + ' lpm' : 'No registrada' },
        { label: 'Frecuencia máxima', value: form.fcMax ? form.fcMax + ' lpm (medida)' : (fcMaxShown ? fcMaxShown + ' lpm (fórmula 220 − edad)' : 'No disponible') }
      ]}
    ];
    if (zones) {
      blocks.push({ type: 'section', label: 'Zonas de entrenamiento · Karvonen' });
      blocks.push({ type: 'table',
        head: ['Zona', 'Intensidad', 'Rango (lpm)', 'Uso principal'],
        rows: zoneRows.map((z) => [z.label, z.pct, zones[z.k].min + ' – ' + zones[z.k].max, z.use]) });
      blocks.push({ type: 'note', text: 'Las zonas se calculan con el método de Karvonen sobre la frecuencia cardíaca de reserva (FC máx − FC reposo). Si la FC máxima fue estimada por fórmula, considera un margen de ±10 lpm.' });
    }
    exportPDF({ title: 'Perfil del Atleta', patient: form, blocks });
  };

  const whats = () => sendWhats(form.phone,
    '*JYNTRA · PERFIL DEL ATLETA*\nPerfil de ' + form.name + ' actualizado.\n\n*Objetivo:* ' + form.objective +
    '\n*Peso:* ' + form.weight + ' kg' + (zones ? '\n*Zona quema grasa:* ' + zones.grasa.min + '–' + zones.grasa.max + ' lpm' : ''));

  return (
    <div className="jt-stack">
      <Panel title="Perfil del atleta" sub="Estos datos alimentan el cálculo de fuerza relativa y las zonas cardíacas." icon={<User size={18} />} tone="gold">
        <div className="jt-grid-2">
          <div className="jt-col">
            <h4 className="jt-sub">Identificación</h4>
            <Field label="Nombre completo">
              <input className="jt-input" placeholder="Ej. Juan Pérez" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Teléfono WhatsApp">
              <input className="jt-input" placeholder="+56 9 9982 6310" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <div className="jt-row-2">
              <Field label="Edad" hint="años">
                <input type="number" className="jt-input" placeholder="0" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
              </Field>
              <Field label="Peso" hint="kg">
                <input type="number" className="jt-input" placeholder="0" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
              </Field>
            </div>
            <Field label="Objetivo principal">
              <select className="jt-input" value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })}>
                {OBJECTIVES.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
          </div>

          <div className="jt-col">
            <h4 className="jt-sub">Monitoreo cardíaco</h4>
            <div className="jt-row-2">
              <Field label="FC reposo" hint="lpm">
                <input type="number" className="jt-input" placeholder="Ej. 65" value={form.fcRep} onChange={(e) => setForm({ ...form, fcRep: e.target.value })} />
              </Field>
              <Field label="FC máx real" hint="opcional">
                <input type="number" className="jt-input" placeholder="Ej. 195" value={form.fcMax} onChange={(e) => setForm({ ...form, fcMax: e.target.value })} />
              </Field>
            </div>

            <div className="jt-fcbox">
              <div className="jt-fcbox-h">
                <span>Frecuencia máxima de trabajo</span>
                <strong>{fcMaxShown || '--'}<em>lpm</em></strong>
              </div>
              <p className="jt-hint">{form.fcMax ? 'Medida en test directo.' : 'Estimada con 220 − edad. Ingresa la FC máx real para mayor precisión.'}</p>
            </div>

            {zones ? (
              <HeartRateZones zones={zones} zoneRows={zoneRows} fcMaxShown={fcMaxShown} fcRep={form.fcRep} />
            ) : (
              <div className="jt-note">Ingresa la edad para desplegar las zonas de Karvonen.</div>
            )}
          </div>
        </div>

        <Actions onSave={save} onPdf={pdf} onWhats={whats} saveLabel="Guardar perfil" ready={ready} />
      </Panel>
    </div>
  );
}

/* -------------------------------- 03 · 1RM -------------------------------- */

function RM({ patient, setPatient, notify, exportPDF, ready }) {
  const [exercise, setExercise] = useState(EXERCISES[0]);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [author, setAuthor] = useState('Brzycki');
  const [openId, setOpenId] = useState(null);

  const rm = useMemo(() => calculate1RM(weight, reps, author), [weight, reps, author]);
  const all = useMemo(() => RM_AUTHORS.map((a) => ({ a, v: calculate1RM(weight, reps, a) })), [weight, reps]);
  const ratio = rm && patient.weight ? rm / patient.weight : 0;
  const level = getRelativeStrength(rm, patient.weight);

  const history = patient.records?.RM || [];
  const sameEx = history.filter((r) => r.exercise === exercise);
  const prev = sameEx.length ? parseFloat(sameEx[0].rm) : null;

  // Respaldo para registros guardados antes de existir el campo "zones"
  const zonesOf = (r) => r.zones || RM_ZONES.map((z) => ({
    name: z.name, tone: z.tone, range: z.range, reps: z.reps,
    loads: z.percents.map((p) => ({ p, kg: (parseFloat(r.rm) * (p / 100)).toFixed(1) }))
  }));

  const valid = rm > 0;

  const save = () => {
    if (!valid) { notify('Ingresa peso y repeticiones para guardar.', 'bad'); return; }
    const zones = RM_ZONES.map((z) => ({
      name: z.name, tone: z.tone, range: z.range, reps: z.reps,
      loads: z.percents.map((p) => ({ p, kg: (rm * (p / 100)).toFixed(1) }))
    }));
    const rec = {
      id: Date.now(), exercise, weight, reps, author,
      rm: rm.toFixed(1), ratio: ratio.toFixed(2), level: level.cat,
      zones,
      date: new Date().toLocaleDateString('es-CL')
    };
    const registros = { ...patient.records, RM: [rec, ...history] };
    setPatient({ ...patient, records: registros });
    /* puente JYNTRA: la toma de 1RM cae en la ficha del alumno (pilar 5) */
    const enFicha = jyGuardar({
      modulo: 'evaluacion', tipo: 'Fuerza 1RM · ' + exercise,
      datos: {
        nombre: patient.name, ejercicio: exercise,
        pesoMovido: weight, repeticiones: reps, formula: author,
        rm: rec.rm, fuerzaRelativa: rec.ratio, clasificacion: rec.level,
        pesoCorporal: patient.weight, fecha: rec.date,
        perfil: {
          name: patient.name, age: patient.age, weight: patient.weight,
          phone: patient.phone, objective: patient.objective,
          fcRep: patient.fcRep || '', fcMax: patient.fcMax || ''
        },
        registros
      }
    });
    notify(enFicha ? '1RM guardado en la ficha del alumno' : '1RM guardado en el historial');
  };

  const pdf = () => {
    if (!valid) { notify('Ingresa peso y repeticiones antes de generar el PDF.', 'bad'); return; }

    // Agrupa TODAS las evaluaciones guardadas (todos los ejercicios), no solo el actual.
    const byExercise = {};
    history.forEach((r) => {
      if (!byExercise[r.exercise]) byExercise[r.exercise] = [];
      byExercise[r.exercise].push(r);
    });
    const exerciseNames = Object.keys(byExercise);

    const perExerciseBlocks = exerciseNames.flatMap((ex) => {
      const recs = byExercise[ex]; // más reciente primero
      const latest = recs[0];
      return [
        { type: 'section', label: ex + ' · último 1RM registrado' },
        { type: 'kv', rows: [
          { label: 'Fecha de la última toma', value: latest.date },
          { label: 'Base del cálculo', value: latest.weight + ' kg × ' + latest.reps + ' reps · ' + latest.author },
          { label: '1RM estimado', value: latest.rm + ' kg', strong: true },
          { label: 'Fuerza relativa', value: latest.ratio + '× peso corporal', tone: toneOf(latest.level) },
          { label: 'Clasificación', value: latest.level, tone: toneOf(latest.level) }
        ]},
        { type: 'loads', rm: parseFloat(latest.rm) },
        ...(recs.length > 1 ? [
          { type: 'table', head: ['Fecha', 'Base', 'Fórmula', '1RM'],
            rows: recs.slice(0, 8).map((r) => [r.date, r.weight + ' kg × ' + r.reps, r.author, r.rm + ' kg']) }
        ] : [])
      ];
    });

    exportPDF({
      title: 'Fuerza 1RM',
      patient,
      blocks: [
        { type: 'hero', caption: exercise + ' · valores actuales en la calculadora', value: fmt(rm, 1), unit: 'kg (1RM estimado)',
          badge: level.cat, badgeTone: level.tone,
          extras: [weight + ' kg × ' + reps + ' reps', 'Fórmula ' + author] },
        { type: 'scale', scale: SCALES.relStrength, value: ratio, title: 'Fuerza relativa al peso corporal' },
        { type: 'section', label: 'Comparativa entre fórmulas · ' + exercise },
        { type: 'table', head: ['Fórmula', '1RM estimado', 'Diferencia vs. aplicada'],
          rows: all.map((x) => [x.a, fmt(x.v, 1) + ' kg', (x.v - rm >= 0 ? '+' : '') + fmt(x.v - rm, 1) + ' kg']) },
        { type: 'section', label: 'Resumen de todas las evaluaciones de 1RM registradas' },
        ...(history.length ? [
          { type: 'table', head: ['Fecha', 'Ejercicio', 'Base', 'Fórmula', '1RM', 'F. Relativa', 'Clasificación'],
            rows: history.map((r) => [r.date, r.exercise, r.weight + ' kg × ' + r.reps, r.author, r.rm + ' kg', r.ratio + '×', r.level]) }
        ] : [
          { type: 'note', text: 'Aún no hay evaluaciones guardadas en el historial; este PDF solo refleja los valores actuales de la calculadora.' }
        ]),
        ...(perExerciseBlocks.length ? [
          { type: 'section', label: 'Cargas de trabajo por zona · cada ejercicio evaluado' },
          ...perExerciseBlocks
        ] : [
          { type: 'section', label: 'Cargas de trabajo por zona · ' + exercise },
          { type: 'loads', rm }
        ]),
        { type: 'note', text: 'El 1RM es una estimación indirecta calculada a partir de una serie submáxima. Su precisión disminuye por sobre las 10 repeticiones; para cargas de fuerza máxima, revalida cada 4 a 6 semanas. Este reporte incluye todas las evaluaciones de 1RM guardadas en el historial del atleta, agrupadas por ejercicio.' }
      ]
    });
  };

  const whats = () => sendWhats(patient.phone,
    '*JYNTRA · FUERZA 1RM*\n' + patient.name + ', resultado de ' + exercise + ':\n\n*1RM estimado:* ' + fmt(rm, 1) +
    ' kg\n*Fuerza relativa:* ' + fmt(ratio, 2) + '× (' + level.cat + ')\n\n_En el PDF están todas tus evaluaciones de 1RM guardadas, con sus cargas exactas por zona._');

  return (
    <div className="jt-stack">
      <Panel title="Calculadora de 1RM" sub="Fórmulas de Brzycki, Epley y Lander sobre una serie submáxima." icon={<Calculator size={18} />} tone="gold">
        <div className="jt-rm-top">
          <div className="jt-col">
            <Field label="Ejercicio">
              <select className="jt-input" value={exercise} onChange={(e) => setExercise(e.target.value)}>
                {EXERCISES.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </Field>
            <div className="jt-row-2">
              <Field label="Peso movilizado" hint="kg">
                <input type="number" min="0" className="jt-input jt-input-xl" placeholder="0" value={weight} onChange={(e) => setWeight(e.target.value)} />
              </Field>
              <Field label="Repeticiones" hint="1 a 15">
                <input type="number" min="1" max="15" className="jt-input jt-input-xl" placeholder="0" value={reps} onChange={(e) => setReps(e.target.value)} />
              </Field>
            </div>
            <div className="jt-seg">
              {RM_AUTHORS.map((a) => (
                <button key={a} className={'jt-seg-b' + (author === a ? ' is-on' : '')} onClick={() => setAuthor(a)}>
                  {a}
                  <em>{all.find((x) => x.a === a)?.v > 0 ? fmt(all.find((x) => x.a === a).v, 1) + ' kg' : '—'}</em>
                </button>
              ))}
            </div>
          </div>

          <div className="jt-readout">
            <span className="jt-eyebrow">1RM estimado</span>
            <div className="jt-bignum">{valid ? fmt(rm, 1) : '--'}<em>kg</em></div>
            <Verdict cat={valid ? level.cat : null} />
            {valid && <Delta current={rm} previous={prev} unit="kg" />}
            {sameEx.length > 1 && <Spark values={[...sameEx].reverse().map((r) => parseFloat(r.rm))} />}
          </div>
        </div>

        <Ruler scale={SCALES.relStrength} value={valid ? ratio : ''} label={'Fuerza relativa · ' + fmt(ratio, 2) + '× de ' + patient.weight + ' kg de peso corporal'} />

        <Actions onSave={save} onPdf={pdf} onWhats={whats} saveLabel="Guardar 1RM" ready={ready} />
      </Panel>

      <Panel title="Cargas por zona de trabajo" sub="Calculadas sobre el 1RM actual. Úsalas para prescribir la sesión." icon={<Dumbbell size={18} />} tone="gold">
        <div className="jt-zonegrid">
          {RM_ZONES.map((z) => (
            <div key={z.name} className="jt-zonecard" style={{ borderColor: TONE[z.tone].hex, background: TONE[z.tone].soft }}>
              <div className="jt-zonecard-h">
                <span style={{ color: TONE[z.tone].hex }}><Activity size={14} /> {z.name}</span>
                <div><em>{z.range}</em><i>{z.reps}</i></div>
              </div>
              <div className="jt-loads">
                {z.percents.map((p) => (
                  <div key={p} className="jt-load">
                    <span>{p}%</span>
                    <strong>{valid ? fmt(rm * (p / 100), 1) : '--'}</strong>
                    <i>kg</i>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {history.length > 0 && (
        <Panel title="Historial de evaluaciones" sub={history.length + ' registros · toca uno para ver sus cargas por zona'} icon={<GaugeIcon size={18} />} tone="gold">
          <div className="jt-hist">
            {history.map((r) => {
              const isOpen = openId === r.id;
              return (
                <div key={r.id} className={'jt-histcard' + (isOpen ? ' is-open' : '')}>
                  <button type="button" className="jt-histrow" onClick={() => setOpenId(isOpen ? null : r.id)} aria-expanded={isOpen}>
                    <div className="jt-histrow-l">
                      <span className="jt-date">{r.date}</span>
                      <strong>{r.exercise}</strong>
                      <em>{r.weight} kg × {r.reps} reps · {r.author}</em>
                    </div>
                    <div className="jt-histrow-r">
                      <span className="jt-histnum">{r.rm}<i>kg</i></span>
                      <span className="jt-pill" style={{ borderColor: TONE[toneOf(r.level)].hex, color: TONE[toneOf(r.level)].hex, background: TONE[toneOf(r.level)].soft }}>
                        {r.level} · {r.ratio}×
                      </span>
                      <ChevronDown size={16} className="jt-hist-chev" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="jt-histbody">
                      <span className="jt-histbody-cap">Cargas por zona de trabajo · {r.exercise} ({fmt(parseFloat(r.rm), 1)} kg de 1RM)</span>
                      <div className="jt-zonegrid">
                        {zonesOf(r).map((z) => (
                          <div key={z.name} className="jt-zonecard" style={{ borderColor: TONE[z.tone].hex, background: TONE[z.tone].soft }}>
                            <div className="jt-zonecard-h">
                              <span style={{ color: TONE[z.tone].hex }}><Activity size={14} /> {z.name}</span>
                              <div><em>{z.range}</em><i>{z.reps}</i></div>
                            </div>
                            <div className="jt-loads">
                              {z.loads.map((l) => (
                                <div key={l.p} className="jt-load">
                                  <span>{l.p}%</span>
                                  <strong>{l.kg}</strong>
                                  <i>kg</i>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
}

/* -------------------------------- 04 · VO2 -------------------------------- */

function VO2({ patient, setPatient, notify, exportPDF, ready }) {
  const [protocol, setProtocol] = useState('BRUCE');
  const [gender, setGender] = useState('M');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [p0, setP0] = useState('');
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');

  const isRuffier = protocol === 'RUFFIER';
  const proto = VO2_PROTOCOLS.find((p) => p.id === protocol);

  const t = (parseFloat(minutes || 0) + parseFloat(seconds || 0) / 60);
  const vo2 = useMemo(() => {
    if (isRuffier || !(t > 0)) return 0;
    return protocol === 'BRUCE' ? calculateBruce(t, gender) : calculateBalke(t, gender);
  }, [t, protocol, gender, isRuffier]);

  const ruffierIndex = useMemo(() => (isRuffier ? calculateRuffier(p0, p1, p2) : null), [isRuffier, p0, p1, p2]);

  const rating = isRuffier ? getRuffierRating(ruffierIndex) : getVO2Rating(vo2, gender);
  const scale = isRuffier ? SCALES.ruffier : (gender === 'M' ? SCALES.vo2M : SCALES.vo2F);
  const mets = vo2 / 3.5;
  const readoutValue = isRuffier ? ruffierIndex : vo2;
  const readoutUnit = isRuffier ? 'IR' : 'ml/kg/min';

  const history = patient.records?.VO2 || [];
  const sameProto = history.filter((r) => r.protocol === protocol);
  const prev = sameProto.length ? parseFloat(isRuffier ? sameProto[0].index : sameProto[0].vo2) : null;
  const valid = isRuffier ? (ruffierIndex !== null && !isNaN(ruffierIndex)) : vo2 > 0;

  // Zonas de entrenamiento (Karvonen) en latidos por minuto, a partir del perfil del atleta
  const zones = patient.age ? getKarvonenZones(patient.age, patient.fcMax, patient.fcRep) : null;
  const fcMaxShown = patient.fcMax ? parseInt(patient.fcMax) : (patient.age ? 220 - parseInt(patient.age) : null);
  const zoneRows = zones ? [
    { k: 'calentamiento', label: 'Calentamiento', pct: '50–60%', tone: 'info', use: 'Activación y vuelta a la calma' },
    { k: 'grasa',         label: 'Quema de grasa', pct: '60–70%', tone: 'ok',   use: 'Trabajo aeróbico base, larga duración' },
    { k: 'resistencia',   label: 'Resistencia',    pct: '70–80%', tone: 'warn', use: 'Umbral aeróbico, ritmo sostenido' },
    { k: 'maximo',        label: 'Máximo',         pct: '80–95%', tone: 'bad',  use: 'Intervalos y potencia aeróbica' }
  ] : [];

  const save = () => {
    if (!valid) { notify(isRuffier ? 'Ingresa P0, P1 y P2 para guardar.' : 'Ingresa el tiempo del test para guardar.', 'bad'); return; }
    const rec = isRuffier
      ? { id: Date.now(), protocol, p0, p1, p2, index: ruffierIndex.toFixed(1), rating, date: new Date().toLocaleDateString('es-CL') }
      : { id: Date.now(), protocol, gender, time: t.toFixed(2), vo2: vo2.toFixed(2), rating, date: new Date().toLocaleDateString('es-CL') };
    setPatient({ ...patient, records: { ...patient.records, VO2: [rec, ...history] } });
    notify((isRuffier ? 'Índice de Ruffier' : 'VO₂ máx') + ' guardado en el historial');
  };

  const pdf = () => {
    if (!valid) { notify(isRuffier ? 'Ingresa P0, P1 y P2 antes de generar el PDF.' : 'Ingresa el tiempo del test antes de generar el PDF.', 'bad'); return; }

    const zoneBlocks = zones ? [
      { type: 'section', label: 'Zonas de trabajo · Karvonen (lpm)' },
      { type: 'table', head: ['Zona', 'Intensidad', 'Rango (lpm)', 'Uso principal'],
        rows: zoneRows.map((z) => [z.label, z.pct, zones[z.k].min + ' – ' + zones[z.k].max, z.use]) }
    ] : [];

    if (isRuffier) {
      exportPDF({
        title: 'VO2 Max - Test de Ruffier',
        patient,
        blocks: [
          { type: 'hero', caption: 'Índice de Ruffier-Dickson · Recuperación cardíaca', value: fmt(ruffierIndex, 1), unit: 'IR',
            badge: rating, badgeTone: toneOf(rating),
            extras: ['P0 ' + p0 + ' lpm', 'P1 ' + p1 + ' lpm', 'P2 ' + p2 + ' lpm'] },
          { type: 'scale', scale, value: ruffierIndex, title: 'Escala normativa del índice de Ruffier' },
          { type: 'section', label: 'Configuración de la prueba' },
          { type: 'kv', rows: [
            { label: 'Protocolo utilizado', value: 'Test de Ruffier', strong: true },
            { label: 'Pulso en reposo (P0)', value: p0 + ' lpm' },
            { label: 'Pulso post-esfuerzo (P1)', value: p1 + ' lpm' },
            { label: 'Pulso post-recuperación (P2)', value: p2 + ' lpm' },
            { label: 'Índice de Ruffier', value: fmt(ruffierIndex, 1), strong: true },
            { label: 'Clasificación', value: rating, tone: toneOf(rating) }
          ]},
          ...zoneBlocks,
          ...(sameProto.length ? [
            { type: 'section', label: 'Historial del test de Ruffier' },
            { type: 'table', head: ['Fecha', 'P0', 'P1', 'P2', 'Índice'],
              rows: sameProto.slice(0, 8).map((r) => [r.date, r.p0, r.p1, r.p2, r.index]) }
          ] : []),
          { type: 'note', text: 'El índice de Ruffier-Dickson evalúa la capacidad de recuperación cardíaca tras un esfuerzo submáximo (30 sentadillas en 45 s). A menor índice, mejor capacidad de recuperación. No reemplaza una prueba de esfuerzo clínica.' }
        ]
      });
      return;
    }

    exportPDF({
      title: 'VO2 Max',
      patient,
      blocks: [
        { type: 'hero', caption: 'Consumo máximo de oxígeno · Test de ' + (protocol === 'BRUCE' ? 'Bruce' : 'Balke'),
          value: fmt(vo2, 2), unit: 'ml/kg/min', badge: rating, badgeTone: toneOf(rating),
          extras: [fmt(mets, 1) + ' METs', Math.floor(t) + ' min ' + Math.round((t % 1) * 60) + ' s en cinta'] },
        { type: 'scale', scale, value: vo2, title: 'Escala normativa · ' + (gender === 'M' ? 'hombres' : 'mujeres') },
        { type: 'section', label: 'Configuración de la prueba' },
        { type: 'kv', rows: [
          { label: 'Protocolo utilizado', value: 'Test de ' + (protocol === 'BRUCE' ? 'Bruce' : 'Balke'), strong: true },
          { label: 'Sexo de referencia', value: gender === 'M' ? 'Masculino' : 'Femenino' },
          { label: 'Tiempo hasta el agotamiento', value: (minutes || 0) + ' min ' + (seconds || 0) + ' s  (' + fmt(t, 2) + ' min)' },
          { label: 'VO₂ máx estimado', value: fmt(vo2, 2) + ' ml/kg/min', strong: true },
          { label: 'Equivalente metabólico', value: fmt(mets, 1) + ' METs' },
          { label: 'Clasificación', value: rating, tone: toneOf(rating) }
        ]},
        { type: 'section', label: 'Referencia normativa por sexo' },
        { type: 'table', head: ['Clasificación', 'Rango (ml/kg/min)', 'Interpretación'],
          rows: scale.segments.slice().reverse().map((s) => [
            s.label, s.from + ' – ' + s.to,
            s.label === 'Excelente' ? 'Capacidad aeróbica de nivel deportivo'
              : s.label === 'Bueno' ? 'Buena reserva cardiorrespiratoria'
              : s.label === 'Regular' ? 'Margen amplio de mejora con trabajo aeróbico'
              : 'Prioridad: base aeróbica progresiva'
          ]) },
        ...zoneBlocks,
        ...(sameProto.length ? [
          { type: 'section', label: 'Historial de resistencia · ' + protocol },
          { type: 'table', head: ['Fecha', 'Protocolo', 'Tiempo', 'VO₂ máx'],
            rows: sameProto.slice(0, 8).map((r) => [r.date, r.protocol, r.time + ' min', r.vo2]) }
        ] : []),
        { type: 'note', text: 'El VO₂ máx indica la cantidad máxima de oxígeno que el organismo puede absorber, transportar y consumir durante el esfuerzo. Es una estimación indirecta a partir del tiempo en protocolo; repite la prueba con el mismo protocolo para que las comparaciones sean válidas.' }
      ]
    });
  };

  const whats = () => isRuffier
    ? sendWhats(patient.phone,
        '*JYNTRA · VO₂ MÁX*\nTest de Ruffier de ' + patient.name + ':\n\n*Índice de Ruffier:* ' + fmt(ruffierIndex, 1) +
        '\n*Nivel:* ' + rating + '\n\n_El PDF incluye la escala normativa completa y las zonas de trabajo._')
    : sendWhats(patient.phone,
        '*JYNTRA · VO₂ MÁX*\nTest de ' + protocol + ' de ' + patient.name + ':\n\n*VO₂ máx:* ' + fmt(vo2, 2) +
        ' ml/kg/min\n*Nivel:* ' + rating + '\n*Equivalente:* ' + fmt(mets, 1) + ' METs\n\n_El PDF incluye la escala normativa completa y las zonas de trabajo._');

  return (
    <div className="jt-stack">
      <Panel title="Capacidad cardiorrespiratoria" sub="Elige el protocolo, sigue sus pasos para tomar los parámetros y lee el resultado en la escala." icon={<HeartPulse size={18} />} tone="gold">
        <div className="jt-vo2-top">
          <div className="jt-col">
            <div className="jt-proto">
              {VO2_PROTOCOLS.map((p) => (
                <button key={p.id} className={'jt-proto-b' + (protocol === p.id ? ' is-on' : '')} onClick={() => setProtocol(p.id)}>
                  <strong>Test de {p.n}</strong>
                  <span>{p.d}</span>
                </button>
              ))}
            </div>

            <div className="jt-protodetail">
              <span className="jt-eyebrow">Protocolo · toma de parámetros</span>
              <p className="jt-protodetail-mat"><strong>Material: </strong>{proto.material}</p>
              <ol className="jt-protodetail-steps">
                {proto.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </div>

            {isRuffier ? (
              <div className="jt-row-3">
                <Field label="P0 · Reposo" hint="lpm">
                  <input type="number" min="0" className="jt-input jt-input-xl" placeholder="0" value={p0} onChange={(e) => setP0(e.target.value)} />
                </Field>
                <Field label="P1 · Post-esfuerzo" hint="lpm">
                  <input type="number" min="0" className="jt-input jt-input-xl" placeholder="0" value={p1} onChange={(e) => setP1(e.target.value)} />
                </Field>
                <Field label="P2 · Post-recuperación" hint="lpm">
                  <input type="number" min="0" className="jt-input jt-input-xl" placeholder="0" value={p2} onChange={(e) => setP2(e.target.value)} />
                </Field>
              </div>
            ) : (
              <>
                <div className="jt-row-2">
                  <Field label="Minutos">
                    <input type="number" min="0" className="jt-input jt-input-xl" placeholder="00" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
                  </Field>
                  <Field label="Segundos">
                    <input type="number" min="0" max="59" className="jt-input jt-input-xl" placeholder="00" value={seconds} onChange={(e) => setSeconds(e.target.value)} />
                  </Field>
                </div>

                <div className="jt-seg">
                  {[{ v: 'M', l: 'Masculino' }, { v: 'F', l: 'Femenino' }].map((g) => (
                    <button key={g.v} className={'jt-seg-b' + (gender === g.v ? ' is-on' : '')} onClick={() => setGender(g.v)}>
                      {g.l}<em>tabla normativa</em>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="jt-readout is-gauge">
            <Gauge value={readoutValue} scale={scale} unit={readoutUnit} caption={isRuffier ? 'Índice de Ruffier' : 'Consumo de oxígeno'} decimals={isRuffier ? 1 : 2} />
            <Verdict cat={valid ? rating : null} />
            {valid && !isRuffier && (
              <div className="jt-mets">
                <span>{fmt(mets, 1)} METs</span>
                <Delta current={vo2} previous={prev} unit="ml/kg/min" />
              </div>
            )}
            {valid && isRuffier && <Delta current={ruffierIndex} previous={prev} unit="IR" invert />}

            {zones && (
              <div className="jt-vo2zones">
                <span className="jt-eyebrow">Zonas de trabajo · latidos por minuto</span>
                <HeartRateZones zones={zones} zoneRows={zoneRows} fcMaxShown={fcMaxShown} fcRep={patient.fcRep} />
              </div>
            )}
          </div>
        </div>

        <Ruler scale={scale} value={valid ? readoutValue : ''} label={isRuffier ? 'Escala normativa del índice de Ruffier' : ('Escala normativa · ' + (gender === 'M' ? 'hombres' : 'mujeres'))} />

        <Actions onSave={save} onPdf={pdf} onWhats={whats} saveLabel={isRuffier ? 'Guardar índice de Ruffier' : 'Guardar VO₂ máx'} ready={ready} />
      </Panel>

      {history.length > 0 && (
        <Panel title="Historial de resistencia" sub={history.length + ' registros'} icon={<Activity size={18} />} tone="gold">
          <div className="jt-hist">
            {history.map((r) => {
              const rIsRuffier = r.protocol === 'RUFFIER';
              return (
                <div key={r.id} className="jt-histrow">
                  <div className="jt-histrow-l">
                    <span className="jt-date">{r.date}</span>
                    <strong>Test de {r.protocol === 'RUFFIER' ? 'Ruffier' : r.protocol}</strong>
                    <em>{rIsRuffier ? ('P0 ' + r.p0 + ' · P1 ' + r.p1 + ' · P2 ' + r.p2) : (r.time + ' min en cinta')}</em>
                  </div>
                  <div className="jt-histrow-r">
                    <span className="jt-histnum">{rIsRuffier ? r.index : r.vo2}<i>{rIsRuffier ? 'IR' : 'ml/kg/min'}</i></span>
                    <span className="jt-pill" style={{ borderColor: TONE[toneOf(r.rating)].hex, color: TONE[toneOf(r.rating)].hex, background: TONE[toneOf(r.rating)].soft }}>
                      {r.rating}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ---------------------------- 05 · FLEXIBILIDAD ---------------------------- */

function Flex({ patient, setPatient, notify, exportPDF, ready }) {
  const [sit, setSit] = useState('');
  const [esc, setEsc] = useState('');

  const sitCat = (v) => {
    if (v === '' || v === null || !isFinite(Number(v))) return null;
    const x = parseFloat(v);
    if (x >= 15) return 'Excelente';
    if (x >= 6) return 'Bueno';
    if (x >= 0) return 'Regular';
    return 'Pobre';
  };
  const escCat = (v) => {
    if (v === '' || v === null || !isFinite(Number(v))) return null;
    const x = parseFloat(v);
    if (x <= 5) return 'Excelente';
    if (x <= 10) return 'Bueno';
    if (x <= 15) return 'Regular';
    return 'Pobre';
  };

  const history = patient.records?.Flex || [];

  const TESTS = [
    {
      key: 'Sit & Reach', value: sit, setValue: setSit, cat: sitCat(sit), scale: SCALES.sitReach, invert: false,
      title: 'Test Sit and Reach', desc: 'Flexibilidad de la zona lumbar y la musculatura isquiotibial.',
      inputLabel: 'Alcance registrado', hint: 'cm', better: 'Mayor alcance es mejor',
      note: 'Sentado con piernas extendidas, se empuja el cursor del cajón con las dos manos sin flexionar rodillas. Se registra el mejor de tres intentos tras calentamiento.',
      material: 'Cajón de Sit and Reach (o caja con regla adosada), superficie plana.',
      steps: [
        'Realizar un calentamiento general breve antes de la prueba.',
        'Sentarse en el suelo, descalzo, con las piernas extendidas y las plantas de los pies apoyadas contra el cajón de medición.',
        'Colocar una mano sobre la otra con los brazos extendidos al frente.',
        'Empujar el cursor deslizante hacia adelante con ambas manos, sin flexionar las rodillas y sin realizar rebotes bruscos.',
        'Mantener la posición de máximo alcance durante 2 segundos.',
        'Repetir 3 intentos y registrar el mejor resultado, en centímetros, en la calculadora.'
      ]
    },
    {
      key: 'Amplitud Escapular', value: esc, setValue: setEsc, cat: escCat(esc), scale: SCALES.escapular, invert: true,
      title: 'Test de amplitud escapular', desc: 'Movilidad de la cintura escapular y flexibilidad de hombros.',
      inputLabel: 'Distancia entre manos', hint: 'cm', better: 'Menor distancia es mejor',
      note: 'Una mano por encima del hombro y la otra por la espalda baja; se mide la distancia entre las puntas de los dedos medios. Se evalúan ambos lados y se registra el peor resultado.',
      material: 'Cinta métrica flexible.',
      steps: [
        'De pie, llevar un brazo por encima del mismo hombro con el codo flexionado y la palma apoyada entre los omóplatos.',
        'Simultáneamente, llevar el otro brazo por detrás de la espalda baja, con el codo flexionado hacia arriba y la palma hacia afuera.',
        'Intentar aproximar o superponer los dedos medios de ambas manos entre los omóplatos, sin forzar ni generar dolor.',
        'Medir con la cinta métrica la distancia entre las puntas de los dedos medios; si se superponen, registrar el traslape como valor negativo.',
        'Evaluar ambos lados (brazo derecho arriba y brazo izquierdo arriba) y registrar el peor resultado (mayor distancia) en la calculadora.'
      ]
    }
  ];

  const saveOne = (test) => {
    if (!test.cat) { notify('Ingresa el resultado en centímetros para guardar.', 'bad'); return; }
    const rec = { id: Date.now(), type: test.key, val: parseFloat(test.value).toFixed(1), rating: test.cat, date: new Date().toLocaleDateString('es-CL') };
    setPatient({ ...patient, records: { ...patient.records, Flex: [rec, ...history] } });
    notify(test.key + ' guardado en el historial');
  };

  const pdfOne = (test) => {
    if (!test.cat) { notify('Ingresa el resultado antes de generar el PDF.', 'bad'); return; }
    const past = history.filter((r) => r.type === test.key);
    exportPDF({
      title: 'Flexibilidad - ' + test.key,
      patient,
      blocks: [
        { type: 'hero', caption: test.title, value: fmt(test.value, 1), unit: 'cm', badge: test.cat, badgeTone: toneOf(test.cat),
          extras: [test.better] },
        { type: 'scale', scale: test.scale, value: parseFloat(test.value), title: 'Escala normativa de referencia' },
        { type: 'section', label: 'Detalle de la evaluación' },
        { type: 'kv', rows: [
          { label: 'Prueba evaluada', value: test.title, strong: true },
          { label: 'Enfoque de medición', value: test.desc },
          { label: 'Resultado registrado', value: fmt(test.value, 1) + ' cm', strong: true },
          { label: 'Clasificación normativa', value: test.cat, tone: toneOf(test.cat) }
        ]},
        { type: 'section', label: 'Tabla de referencia (cm)' },
        { type: 'table', head: ['Clasificación', 'Rango', 'Criterio'],
          rows: test.scale.segments.slice().reverse().map((s) => [s.label, s.from + ' a ' + s.to + ' cm', test.better]) },
        ...(past.length ? [
          { type: 'section', label: 'Historial de la prueba' },
          { type: 'table', head: ['Fecha', 'Resultado', 'Clasificación'], rows: past.slice(0, 8).map((r) => [r.date, r.val + ' cm', r.rating]) }
        ] : []),
        { type: 'note', text: 'Protocolo aplicado: ' + test.note }
      ]
    });
  };

  const whatsOne = (test) => sendWhats(patient.phone,
    '*JYNTRA · FLEXIBILIDAD*\n' + test.title + ' de ' + patient.name + ':\n\n*Resultado:* ' + fmt(test.value, 1) +
    ' cm\n*Clasificación:* ' + (test.cat || '-') + '\n\n_El PDF incluye la escala completa y el protocolo._');

  return (
    <div className="jt-stack">
      {TESTS.map((test) => (
        <Panel key={test.key} title={test.title} sub={test.desc} icon={<RulerIcon size={18} />} tone="gold">
          <div className="jt-flex-top">
            <div className="jt-col">
              <Field label={test.inputLabel} hint={test.hint}>
                <input type="number" step="0.5" className="jt-input jt-input-xl" placeholder="0.0"
                  value={test.value} onChange={(e) => test.setValue(e.target.value)} />
              </Field>

              <div className="jt-protodetail">
                <span className="jt-eyebrow">Protocolo · toma de parámetros</span>
                <p className="jt-protodetail-mat"><strong>Material: </strong>{test.material}</p>
                <ol className="jt-protodetail-steps">
                  {test.steps.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
                <p className="jt-protodetail-mat" style={{ marginTop: 10, marginBottom: 0 }}><strong>Criterio: </strong>{test.better}.</p>
              </div>
            </div>
            <div className="jt-readout">
              <span className="jt-eyebrow">Clasificación</span>
              <div className="jt-bignum">{test.cat ? fmt(test.value, 1) : '--'}<em>cm</em></div>
              <Verdict cat={test.cat} />
            </div>
          </div>

          <Ruler scale={test.scale} value={test.cat ? parseFloat(test.value) : ''} label="Escala normativa de referencia" />

          <Actions
            onSave={() => saveOne(test)}
            onPdf={() => pdfOne(test)}
            onWhats={() => whatsOne(test)}
            saveLabel={'Guardar ' + test.key}
            ready={ready}
          />
        </Panel>
      ))}

      {history.length > 0 && (
        <Panel title="Historial de amplitud" sub={history.length + ' registros'} icon={<RulerIcon size={18} />} tone="gold">
          <div className="jt-hist">
            {history.map((r) => (
              <div key={r.id} className="jt-histrow">
                <div className="jt-histrow-l">
                  <span className="jt-date">{r.date}</span>
                  <strong>{r.type}</strong>
                </div>
                <div className="jt-histrow-r">
                  <span className="jt-histnum">{r.val}<i>cm</i></span>
                  <span className="jt-pill" style={{ borderColor: TONE[toneOf(r.rating)].hex, color: TONE[toneOf(r.rating)].hex, background: TONE[toneOf(r.rating)].soft }}>
                    {r.rating}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ================================= ESTILOS ================================= */

function Styles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: [
      "@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');",
      ":root{--ink:#070707;--panel:#0E0E0E;--panel2:#141414;--line:#242424;--gold:#DD2C37;--gold2:#EEF1F3;--tx:#EEF1F3;--mu:#8B877E;",
      "--dsp:'Barlow Condensed',Impact,sans-serif;--bdy:'Inter',system-ui,sans-serif;--mono:'JetBrains Mono',ui-monospace,monospace;}",
      "html{-webkit-tap-highlight-color:transparent;}",
      ".jt-shell{min-height:100vh;min-height:100dvh;background:radial-gradient(900px 400px at 50% -12%,rgba(221,44,55,.10),transparent 60%),var(--ink);color:var(--tx);font-family:var(--bdy);max-width:560px;margin:0 auto;padding:0 0 calc(74px + env(safe-area-inset-bottom));position:relative;box-shadow:0 0 60px rgba(0,0,0,.6);overflow-x:hidden;touch-action:manipulation;}",
      ".jt-shell *{box-sizing:border-box;}",
      ".jt-shell ::selection{background:var(--jy-acc);color:#000;}",
      "@media (min-width:561px){body{background:#000;}.jt-shell{border-left:1px solid var(--line);border-right:1px solid var(--line);}}",

      ".jt-top{background:rgba(11,11,11,.92);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-bottom:1px solid var(--line);position:sticky;top:0;z-index:40;padding-top:env(safe-area-inset-top);}",
      ".jt-top-in{margin:0 auto;padding:11px 16px;display:flex;justify-content:space-between;align-items:center;gap:12px;}",
      ".jt-brand{display:flex;align-items:center;gap:10px;min-width:0;}",
      ".jt-brand-logo{width:30px;height:30px;object-fit:contain;display:block;flex-shrink:0;filter:drop-shadow(0 2px 8px rgba(221,44,55,.25));}",
      ".jt-brand-txt{display:flex;flex-direction:column;min-width:0;}",
      ".jt-brand-mark{font-family:var(--dsp);font-size:21px;font-weight:700;letter-spacing:.06em;color:var(--jy-texto-acc);line-height:1;display:block;}",
      ".jt-brand-mark em{font-style:normal;color:var(--tx);margin-left:.22em;}",
      ".jt-brand-sub{display:block;margin-top:2px;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--mu);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
      ".jt-top-meta{display:flex;align-items:center;gap:9px;font-size:11px;color:var(--mu);flex-shrink:0;}",
      ".jt-dot{width:8px;height:8px;border-radius:50%;background:#4a4a4a;flex-shrink:0;}",
      ".jt-dot.is-on{background:var(--jy-acc);box-shadow:0 0 9px rgba(221,44,55,.9);}",

      ".jt-nav{position:fixed;left:50%;transform:translateX(-50%);bottom:0;width:100%;max-width:560px;margin:0 auto;padding:6px 6px calc(6px + env(safe-area-inset-bottom));display:flex;gap:4px;background:rgba(9,9,9,.94);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-top:1px solid var(--line);z-index:50;}",
      "@media (min-width:561px){.jt-nav{border-left:1px solid var(--line);border-right:1px solid var(--line);}}",
      ".jt-tab{flex:1 1 0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:7px 4px 6px;min-height:52px;background:transparent;border:1px solid transparent;border-radius:13px;color:var(--mu);font-family:var(--bdy);font-size:10px;font-weight:600;letter-spacing:.02em;cursor:pointer;transition:.18s;position:relative;}",
      ".jt-tab:active{background:rgba(255,255,255,.06);}",
      ".jt-tab-ico{position:relative;display:flex;}",
      ".jt-tab-l{white-space:nowrap;}",
      ".jt-tab.is-active{color:var(--jy-texto-acc);}",
      ".jt-tab.is-active .jt-tab-ico{filter:drop-shadow(0 0 8px rgba(221,44,55,.55));}",
      ".jt-tab.is-done:not(.is-active){color:var(--tx);}",
      ".jt-tab-ok{position:absolute;top:-4px;right:-7px;color:var(--jy-texto-acc);background:#1C1C1C;border-radius:50%;}",
      ".jt-tab.is-active .jt-tab-ok{color:var(--jy-texto-acc);}",

      ".jt-athlete{margin:0;padding:10px 16px;display:flex;align-items:center;gap:11px;background:linear-gradient(90deg,var(--panel),#1C1C1C);border-bottom:1px solid var(--line);border-left:3px solid var(--jy-acc);flex-wrap:nowrap;overflow-x:auto;-webkit-overflow-scrolling:touch;}",
      ".jt-avatar{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;font-family:var(--dsp);font-size:18px;color:var(--jy-texto-acc);background:rgba(221,44,55,.10);border:1px solid rgba(221,44,55,.45);flex-shrink:0;}",
      ".jt-athlete-id{flex-shrink:0;}",
      ".jt-athlete-id h2{margin:0;font-family:var(--dsp);font-size:18px;letter-spacing:.01em;color:#fff;font-weight:600;line-height:1.15;white-space:nowrap;}",
      ".jt-athlete-id p{margin:1px 0 0;font-size:10px;color:var(--mu);white-space:nowrap;}",
      ".jt-athlete-tags{display:flex;gap:6px;flex-wrap:nowrap;flex-shrink:0;margin-left:auto;padding-left:6px;}",
      ".jt-tag{font-size:10px;padding:5px 9px;border-radius:999px;border:1px solid var(--line);color:var(--mu);white-space:nowrap;background:#1C1C1C;}",
      ".jt-tag.is-gold{border-color:rgba(221,44,55,.5);color:var(--jy-texto-acc);background:rgba(221,44,55,.08);font-weight:600;}",

      ".jt-main{margin:0 auto;padding:16px 14px 8px;}",
      ".jt-stack{display:flex;flex-direction:column;gap:20px;animation:jtIn .35s ease-out;}",
      "@keyframes jtIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}",
      "@media (prefers-reduced-motion:reduce){.jt-stack{animation:none;}}",

      ".jt-panel{background:var(--panel);border:1px solid var(--line);border-radius:16px;overflow:hidden;}",
      ".jt-panel-h{display:flex;gap:10px;align-items:flex-start;padding:15px 16px 12px;border-bottom:1px solid var(--line);background:linear-gradient(180deg,rgba(221,44,55,.05),transparent);}",
      ".jt-panel-icon{color:var(--jy-texto-acc);margin-top:2px;flex-shrink:0;}",
      ".jt-panel-h h3{margin:0;font-family:var(--dsp);font-size:19px;font-weight:600;letter-spacing:.02em;color:#fff;text-transform:uppercase;}",
      ".jt-panel-h p{margin:3px 0 0;font-size:11.5px;color:var(--mu);}",
      ".jt-panel-b{padding:16px;display:flex;flex-direction:column;gap:14px;}",

      ".jt-grid-2{display:grid;grid-template-columns:1fr;gap:18px;}",
      ".jt-row-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}",
      "@media (max-width:359px){.jt-row-2{grid-template-columns:1fr;}}",
      ".jt-col{display:flex;flex-direction:column;gap:12px;}",
      "@media (max-width:820px){.jt-grid-2{grid-template-columns:1fr;}}",

      ".jt-sub{margin:0 0 2px;font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--jy-texto-acc);border-bottom:1px solid var(--line);padding-bottom:8px;font-weight:700;}",
      ".jt-eyebrow{font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--mu);}",
      ".jt-hint{font-size:11.5px;color:var(--mu);line-height:1.6;margin:0;}",
      ".jt-note{font-size:12px;color:var(--mu);background:var(--panel2);border:1px dashed var(--line);border-radius:12px;padding:14px;text-align:center;}",

      ".jt-field{display:flex;flex-direction:column;gap:6px;}",
      ".jt-field-l{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--mu);}",
      ".jt-field-l em{font-style:normal;text-transform:none;letter-spacing:0;margin-left:6px;color:#5f5c56;}",
      ".jt-input{width:100%;background:#171717;border:1px solid var(--line);border-radius:11px;padding:13px;color:#fff;font-family:var(--bdy);font-size:16px;min-height:46px;outline:none;transition:.16s;}",
      ".jt-input:focus{border-color:var(--jy-acc);box-shadow:0 0 0 3px rgba(221,44,55,.16);}",
      ".jt-input-xl{font-family:var(--mono);font-size:22px;font-weight:700;text-align:center;letter-spacing:.02em;}",
      "textarea.jt-input{resize:vertical;line-height:1.55;font-size:13.5px;}",
      ".jt-range{width:100%;accent-color:var(--jy-acc);}",

      ".jt-seg{display:flex;gap:6px;background:#171717;border:1px solid var(--line);border-radius:12px;padding:5px;}",
      ".jt-seg-b{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:2px;padding:9px 4px;border:0;border-radius:9px;background:transparent;color:var(--mu);font-family:var(--bdy);font-size:11.5px;font-weight:700;cursor:pointer;transition:.16s;min-height:44px;justify-content:center;}",
      ".jt-seg-b em{font-style:normal;font-family:var(--mono);font-size:9.5px;font-weight:500;opacity:.7;}",
      ".jt-seg-b:hover{color:var(--tx);}",
      ".jt-seg-b.is-on{background:linear-gradient(180deg,#DD2C37,var(--jy-acc));color:#1B1B1B;}",

      ".jt-readout{background:linear-gradient(180deg,#1B1B1B,#222222);border:1px solid rgba(221,44,55,.28);border-radius:16px;padding:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;}",
      ".jt-bignum{font-family:var(--dsp);font-size:52px;line-height:.9;font-weight:700;color:transparent;background:linear-gradient(180deg,#EEF1F3,var(--jy-acc));-webkit-background-clip:text;background-clip:text;}",
      ".jt-bignum em{font-style:normal;font-family:var(--bdy);font-size:15px;font-weight:600;color:var(--mu);margin-left:7px;-webkit-text-fill-color:var(--mu);}",
      ".jt-verdict{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:11px;border:1px solid;border-radius:11px;font-family:var(--dsp);font-size:21px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;}",
      ".jt-verdict.is-empty{border:1px dashed var(--line);color:#5f5c56;font-family:var(--bdy);font-size:11.5px;font-weight:500;letter-spacing:0;text-transform:none;}",
      ".jt-delta{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:var(--mu);}",
      ".jt-delta.is-up{color:#3FBF7F;}.jt-delta.is-down{color:#E5484D;}",
      ".jt-spark{width:100%;height:32px;opacity:.85;}",
      ".jt-mets{display:flex;flex-direction:column;align-items:center;gap:4px;font-family:var(--mono);font-size:12px;color:var(--jy-texto-acc);}",

      ".jt-ruler{background:#171717;border:1px solid var(--line);border-radius:14px;padding:26px 16px 12px;position:relative;}",
      ".jt-ruler.is-compact{padding:24px 8px 10px;background:transparent;border:0;}",
      ".jt-ruler-title{position:absolute;top:9px;left:16px;right:16px;font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--mu);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
      ".jt-ruler-track{display:flex;height:26px;border-radius:6px;overflow:visible;position:relative;margin-top:14px;}",
      ".jt-ruler-seg{position:relative;display:grid;place-items:center;overflow:hidden;}",
      ".jt-ruler-seg:first-child{border-radius:6px 0 0 6px;}",
      ".jt-ruler-seg:last-child{border-radius:0 6px 6px 0;}",
      ".jt-ruler-seg span{font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:rgba(0,0,0,.72);white-space:nowrap;padding:0 4px;}",
      ".jt-ruler-needle{position:absolute;top:-6px;bottom:-6px;width:2px;background:#fff;box-shadow:0 0 12px rgba(255,255,255,.6);transform:translateX(-1px);transition:left .45s cubic-bezier(.22,1,.36,1);}",
      ".jt-ruler-chip{position:absolute;bottom:calc(100% + 5px);left:50%;transform:translateX(-50%);background:#fff;color:#1B1B1B;font-family:var(--mono);font-size:11px;font-weight:700;padding:3px 8px;border-radius:5px;white-space:nowrap;}",
      ".jt-ruler-chip em{font-style:normal;font-weight:500;opacity:.6;margin-left:3px;font-size:9px;}",
      ".jt-ruler-ticks{position:relative;height:16px;margin-top:5px;}",
      ".jt-ruler-ticks span{position:absolute;transform:translateX(-50%);font-family:var(--mono);font-size:9px;color:#5f5c56;}",
      ".jt-ruler-ticks span.is-end{transform:translateX(-100%);}",

      ".jt-gauge{width:100%;max-width:240px;margin:0 auto;position:relative;}",
      ".jt-gauge-svg{width:100%;display:block;}",
      ".jt-gauge .jt-needle{transition:.5s;}",
      ".jt-gauge-read{margin-top:-24px;text-align:center;}",
      ".jt-gauge-read strong{font-family:var(--dsp);font-size:46px;font-weight:700;color:#fff;line-height:1;display:block;}",
      ".jt-gauge-read span{font-family:var(--mono);font-size:10px;color:var(--jy-texto-acc);}",
      ".jt-gauge-cap{margin-top:6px;text-align:center;font-size:9.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--mu);}",

      ".jt-fcbox{background:#171717;border:1px solid var(--line);border-radius:13px;padding:14px 16px;}",
      ".jt-fcbox-h{display:flex;justify-content:space-between;align-items:baseline;gap:10px;}",
      ".jt-fcbox-h span{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--mu);}",
      ".jt-fcbox-h strong{font-family:var(--dsp);font-size:34px;color:var(--jy-texto-acc);line-height:1;}",
      ".jt-fcbox-h strong em{font-style:normal;font-family:var(--bdy);font-size:11px;color:var(--mu);margin-left:5px;}",
      ".jt-fcbox p{margin:7px 0 0;}",

      ".jt-zones{display:grid;grid-template-columns:1fr;gap:10px;}",
      ".jt-zone{border:1px solid;border-radius:13px;padding:12px 13px;}",
      ".jt-zone-t{display:flex;justify-content:space-between;align-items:center;font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;}",
      ".jt-zone-t em{font-style:normal;font-family:var(--mono);font-size:9px;color:var(--mu);}",
      ".jt-zone strong{display:block;margin:6px 0 8px;font-family:var(--dsp);font-size:27px;color:#fff;line-height:1;}",
      ".jt-zone strong i{font-style:normal;opacity:.4;margin:0 3px;}",
      ".jt-zone strong em{font-style:normal;font-family:var(--bdy);font-size:10px;color:var(--mu);margin-left:6px;}",
      ".jt-zone-bar{height:4px;border-radius:3px;background:rgba(255,255,255,.07);overflow:hidden;}",
      ".jt-zone-bar span{display:block;height:100%;border-radius:3px;}",
      ".jt-zone p{margin:8px 0 0;font-size:10.5px;color:var(--mu);line-height:1.5;}",
      "@media (max-width:520px){.jt-zones{grid-template-columns:1fr;}}",

      ".jt-zone-acc{padding:0;overflow:hidden;}",
      ".jt-zone-acc-h{appearance:none;-webkit-appearance:none;width:100%;background:transparent;border:0;margin:0;padding:12px 13px;font:inherit;color:inherit;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:10px;text-align:left;}",
      ".jt-zone-acc-r{display:flex;align-items:center;gap:8px;}",
      ".jt-zone-acc-r strong{font-family:var(--dsp);font-size:22px;color:#fff;line-height:1;}",
      ".jt-zone-acc-r strong i{font-style:normal;opacity:.4;margin:0 3px;}",
      ".jt-zone-acc-r strong em{font-style:normal;font-family:var(--bdy);font-size:10px;color:var(--mu);margin-left:5px;}",
      ".jt-zone-chev{transition:transform .25s ease;flex-shrink:0;color:var(--mu);}",
      ".jt-zone-acc.is-open .jt-zone-chev{transform:rotate(180deg);}",
      ".jt-zone-acc-body{padding:0 13px 13px;}",

      ".jt-rm-top,.jt-vo2-top,.jt-flex-top{display:flex;flex-direction:column;gap:16px;}",

      ".jt-zonegrid{display:grid;grid-template-columns:1fr;gap:10px;}",
      ".jt-zonecard{border:1px solid;border-radius:15px;padding:14px;}",
      ".jt-zonecard-h{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;}",
      ".jt-zonecard-h span{display:flex;align-items:center;gap:6px;font-family:var(--dsp);font-size:19px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;}",
      ".jt-zonecard-h div{text-align:right;}",
      ".jt-zonecard-h em,.jt-zonecard-h i{display:block;font-style:normal;font-family:var(--mono);font-size:9px;color:var(--mu);}",
      ".jt-loads{display:grid;grid-template-columns:repeat(auto-fit,minmax(58px,1fr));gap:7px;}",
      ".jt-load{background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.06);border-radius:9px;padding:8px 4px;text-align:center;}",
      ".jt-load span{display:block;font-family:var(--mono);font-size:9px;color:var(--mu);}",
      ".jt-load strong{display:block;font-family:var(--dsp);font-size:22px;color:#fff;line-height:1.1;}",
      ".jt-load i{font-style:normal;font-size:9px;color:var(--mu);}",

      ".jt-proto{display:flex;flex-direction:column;gap:9px;}",
      ".jt-proto-b{text-align:left;background:#171717;border:1px solid var(--line);border-radius:13px;padding:13px 15px;cursor:pointer;transition:.18s;color:var(--mu);}",
      ".jt-proto-b strong{display:block;font-family:var(--dsp);font-size:19px;letter-spacing:.04em;text-transform:uppercase;color:var(--tx);margin-bottom:3px;}",
      ".jt-proto-b span{font-size:11.5px;line-height:1.55;display:block;}",
      ".jt-proto-b:hover{border-color:#3a3a3a;}",
      ".jt-proto-b.is-on{border-color:var(--jy-acc);background:rgba(221,44,55,.07);color:#C9CACB;}",
      ".jt-proto-b.is-on strong{color:var(--jy-texto-acc);}",

      ".jt-protodetail{background:#171717;border:1px solid var(--line);border-radius:13px;padding:14px 16px;}",
      ".jt-protodetail-mat{margin:8px 0 10px;font-size:11.5px;color:var(--mu);line-height:1.5;}",
      ".jt-protodetail-mat strong{color:var(--tx);font-weight:700;}",
      ".jt-protodetail-steps{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:7px;}",
      ".jt-protodetail-steps li{font-size:11.5px;line-height:1.55;color:var(--tx);}",
      ".jt-protodetail-steps li::marker{color:var(--jy-texto-acc);font-weight:700;}",

      ".jt-row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;}",
      "@media (max-width:640px){.jt-row-3{grid-template-columns:1fr;}}",

      ".jt-vo2zones{width:100%;margin-top:18px;padding-top:16px;border-top:1px solid var(--line);}",
      ".jt-vo2zones .jt-zones{margin-top:10px;}",

      ".jt-anam-head{display:flex;flex-direction:column;gap:14px;}",
      ".jt-stressbox,.jt-flags{background:#171717;border:1px solid var(--line);border-radius:14px;padding:15px 16px;display:flex;flex-direction:column;gap:9px;}",
      ".jt-stress-val{font-family:var(--dsp);font-size:44px;line-height:1;font-weight:700;}",
      ".jt-stress-val em{font-style:normal;font-size:15px;color:var(--mu);margin-left:4px;}",
      ".jt-flag{border:1px solid var(--line);border-radius:9px;padding:9px 11px;font-size:11.5px;font-weight:600;display:flex;align-items:center;gap:7px;}",
      ".jt-flag.is-ok{color:#3FBF7F;border-color:rgba(63,191,127,.4);background:rgba(63,191,127,.1);}",

      ".jt-hist{display:flex;flex-direction:column;gap:8px;max-height:520px;overflow-y:auto;padding-right:4px;}",
      ".jt-hist::-webkit-scrollbar{width:5px;}",
      ".jt-hist::-webkit-scrollbar-thumb{background:#333;border-radius:8px;}",
      ".jt-histrow{display:flex;justify-content:space-between;align-items:center;gap:10px;background:#171717;border:1px solid var(--line);border-left:2px solid rgba(221,44,55,.5);border-radius:11px;padding:11px 12px;flex-wrap:wrap;}",
      ".jt-histcard{display:flex;flex-direction:column;}",
      "button.jt-histrow{appearance:none;-webkit-appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;transition:.18s;}",
      "button.jt-histrow:hover{border-color:#3a3a3a;}",
      ".jt-histcard.is-open button.jt-histrow{border-color:var(--jy-acc);background:rgba(221,44,55,.07);border-radius:11px 11px 0 0;}",
      ".jt-hist-chev{transition:transform .25s ease;flex-shrink:0;color:var(--mu);}",
      ".jt-histcard.is-open .jt-hist-chev{transform:rotate(180deg);color:var(--jy-texto-acc);}",
      ".jt-histbody{background:#171717;border:1px solid var(--jy-acc);border-top:0;border-radius:0 0 11px 11px;padding:16px 14px 18px;}",
      ".jt-histbody-cap{display:block;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--mu);margin-bottom:12px;}",
      ".jt-histrow-l strong{display:block;font-size:13.5px;color:#fff;}",
      ".jt-histrow-l em{font-style:normal;font-size:11px;color:var(--mu);}",
      ".jt-date{display:block;font-family:var(--mono);font-size:9.5px;color:var(--jy-texto-acc);margin-bottom:2px;}",
      ".jt-histrow-r{display:flex;align-items:center;gap:12px;}",
      ".jt-histnum{font-family:var(--dsp);font-size:26px;color:#fff;line-height:1;}",
      ".jt-histnum i{font-style:normal;font-family:var(--bdy);font-size:10px;color:var(--mu);margin-left:4px;}",
      ".jt-pill{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;border:1px solid;border-radius:999px;padding:5px 11px;white-space:nowrap;}",

      ".jt-actions{display:flex;flex-direction:column;gap:9px;padding-top:16px;border-top:1px solid var(--line);margin-top:4px;}",
      ".jt-btn{display:flex;width:100%;align-items:center;justify-content:center;gap:8px;padding:14px 20px;min-height:48px;border-radius:12px;font-family:var(--bdy);font-size:12.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;border:1px solid;transition:.18s;}",
      ".jt-btn:disabled{opacity:.45;cursor:not-allowed;}",
      ".jt-btn-save{order:2;background:#222222;border-color:#333;color:var(--tx);}",
      ".jt-btn-save:active:not(:disabled){border-color:var(--jy-acc);color:var(--jy-texto-acc);}",
      ".jt-btn-pdf{order:1;background:linear-gradient(180deg,#DD2C37,var(--jy-acc));border-color:var(--jy-acc);color:#1B1B1B;box-shadow:0 8px 24px rgba(221,44,55,.18);}",
      ".jt-btn-pdf:active:not(:disabled){filter:brightness(1.08);}",
      ".jt-btn-wa{order:3;background:transparent;border-color:rgba(63,191,127,.45);color:#3FBF7F;}",
      ".jt-btn-wa:active:not(:disabled){background:rgba(63,191,127,.1);}",
      ".jt-btn:focus-visible{outline:2px solid var(--jy-acc);outline-offset:3px;}",
      ".jt-input:focus-visible,.jt-tab:focus-visible,.jt-seg-b:focus-visible,.jt-proto-b:focus-visible{outline:2px solid var(--jy-acc);outline-offset:2px;}",

      ".jt-empty{margin:36px auto;text-align:center;color:var(--mu);background:var(--panel);border:1px dashed var(--line);border-radius:18px;padding:30px 22px;}",
      ".jt-empty h3{font-family:var(--dsp);font-size:23px;color:var(--jy-texto-acc);margin:12px 0 8px;text-transform:uppercase;letter-spacing:.05em;}",
      ".jt-empty p{font-size:12.5px;line-height:1.65;margin:0;}",

      ".jt-foot{margin:26px 0 6px;padding-top:14px;border-top:1px solid var(--line);font-size:10px;line-height:1.6;color:#4f4c47;letter-spacing:.03em;text-align:center;}",

      ".jt-toast{position:fixed;left:50%;bottom:calc(78px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:60;max-width:88vw;padding:12px 20px;border-radius:12px;font-size:12px;font-weight:600;text-align:center;background:#0F0F0F;border:1px solid var(--jy-acc);color:var(--jy-texto-acc);box-shadow:0 14px 40px rgba(0,0,0,.6);animation:jtToast .3s ease-out;}",
      ".jt-toast.is-bad{border-color:#E5484D;color:#E5484D;}",
      "@keyframes jtToast{from{opacity:0;transform:translate(-50%,12px);}to{opacity:1;transform:translate(-50%,0);}}",

      /* ---- Modo embebido: la herramienta vive dentro de la cáscara JYNTRA.
         El iframe crece hasta el alto del contenido, así que no hay scroll
         propio: la barra de pestañas deja de ser fija y sube bajo el
         encabezado, y el ancho se suelta para acompañar al panel. ---- */
      ".jt-shell.is-embed{min-height:0;max-width:none;padding-bottom:24px;box-shadow:none;border-left:0;border-right:0;}",
      ".jt-shell.is-embed .jt-top{position:static;}",
      ".jt-shell.is-embed .jt-nav{position:static;transform:none;left:auto;bottom:auto;width:auto;max-width:none;margin:0;border-top:0;border-bottom:1px solid var(--line);padding:9px 12px;justify-content:flex-start;gap:8px;border-left:0;border-right:0;}",
      ".jt-shell.is-embed .jt-tab{flex:0 1 200px;flex-direction:row;gap:9px;min-height:46px;font-size:11.5px;padding:8px 14px;border-color:var(--line);background:#101010;}",
      ".jt-shell.is-embed .jt-tab.is-active{border-color:var(--jy-acc);background:rgba(221,44,55,.09);}",
      ".jt-shell.is-embed .jt-athlete{position:static;}",
      ".jt-shell.is-embed .jt-main{max-width:820px;padding:18px 16px 8px;}",
      ".jt-shell.is-embed .jt-toast{bottom:18px;}",
      "@media (min-width:900px){.jt-shell.is-embed .jt-grid-2{grid-template-columns:1fr 1fr;}}"
    ].join('\n') }} />
  );
}


/* Punto de montaje de la app en el DOM */
import { createRoot } from 'react-dom/client';
createRoot(document.getElementById('root')).render(<App />);

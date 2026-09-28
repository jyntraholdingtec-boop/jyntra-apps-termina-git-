/* ================================================================
   JYNTRA · puente de contexto para herramientas en archivo suelto
   ----------------------------------------------------------------
   Las herramientas fueron escritas para leer window.__JY_CTX de
   forma síncrona, porque antes vivían incrustadas en la cáscara.
   Como archivos sueltos ya no reciben esa semilla: la reconstruyen
   aquí, leyendo el mismo localStorage que usa la cáscara (mismo
   dominio ⇒ mismo almacén). La cáscara deja escrito quién trabaja
   y sobre quién, en 'jyntra.__foco', justo antes de montar.
   ================================================================ */
(function(){
  'use strict';
  if (window.__JY_CTX) return;               /* incrustada: ya la tiene */

  function leer(k, def){
    try{ var v = localStorage.getItem('jyntra.' + k);
         return v == null ? def : JSON.parse(v); }
    catch(e){ return def; }
  }

  /* el foco viaja en la dirección del marco (?jyfoco=...); si no, el
     que dejó escrito la cáscara */
  var foco = null;
  try{
    var mq = /[?&]jyfoco=([^&#]*)/.exec(location.search);
    if (mq) foco = JSON.parse(decodeURIComponent(mq[1]));
  }catch(e){ foco = null; }
  if (!foco) foco = leer('__foco', {}) || {};
  var usuarios = leer('usuarios', []) || [];
  var metricas = leer('metricas', []) || [];
  var registros= leer('registros', []) || [];

  function porId(id){
    for (var i = 0; i < usuarios.length; i++) if (usuarios[i].id === id) return usuarios[i];
    return null;
  }
  function edadDe(nac){
    if (!nac) return '';
    var ms = Date.now() - new Date(nac).getTime();
    return isNaN(ms) ? '' : String(Math.floor(ms / 31557600000));
  }
  function ultimaMetrica(alumnoId, clave){
    var l = metricas.filter(function(m){ return m.alumnoId === alumnoId && m.clave === clave; })
                    .sort(function(x, y){ return String(y.fecha).localeCompare(String(x.fecha)); });
    return l[0] ? l[0].valor : '';
  }
  function registrosDe(sujetoId, modulo){
    /* Se ordena por la última escritura ('tocado'), no por la fecha de
       creación: si no, la versión recién publicada por el profesional
       tapa la que la otra parte anotó después. */
    return registros.filter(function(r){ return r && r.sujetoId === sujetoId && r.modulo === modulo; })
                    .sort(function(x, y){
                      return String(y.tocado || y.creado).localeCompare(String(x.tocado || x.creado));
                    });
  }
  function ultimoRegistro(sujetoId, modulo){
    var l = registrosDe(sujetoId, modulo);
    return l[0] ? l[0].datos : null;
  }
  /* El último registro que TENGA cierto dato: en 'evaluacion' conviven
     el perfil 1RM, la anamnesis deportiva y la nutricional; sin este
     filtro la última en guardarse tapaba a las demás. */
  function ultimoCon(sujetoId, modulo, prueba){
    var l = registrosDe(sujetoId, modulo);
    for (var i = 0; i < l.length; i++){
      try{ if (l[i].datos && prueba(l[i].datos)) return l[i].datos; }catch(e){}
    }
    return null;
  }

  var u = porId(foco.usuarioId) || null;
  var a = porId(foco.alumnoId)  || null;

  window.__JY_CTX = {
    marca  : { nombre:'JYNTRA', dorado:'#C6A15A', negro:'#0D0D0D', hueso:'#EDE7DA' },
    usuario: u ? { id:u.id, nombre:u.nombre, rol:u.rol, plan:u.plan || 'base' } : null,
    alumno : a ? { id:a.id, nombre:a.nombre, email:a.email || '', telefono:a.telefono || '',
                   nacimiento:a.nacimiento || '', edad:edadDe(a.nacimiento), sexo:a.sexo || '',
                   altura:a.altura || '', peso:ultimaMetrica(a.id, 'peso'),
                   objetivo:a.objetivo || '' } : null,
    plan      : a ? ultimoRegistro(a.id, 'planificacion') : null,
    evaluacion: a ? (ultimoCon(a.id, 'evaluacion', function(d){ return d.perfil && d.perfil.name; })
                     || ultimoRegistro(a.id, 'evaluacion')) : null,
    gifs      : leer('gifs', null),
    llaves    : foco.llaves || {},
    modo      : foco.modo || 'edicion'      /* 'edicion' | 'lectura' */
  };

  /* ── Configuración de herramientas que no leen __JY_CTX ──────────
     Dos herramientas (la anamnesis nutricional y la cineantropometría)
     no fueron escritas para leer __JY_CTX: esperan que la cáscara les
     sustituya un marcador en el código con su configuración. Como
     ahora viven en archivo suelto, nadie hace esa sustitución y se
     quedan en su modo por defecto — la nutricional se abría siempre
     en 'anamnesis', que es la vista del alumno. Se arma aquí. */
  var C = window.__JY_CTX;
  var a2 = C.alumno || {};

  /* ── Anamnesis deportiva («Mi evaluación») ──────────────────────
     Borrador compartido por alumno y profesor; si no hay, el último
     registro guardado con el botón. */
  var anam = null;
  if (a2.id){
    var b = leer('__borrador_anamnesis_' + a2.id, null);
    anam = (b && b.datos) || ultimoCon(a2.id, 'evaluacion', function(d){ return d.__anam; });
    if (anam && anam.__anam) anam = anam.__anam;
  }
  C.anamnesis = anam;
  var av = (anam && anam.vals) || {};

  /* ── Identidad del atleta ─────────────────────────────────────
     Nutrición y cineantropometría la esperan como OBJETO con los datos
     (antes se les mandaba 'true' y no se rellenaba nada). Sale de la
     anamnesis deportiva y, si falta, de la cuenta del alumno. */
  var identidad = a2.id ? {
    nombre: av.f_nom || a2.nombre || '',
    edad  : av.f_ed  || a2.edad   || '',
    sexo  : av.f_sx  || a2.sexo   || '',
    peso  : av.f_pe  || a2.peso   || '',
    talla : av.f_ta  || a2.altura || ''
  } : null;
  C.identidad = identidad;
  /* Lo que el atleta declaró en su anamnesis manda sobre lo que quedó
     en la cuenta (fecha de nacimiento, última métrica): así las cinco
     herramientas muestran la misma edad, peso y talla. */
  if (C.alumno && identidad){
    if (av.f_ed) C.alumno.edad   = String(av.f_ed);
    if (av.f_pe) C.alumno.peso   = String(av.f_pe);
    if (av.f_ta) C.alumno.altura = String(av.f_ta);
    if (av.f_sx) C.alumno.sexo   = av.f_sx;
  }

  window.__JY_CFG_PREP__ = {
    modo      : foco.modoNutri || 'completo',   /* anamnesis | plan | completo */
    pasos     : foco.pasos || null,
    soloLectura: (C.modo === 'lectura') ? [0,1,2,3,4,5] : (foco.soloLectura || []),
    paciente  : a2.id || '',
    nombre    : a2.nombre || '',
    identidad : identidad,
    origen    : 'Se toma de «Mi evaluación» (anamnesis deportiva).',
    estado    : leer('__nutri_' + (a2.id || ''), null)
  };

  var cine = a2.id ? (ultimoCon(a2.id, 'seguimiento', function(d){ return d.__cine; })
                      || (C.evaluacion && C.evaluacion.__cine ? C.evaluacion : null)) : null;
  window.__JY_CINE_PREP__ = {
    paciente : a2.id || '',
    nombre   : a2.nombre || '',
    evaluador: (C.usuario && C.usuario.nombre) || '',
    identidad: identidad,
    modo     : C.modo || 'edicion',
    estado   : (cine && cine.__cine) || null
  };

  /* ── Sólo lectura (Perfil del atleta visto por el alumno) ─────────
     Recupera la capa que tenía la v14: aviso arriba, campos bloqueados
     y sin botones de guardar. Los datos los carga el profesional. */
  if (C.modo === 'lectura' && /perfil-atleta/.test(location.pathname)){
    var css = document.createElement('style');
    css.textContent =
      '.jy-ro-aviso{position:sticky;top:0;z-index:99;display:flex;gap:9px;align-items:center;' +
      'padding:10px 14px;margin:0 0 6px;background:linear-gradient(180deg,#1E1810,#141010);' +
      'border:1px solid #4A3B1E;border-radius:11px;color:#E8CF95;' +
      'font-family:system-ui,sans-serif;font-size:12px;line-height:1.35}' +
      '.jy-ro-aviso b{color:#C6A15A;font-weight:700}' +
      '.jy-ro input,.jy-ro select,.jy-ro textarea{pointer-events:none !important;opacity:.62 !important}' +
      '.jy-ro .jt-btn-save,.jy-ro .jt-btn-wa,.jy-ro .jt-seg-b,.jy-ro .jt-proto-b{display:none !important}' +
      '.jy-ro .jt-actions{border-top:0 !important;padding-top:6px !important}';
    (document.head || document.documentElement).appendChild(css);
    var vestir = function(){
      var r = document.getElementById('root') || document.body; if(!r) return;
      r.classList.add('jy-ro');
      Array.prototype.forEach.call(r.querySelectorAll('input,select,textarea'), function(e){
        e.setAttribute('readonly','readonly'); e.setAttribute('tabindex','-1');
      });
      if (!document.querySelector('.jy-ro-aviso')){
        var d = document.createElement('div'); d.className = 'jy-ro-aviso';
        d.innerHTML = '\u25C8&nbsp;<span><b>Ficha de tu profesor.</b> Estos resultados los carga quien te entrena. ' +
                      'Puedes revisarlos y descargar el PDF.</span>';
        r.insertBefore(d, r.firstChild);
      }
    };
    window.addEventListener('load', function(){
      vestir(); setTimeout(vestir, 400); setTimeout(vestir, 1500);
      try{ new MutationObserver(function(){ vestir(); }).observe(document.body, {childList:true, subtree:true}); }catch(e){}
    });
  }

  /* Alto: el marco no tiene scroll propio, le avisa al padre cuánto mide.
     Se emiten las dos marcas porque conviven dos protocolos de herramienta. */
  var ultimo = 0;
  function avisar(){
    var h = Math.max(document.documentElement.scrollHeight,
                     document.body ? document.body.scrollHeight : 0);
    if (Math.abs(h - ultimo) > 20){
      ultimo = h;
      try{ parent.postMessage({ jyntra:true,  accion:'alto', px:h }, '*'); }catch(e){}
      try{ parent.postMessage({ jyEmbed:true, accion:'alto', px:h }, '*'); }catch(e){}
    }
  }
  if (parent && parent !== window){
    window.addEventListener('load', avisar);
    window.addEventListener('resize', avisar);
    setInterval(avisar, 600);
    try{ parent.postMessage({ jyntra:true, accion:'listo' }, '*'); }catch(e){}
  }
})();

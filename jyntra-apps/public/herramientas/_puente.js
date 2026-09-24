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

  var foco     = leer('__foco', {}) || {};
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
  function ultimoRegistro(sujetoId, modulo){
    var l = registros.filter(function(r){ return r.sujetoId === sujetoId && r.modulo === modulo; })
                     .sort(function(x, y){ return String(y.creado).localeCompare(String(x.creado)); });
    return l[0] ? l[0].datos : null;
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
    evaluacion: a ? ultimoRegistro(a.id, 'evaluacion')    : null,
    gifs      : leer('gifs', null),
    llaves    : foco.llaves || {},
    modo      : foco.modo || 'edicion'      /* 'edicion' | 'lectura' */
  };

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

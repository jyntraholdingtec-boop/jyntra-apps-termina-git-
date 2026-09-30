/* ================================================================
   JYNTRA · tema día / noche para las herramientas
   La cáscara guarda la elección en 'jyntra.__tema' (mismo dominio,
   mismo almacén). Aquí se lee al abrir y se sigue en vivo cuando la
   persona pulsa el botón del menú (evento 'storage' o mensaje).
   ================================================================ */
(function(){
  'use strict';
  /* Día: las herramientas nacieron oscuras; se invierte la luminosidad de toda la
     hoja (negro<->blanco) manteniendo el tono, y se devuelve a su color real a
     fotos, GIFs y vídeos. Las variables de 'claro' compensan los grises medios. */
  var css = document.createElement('style'); css.id = 'jy-tema-filtro';
  css.textContent =
    'html[data-tema="claro"]{filter:invert(1) hue-rotate(180deg);background:#0E0C09}' +
    'html[data-tema="claro"] img,html[data-tema="claro"] video,html[data-tema="claro"] picture,' +
    'html[data-tema="claro"] canvas.jy-foto,html[data-tema="claro"] [data-jy-noinv]{filter:invert(1) hue-rotate(180deg)}' +
    'html[data-tema="claro"]{' +
    '--bg:#0A0C0F;--bg-2:#06080B;--ink:#0A0C0F;--ink-2:#06080B;--ink-3:#101419;' +
    '--panel:#000000;--panel-2:#06080B;--surface:#000000;--surface-2:#06080B;--surface-3:#101419;' +
    '--line:#2A313A;--line-hi:#3C4550;--jy-borde:#2A313A;' +
    '--text:#E6E9EE;--muted:#B6BDC9;--muted-2:#A8B0BC;--jy-texto-tenue:#B6BDC9;--mu:#B6BDC9;' +
    '--gold:#FFA08F;--gold-light:#FFA08F;--gold-dark:#FFB3A6;--gold-lo:#FFB3A6;' +
    '--jade:#FF9381;--jade-hi:#FF9381;--jade-lo:#FFB3A6;--kcal:#FF9381;' +
    '--jy-acc:#FF9381;--jy-acc-hi:#FF9381;--jy-acc-lo:#FFB3A6;--jy-texto-acc:#FF9381;' +
    '--danger:#FF9DAC}' +
    'html[data-tema="claro"][data-rol="profesor"]{--jy-acc:#C6963A;--jy-acc-hi:#D0A658;--jy-acc-lo:#D8B474;--jy-texto-acc:#C6963A;--gold:#C6963A;--gold-light:#C6963A;--gold-dark:#D8B474;--gold-lo:#D8B474;--jade:#C6963A;--jade-hi:#D0A658;--jade-lo:#D8B474;--danger:#FF9DAC}html[data-tema="claro"][data-rol="nutricionista"]{--jy-acc:#66C094;--jy-acc-hi:#7ECAA4;--jy-acc-lo:#98D6B8;--jy-texto-acc:#66C094;--gold:#66C094;--gold-light:#66C094;--gold-dark:#98D6B8;--gold-lo:#98D6B8;--jade:#66C094;--jade-hi:#7ECAA4;--jade-lo:#98D6B8;--danger:#FF9DAC}' +
    'html[data-tema="claro"] .btn.pri,html[data-tema="claro"] .primary,html[data-tema="claro"] button.tab.active,' +
    'html[data-tema="claro"] .jt-btn-pdf,html[data-tema="claro"] .jy-guardar{color:#000!important}' +
    'html[data-tema="claro"] .jt-zone-t span{filter:brightness(1.75)}' +
    'html[data-tema="claro"] .jt-field-l em,html[data-tema="claro"] .jt-foot,html[data-tema="claro"] .jt-zone em{color:#C8CED7!important}' +
    'html[data-tema="claro"] .tabbtn{color:#B9BFC8}html[data-tema="claro"] .tabbtn.on{color:var(--jy-texto-acc)}' +
    'html[data-tema="claro"] img.brand-mark,html[data-tema="claro"] img.jt-brand-logo,html[data-tema="claro"] img[class*="logo"]{filter:none!important}' +
    'html[data-tema="claro"] small,html[data-tema="claro"] .jy-ss-nota{color:#C0C6CF}';
  (document.head || document.documentElement).appendChild(css);
  function rol(){
    var r = '';
    try{ r = window.parent.document.body.getAttribute('data-rol') || ''; }catch(e){}
    if (r) document.documentElement.setAttribute('data-rol', r);
  }
  function poner(t){
    var c = (t === 'claro') ? 'claro' : 'oscuro';
    rol();
    document.documentElement.setAttribute('data-tema', c);
    try{ document.documentElement.style.colorScheme = (c === 'claro') ? 'light' : 'dark'; }catch(e){}
    try{ window.dispatchEvent(new CustomEvent('jy-tema', { detail:c })); }catch(e){}
  }
  var t = 'oscuro';
  try{ t = JSON.parse(localStorage.getItem('jyntra.__tema')) || 'oscuro'; }catch(e){}
  poner(t);
  window.addEventListener('storage', function(e){
    if (e.key === 'jyntra.__tema'){ try{ poner(JSON.parse(e.newValue)); }catch(x){} }
  });
  window.addEventListener('message', function(e){
    if (e.data && e.data.jyTema) poner(e.data.jyTema);
  });
})();

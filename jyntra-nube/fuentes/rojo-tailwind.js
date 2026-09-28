/* fondos, selección y foco que eran dorados → rojo JYNTRA #DD2C37 (221 44 55) */
const fs=require('fs');const f='../public/vendor/cine-tailwind.css';let s=fs.readFileSync(f,'utf8');let n=0;
s=s.replace(/([^{}]*(?:bg-gold|selection\\:bg-gold|focus\\:border-gold|from-gold|to-gold|via-gold)[^{}]*)\{([^{}]*)\}/g,(m,sel,body)=>{
  n++; const b=body.replace(/rgb\((\d+) (\d+) (\d+)/g,'rgb(221 44 55').replace(/#(?:fff|ffffff|eef1f3|c9cdd1|9aa0a6)\b/gi,'#DD2C37'); return sel+'{'+b+'}';});
fs.writeFileSync(f,s);console.log('reglas en rojo:',n);

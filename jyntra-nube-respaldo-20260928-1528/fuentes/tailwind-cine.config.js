/* Paleta JYNTRA: el antiguo "gold" pasa a blancos (letras y bordes); los
   fondos gold se vuelven rojo en el paso posterior (ver package.json). */
module.exports = {
  content: ['../public/herramientas/cineantropometria.html'],
  darkMode: 'class',
  theme: { extend: { colors: {
    gold:   { 50:'#FFFFFF',100:'#FFFFFF',200:'#FFFFFF',300:'#FFFFFF',400:'#FFFFFF',500:'#EEF1F3',600:'#C9CDD1',700:'#9AA0A6',800:'#6F757B',900:'#2A2A2A' },
    darkbg: { 900:'#171717',800:'#1F1F1F',700:'#262626',600:'#333333' } } } }
};

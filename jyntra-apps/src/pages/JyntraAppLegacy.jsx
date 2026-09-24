import React, { useEffect, useRef } from 'react';

import '../legacy/jyntraV10.css';
import { iniciarJyntraV10 } from '../legacy/jyntraV10Core.js';

function JyntraAppLegacy() {
  const inicializado = useRef(false);

  useEffect(() => {
    if (inicializado.current) {
      return;
    }

    if (window.__JYNTRA_V10_INITIALIZADA__) {
      inicializado.current = true;
      return;
    }

    inicializado.current = true;
    window.__JYNTRA_V10_INITIALIZADA__ = true;

    try {
      iniciarJyntraV10();
    } catch (error) {
      console.error(
        'JYNTRA · Error al iniciar la aplicación v10:',
        error
      );
    }
  }, []);

  return (
    <>
      <div id="app"></div>

      <div id="toasts" className="toasts"></div>

      <div id="modal-root"></div>
    </>
  );
}

export default JyntraAppLegacy;
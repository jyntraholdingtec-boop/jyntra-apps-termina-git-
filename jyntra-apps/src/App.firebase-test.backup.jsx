import React, { useEffect } from 'react';

import { auth, db, storage } from './config/firebase';

function App() {
  useEffect(() => {
    console.log('JYNTRA · Firebase React inicializado');
    console.log('Auth:', auth);
    console.log('Firestore:', db);
    console.log('Storage:', storage);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log(
          'JYNTRA · Usuario Firebase conectado:',
          user.uid,
          user.email
        );
      } else {
        console.log('JYNTRA · Sin usuario Firebase conectado');
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <main style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <h1>JyntraApp</h1>

      <p>
        Firebase está conectado a React.
      </p>

      <a href="/jyntra-app_v10.html">
        Abrir aplicación original
      </a>
    </main>
  );
}

export default App;
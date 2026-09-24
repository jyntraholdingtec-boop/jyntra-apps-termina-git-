import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAS6QcVFrIkAhOxaMa2IGpqLgoUXUwpQTw",
  authDomain: "jintra-db.firebaseapp.com",
  projectId: "jintra-db",
  storageBucket: "jintra-db.firebasestorage.app",
  messagingSenderId: "928873571708",
  appId: "1:928873571708:web:a5ad16712a58925ebe70f9",
  measurementId: "G-KJ8PWQGVPJ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
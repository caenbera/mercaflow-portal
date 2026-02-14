
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

/**
 * Configuración de Firebase.
 * Se utilizan variables de entorno para permitir que la aplicación
 * se conecte a diferentes bases de datos (Producción o Desarrollo)
 * sin cambiar el código fuente.
 */
const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

// Inicializa Firebase solo si no hay aplicaciones inicializadas previamente
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);

export { app, auth, db, functions, storage };

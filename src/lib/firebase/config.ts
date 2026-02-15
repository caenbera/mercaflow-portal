import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { firebaseConfig as baseConfig } from '@/firebase/config';

/**
 * MercaFlow Portal - Configuración de Firebase Independiente
 * Esta copia utiliza una base de datos aislada para pruebas.
 */
const firebaseConfig = {
  projectId: baseConfig.projectId,
  appId: baseConfig.appId,
  storageBucket: `${baseConfig.projectId}.firebasestorage.app`,
  apiKey: baseConfig.apiKey,
  authDomain: baseConfig.authDomain,
  messagingSenderId: baseConfig.messagingSenderId,
};

// Inicializa Firebase solo si no hay aplicaciones inicializadas previamente
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app);

export { app, auth, db, functions, storage };

import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebaseConfig.json';

const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

function createAuth(): Auth {
  try {
    // Persiste a sessão com AsyncStorage (recuperação da sessão ao reabrir o app).
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    // Fast refresh: o Auth já foi inicializado.
    return getAuth(app);
  }
}

export const auth: Auth = createAuth();
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);

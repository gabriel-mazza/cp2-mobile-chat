import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente ausente: ${name}`);
  }
  return value;
}

function initialize(): App {
  const existing = getApps()[0];
  if (existing) return existing;
  return initializeApp({
    credential: cert({
      projectId: requireEnv('FIREBASE_PROJECT_ID'),
      clientEmail: requireEnv('FIREBASE_CLIENT_EMAIL'),
      // Hospedagens costumam armazenar a chave com "\n" literal.
      privateKey: requireEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
    }),
    databaseURL: requireEnv('FIREBASE_DATABASE_URL'),
  });
}

const app = initialize();

export const adminAuth = getAuth(app);
export const firestore = getFirestore(app);
export const realtimeDb = getDatabase(app);
export const messaging = getMessaging(app);

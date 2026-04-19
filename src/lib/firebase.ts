import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration fallback to environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const isConfigValid = firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "";

let app;
if (isConfigValid) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
}

export const auth = isConfigValid ? getAuth(app) : null;
export const db = isConfigValid ? getFirestore(app) : null;
export const storage = isConfigValid ? getStorage(app) : null;
export const googleProvider = new GoogleAuthProvider();
export const isFirebaseEnabled = !!isConfigValid;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error(`Firestore Error [${operationType}] at [${path}]: `, error);
  throw error;
}

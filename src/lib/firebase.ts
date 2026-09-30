import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  memoryLocalCache,
  setLogLevel,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Suppress transient backend unreachable notices during network switches
setLogLevel('error');

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';

let dbInstance: ReturnType<typeof getFirestore>;

try {
  dbInstance = initializeFirestore(app, {
    localCache: typeof window !== 'undefined' ? memoryLocalCache() : undefined,
    experimentalAutoDetectLongPolling: true,
  }, databaseId);
} catch {
  // If already initialized or fallback needed
  dbInstance = getFirestore(app, databaseId);
}

export const db = dbInstance;

export { collection, doc, getDocs, getDoc, setDoc, deleteDoc, onSnapshot };



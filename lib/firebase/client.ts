import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
} from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyBgaXHoBUYFGIrtotEsLXWleFCw52RYSBs",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "maelo-sushim2.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "maelo-sushim2",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "maelo-sushim2.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "569411125214",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:569411125214:web:73894e805cd1e1795fe74f"
};

// Firebase solo se inicializa en el cliente (browser).
// Durante el build/SSR de Next.js, typeof window === 'undefined',
// así que exportamos stubs seguros para evitar el error auth/invalid-api-key.
// Todos los usos reales de Firebase están dentro de useEffect (solo corre en cliente).
const isBrowser = typeof window !== "undefined";

const app: FirebaseApp = isBrowser
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : ({} as FirebaseApp);

export const auth: Auth = isBrowser ? getAuth(app) : ({} as Auth);

/**
 * Firestore con persistencia offline (Offline First).
 * persistentLocalCache = caché en IndexedDB: lecturas y escrituras siguen
 * funcionando sin conexión y se sincronizan solas al reconectar.
 * persistentMultipleTabManager = soporte multi-pestaña sin conflictos.
 * Si IndexedDB falla (modo incógnito, navegador viejo) caemos a memoria.
 */
function initDb(): Firestore {
  if (!isBrowser) return {} as Firestore;
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    // Ya inicializado o IndexedDB no disponible → cliente estándar.
    return getFirestore(app);
  }
}

export const db: Firestore = initDb();
export const storage: FirebaseStorage = isBrowser ? getStorage(app) : ({} as FirebaseStorage);
export default app;


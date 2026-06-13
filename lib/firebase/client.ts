import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
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
export const db: Firestore = isBrowser ? getFirestore(app) : ({} as Firestore);
export const storage: FirebaseStorage = isBrowser ? getStorage(app) : ({} as FirebaseStorage);
export default app;


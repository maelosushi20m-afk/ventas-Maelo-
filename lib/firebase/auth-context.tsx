"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./client";
import { AppUser, Role } from "@/types";

interface AuthContextValue {
  user: User | null;
  appUser: AppUser | null;
  role: Role | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Timeout de seguridad: si Firebase no responde en 8s (env vars faltantes, red),
    // forzamos loading=false para no quedar en pantalla negra infinita.
    const timeout = setTimeout(() => setLoading(false), 8000);

    const unsub = onAuthStateChanged(auth, async (u) => {
      clearTimeout(timeout);
      setUser(u);
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        setAppUser(snap.exists() ? ({ uid: u.uid, ...snap.data() } as AppUser) : null);
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });

    return () => { clearTimeout(timeout); unsub(); };
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, appUser, role: appUser?.role ?? null, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth fuera de AuthProvider");
  return ctx;
}

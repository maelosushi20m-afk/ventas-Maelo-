import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { AppUser, Role, SUPER_ADMIN_EMAIL } from "@/types";

export async function listUsers(): Promise<AppUser[]> {
  const snap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "asc")));
  return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }));
}

export async function upsertUserProfile(uid: string, data: {
  email: string; name: string; role: Role; activo: boolean; createdBy?: string;
}) {
  await setDoc(
    doc(db, "users", uid),
    { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function updateUserProfile(uid: string, data: Partial<Pick<AppUser, "name" | "role" | "activo">>) {
  await updateDoc(doc(db, "users", uid), { ...data, updatedAt: serverTimestamp() });
}

export async function setUserRole(uid: string, role: Role) {
  await updateDoc(doc(db, "users", uid), { role, updatedAt: serverTimestamp() });
}

export async function setUserActive(uid: string, activo: boolean) {
  await updateDoc(doc(db, "users", uid), { activo, updatedAt: serverTimestamp() });
}

export async function removeUser(uid: string) {
  await deleteDoc(doc(db, "users", uid));
}

// Crear usuario vía API route (usa Firebase Admin para crear en Auth)
export async function createUser(data: {
  email: string;
  name: string;
  role: Role;
  password: string;
}): Promise<{ uid: string }> {
  const res = await fetch("/api/users/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al crear usuario");
  }
  return res.json();
}

// Restablecer contraseña vía API route
export async function resetUserPassword(uid: string, newPassword: string): Promise<void> {
  const res = await fetch("/api/users/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, newPassword }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al restablecer contraseña");
  }
}

// Guardar log de auditoría
export async function logAudit(data: {
  usuarioId: string;
  usuarioEmail: string;
  usuarioNombre: string;
  accion: string;
  modulo: string;
  detalle?: string;
}) {
  await setDoc(doc(collection(db, "audit_logs")), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

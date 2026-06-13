import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { AppUser, Role } from "@/types";

export async function listUsers(): Promise<AppUser[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }));
}

export async function upsertUserProfile(uid: string, data: {
  email: string; name: string; role: Role; activo: boolean;
}) {
  await setDoc(doc(db, "users", uid), { ...data, createdAt: serverTimestamp() }, { merge: true });
}

export async function setUserRole(uid: string, role: Role) {
  await updateDoc(doc(db, "users", uid), { role });
}

export async function setUserActive(uid: string, activo: boolean) {
  await updateDoc(doc(db, "users", uid), { activo });
}

export async function removeUser(uid: string) {
  await deleteDoc(doc(db, "users", uid));
}

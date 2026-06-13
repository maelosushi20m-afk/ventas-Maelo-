import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Promotion } from "@/types";

const col = collection(db, "promotions");

export async function listPromotions(soloActivos = false): Promise<Promotion[]> {
  const snap = await getDocs(col);
  const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Promotion[];
  const filtered = soloActivos ? all.filter((p) => p.activo !== false) : all;
  return filtered.sort((a, b) => (a.precio || 0) - (b.precio || 0));
}

export async function createPromotion(data: Omit<Promotion, "id" | "createdAt">) {
  return addDoc(col, { ...data, createdAt: serverTimestamp() });
}

export async function updatePromotion(id: string, data: Partial<Promotion>) {
  return updateDoc(doc(db, "promotions", id), data);
}

export async function deletePromotion(id: string) {
  return deleteDoc(doc(db, "promotions", id));
}

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Product } from "@/types";

const col = () => collection(db, "products");

export async function listProducts(soloActivos = false): Promise<Product[]> {
  const snap = await getDocs(col());
  const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Product[];
  const filtered = soloActivos ? all.filter((p) => p.activo !== false) : all;
  return filtered.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
}

export async function getProduct(id: string): Promise<Product | null> {
  const s = await getDoc(doc(db, "products", id));
  return s.exists() ? ({ id: s.id, ...(s.data() as any) }) : null;
}

export async function createProduct(data: Omit<Product, "id" | "createdAt">) {
  return addDoc(col(), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function updateProduct(id: string, data: Partial<Product>) {
  return updateDoc(doc(db, "products", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteProduct(id: string) {
  return deleteDoc(doc(db, "products", id));
}

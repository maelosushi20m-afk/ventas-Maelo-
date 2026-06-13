import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Customer } from "@/types";

const col = () => collection(db, "customers");

export async function listCustomers(): Promise<Customer[]> {
  const snap = await getDocs(query(col(), orderBy("totalGastado", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function findCustomerByPhone(telefono: string): Promise<Customer | null> {
  const snap = await getDocs(query(col(), where("telefono", "==", telefono), limit(1)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as any) };
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const s = await getDoc(doc(db, "customers", id));
  return s.exists() ? ({ id: s.id, ...(s.data() as any) }) : null;
}

export async function upsertCustomerFromOrder(input: {
  nombre: string;
  telefono?: string;
  direccion?: string;
  total: number;
}): Promise<string | null> {
  if (!input.telefono) return null;
  const existing = await findCustomerByPhone(input.telefono);
  if (existing) {
    await updateDoc(doc(db, "customers", existing.id), {
      cantidadPedidos: (existing.cantidadPedidos || 0) + 1,
      totalGastado: (existing.totalGastado || 0) + input.total,
      ultimoPedido: serverTimestamp(),
      ...(input.direccion ? { direccion: input.direccion } : {}),
      nombre: input.nombre || existing.nombre
    });
    return existing.id;
  }
  const ref = await addDoc(col(), {
    nombre: input.nombre,
    telefono: input.telefono,
    direccion: input.direccion || "",
    fechaPrimerPedido: serverTimestamp(),
    cantidadPedidos: 1,
    totalGastado: input.total,
    ultimoPedido: serverTimestamp()
  });
  return ref.id;
}

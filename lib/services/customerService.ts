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
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Customer, AuditActor } from "@/types";
import { audit } from "./auditService";

const col = () => collection(db, "customers");

export async function listCustomers(): Promise<Customer[]> {
  const snap = await getDocs(query(col(), orderBy("totalGastado", "desc")));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }) as Customer)
    .filter((c) => c.deleted !== true);
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

export async function createCustomer(
  data: Omit<Customer, "id" | "fechaPrimerPedido" | "cantidadPedidos" | "totalGastado">,
  actor?: AuditActor
) {
  const ref = await addDoc(col(), {
    ...data,
    deleted: false,
    cantidadPedidos: 0,
    totalGastado: 0,
    fechaPrimerPedido: serverTimestamp(),
  });
  await audit(actor, {
    accion: "crear_cliente",
    modulo: "clientes",
    documentId: ref.id,
    afterData: data,
    detalle: `Cliente creado: ${data.nombre}`,
  });
  return ref;
}

export async function updateCustomer(
  id: string,
  data: Partial<Customer>,
  actor?: AuditActor
) {
  const before = await getCustomer(id);
  await updateDoc(doc(db, "customers", id), data);
  await audit(actor, {
    accion: "modificar_cliente",
    modulo: "clientes",
    documentId: id,
    beforeData: before ?? undefined,
    afterData: data,
    detalle: `Cliente modificado: ${before?.nombre || id}`,
  });
}

/** Borrado lógico. */
export async function deleteCustomer(id: string, actor?: AuditActor) {
  const before = await getCustomer(id);
  await updateDoc(doc(db, "customers", id), {
    deleted: true,
    deletedAt: serverTimestamp(),
    deletedBy: actor?.email || "desconocido",
  });
  await audit(actor, {
    accion: "eliminar_cliente",
    modulo: "clientes",
    documentId: id,
    beforeData: before ?? undefined,
    detalle: `Cliente eliminado: ${before?.nombre || id}`,
  });
}

export async function restoreCustomer(id: string, actor?: AuditActor) {
  await updateDoc(doc(db, "customers", id), {
    deleted: false,
    deletedAt: null,
    deletedBy: null,
  });
  await audit(actor, {
    accion: "restaurar_cliente",
    modulo: "clientes",
    documentId: id,
    detalle: `Cliente restaurado: ${id}`,
  });
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
      nombre: input.nombre || existing.nombre,
    });
    return existing.id;
  }
  const ref = await addDoc(col(), {
    nombre: input.nombre,
    telefono: input.telefono,
    direccion: input.direccion || "",
    deleted: false,
    fechaPrimerPedido: serverTimestamp(),
    cantidadPedidos: 1,
    totalGastado: input.total,
    ultimoPedido: serverTimestamp(),
  });
  return ref.id;
}

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Product, AuditActor } from "@/types";
import { audit } from "./auditService";

const col = () => collection(db, "products");

export async function listProducts(soloActivos = false): Promise<Product[]> {
  const snap = await getDocs(col());
  const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Product[];
  // Excluir eliminados (borrado lógico)
  const visibles = all.filter((p) => p.deleted !== true);
  const filtered = soloActivos ? visibles.filter((p) => p.activo !== false) : visibles;
  return filtered.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
}

export async function getProduct(id: string): Promise<Product | null> {
  const s = await getDoc(doc(db, "products", id));
  return s.exists() ? ({ id: s.id, ...(s.data() as any) }) : null;
}

export async function createProduct(
  data: Omit<Product, "id" | "createdAt">,
  actor?: AuditActor
) {
  const ref = await addDoc(col(), {
    ...data,
    deleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await audit(actor, {
    accion: "crear_producto",
    modulo: "productos",
    documentId: ref.id,
    afterData: data,
    detalle: `Producto creado: ${data.nombre}`,
  });
  return ref;
}

export async function updateProduct(
  id: string,
  data: Partial<Product>,
  actor?: AuditActor
) {
  const before = await getProduct(id);
  await updateDoc(doc(db, "products", id), { ...data, updatedAt: serverTimestamp() });

  // Detectar cambios específicos: precio y "stock" (precioOferta no es stock; productos no tienen stock propio)
  const nombre = before?.nombre || data.nombre || id;
  let accion = "modificar_producto";
  let detalle = `Producto modificado: ${nombre}`;

  if (before && data.precioNormal !== undefined && data.precioNormal !== before.precioNormal) {
    accion = "cambiar_precio";
    detalle = `Precio ${nombre}: ${before.precioNormal} → ${data.precioNormal}`;
  }

  await audit(actor, {
    accion,
    modulo: "productos",
    documentId: id,
    beforeData: before ?? undefined,
    afterData: data,
    detalle,
  });
}

/**
 * Borrado lógico: marca deleted en lugar de eliminar físicamente.
 */
export async function deleteProduct(id: string, actor?: AuditActor) {
  const before = await getProduct(id);
  await updateDoc(doc(db, "products", id), {
    deleted: true,
    activo: false,
    deletedAt: serverTimestamp(),
    deletedBy: actor?.email || "desconocido",
    updatedAt: serverTimestamp(),
  });
  await audit(actor, {
    accion: "eliminar_producto",
    modulo: "productos",
    documentId: id,
    beforeData: before ?? undefined,
    detalle: `Producto eliminado: ${before?.nombre || id}`,
  });
}

/**
 * Restaura un producto eliminado lógicamente.
 */
export async function restoreProduct(id: string, actor?: AuditActor) {
  await updateDoc(doc(db, "products", id), {
    deleted: false,
    deletedAt: null,
    deletedBy: null,
    updatedAt: serverTimestamp(),
  });
  await audit(actor, {
    accion: "restaurar_producto",
    modulo: "productos",
    documentId: id,
    detalle: `Producto restaurado: ${id}`,
  });
}

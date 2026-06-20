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
import { Promotion, AuditActor } from "@/types";
import { audit } from "./auditService";

const col = () => collection(db, "promotions");

export async function listPromotions(soloActivos = false): Promise<Promotion[]> {
  const snap = await getDocs(col());
  const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Promotion[];
  const visibles = all.filter((p) => p.deleted !== true);
  const filtered = soloActivos ? visibles.filter((p) => p.activo !== false) : visibles;
  return filtered.sort((a, b) => (a.precio || 0) - (b.precio || 0));
}

export async function getPromotion(id: string): Promise<Promotion | null> {
  const s = await getDoc(doc(db, "promotions", id));
  return s.exists() ? ({ id: s.id, ...(s.data() as any) }) : null;
}

export async function createPromotion(
  data: Omit<Promotion, "id" | "createdAt">,
  actor?: AuditActor
) {
  const ref = await addDoc(col(), { ...data, deleted: false, createdAt: serverTimestamp() });
  await audit(actor, {
    accion: "crear_promocion",
    modulo: "promociones",
    documentId: ref.id,
    afterData: data,
    detalle: `Promoción creada: ${data.nombre}`,
  });
  return ref;
}

export async function updatePromotion(
  id: string,
  data: Partial<Promotion>,
  actor?: AuditActor
) {
  const before = await getPromotion(id);
  await updateDoc(doc(db, "promotions", id), data);
  await audit(actor, {
    accion: "modificar_promocion",
    modulo: "promociones",
    documentId: id,
    beforeData: before ?? undefined,
    afterData: data,
    detalle: `Promoción modificada: ${before?.nombre || id}`,
  });
}

/** Borrado lógico. */
export async function deletePromotion(id: string, actor?: AuditActor) {
  const before = await getPromotion(id);
  await updateDoc(doc(db, "promotions", id), {
    deleted: true,
    activo: false,
    deletedAt: serverTimestamp(),
    deletedBy: actor?.email || "desconocido",
  });
  await audit(actor, {
    accion: "eliminar_promocion",
    modulo: "promociones",
    documentId: id,
    beforeData: before ?? undefined,
    detalle: `Promoción eliminada: ${before?.nombre || id}`,
  });
}

export async function restorePromotion(id: string, actor?: AuditActor) {
  await updateDoc(doc(db, "promotions", id), {
    deleted: false,
    deletedAt: null,
    deletedBy: null,
  });
  await audit(actor, {
    accion: "restaurar_promocion",
    modulo: "promociones",
    documentId: id,
    detalle: `Promoción restaurada: ${id}`,
  });
}

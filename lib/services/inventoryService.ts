import {
  addDoc,
  collection,
  doc,
  getDocs,
  getDoc,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  limit,
  deleteDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { InventoryItem, InventoryMovement, MovementType, AuditActor } from "@/types";
import { audit } from "./auditService";

const col = () => collection(db, "inventory");
const movCol = () => collection(db, "inventoryMovements");

// ── Items ──────────────────────────────────────────────────────

export async function listInventory(soloActivos = false): Promise<InventoryItem[]> {
  const snap = await getDocs(query(col(), orderBy("nombre")));
  const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as InventoryItem[];
  return soloActivos ? all.filter((i) => i.activo !== false) : all;
}

export async function getInventoryItem(id: string): Promise<InventoryItem | null> {
  const s = await getDoc(doc(db, "inventory", id));
  return s.exists() ? ({ id: s.id, ...(s.data() as any) }) : null;
}

export async function createInventoryItem(
  data: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">,
  actor?: AuditActor
): Promise<string> {
  const ref = await addDoc(col(), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  await audit(actor, {
    accion: "crear_item_inventario",
    modulo: "inventario",
    documentId: ref.id,
    afterData: data,
    detalle: `Ítem creado: ${data.nombre}`,
  });
  return ref.id;
}

export async function updateInventoryItem(
  id: string,
  data: Partial<InventoryItem>,
  actor?: AuditActor
) {
  const before = await getInventoryItem(id);
  await updateDoc(doc(db, "inventory", id), { ...data, updatedAt: serverTimestamp() });
  await audit(actor, {
    accion: "modificar_item_inventario",
    modulo: "inventario",
    documentId: id,
    beforeData: before ?? undefined,
    afterData: data,
    detalle: `Ítem modificado: ${before?.nombre || id}`,
  });
}

export async function deleteInventoryItem(id: string, actor?: AuditActor) {
  const before = await getInventoryItem(id);
  await deleteDoc(doc(db, "inventory", id));
  await audit(actor, {
    accion: "eliminar_item_inventario",
    modulo: "inventario",
    documentId: id,
    beforeData: before ?? undefined,
    detalle: `Ítem eliminado: ${before?.nombre || id}`,
  });
}

// ── Movimientos ────────────────────────────────────────────────

const isOnline = () =>
  typeof navigator === "undefined" ? true : navigator.onLine !== false;

/** Calcula el stock resultante según el tipo de movimiento. */
function calcStock(tipo: MovementType, stockAnterior: number, cantidad: number): number {
  if (tipo === "entrada") return stockAnterior + cantidad;
  if (tipo === "salida") {
    if (cantidad > stockAnterior) throw new Error("Stock insuficiente");
    return stockAnterior - cantidad;
  }
  return cantidad; // ajuste: nuevo stock absoluto
}

export async function registrarMovimiento(input: {
  itemId: string;
  tipo: MovementType;
  cantidad: number;
  motivo?: string;
  usuarioId?: string;
  usuarioNombre?: string;
  actor?: AuditActor;
}): Promise<{ stockResultante: number }> {
  const itemRef = doc(db, "inventory", input.itemId);

  const buildMov = (item: InventoryItem, stockAnterior: number, stockResultante: number) => ({
    itemId: input.itemId,
    itemNombre: item.nombre,
    tipo: input.tipo,
    cantidad: input.tipo === "ajuste" ? Math.abs(stockResultante - stockAnterior) : input.cantidad,
    stockAnterior,
    stockResultante,
    motivo: input.motivo || "",
    usuarioId: input.usuarioId || null,
    usuarioNombre: input.usuarioNombre || null,
    createdAt: serverTimestamp(),
  });

  let result: { stockResultante: number; stockAnterior: number; itemNombre: string };

  if (isOnline()) {
    // Online: transacción atómica (a prueba de concurrencia entre cajas).
    result = await runTransaction(db, async (tx) => {
      const snap = await tx.get(itemRef);
      if (!snap.exists()) throw new Error("Ítem no encontrado");
      const item = snap.data() as InventoryItem;
      const stockAnterior = item.stockActual ?? 0;
      const stockResultante = calcStock(input.tipo, stockAnterior, input.cantidad);
      tx.update(itemRef, { stockActual: stockResultante, updatedAt: serverTimestamp() });
      await addDoc(movCol(), buildMov(item, stockAnterior, stockResultante));
      return { stockResultante, stockAnterior, itemNombre: item.nombre };
    });
  } else {
    // Offline: lectura desde caché local + escritura optimista.
    // Las transacciones no operan sin conexión; los writes se sincronizan
    // automáticamente al reconectar (Firestore offline).
    const snap = await getDoc(itemRef);
    if (!snap.exists()) throw new Error("Ítem no encontrado (sin conexión)");
    const item = snap.data() as InventoryItem;
    const stockAnterior = item.stockActual ?? 0;
    const stockResultante = calcStock(input.tipo, stockAnterior, input.cantidad);
    void updateDoc(itemRef, { stockActual: stockResultante, updatedAt: serverTimestamp() });
    void addDoc(movCol(), buildMov(item, stockAnterior, stockResultante));
    result = { stockResultante, stockAnterior, itemNombre: item.nombre };
  }

  // Auditoría fuera de la transacción
  const accionMap: Record<MovementType, string> = {
    entrada: "entrada_stock",
    salida: "salida_stock",
    ajuste: "ajuste_stock",
  };
  await audit(input.actor, {
    accion: accionMap[input.tipo],
    modulo: "inventario",
    documentId: input.itemId,
    beforeData: { stockActual: result.stockAnterior },
    afterData: { stockActual: result.stockResultante },
    observaciones: input.motivo,
    detalle: `${result.itemNombre}: stock ${result.stockAnterior} → ${result.stockResultante} (${input.tipo})`,
  });

  return { stockResultante: result.stockResultante };
}

export async function listMovements(itemId?: string, limitN = 50): Promise<InventoryMovement[]> {
  const constraints: any[] = [orderBy("createdAt", "desc"), limit(limitN)];
  if (itemId) constraints.unshift(where("itemId", "==", itemId));
  const snap = await getDocs(query(movCol(), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

// ── Alertas ────────────────────────────────────────────────────

export type StockStatus = "ok" | "bajo" | "critico";

export function getStockStatus(item: InventoryItem): StockStatus {
  if (item.stockActual <= item.stockSeguridad) return "critico";
  if (item.stockActual <= item.stockMinimo) return "bajo";
  return "ok";
}

export async function listAlerts(): Promise<InventoryItem[]> {
  const all = await listInventory(true);
  return all.filter((i) => getStockStatus(i) !== "ok");
}

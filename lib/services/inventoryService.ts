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
import { InventoryItem, InventoryMovement, MovementType } from "@/types";

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
  data: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(col(), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return ref.id;
}

export async function updateInventoryItem(id: string, data: Partial<InventoryItem>) {
  return updateDoc(doc(db, "inventory", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteInventoryItem(id: string) {
  return deleteDoc(doc(db, "inventory", id));
}

// ── Movimientos ────────────────────────────────────────────────

export async function registrarMovimiento(input: {
  itemId: string;
  tipo: MovementType;
  cantidad: number;
  motivo?: string;
  usuarioId?: string;
  usuarioNombre?: string;
}): Promise<{ stockResultante: number }> {
  const itemRef = doc(db, "inventory", input.itemId);

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(itemRef);
    if (!snap.exists()) throw new Error("Ítem no encontrado");

    const item = snap.data() as InventoryItem;
    const stockAnterior = item.stockActual ?? 0;
    let stockResultante: number;

    if (input.tipo === "entrada") {
      stockResultante = stockAnterior + input.cantidad;
    } else if (input.tipo === "salida") {
      if (input.cantidad > stockAnterior) throw new Error("Stock insuficiente");
      stockResultante = stockAnterior - input.cantidad;
    } else {
      // ajuste: la cantidad es el nuevo stock absoluto
      stockResultante = input.cantidad;
    }

    tx.update(itemRef, { stockActual: stockResultante, updatedAt: serverTimestamp() });

    const movData = {
      itemId: input.itemId,
      itemNombre: item.nombre,
      tipo: input.tipo,
      cantidad: input.tipo === "ajuste" ? Math.abs(stockResultante - stockAnterior) : input.cantidad,
      stockAnterior,
      stockResultante,
      motivo: input.motivo || "",
      usuarioId: input.usuarioId || null,
      usuarioNombre: input.usuarioNombre || null,
      createdAt: serverTimestamp()
    };

    await addDoc(movCol(), movData);
    return { stockResultante };
  });
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

import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { CashSession, Order, PAYMENT_METHODS } from "@/types";
import { listOrdersRange } from "./orderService";
import { endOfDay, startOfDay } from "@/lib/utils";

const col = () => collection(db, "cashSessions");

export async function getOpenSession(): Promise<CashSession | null> {
  const snap = await getDocs(query(col(), where("estado", "==", "abierta"), limit(1)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as any) };
}

export async function openSession(usuarioId: string, usuarioNombre: string) {
  const open = await getOpenSession();
  if (open) return open;
  const ref = await addDoc(col(), {
    fechaApertura: serverTimestamp(),
    usuarioId,
    usuarioNombre,
    totalEfectivo: 0,
    totalTransferencia: 0,
    totalDebito: 0,
    totalCredito: 0,
    totalGeneral: 0,
    cantidadPedidos: 0,
    estado: "abierta"
  });
  return { id: ref.id } as any;
}

export function aggregateByPayment(orders: Order[]) {
  const totals: Record<string, number> = {
    Efectivo: 0,
    Transferencia: 0,
    Débito: 0,
    Crédito: 0
  };
  let count = 0;
  for (const o of orders) {
    if (o.estado === "Cancelado") continue;
    totals[o.metodoPago] = (totals[o.metodoPago] || 0) + (o.total || 0);
    count++;
  }
  const total = PAYMENT_METHODS.reduce((s, k) => s + (totals[k] || 0), 0);
  return { totals, total, count };
}

export async function closeSession(id: string) {
  const orders = await listOrdersRange(startOfDay(), endOfDay());
  const { totals, total, count } = aggregateByPayment(orders);
  await updateDoc(doc(db, "cashSessions", id), {
    fechaCierre: serverTimestamp(),
    totalEfectivo: totals.Efectivo,
    totalTransferencia: totals.Transferencia,
    totalDebito: totals["Débito"],
    totalCredito: totals["Crédito"],
    totalGeneral: total,
    cantidadPedidos: count,
    estado: "cerrada"
  });
}

export async function listSessions(): Promise<CashSession[]> {
  const snap = await getDocs(query(col(), orderBy("fechaApertura", "desc"), limit(60)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

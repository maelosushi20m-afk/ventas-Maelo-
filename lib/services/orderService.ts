import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Order, OrderStatus } from "@/types";
import { upsertCustomerFromOrder } from "./customerService";

const col = collection(db, "orders");

async function nextOrderNumber(): Promise<number> {
  const ref = doc(db, "counters", "orderNumber");
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists() ? (snap.data().seq as number) : 0;
    const next = current + 1;
    tx.set(ref, { seq: next });
    return next;
  });
}

export interface CreateOrderInput {
  clienteNombre: string;
  telefono?: string;
  direccion?: string;
  observaciones?: string;
  items: Order["items"];
  total: number;
  metodoPago: Order["metodoPago"];
  estado?: OrderStatus;
  vendedorId?: string;
  vendedorNombre?: string;
}

export async function createOrder(input: CreateOrderInput) {
  const numeroPedido = await nextOrderNumber();
  const clienteId = await upsertCustomerFromOrder({
    nombre: input.clienteNombre,
    telefono: input.telefono,
    direccion: input.direccion,
    total: input.total
  });
  const ref = await addDoc(col, {
    numeroPedido,
    fecha: serverTimestamp(),
    clienteId: clienteId || null,
    clienteNombre: input.clienteNombre,
    telefono: input.telefono || "",
    direccion: input.direccion || "",
    observaciones: input.observaciones || "",
    items: input.items,
    total: input.total,
    metodoPago: input.metodoPago,
    estado: input.estado || "Pendiente",
    vendedorId: input.vendedorId || null,
    vendedorNombre: input.vendedorNombre || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  await addDoc(collection(db, "notifications"), {
    tipo: "nuevo",
    mensaje: `Nuevo pedido #${numeroPedido} - ${input.clienteNombre}`,
    pedidoId: ref.id,
    leida: false,
    createdAt: serverTimestamp(),
    destinatarioRol: "todos"
  });
  return { id: ref.id, numeroPedido };
}

export async function updateOrderStatus(id: string, estado: OrderStatus) {
  await updateDoc(doc(db, "orders", id), { estado, updatedAt: serverTimestamp() });
  const tipo =
    estado === "Listo" ? "listo" :
    estado === "Entregado" ? "entregado" :
    estado === "Cancelado" ? "cancelado" : null;
  if (tipo) {
    const o = await getDoc(doc(db, "orders", id));
    const data = o.data() as any;
    await addDoc(collection(db, "notifications"), {
      tipo,
      mensaje: `Pedido #${data?.numeroPedido} ${estado.toLowerCase()}`,
      pedidoId: id,
      leida: false,
      createdAt: serverTimestamp(),
      destinatarioRol: "todos"
    });
  }
}

export async function getOrder(id: string): Promise<Order | null> {
  const s = await getDoc(doc(db, "orders", id));
  return s.exists() ? ({ id: s.id, ...(s.data() as any) }) : null;
}

export async function listOrdersRange(from: Date, to: Date): Promise<Order[]> {
  const q = query(
    col,
    where("fecha", ">=", Timestamp.fromDate(from)),
    where("fecha", "<=", Timestamp.fromDate(to)),
    orderBy("fecha", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function listLatestOrders(n = 10): Promise<Order[]> {
  const q = query(col, orderBy("fecha", "desc"), limit(n));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

export async function searchOrders(termino: string): Promise<Order[]> {
  const term = termino.trim().toLowerCase();
  const snap = await getDocs(query(col, orderBy("fecha", "desc"), limit(200)));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as any) }) as Order)
    .filter((o) => {
      return (
        String(o.numeroPedido).includes(term) ||
        (o.clienteNombre || "").toLowerCase().includes(term) ||
        (o.telefono || "").toLowerCase().includes(term)
      );
    });
}

import { Order, PaymentMethod } from "@/types";
import { listOrdersRange } from "./orderService";

export interface ReportSummary {
  totalVentas: number;
  cantidadPedidos: number;
  ticketPromedio: number;
  porMetodoPago: Record<PaymentMethod, number>;
  topProductos: { nombre: string; cantidad: number; total: number }[];
  topPromociones: { nombre: string; cantidad: number; total: number }[];
  topClientes: { nombre: string; telefono?: string; pedidos: number; total: number }[];
  orders: Order[];
}

export async function buildReport(from: Date, to: Date): Promise<ReportSummary> {
  const orders = (await listOrdersRange(from, to)).filter((o) => o.estado !== "Cancelado");

  const totalVentas = orders.reduce((s, o) => s + (o.total || 0), 0);
  const cantidadPedidos = orders.length;
  const ticketPromedio = cantidadPedidos ? totalVentas / cantidadPedidos : 0;

  const porMetodoPago: Record<PaymentMethod, number> = {
    Efectivo: 0,
    Transferencia: 0,
    Débito: 0,
    Crédito: 0
  };
  const prodMap = new Map<string, { nombre: string; cantidad: number; total: number }>();
  const promoMap = new Map<string, { nombre: string; cantidad: number; total: number }>();
  const cliMap = new Map<string, { nombre: string; telefono?: string; pedidos: number; total: number }>();

  for (const o of orders) {
    porMetodoPago[o.metodoPago] = (porMetodoPago[o.metodoPago] || 0) + (o.total || 0);
    for (const it of o.items || []) {
      const map = it.tipo === "promotion" ? promoMap : prodMap;
      const cur = map.get(it.refId) || { nombre: it.nombre, cantidad: 0, total: 0 };
      cur.cantidad += it.cantidad;
      cur.total += it.subtotal;
      map.set(it.refId, cur);
    }
    const key = o.telefono || o.clienteNombre || "anon";
    const c = cliMap.get(key) || { nombre: o.clienteNombre, telefono: o.telefono, pedidos: 0, total: 0 };
    c.pedidos += 1;
    c.total += o.total || 0;
    cliMap.set(key, c);
  }

  const sortByTotal = (a: any, b: any) => b.total - a.total;
  return {
    totalVentas,
    cantidadPedidos,
    ticketPromedio,
    porMetodoPago,
    topProductos: [...prodMap.values()].sort(sortByTotal).slice(0, 10),
    topPromociones: [...promoMap.values()].sort(sortByTotal).slice(0, 10),
    topClientes: [...cliMap.values()].sort((a, b) => b.pedidos - a.pedidos).slice(0, 10),
    orders
  };
}

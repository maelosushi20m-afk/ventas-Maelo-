"use client";
import Link from "next/link";
import { Home } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useQuery } from "@tanstack/react-query";
import { listOrdersRange, listLatestOrders } from "@/lib/services/orderService";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfMonth,
  formatCLP,
  toDate
} from "@/lib/utils";
import { SalesChart } from "@/components/dashboard/SalesChart";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="text-xs text-gray-400 uppercase">{label}</div>
      <div className="text-2xl font-bold mt-1 text-brand-gold">{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const day = useQuery({
    queryKey: ["orders", "day"],
    queryFn: () => listOrdersRange(startOfDay(), endOfDay())
  });
  const week = useQuery({
    queryKey: ["orders", "week"],
    queryFn: () => listOrdersRange(startOfWeek(), endOfDay())
  });
  const month = useQuery({
    queryKey: ["orders", "month"],
    queryFn: () => listOrdersRange(startOfMonth(), endOfDay())
  });
  const latest = useQuery({ queryKey: ["orders", "latest"], queryFn: () => listLatestOrders(8) });

  const validOrders = (arr?: any[]) => (arr || []).filter((o) => o.estado !== "Cancelado");
  const sum = (arr?: any[]) => validOrders(arr).reduce((s, o) => s + (o.total || 0), 0);
  const count = (arr?: any[]) => validOrders(arr).length;
  const ticket = (arr?: any[]) => (count(arr) ? sum(arr) / count(arr) : 0);

  const orders = validOrders(month.data);
  const prodMap = new Map<string, { nombre: string; cantidad: number; total: number }>();
  const promoMap = new Map<string, { nombre: string; cantidad: number; total: number }>();
  const payMap: Record<string, number> = {};
  for (const o of orders) {
    payMap[o.metodoPago] = (payMap[o.metodoPago] || 0) + o.total;
    for (const it of o.items || []) {
      const map = it.tipo === "promotion" ? promoMap : prodMap;
      const c = map.get(it.refId) || { nombre: it.nombre, cantidad: 0, total: 0 };
      c.cantidad += it.cantidad;
      c.total += it.subtotal;
      map.set(it.refId, c);
    }
  }
  const topProd = [...prodMap.values()].sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);
  const topPromo = [...promoMap.values()].sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);

  return (
    <AppShell title="Dashboard">
      <div className="mb-4">
        <Link href="/" className="btn-ghost inline-flex">
          <Home size={16} /> Volver al Inicio
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Ventas hoy" value={formatCLP(sum(day.data))} />
        <Stat label="Ventas semana" value={formatCLP(sum(week.data))} />
        <Stat label="Ventas mes" value={formatCLP(sum(month.data))} />
        <Stat label="Pedidos hoy" value={String(count(day.data))} />
        <Stat label="Ticket promedio (mes)" value={formatCLP(ticket(month.data))} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="card">
          <h3 className="font-semibold mb-3 text-brand-gold">Top productos (mes)</h3>
          {topProd.length === 0 && <div className="text-sm text-gray-400">Sin datos</div>}
          {topProd.map((p) => (
            <div key={p.nombre} className="flex justify-between py-1 text-sm border-b border-brand-gray">
              <span>{p.nombre}</span>
              <span className="text-brand-gold">{p.cantidad}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3 text-brand-gold">Top promociones (mes)</h3>
          {topPromo.length === 0 && <div className="text-sm text-gray-400">Sin datos</div>}
          {topPromo.map((p) => (
            <div key={p.nombre} className="flex justify-between py-1 text-sm border-b border-brand-gray">
              <span>{p.nombre}</span>
              <span className="text-brand-gold">{p.cantidad}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3 text-brand-gold">Métodos de pago (mes)</h3>
          {Object.entries(payMap).length === 0 && <div className="text-sm text-gray-400">Sin datos</div>}
          {Object.entries(payMap).map(([k, v]) => (
            <div key={k} className="flex justify-between py-1 text-sm border-b border-brand-gray">
              <span>{k}</span>
              <span className="text-brand-gold">{formatCLP(v)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <SalesChart orders={week.data || []} />
      </div>

      <div className="card mt-6">
        <h3 className="font-semibold mb-3 text-brand-gold">Últimos pedidos</h3>
        <table className="table">
          <thead>
            <tr>
              <th>#</th><th>Cliente</th><th>Total</th><th>Pago</th><th>Estado</th><th>Hora</th>
            </tr>
          </thead>
          <tbody>
            {(latest.data || []).map((o: any) => (
              <tr key={o.id}>
                <td>{o.numeroPedido}</td>
                <td>{o.clienteNombre}</td>
                <td>{formatCLP(o.total)}</td>
                <td>{o.metodoPago}</td>
                <td><span className="badge bg-brand-gray">{o.estado}</span></td>
                <td>{toDate(o.fecha).toLocaleTimeString("es-CL")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

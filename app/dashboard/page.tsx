"use client";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useQuery } from "@tanstack/react-query";
import { listOrdersRange, listLatestOrders } from "@/lib/services/orderService";
import { listInventory } from "@/lib/services/inventoryService";
import { listAuditLogs } from "@/lib/services/auditService";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfMonth,
  formatCLP,
  toDate
} from "@/lib/utils";
import { SalesChart } from "@/components/dashboard/SalesChart";
import {
  TrendingUp, ShoppingBag, CheckCircle2, Clock, AlertTriangle, Activity
} from "lucide-react";

function Stat({
  label, value, icon: Icon, accent = "text-brand-gold"
}: {
  label: string; value: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  accent?: string;
}) {
  return (
    <div className="card flex items-start gap-3">
      {Icon && (
        <div className={`mt-0.5 p-2 rounded-lg bg-brand-gray ${accent}`}>
          <Icon size={16} />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-xs text-gray-400 uppercase truncate">{label}</div>
        <div className={`text-lg sm:text-2xl font-bold mt-1 truncate ${accent}`}>{value}</div>
      </div>
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
  const inventory = useQuery({ queryKey: ["inventory"], queryFn: () => listInventory() });
  const auditLogs = useQuery({ queryKey: ["audit", "recent"], queryFn: () => listAuditLogs(10) });

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

  // Pedidos del día por estado
  const allToday = day.data || [];
  const pendientes = allToday.filter((o: any) => o.estado === "Pendiente" || o.estado === "En preparación").length;
  const entregados = allToday.filter((o: any) => o.estado === "Entregado").length;

  // Inventario bajo
  const invBajo = (inventory.data || []).filter(
    (i) => i.activo !== false && i.stockActual <= i.stockMinimo
  );

  return (
    <AppShell title="Dashboard" roles={["SUPER_ADMIN"]}>
      {/* Stats principales */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Stat label="Ventas hoy" value={formatCLP(sum(day.data))} icon={TrendingUp} />
        <Stat label="Ventas semana" value={formatCLP(sum(week.data))} icon={TrendingUp} accent="text-blue-400" />
        <Stat label="Ventas mes" value={formatCLP(sum(month.data))} icon={TrendingUp} accent="text-purple-400" />
        <Stat label="Pedidos hoy" value={String(count(day.data))} icon={ShoppingBag} accent="text-brand-gold" />
        <Stat label="Ticket prom." value={formatCLP(ticket(month.data))} icon={TrendingUp} accent="text-green-400" />
      </div>

      {/* Estado pedidos hoy */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-3 sm:mt-4">
        <Stat label="Pendientes hoy" value={String(pendientes)} icon={Clock} accent="text-yellow-400" />
        <Stat label="Entregados hoy" value={String(entregados)} icon={CheckCircle2} accent="text-green-400" />
        <Stat label="Inv. bajo stock" value={String(invBajo.length)} icon={AlertTriangle} accent={invBajo.length > 0 ? "text-red-400" : "text-gray-400"} />
        <Stat label="Ticket prom. hoy" value={formatCLP(ticket(day.data))} icon={TrendingUp} accent="text-brand-gold" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
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

      {/* Últimos pedidos */}
      <div className="card mt-4 sm:mt-6">
        <h3 className="font-semibold mb-3 text-brand-gold">Últimos pedidos</h3>
        <div className="overflow-x-auto">
          <table className="table min-w-[500px]">
            <thead>
              <tr>
                <th>#</th><th>Cliente</th><th>Total</th><th>Pago</th><th>Estado</th><th>Hora</th>
              </tr>
            </thead>
            <tbody>
              {(latest.data || []).map((o: any) => (
                <tr key={o.id}>
                  <td>{o.numeroPedido}</td>
                  <td className="truncate max-w-[120px]">{o.clienteNombre}</td>
                  <td>{formatCLP(o.total)}</td>
                  <td>{o.metodoPago}</td>
                  <td>
                    <span className={`badge text-xs ${
                      o.estado === "Entregado" ? "bg-green-500/20 text-green-400"
                      : o.estado === "Cancelado" ? "bg-red-500/20 text-red-400"
                      : o.estado === "En preparación" ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-brand-gray text-gray-300"
                    }`}>{o.estado}</span>
                  </td>
                  <td className="whitespace-nowrap">{toDate(o.fecha).toLocaleTimeString("es-CL")}</td>
                </tr>
              ))}
              {(latest.data || []).length === 0 && (
                <tr><td colSpan={6} className="text-center text-gray-400 py-4">Sin pedidos hoy</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventario bajo y Actividad reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4 sm:mt-6">
        {/* Inventario bajo */}
        <div className="card">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-400" />
            <span className="text-brand-gold">Inventario bajo stock</span>
          </h3>
          {invBajo.length === 0 ? (
            <div className="text-sm text-gray-400">Todo el inventario en niveles normales ✓</div>
          ) : (
            <div className="space-y-2">
              {invBajo.slice(0, 8).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm border-b border-brand-gray pb-1.5">
                  <span className="truncate">{item.nombre}</span>
                  <span className="text-red-400 font-medium ml-2 whitespace-nowrap">
                    {item.stockActual} {item.unidad} <span className="text-gray-500">/ mín {item.stockMinimo}</span>
                  </span>
                </div>
              ))}
              {invBajo.length > 8 && (
                <Link href="/inventario" className="text-xs text-brand-gold hover:underline">
                  Ver {invBajo.length - 8} más…
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Actividad reciente */}
        <div className="card">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Activity size={16} className="text-blue-400" />
            <span className="text-brand-gold">Actividad reciente</span>
          </h3>
          {(auditLogs.data || []).length === 0 ? (
            <div className="text-sm text-gray-400">Sin actividad registrada</div>
          ) : (
            <div className="space-y-2">
              {(auditLogs.data || []).map((log: any) => (
                <div key={log.id} className="flex items-start gap-2 text-xs border-b border-brand-gray pb-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-gold mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-gray-200">{log.usuarioNombre || log.usuarioEmail}</span>
                    <span className="text-gray-400 mx-1">·</span>
                    <span className="text-gray-300">{log.accion.replace(/_/g, " ")}</span>
                    {log.detalle && <div className="text-gray-500 truncate">{log.detalle}</div>}
                  </div>
                  <div className="text-gray-500 whitespace-nowrap shrink-0">
                    {toDate(log.createdAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/auditoria" className="text-xs text-brand-gold hover:underline mt-2 block">
            Ver historial completo →
          </Link>
        </div>
      </div>
    </AppShell>
  );
}

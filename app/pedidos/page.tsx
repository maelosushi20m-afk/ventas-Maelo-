"use client";
import { AppShell } from "@/components/layout/AppShell";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listLatestOrders, searchOrders, updateOrderStatus } from "@/lib/services/orderService";
import { ORDER_STATUSES, Order, OrderStatus, PAYMENT_METHODS, PaymentMethod } from "@/types";
import { formatCLP, toDate } from "@/lib/utils";
import toast from "react-hot-toast";
import { Search, Printer } from "lucide-react";
import Link from "next/link";

const colorEstado: Record<OrderStatus, string> = {
  "Pendiente": "bg-yellow-700",
  "En preparación": "bg-blue-700",
  "Listo": "bg-green-700",
  "En reparto": "bg-purple-700",
  "Entregado": "bg-green-900",
  "Cancelado": "bg-red-900"
};

export default function PedidosPage() {
  const qc = useQueryClient();
  const [term, setTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<OrderStatus | "">("");
  const [filterPago, setFilterPago] = useState<PaymentMethod | "">("");
  const [selected, setSelected] = useState<Order | null>(null);

  const { data: latest = [] } = useQuery({ queryKey: ["orders", "latest", 50], queryFn: () => listLatestOrders(50) });
  const { data: result = [] } = useQuery({
    queryKey: ["orders", "search", term],
    queryFn: () => (term ? searchOrders(term) : Promise.resolve([])),
    enabled: !!term
  });

  const base = term ? result : latest;
  const orders = base.filter((o: any) =>
    (!filterEstado || o.estado === filterEstado) &&
    (!filterPago || o.metodoPago === filterPago)
  );

  const cambiar = async (id: string, estado: OrderStatus) => {
    try {
      await updateOrderStatus(id, estado);
      toast.success("Estado actualizado");
      qc.invalidateQueries({ queryKey: ["orders"] });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <AppShell title="Pedidos">
      <div className="card mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="flex gap-2 items-center sm:col-span-2 lg:col-span-2">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input className="input" placeholder="Buscar #, cliente o teléfono…" value={term} onChange={(e) => setTerm(e.target.value)} />
        </div>
        <select className="input" value={filterEstado} onChange={(e) => setFilterEstado(e.target.value as any)}>
          <option value="">Todos los estados</option>
          {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="input" value={filterPago} onChange={(e) => setFilterPago(e.target.value as any)}>
          <option value="">Todos los pagos</option>
          {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>

      {/* Vista cards en móvil, tabla en desktop */}
      <div className="card hidden md:block">
        <div className="overflow-x-auto">
          <table className="table min-w-[700px]">
            <thead>
              <tr><th>#</th><th>Cliente</th><th>Teléfono</th><th>Total</th><th>Pago</th><th>Estado</th><th>Fecha</th><th></th></tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id} className="hover:bg-brand-gray cursor-pointer" onClick={() => setSelected(o)}>
                  <td className="font-mono">#{o.numeroPedido}</td>
                  <td className="truncate max-w-[120px]">{o.clienteNombre}</td>
                  <td>{o.telefono}</td>
                  <td>{formatCLP(o.total)}</td>
                  <td>{o.metodoPago}</td>
                  <td><span className={`badge ${colorEstado[o.estado as OrderStatus]}`}>{o.estado}</span></td>
                  <td className="whitespace-nowrap">{toDate(o.fecha).toLocaleString("es-CL")}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select className="input text-xs py-1" value={o.estado} onChange={(e) => cambiar(o.id, e.target.value as OrderStatus)}>
                      {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista cards para móvil */}
      <div className="md:hidden space-y-2">
        {orders.map((o: any) => (
          <div key={o.id} className="card cursor-pointer active:bg-brand-gray" onClick={() => setSelected(o)}>
            <div className="flex justify-between items-start mb-1">
              <span className="font-mono font-bold">#{o.numeroPedido}</span>
              <span className={`badge ${colorEstado[o.estado as OrderStatus]}`}>{o.estado}</span>
            </div>
            <div className="text-sm">{o.clienteNombre}</div>
            <div className="flex justify-between items-center mt-2 text-sm">
              <span className="text-brand-gold font-bold">{formatCLP(o.total)}</span>
              <span className="text-gray-400 text-xs">{o.metodoPago} · {toDate(o.fecha).toLocaleString("es-CL")}</span>
            </div>
            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
              <select className="input text-xs py-1" value={o.estado} onChange={(e) => cambiar(o.id, e.target.value as OrderStatus)}>
                {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center sm:p-4 z-50" onClick={() => setSelected(null)}>
          <div className="card max-w-lg w-full rounded-b-none sm:rounded-b-xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-brand-gold mb-2">Pedido #{selected.numeroPedido}</h3>
            <div className="text-sm space-y-1 mb-3">
              <div><b>Cliente:</b> {selected.clienteNombre}</div>
              <div><b>Teléfono:</b> {selected.telefono}</div>
              <div><b>Dirección:</b> {selected.direccion}</div>
              <div><b>Observaciones:</b> {selected.observaciones}</div>
              <div><b>Pago:</b> {selected.metodoPago}</div>
              <div><b>Estado:</b> {selected.estado}</div>
              <div><b>Fecha:</b> {toDate(selected.fecha).toLocaleString("es-CL")}</div>
            </div>
            <div className="border-t border-brand-gray pt-2">
              {selected.items.map((it, i) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <span>{it.cantidad}× {it.nombre}</span>
                  <span>{formatCLP(it.subtotal)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold mt-2 text-brand-gold">
                <span>Total</span><span>{formatCLP(selected.total)}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Link href={`/pedidos/${selected.id}`} className="btn-gold flex-1 justify-center">
                <Printer size={16} /> Ver ticket
              </Link>
              <button className="btn-ghost flex-1" onClick={() => setSelected(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

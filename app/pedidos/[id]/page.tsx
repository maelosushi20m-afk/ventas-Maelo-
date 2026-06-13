"use client";
import { AppShell } from "@/components/layout/AppShell";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getOrder } from "@/lib/services/orderService";
import { formatCLP, toDate } from "@/lib/utils";
import { Printer, ArrowLeft } from "lucide-react";

export default function PedidoDetallePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", params.id],
    queryFn: () => getOrder(params.id)
  });

  if (isLoading) return <AppShell title="Cargando…">…</AppShell>;
  if (!order) return <AppShell title="No encontrado">Pedido no existe</AppShell>;

  return (
    <AppShell title={`Pedido #${order.numeroPedido}`}>
      <div className="flex gap-2 mb-4 no-print">
        <button className="btn-ghost" onClick={() => router.back()}><ArrowLeft size={16} /> Volver</button>
        <button className="btn-gold" onClick={() => window.print()}><Printer size={16} /> Imprimir ticket</button>
      </div>

      <div id="ticket" className="card max-w-md mx-auto print:bg-white print:text-black print:border-none">
        <div className="text-center mb-3">
          <div className="text-2xl font-bold text-brand-gold print:text-black">MAELO ROLLS</div>
          <div className="text-xs text-gray-400 print:text-black">Ticket de pedido</div>
        </div>
        <div className="text-sm space-y-1 border-t border-b border-brand-gray print:border-black py-2 mb-2">
          <div className="flex justify-between"><span>N° pedido</span><span className="font-bold">#{order.numeroPedido}</span></div>
          <div className="flex justify-between"><span>Fecha</span><span>{toDate(order.fecha).toLocaleString("es-CL")}</span></div>
          <div className="flex justify-between"><span>Cliente</span><span>{order.clienteNombre}</span></div>
          {order.telefono && <div className="flex justify-between"><span>Teléfono</span><span>{order.telefono}</span></div>}
          {order.direccion && <div className="flex justify-between"><span>Dirección</span><span>{order.direccion}</span></div>}
          <div className="flex justify-between"><span>Pago</span><span>{order.metodoPago}</span></div>
          <div className="flex justify-between"><span>Estado</span><span>{order.estado}</span></div>
        </div>
        <div className="text-sm">
          {order.items.map((it, i) => (
            <div key={i} className="flex justify-between py-1">
              <span>{it.cantidad}× {it.nombre}</span>
              <span>{formatCLP(it.subtotal)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-brand-gray print:border-black mt-2 pt-2 flex justify-between font-bold text-lg">
          <span>TOTAL</span><span>{formatCLP(order.total)}</span>
        </div>
        {order.observaciones && (
          <div className="mt-3 text-xs text-gray-400 print:text-black">
            <b>Obs:</b> {order.observaciones}
          </div>
        )}
        <div className="text-center text-xs text-gray-500 print:text-black mt-4">¡Gracias por su pedido!</div>
      </div>
    </AppShell>
  );
}

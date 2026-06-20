"use client";
import { AppShell } from "@/components/layout/AppShell";
import { useQuery } from "@tanstack/react-query";
import { listCustomers } from "@/lib/services/customerService";
import { listOrdersRange } from "@/lib/services/orderService";
import { Customer } from "@/types";
import { useState, useMemo } from "react";
import { formatCLP, toDate } from "@/lib/utils";

export default function ClientesPage() {
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: listCustomers });
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    const t = term.toLowerCase();
    return customers.filter((c) =>
      c.nombre.toLowerCase().includes(t) ||
      (c.telefono || "").toLowerCase().includes(t)
    );
  }, [customers, term]);

  const { data: history = [] } = useQuery({
    queryKey: ["customer-history", selected?.id],
    enabled: !!selected,
    queryFn: async () => {
      const from = new Date(2020, 0, 1);
      const to = new Date();
      const all = await listOrdersRange(from, to);
      return all.filter((o) => o.clienteId === selected!.id);
    }
  });

  return (
    <AppShell title="Clientes">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="card lg:col-span-2">
          <input className="input mb-3" placeholder="Buscar cliente o teléfono…" value={term} onChange={(e) => setTerm(e.target.value)} />
          <div className="overflow-x-auto">
          <table className="table min-w-[450px]">
            <thead>
              <tr><th>Nombre</th><th>Teléfono</th><th>Pedidos</th><th>Total</th><th>Último</th></tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-brand-gray cursor-pointer" onClick={() => setSelected(c)}>
                  <td>{c.nombre}</td>
                  <td>{c.telefono}</td>
                  <td>{c.cantidadPedidos}</td>
                  <td>{formatCLP(c.totalGastado)}</td>
                  <td>{c.ultimoPedido ? toDate(c.ultimoPedido).toLocaleDateString("es-CL") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        <div className="card">
          {!selected && <div className="text-sm text-gray-400">Selecciona un cliente</div>}
          {selected && (
            <>
              <h3 className="font-semibold text-brand-gold">{selected.nombre}</h3>
              <div className="text-sm text-gray-400">{selected.telefono}</div>
              <div className="text-sm">{selected.direccion}</div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="card !p-2"><div className="text-xs text-gray-400">Pedidos</div><div className="font-bold">{selected.cantidadPedidos}</div></div>
                <div className="card !p-2"><div className="text-xs text-gray-400">Total</div><div className="font-bold">{formatCLP(selected.totalGastado)}</div></div>
              </div>
              <h4 className="mt-4 font-semibold">Historial</h4>
              <div className="max-h-80 overflow-auto">
                {history.map((o) => (
                  <div key={o.id} className="text-sm py-2 border-b border-brand-gray">
                    <div className="flex justify-between">
                      <span>#{o.numeroPedido}</span>
                      <span>{formatCLP(o.total)}</span>
                    </div>
                    <div className="text-xs text-gray-400">{toDate(o.fecha).toLocaleString("es-CL")} · {o.estado}</div>
                  </div>
                ))}
                {history.length === 0 && <div className="text-sm text-gray-400">Sin historial</div>}
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

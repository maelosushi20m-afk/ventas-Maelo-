"use client";
import { AppShell } from "@/components/layout/AppShell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  aggregateByPayment,
  closeSession,
  getOpenSession,
  listSessions,
  openSession
} from "@/lib/services/cashService";
import { listOrdersRange } from "@/lib/services/orderService";
import { startOfDay, endOfDay, formatCLP, toDate } from "@/lib/utils";
import { useAuth } from "@/lib/firebase/auth-context";
import toast from "react-hot-toast";

export default function CajaPage() {
  const qc = useQueryClient();
  const { appUser } = useAuth();
  const open = useQuery({ queryKey: ["cash", "open"], queryFn: getOpenSession });
  const sessions = useQuery({ queryKey: ["cash", "list"], queryFn: listSessions });
  const today = useQuery({ queryKey: ["orders", "today"], queryFn: () => listOrdersRange(startOfDay(), endOfDay()) });

  const agg = aggregateByPayment(today.data || []);

  const abrir = async () => {
    if (!appUser) return;
    await openSession(appUser.uid, appUser.name);
    toast.success("Caja abierta");
    qc.invalidateQueries({ queryKey: ["cash"] });
  };

  const cerrar = async () => {
    if (!open.data) return;
    if (!confirm("¿Cerrar caja?")) return;
    await closeSession(open.data.id);
    toast.success("Caja cerrada");
    qc.invalidateQueries({ queryKey: ["cash"] });
  };

  return (
    <AppShell title="Caja diaria">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {(["Efectivo", "Transferencia", "Débito", "Crédito"] as const).map((k) => (
          <div key={k} className="card">
            <div className="text-xs text-gray-400 uppercase">{k}</div>
            <div className="text-lg sm:text-2xl font-bold text-brand-gold truncate">{formatCLP(agg.totals[k])}</div>
          </div>
        ))}
      </div>

      <div className="card mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="text-gray-400">Total del día</div>
            <div className="text-2xl sm:text-3xl font-bold text-brand-gold">{formatCLP(agg.total)}</div>
            <div className="text-sm text-gray-400 mt-1">{agg.count} pedidos válidos</div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {!open.data && <button className="btn-gold flex-1 sm:flex-none" onClick={abrir}>Abrir caja</button>}
            {open.data && <button className="btn-primary flex-1 sm:flex-none" onClick={cerrar}>Cerrar caja</button>}
          </div>
        </div>
        {open.data && (
          <div className="mt-3 text-sm text-gray-400">
            Sesión abierta por {open.data.usuarioNombre} — {toDate(open.data.fechaApertura).toLocaleString("es-CL")}
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="font-semibold text-brand-gold mb-3">Cierres anteriores</h3>
        <div className="overflow-x-auto">
        <table className="table min-w-[550px]">
          <thead>
            <tr><th>Apertura</th><th>Cierre</th><th>Usuario</th><th>Pedidos</th><th>Total</th><th>Estado</th></tr>
          </thead>
          <tbody>
            {(sessions.data || []).map((s) => (
              <tr key={s.id}>
                <td>{toDate(s.fechaApertura).toLocaleString("es-CL")}</td>
                <td>{s.fechaCierre ? toDate(s.fechaCierre).toLocaleString("es-CL") : "—"}</td>
                <td>{s.usuarioNombre}</td>
                <td>{s.cantidadPedidos}</td>
                <td>{formatCLP(s.totalGeneral)}</td>
                <td><span className={`badge ${s.estado === "abierta" ? "bg-green-800" : "bg-brand-gray"}`}>{s.estado}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </AppShell>
  );
}

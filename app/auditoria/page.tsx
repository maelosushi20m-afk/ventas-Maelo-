"use client";
import { AppShell } from "@/components/layout/AppShell";
import { useQuery } from "@tanstack/react-query";
import { listAuditLogs } from "@/lib/services/auditService";
import { toDate } from "@/lib/utils";
import { ScrollText, Loader2 } from "lucide-react";
import { useState } from "react";

const MODULO_COLORS: Record<string, string> = {
  usuarios: "bg-purple-500/20 text-purple-400",
  pedidos: "bg-blue-500/20 text-blue-400",
  productos: "bg-green-500/20 text-green-400",
  inventario: "bg-yellow-500/20 text-yellow-400",
  caja: "bg-orange-500/20 text-orange-400",
  auth: "bg-gray-500/20 text-gray-400",
};

export default function AuditoriaPage() {
  const [filtroModulo, setFiltroModulo] = useState<string>("");
  const [filtroUsuario, setFiltroUsuario] = useState<string>("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit", "all"],
    queryFn: () => listAuditLogs(200),
    refetchInterval: 30_000, // refresh cada 30s
  });

  const filtered = logs.filter((l) => {
    if (filtroModulo && l.modulo !== filtroModulo) return false;
    if (filtroUsuario && !l.usuarioEmail.toLowerCase().includes(filtroUsuario.toLowerCase())) return false;
    return true;
  });

  const modulos = [...new Set(logs.map((l) => l.modulo))].sort();

  return (
    <AppShell title="Historial de Auditoría" roles={["SUPER_ADMIN"]}>
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Filtrar por usuario…"
          className="input text-sm max-w-[200px]"
          value={filtroUsuario}
          onChange={(e) => setFiltroUsuario(e.target.value)}
        />
        <select
          className="input text-sm max-w-[160px]"
          value={filtroModulo}
          onChange={(e) => setFiltroModulo(e.target.value)}
        >
          <option value="">Todos los módulos</option>
          {modulos.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <div className="text-xs text-gray-400 self-center">
          {filtered.length} registros
        </div>
      </div>

      <div className="card overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-brand-gold" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-gray-400 gap-2">
            <ScrollText size={32} />
            <span className="text-sm">Sin registros de auditoría</span>
          </div>
        ) : (
          <table className="table min-w-[640px]">
            <thead>
              <tr>
                <th>Fecha / Hora</th>
                <th>Usuario</th>
                <th>Módulo</th>
                <th>Acción</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => {
                const fecha = toDate(log.createdAt);
                return (
                  <tr key={log.id}>
                    <td className="whitespace-nowrap text-xs text-gray-400">
                      <div>{fecha.toLocaleDateString("es-CL")}</div>
                      <div>{fecha.toLocaleTimeString("es-CL")}</div>
                    </td>
                    <td>
                      <div className="text-sm font-medium">{log.usuarioNombre || "—"}</div>
                      <div className="text-xs text-gray-400">{log.usuarioEmail}</div>
                    </td>
                    <td>
                      <span className={`badge text-xs ${MODULO_COLORS[log.modulo] || "bg-brand-gray text-gray-300"}`}>
                        {log.modulo}
                      </span>
                    </td>
                    <td className="text-sm capitalize">
                      {(log.accion || "").replace(/_/g, " ")}
                    </td>
                    <td className="text-xs text-gray-400 max-w-[200px] truncate">
                      {log.detalle || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}

"use client";
import { AppShell } from "@/components/layout/AppShell";
import { useQuery } from "@tanstack/react-query";
import { listAuditLogs } from "@/lib/services/auditService";
import { toDate } from "@/lib/utils";
import { AuditLog } from "@/types";
import { ScrollText, Loader2, X, Eye } from "lucide-react";
import { useState, useMemo } from "react";

const MODULO_COLORS: Record<string, string> = {
  usuarios: "bg-purple-500/20 text-purple-400",
  pedidos: "bg-blue-500/20 text-blue-400",
  productos: "bg-green-500/20 text-green-400",
  inventario: "bg-yellow-500/20 text-yellow-400",
  promociones: "bg-pink-500/20 text-pink-400",
  clientes: "bg-cyan-500/20 text-cyan-400",
  caja: "bg-orange-500/20 text-orange-400",
  auth: "bg-gray-500/20 text-gray-400",
};

function fmtVal(v: any): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v);
}

// Compara before/after y devuelve solo los campos que cambiaron
function diffCampos(before: any, after: any): { campo: string; antes: any; nuevo: any }[] {
  if (!before && !after) return [];
  const claves = new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {}),
  ]);
  const out: { campo: string; antes: any; nuevo: any }[] = [];
  claves.forEach((k) => {
    const a = before?.[k];
    const b = after?.[k];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      out.push({ campo: k, antes: a, nuevo: b });
    }
  });
  return out;
}

export default function AuditoriaPage() {
  const [filtroModulo, setFiltroModulo] = useState("");
  const [filtroUsuario, setFiltroUsuario] = useState("");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");
  const [texto, setTexto] = useState("");
  const [detalle, setDetalle] = useState<AuditLog | null>(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit", "all"],
    queryFn: () => listAuditLogs(500),
    refetchInterval: 30_000,
  });

  const modulos = useMemo(
    () => [...new Set(logs.map((l) => l.modulo))].sort(),
    [logs]
  );

  const filtered = useMemo(() => {
    const desde = filtroDesde ? new Date(filtroDesde + "T00:00:00") : null;
    const hasta = filtroHasta ? new Date(filtroHasta + "T23:59:59") : null;
    const t = texto.trim().toLowerCase();
    return logs.filter((l) => {
      if (filtroModulo && l.modulo !== filtroModulo) return false;
      if (filtroUsuario && !(l.usuarioEmail || "").toLowerCase().includes(filtroUsuario.toLowerCase()) && !(l.usuarioNombre || "").toLowerCase().includes(filtroUsuario.toLowerCase())) return false;
      const f = toDate(l.createdAt);
      if (desde && f < desde) return false;
      if (hasta && f > hasta) return false;
      if (t) {
        const blob = [
          l.usuarioNombre, l.usuarioEmail, l.accion, l.modulo,
          l.documentId, l.detalle, l.observaciones,
          JSON.stringify(l.beforeData), JSON.stringify(l.afterData),
        ].join(" ").toLowerCase();
        if (!blob.includes(t)) return false;
      }
      return true;
    });
  }, [logs, filtroModulo, filtroUsuario, filtroDesde, filtroHasta, texto]);

  const limpiar = () => {
    setFiltroModulo(""); setFiltroUsuario(""); setFiltroDesde("");
    setFiltroHasta(""); setTexto("");
  };

  return (
    <AppShell title="Historial de Actividad">
      {/* Filtros */}
      <div className="card mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        <input
          type="text"
          placeholder="Buscar (texto libre)…"
          className="input text-sm lg:col-span-2"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <input
          type="text"
          placeholder="Usuario o correo…"
          className="input text-sm"
          value={filtroUsuario}
          onChange={(e) => setFiltroUsuario(e.target.value)}
        />
        <select
          className="input text-sm"
          value={filtroModulo}
          onChange={(e) => setFiltroModulo(e.target.value)}
        >
          <option value="">Todos los módulos</option>
          {modulos.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <input type="date" className="input text-sm" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} title="Desde" />
          <input type="date" className="input text-sm" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} title="Hasta" />
        </div>
        <div className="flex items-center justify-between lg:col-span-5">
          <span className="text-xs text-gray-400">{filtered.length} registros</span>
          <button onClick={limpiar} className="text-xs text-brand-gold hover:underline">Limpiar filtros</button>
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
          <table className="table min-w-[760px]">
            <thead>
              <tr>
                <th>Fecha / Hora</th>
                <th>Usuario</th>
                <th>Módulo</th>
                <th>Acción</th>
                <th>Documento</th>
                <th>Detalle</th>
                <th></th>
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
                    <td className="text-sm capitalize">{(log.accion || "").replace(/_/g, " ")}</td>
                    <td className="text-xs text-gray-400 font-mono max-w-[120px] truncate">{log.documentId || "—"}</td>
                    <td className="text-xs text-gray-400 max-w-[220px] truncate">{log.detalle || "—"}</td>
                    <td>
                      <button
                        onClick={() => setDetalle(log)}
                        className="p-1.5 rounded hover:bg-brand-gray text-brand-gold"
                        title="Ver detalle"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal detalle */}
      {detalle && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setDetalle(null)}>
          <div className="card max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-brand-gold">Detalle del cambio</h3>
              <button onClick={() => setDetalle(null)} className="p-1 hover:bg-brand-gray rounded">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <Campo label="Usuario" value={detalle.usuarioNombre} />
              <Campo label="Correo" value={detalle.usuarioEmail} />
              <Campo label="Acción" value={(detalle.accion || "").replace(/_/g, " ")} />
              <Campo label="Módulo" value={detalle.modulo} />
              <Campo label="Documento" value={detalle.documentId} />
              <Campo
                label="Fecha y hora"
                value={`${toDate(detalle.createdAt).toLocaleDateString("es-CL")} ${toDate(detalle.createdAt).toLocaleTimeString("es-CL")}`}
              />
            </div>

            {detalle.detalle && (
              <div className="mb-4">
                <div className="text-xs text-gray-400 mb-1">Resumen</div>
                <div className="text-sm">{detalle.detalle}</div>
              </div>
            )}
            {detalle.observaciones && (
              <div className="mb-4">
                <div className="text-xs text-gray-400 mb-1">Observaciones</div>
                <div className="text-sm">{detalle.observaciones}</div>
              </div>
            )}

            {/* Cambios antes/después */}
            {(() => {
              const cambios = diffCampos(detalle.beforeData, detalle.afterData);
              if (cambios.length === 0) {
                return (detalle.beforeData || detalle.afterData) ? (
                  <div className="grid grid-cols-2 gap-3">
                    <DatosBox titulo="Valor anterior" data={detalle.beforeData} />
                    <DatosBox titulo="Valor nuevo" data={detalle.afterData} />
                  </div>
                ) : null;
              }
              return (
                <div>
                  <div className="text-xs text-gray-400 mb-2">Campos modificados</div>
                  <table className="table text-xs">
                    <thead>
                      <tr><th>Campo</th><th>Antes</th><th>Nuevo</th></tr>
                    </thead>
                    <tbody>
                      {cambios.map((c) => (
                        <tr key={c.campo}>
                          <td className="font-medium">{c.campo}</td>
                          <td className="text-red-400 whitespace-pre-wrap break-all max-w-[180px]">{fmtVal(c.antes)}</td>
                          <td className="text-green-400 whitespace-pre-wrap break-all max-w-[180px]">{fmtVal(c.nuevo)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Campo({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="font-medium break-all">{value || "—"}</div>
    </div>
  );
}

function DatosBox({ titulo, data }: { titulo: string; data: any }) {
  return (
    <div>
      <div className="text-xs text-gray-400 mb-1">{titulo}</div>
      <pre className="bg-brand-dark/50 rounded p-2 text-xs overflow-x-auto max-h-60 whitespace-pre-wrap break-all">
        {data ? JSON.stringify(data, null, 2) : "—"}
      </pre>
    </div>
  );
}

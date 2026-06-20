"use client";
import { AppShell } from "@/components/layout/AppShell";
import { useState } from "react";
import { buildReport, ReportSummary } from "@/lib/services/reportService";
import { exportReportPDF, exportReportExcel } from "@/lib/utils/exporters";
import { formatCLP, startOfDay, endOfDay, startOfWeek, startOfMonth } from "@/lib/utils";
import toast from "react-hot-toast";
import { FileText, FileSpreadsheet } from "lucide-react";

export default function ReportesPage() {
  const [from, setFrom] = useState(startOfMonth().toISOString().slice(0, 10));
  const [to, setTo] = useState(endOfDay().toISOString().slice(0, 10));
  const [data, setData] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async (f: Date, t: Date) => {
    setLoading(true);
    try {
      const r = await buildReport(f, t);
      setData(r);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const runRange = () => run(startOfDay(new Date(from)), endOfDay(new Date(to)));

  return (
    <AppShell title="Reportes">
      <div className="card mb-4">
        <div className="flex flex-wrap gap-2 mb-3">
          <button className="btn-ghost" onClick={() => run(startOfDay(), endOfDay())}>Hoy</button>
          <button className="btn-ghost" onClick={() => run(startOfWeek(), endOfDay())}>Semana</button>
          <button className="btn-ghost" onClick={() => run(startOfMonth(), endOfDay())}>Mes</button>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="label">Desde</label>
            <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">Hasta</label>
            <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={runRange} disabled={loading}>
            {loading ? "Calculando…" : "Generar"}
          </button>
          {data && (
            <>
              <button className="btn-gold" onClick={() => exportReportPDF(data, new Date(from), new Date(to))}>
                <FileText size={16} /> PDF
              </button>
              <button className="btn-gold" onClick={() => exportReportExcel(data, new Date(from), new Date(to))}>
                <FileSpreadsheet size={16} /> Excel
              </button>
            </>
          )}
        </div>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
            <Stat label="Ventas" value={formatCLP(data.totalVentas)} />
            <Stat label="Pedidos" value={String(data.cantidadPedidos)} />
            <Stat label="Ticket prom." value={formatCLP(data.ticketPromedio)} />
            <Stat label="Métodos" value={Object.keys(data.porMetodoPago).length.toString()} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Section title="Métodos de pago" rows={Object.entries(data.porMetodoPago).map(([k, v]) => [k, formatCLP(v)])} />
            <Section title="Top productos" rows={data.topProductos.map((p) => [p.nombre, `${p.cantidad}`, formatCLP(p.total)])} />
            <Section title="Top promociones" rows={data.topPromociones.map((p) => [p.nombre, `${p.cantidad}`, formatCLP(p.total)])} />
            <Section title="Clientes frecuentes" rows={data.topClientes.map((c) => [c.nombre, `${c.pedidos} pedidos`, formatCLP(c.total)])} />
          </div>
        </>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="text-xs text-gray-400 uppercase truncate">{label}</div>
      <div className="text-lg sm:text-2xl font-bold text-brand-gold mt-1 truncate">{value}</div>
    </div>
  );
}

function Section({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-brand-gold mb-2">{title}</h3>
      {rows.length === 0 && <div className="text-sm text-gray-400">Sin datos</div>}
      {rows.map((r, i) => (
        <div key={i} className="flex justify-between py-1 text-sm border-b border-brand-gray">
          {r.map((c, j) => <span key={j} className={j === 0 ? "" : "text-brand-gold"}>{c}</span>)}
        </div>
      ))}
    </div>
  );
}

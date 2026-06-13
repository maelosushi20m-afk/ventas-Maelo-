"use client";
import { Order } from "@/types";
import { toDate, formatCLP, startOfDay } from "@/lib/utils";
import { useMemo } from "react";

export function SalesChart({ orders }: { orders: Order[] }) {
  const data = useMemo(() => {
    const days: { label: string; total: number }[] = [];
    const today = startOfDay();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("es-CL", { weekday: "short" });
      const total = orders
        .filter((o) => o.estado !== "Cancelado")
        .filter((o) => {
          const od = toDate(o.fecha);
          return od.toDateString() === d.toDateString();
        })
        .reduce((s, o) => s + (o.total || 0), 0);
      days.push({ label: key, total });
    }
    return days;
  }, [orders]);

  const max = Math.max(...data.map((d) => d.total), 1);
  const W = 600;
  const H = 200;
  const barW = W / data.length - 12;

  return (
    <div className="card">
      <h3 className="font-semibold text-brand-gold mb-3">Ventas últimos 7 días</h3>
      <svg viewBox={`0 0 ${W} ${H + 40}`} className="w-full">
        {data.map((d, i) => {
          const h = (d.total / max) * H;
          const x = i * (barW + 12) + 6;
          const y = H - h;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={h} fill="#D4AF37" rx="4" />
              <text x={x + barW / 2} y={H + 15} fill="#9CA3AF" fontSize="12" textAnchor="middle">{d.label}</text>
              <text x={x + barW / 2} y={H + 32} fill="#FAFAFA" fontSize="10" textAnchor="middle">{formatCLP(d.total)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

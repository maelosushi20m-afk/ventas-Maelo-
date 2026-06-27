"use client";
import { useEffect, useState } from "react";
import { useSync } from "@/stores/syncStore";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

function timeAgo(ts: number | null): string {
  if (!ts) return "—";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 10) return "ahora";
  if (s < 60) return `hace ${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  return `hace ${h} h`;
}

export function ConnectionIndicator() {
  const { init, state, pendingWrites, pendingOrders, lastSync } = useSync();
  const [, tick] = useState(0);

  useEffect(() => {
    init();
    // Refresca el texto "última sync" cada 15s sin tocar Firestore.
    const t = setInterval(() => tick((n) => n + 1), 15_000);
    return () => clearInterval(t);
  }, [init]);

  const st = state();
  const pendientes = pendingWrites + pendingOrders;

  const conf = {
    online: { dot: "bg-green-500", label: "En línea", icon: Wifi, cls: "text-green-400 border-green-500/30 bg-green-500/10" },
    syncing: { dot: "bg-amber-500 animate-pulse", label: "Sincronizando", icon: RefreshCw, cls: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
    offline: { dot: "bg-red-500", label: "Sin conexión", icon: WifiOff, cls: "text-red-400 border-red-500/30 bg-red-500/10" },
  }[st];

  const Icon = conf.icon;

  return (
    <div
      className={`group relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${conf.cls}`}
      title={`${conf.label}${pendientes ? ` · ${pendientes} pendiente(s)` : ""}`}
    >
      <span className={`w-2 h-2 rounded-full ${conf.dot}`} />
      <Icon size={14} className={st === "syncing" ? "animate-spin" : ""} />
      <span className="hidden sm:inline">{conf.label}</span>
      {pendientes > 0 && (
        <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-black/30 text-[10px] font-bold">
          {pendientes}
        </span>
      )}

      {/* Tooltip de detalle */}
      <div className="absolute right-0 top-full mt-2 w-56 p-3 rounded-lg border border-brand-gray bg-brand-dark shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-50 text-left">
        <div className="flex items-center gap-2 mb-2">
          <span className={`w-2 h-2 rounded-full ${conf.dot}`} />
          <span className="font-semibold text-brand-white">{conf.label}</span>
        </div>
        <div className="space-y-1 text-gray-400 text-[11px]">
          <div className="flex justify-between"><span>Operaciones pendientes</span><span className="text-brand-white">{pendientes}</span></div>
          <div className="flex justify-between"><span>Pedidos sin Nº</span><span className="text-brand-white">{pendingOrders}</span></div>
          <div className="flex justify-between"><span>Última sincronización</span><span className="text-brand-white">{timeAgo(lastSync)}</span></div>
        </div>
        {st === "offline" && (
          <p className="mt-2 text-[11px] text-amber-400">
            Trabajando sin conexión. Todo se guarda localmente y se sincroniza al volver Internet.
          </p>
        )}
      </div>
    </div>
  );
}

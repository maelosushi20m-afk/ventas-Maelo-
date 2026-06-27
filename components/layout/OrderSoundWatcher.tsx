"use client";
import { useEffect, useRef } from "react";
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import toast from "react-hot-toast";
import { useSound } from "@/stores/soundStore";

/**
 * Vigilante GLOBAL de pedidos nuevos. Montado una sola vez en AppShell,
 * suena en cualquier pantalla mientras la app esté abierta.
 *
 * Reglas:
 * - Voz "Nuevo pedido" + toast UNA vez por cada pedido nuevo.
 * - Nunca se repite mientras el pedido siga pendiente (dedupe por id).
 * - Varios pedidos nuevos → una notificación por cada uno.
 * - Primera carga (snapshot inicial) no dispara nada.
 * - Sincronización entre pestañas/dispositivos: cada cliente reacciona a
 *   docChanges de Firestore; el localStorage de IDs ya vistos evita
 *   re-sonidos al recargar la misma pestaña.
 */

const SEEN_KEY = "maelo-pedidos-vistos";
const MAX_SEEN = 300;

function loadSeen(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}
function saveSeen(set: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    const arr = Array.from(set).slice(-MAX_SEEN);
    localStorage.setItem(SEEN_KEY, JSON.stringify(arr));
  } catch {
    /* cuota llena: ignorar */
  }
}

export function OrderSoundWatcher() {
  const play = useSound((s) => s.play);
  const seen = useRef<Set<string>>(loadSeen());
  const firstSnapshot = useRef(true);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("fecha", "desc"), limit(30));

    const unsub = onSnapshot(
      q,
      (snap) => {
        // Snapshot inicial: registrar IDs existentes sin notificar.
        if (firstSnapshot.current) {
          snap.docs.forEach((d) => seen.current.add(d.id));
          saveSeen(seen.current);
          firstSnapshot.current = false;
          return;
        }

        const nuevos = snap
          .docChanges()
          .filter((c) => c.type === "added")
          .map((c) => ({ id: c.doc.id, data: c.doc.data() as any }))
          .filter((o) => o.data?.deleted !== true)
          .filter((o) => !seen.current.has(o.id));

        if (nuevos.length === 0) return;

        nuevos.forEach((o) => {
          seen.current.add(o.id);
          play(); // una voz por pedido
          toast.success("Nuevo pedido recibido", { icon: "🍣", id: `np-${o.id}` });
        });
        saveSeen(seen.current);
      },
      (err) => console.error("[OrderSoundWatcher]", err)
    );

    return () => unsub();
  }, [play]);

  return null;
}

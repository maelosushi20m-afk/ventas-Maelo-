import { create } from "zustand";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { reconcileOrderNumbers } from "@/lib/services/orderService";

export type ConnState = "online" | "syncing" | "offline";

interface SyncStore {
  online: boolean;
  /** Escrituras locales aún no confirmadas por el servidor. */
  pendingWrites: number;
  /** Pedidos creados offline sin número correlativo definitivo. */
  pendingOrders: number;
  lastSync: number | null;
  started: boolean;
  /** Estado derivado para el indicador. */
  state: () => ConnState;
  init: () => void;
}

let unsubs: Array<() => void> = [];

export const useSync = create<SyncStore>()((set, get) => ({
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  pendingWrites: 0,
  pendingOrders: 0,
  lastSync: null,
  started: false,

  state: () => {
    const s = get();
    if (!s.online) return "offline";
    if (s.pendingWrites > 0 || s.pendingOrders > 0) return "syncing";
    return "online";
  },

  init: () => {
    if (get().started || typeof window === "undefined") return;
    set({ started: true });

    const goOnline = async () => {
      set({ online: true });
      try {
        await reconcileOrderNumbers(); // asigna correlativos a pedidos offline
        set({ lastSync: Date.now() });
      } catch {
        /* se reintenta en la próxima reconexión */
      }
    };
    const goOffline = () => set({ online: false });

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    // Conteo de escrituras pendientes por colección (no se pisan entre sí).
    const counts: Record<string, number> = {};
    const sumPending = () => Object.values(counts).reduce((a, b) => a + b, 0);

    // Observa colecciones críticas y cuenta documentos con hasPendingWrites
    // (escrituras locales aún sin confirmar en el servidor).
    const watch = (name: string, pendingNumberFilter = false) => {
      const ref = pendingNumberFilter
        ? query(collection(db, name), where("pendienteNumero", "==", true))
        : collection(db, name);
      return onSnapshot(
        ref,
        { includeMetadataChanges: true },
        (snap) => {
          if (pendingNumberFilter) {
            set({ pendingOrders: snap.size });
          } else {
            counts[name] = snap.docs.filter((d) => d.metadata.hasPendingWrites).length;
            set({ pendingWrites: sumPending() });
          }
          if (!snap.metadata.fromCache) set({ lastSync: Date.now() });
        },
        () => {/* errores de permiso/red: ignorar; el indicador sigue por navigator.onLine */}
      );
    };

    // Solo las colecciones que se escriben durante una venta offline,
    // para no inflar lecturas (pediste bajo consumo de recursos).
    unsubs = [
      watch("orders"),
      watch("customers"),
      watch("inventory"),
      watch("inventoryMovements"),
      watch("orders", true), // pedidos offline pendientes de número
    ];

    // Reconciliación inicial por si arrancamos ya online con pendientes previos.
    if (get().online) void goOnline();
  },
}));

export function stopSync() {
  unsubs.forEach((u) => u());
  unsubs = [];
}

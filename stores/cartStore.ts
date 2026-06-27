import { create } from "zustand";
import { persist } from "zustand/middleware";
import { OrderItem, PaymentMethod } from "@/types";

interface CartState {
  items: OrderItem[];
  clienteNombre: string;
  telefono: string;
  direccion: string;
  observaciones: string;
  metodoPago: PaymentMethod;
  set: (patch: Partial<CartState>) => void;
  addItem: (it: OrderItem) => void;
  changeQty: (index: number, delta: number) => void;
  setQty: (index: number, cantidad: number) => void;
  removeItem: (index: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
}

const initial = {
  items: [] as OrderItem[],
  clienteNombre: "",
  telefono: "",
  direccion: "",
  observaciones: "",
  metodoPago: "Efectivo" as PaymentMethod
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      ...initial,
      set: (patch) => set(patch),
      addItem: (it) => set((s) => {
        const idx = s.items.findIndex((x) => x.refId === it.refId && x.tipo === it.tipo);
        if (idx >= 0) {
          const c = [...s.items];
          c[idx] = { ...c[idx], cantidad: c[idx].cantidad + 1, subtotal: (c[idx].cantidad + 1) * c[idx].precio };
          return { items: c };
        }
        return { items: [...s.items, it] };
      }),
      changeQty: (i, delta) => set((s) => {
        const c = [...s.items];
        const nuevo = c[i].cantidad + delta;
        if (nuevo <= 0) return { items: c.filter((_, idx) => idx !== i) };
        c[i] = { ...c[i], cantidad: nuevo, subtotal: nuevo * c[i].precio };
        return { items: c };
      }),
      setQty: (i, cantidad) => set((s) => {
        const c = [...s.items];
        if (!c[i]) return {};
        if (cantidad <= 0) return { items: c.filter((_, idx) => idx !== i) };
        c[i] = { ...c[i], cantidad, subtotal: cantidad * c[i].precio };
        return { items: c };
      }),
      removeItem: (i) => set((s) => ({ items: s.items.filter((_, idx) => idx !== i) })),
      clear: () => set(initial),
      total: () => get().items.reduce((s, x) => s + x.subtotal, 0),
      count: () => get().items.reduce((s, x) => s + x.cantidad, 0)
    }),
    { name: "maelo-cart" }
  )
);

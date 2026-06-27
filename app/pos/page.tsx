"use client";
import { AppShell } from "@/components/layout/AppShell";
import { useQuery } from "@tanstack/react-query";
import { listProducts } from "@/lib/services/productService";
import { listPromotions } from "@/lib/services/promotionService";
import { createOrder } from "@/lib/services/orderService";
import { listCustomers } from "@/lib/services/customerService";
import { Customer, PAYMENT_METHODS, PaymentMethod, PRODUCT_CATEGORIES } from "@/types";
import { useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { formatCLP } from "@/lib/utils";
import { useAuth } from "@/lib/firebase/auth-context";
import { useCart } from "@/stores/cartStore";
import { Trash2, Plus, Minus, UserCheck } from "lucide-react";

export default function POSPage() {
  const { appUser } = useAuth();
  const { data: products = [] } = useQuery({ queryKey: ["products", "active"], queryFn: () => listProducts(true) });
  const { data: promos = [] } = useQuery({ queryKey: ["promotions", "active"], queryFn: () => listPromotions(true) });
  const { data: customers = [] } = useQuery({ queryKey: ["customers"], queryFn: listCustomers });

  // Carrito unificado (Zustand persistente): sobrevive a recargas.
  const {
    items, clienteNombre, telefono, direccion, observaciones, metodoPago,
    addItem, changeQty, setQty, removeItem, clear, set: setCart, total,
  } = useCart();

  const [cat, setCat] = useState<string>("Promociones");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const [clienteQuery, setClienteQuery] = useState(clienteNombre);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const clienteRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const q = clienteQuery.toLowerCase().trim();
    if (!q || q.length < 2) return [];
    return (customers as Customer[]).filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        (c.telefono || "").includes(q)
    ).slice(0, 6);
  }, [clienteQuery, customers]);

  const selectCliente = (c: Customer) => {
    setCart({ clienteNombre: c.nombre, telefono: c.telefono || "", direccion: c.direccion || "" });
    setClienteQuery(c.nombre);
    setShowSuggestions(false);
  };

  const visible = useMemo(() => {
    const term = search.toLowerCase();
    if (cat === "Promociones") {
      return promos.filter((p) => p.nombre.toLowerCase().includes(term));
    }
    return products.filter((p) => p.categoria === cat && p.nombre.toLowerCase().includes(term));
  }, [cat, search, products, promos]);

  const addProduct = (p: any, tipo: "product" | "promotion") => {
    const precio = tipo === "promotion" ? p.precio : (p.precioOferta && p.precioOferta > 0 ? p.precioOferta : p.precioNormal);
    addItem({ tipo, refId: p.id, nombre: p.nombre, cantidad: 1, precio, subtotal: precio });
  };

  const totalValue = total();

  const save = async () => {
    if (items.length === 0) return toast.error("Agrega productos");
    if (!clienteNombre.trim()) return toast.error("Nombre cliente requerido");
    if (totalValue <= 0) return toast.error("Total inválido");
    setSaving(true);
    try {
      const r = await createOrder({
        clienteNombre, telefono, direccion, observaciones,
        items, total: totalValue, metodoPago,
        vendedorId: appUser?.uid, vendedorNombre: appUser?.name
      }, appUser ? { uid: appUser.uid, email: appUser.email, name: appUser.name } : undefined);
      toast.success(`Pedido #${r.numeroPedido} creado`);
      clear();
      setClienteQuery("");
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <AppShell title="Nuevo pedido">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 card order-1 lg:order-none">
          <div className="flex gap-2 flex-wrap mb-3">
            {["Promociones", ...PRODUCT_CATEGORIES.filter((c) => c !== "Promociones")].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm transition ${cat === c ? "bg-brand-red text-white" : "border border-brand-gray text-gray-300 hover:border-brand-gold"}`}
              >{c}</button>
            ))}
          </div>
          <input className="input mb-3" placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {visible.map((p: any) => {
              const tipo = cat === "Promociones" ? "promotion" : "product";
              const precio = tipo === "promotion" ? p.precio : (p.precioOferta && p.precioOferta > 0 ? p.precioOferta : p.precioNormal);
              return (
                <button
                  key={p.id}
                  onClick={() => addProduct(p, tipo as any)}
                  className="card text-left hover:border-brand-gold active:scale-[0.98] transition"
                >
                  <div className="font-semibold text-sm">{p.nombre}</div>
                  <div className="text-xs text-gray-400">{p.categoria || (p.piezas ? `${p.piezas} pz` : "")}</div>
                  <div className="text-brand-gold font-bold mt-1">{formatCLP(precio)}</div>
                </button>
              );
            })}
            {visible.length === 0 && <div className="col-span-full text-sm text-gray-400">Sin resultados</div>}
          </div>
        </div>

        <div className="card flex flex-col order-first lg:order-none">
          <h3 className="font-semibold text-brand-gold mb-3">Pedido</h3>
          <div className="space-y-3 mb-3">
            {/* Buscador de cliente */}
            <div className="relative" ref={clienteRef}>
              <input
                className="input"
                placeholder="Buscar cliente por nombre o teléfono…"
                value={clienteQuery}
                onChange={(e) => {
                  setClienteQuery(e.target.value);
                  setCart({ clienteNombre: e.target.value });
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-brand-dark border border-brand-gray rounded-lg shadow-lg overflow-hidden">
                  {suggestions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={() => selectCliente(c)}
                      className="w-full text-left px-3 py-2 hover:bg-brand-gray flex items-center gap-2 border-b border-brand-gray last:border-0"
                    >
                      <UserCheck size={14} className="text-brand-gold shrink-0" />
                      <div>
                        <div className="text-sm font-medium">{c.nombre}</div>
                        <div className="text-xs text-gray-400">{c.telefono} · {c.cantidadPedidos} pedidos</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input className="input" placeholder="Teléfono" value={telefono} onChange={(e) => setCart({ telefono: e.target.value })} />
            <input className="input" placeholder="Dirección" value={direccion} onChange={(e) => setCart({ direccion: e.target.value })} />
            <textarea className="input" rows={2} placeholder="Observaciones" value={observaciones} onChange={(e) => setCart({ observaciones: e.target.value })} />
            <select className="input" value={metodoPago} onChange={(e) => setCart({ metodoPago: e.target.value as PaymentMethod })}>
              {PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>

          <div className="flex-1 overflow-auto border-t border-brand-gray pt-3">
            {items.length === 0 && <div className="text-sm text-gray-400">Sin productos</div>}
            {items.map((it, i) => (
              <div key={`${it.tipo}-${it.refId}`} className="flex items-center justify-between py-2 border-b border-brand-gray text-sm">
                <div className="flex-1 min-w-0">
                  <div className="truncate">{it.nombre}</div>
                  <div className="text-xs text-gray-400">{formatCLP(it.precio)} c/u · {formatCLP(it.subtotal)}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => changeQty(i, -1)} className="p-1.5 border border-brand-gray rounded active:scale-90 transition" aria-label="Restar"><Minus size={12} /></button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={it.cantidad}
                    onChange={(e) => setQty(i, parseInt(e.target.value, 10) || 0)}
                    className="w-10 text-center bg-brand-black border border-brand-gray rounded py-1"
                    aria-label="Cantidad"
                  />
                  <button onClick={() => changeQty(i, 1)} className="p-1.5 border border-brand-gray rounded active:scale-90 transition" aria-label="Sumar"><Plus size={12} /></button>
                  <button onClick={() => removeItem(i)} className="p-1.5 hover:text-brand-red ml-1 transition" aria-label="Quitar"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-brand-gray pt-3 mt-3">
            <div className="flex justify-between text-lg font-bold mb-3">
              <span>Total</span>
              <span className="text-brand-gold">{formatCLP(totalValue)}</span>
            </div>
            <button className="btn-primary w-full" disabled={saving} onClick={save}>
              {saving ? "Guardando…" : "Crear pedido"}
            </button>
            {items.length > 0 && (
              <button className="btn-ghost w-full mt-2 text-xs" onClick={() => { clear(); setClienteQuery(""); }}>
                Vaciar pedido
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

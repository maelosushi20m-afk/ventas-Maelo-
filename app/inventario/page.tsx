"use client";
import { AppShell } from "@/components/layout/AppShell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listInventory,
  listMovements,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  registrarMovimiento,
  getStockStatus,
  StockStatus
} from "@/lib/services/inventoryService";
import {
  InventoryItem,
  InventoryMovement,
  INVENTORY_CATEGORIES,
  INVENTORY_UNITS,
  InventoryUnit,
  MovementType
} from "@/types";
import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/firebase/auth-context";
import {
  Plus, Pencil, Trash2, ArrowDownCircle, ArrowUpCircle,
  SlidersHorizontal, AlertTriangle, AlertOctagon, CheckCircle,
  ClipboardList, X, Search, PackageOpen
} from "lucide-react";

// ── helpers ─────────────────────────────────────────────────────
const statusColor: Record<StockStatus, string> = {
  ok: "bg-green-800 text-green-200",
  bajo: "bg-yellow-700 text-yellow-100",
  critico: "bg-red-800 text-red-100"
};
const statusLabel: Record<StockStatus, string> = {
  ok: "OK",
  bajo: "Stock bajo",
  critico: "Crítico"
};
const StatusIcon = ({ s }: { s: StockStatus }) =>
  s === "ok" ? <CheckCircle size={14} /> :
  s === "bajo" ? <AlertTriangle size={14} /> :
  <AlertOctagon size={14} />;

const emptyItem = {
  nombre: "",
  categoria: INVENTORY_CATEGORIES[0],
  unidad: "unidad" as InventoryUnit,
  stockActual: 0,
  stockMinimo: 5,
  stockSeguridad: 2,
  precioUnitario: undefined as number | undefined,
  proveedor: "",
  descripcion: "",
  activo: true
};

type Tab = "inventario" | "historial";
type ModalType = "item" | "entrada" | "salida" | "ajuste" | null;

export default function InventarioPage() {
  const { appUser } = useAuth();
  const qc = useQueryClient();

  const { data: items = [] } = useQuery({ queryKey: ["inventory"], queryFn: () => listInventory() });
  const { data: movements = [] } = useQuery({ queryKey: ["inventory", "movements"], queryFn: () => listMovements(undefined, 100) });

  const [tab, setTab] = useState<Tab>("inventario");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterStatus, setFilterStatus] = useState<StockStatus | "">("");

  const [modal, setModal] = useState<ModalType>(null);
  const [selected, setSelected] = useState<InventoryItem | null>(null);

  // form item
  const [form, setForm] = useState<any>(emptyItem);
  const [savingItem, setSavingItem] = useState(false);

  // form movimiento
  const [movCantidad, setMovCantidad] = useState<number>(0);
  const [movMotivo, setMovMotivo] = useState("");
  const [savingMov, setSavingMov] = useState(false);

  // ── filtros ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return (items as InventoryItem[]).filter((i) => {
      const s = getStockStatus(i);
      const q = search.toLowerCase();
      return (
        (!q || i.nombre.toLowerCase().includes(q) || (i.proveedor || "").toLowerCase().includes(q)) &&
        (!filterCat || i.categoria === filterCat) &&
        (!filterStatus || s === filterStatus)
      );
    });
  }, [items, search, filterCat, filterStatus]);

  const alertas = useMemo(() =>
    (items as InventoryItem[]).filter((i) => getStockStatus(i) !== "ok"),
    [items]
  );

  // ── acciones item ────────────────────────────────────────────
  const openNew = () => { setForm(emptyItem); setSelected(null); setModal("item"); };
  const openEdit = (item: InventoryItem) => {
    setSelected(item);
    setForm({
      nombre: item.nombre,
      categoria: item.categoria,
      unidad: item.unidad,
      stockActual: item.stockActual,
      stockMinimo: item.stockMinimo,
      stockSeguridad: item.stockSeguridad,
      precioUnitario: item.precioUnitario,
      proveedor: item.proveedor || "",
      descripcion: item.descripcion || "",
      activo: item.activo
    });
    setModal("item");
  };

  const saveItem = async () => {
    if (!form.nombre.trim()) return toast.error("Nombre requerido");
    if (form.stockSeguridad > form.stockMinimo) return toast.error("Stock seguridad debe ser ≤ stock mínimo");
    setSavingItem(true);
    try {
      if (selected) {
        await updateInventoryItem(selected.id, form);
        toast.success("Actualizado");
      } else {
        await createInventoryItem(form);
        toast.success("Producto creado");
      }
      qc.invalidateQueries({ queryKey: ["inventory"] });
      setModal(null);
    } catch (e: any) { toast.error(e.message); }
    finally { setSavingItem(false); }
  };

  const removeItem = async (id: string) => {
    if (!confirm("¿Eliminar este producto del inventario?")) return;
    await deleteInventoryItem(id);
    toast.success("Eliminado");
    qc.invalidateQueries({ queryKey: ["inventory"] });
  };

  // ── acciones movimiento ──────────────────────────────────────
  const openMov = (item: InventoryItem, tipo: "entrada" | "salida" | "ajuste") => {
    setSelected(item);
    setMovCantidad(tipo === "ajuste" ? item.stockActual : 0);
    setMovMotivo("");
    setModal(tipo);
  };

  const saveMov = async () => {
    if (!selected) return;
    if (movCantidad < 0) return toast.error("Cantidad inválida");
    if (modal !== "ajuste" && movCantidad === 0) return toast.error("Ingresa una cantidad");
    setSavingMov(true);
    try {
      const { stockResultante } = await registrarMovimiento({
        itemId: selected.id,
        tipo: modal as MovementType,
        cantidad: movCantidad,
        motivo: movMotivo,
        usuarioId: appUser?.uid,
        usuarioNombre: appUser?.name
      });
      toast.success(`Stock actualizado → ${stockResultante} ${selected.unidad}`);
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["inventory", "movements"] });
      setModal(null);
    } catch (e: any) { toast.error(e.message); }
    finally { setSavingMov(false); }
  };

  const movTitle: Record<string, string> = {
    entrada: "Agregar stock",
    salida: "Rebajar stock",
    ajuste: "Ajuste de inventario"
  };
  const movIcon: Record<string, JSX.Element> = {
    entrada: <ArrowDownCircle size={18} className="text-green-400" />,
    salida: <ArrowUpCircle size={18} className="text-red-400" />,
    ajuste: <SlidersHorizontal size={18} className="text-yellow-400" />
  };

  return (
    <AppShell title="Inventario" roles={["admin"]}>

      {/* ── alertas banner ── */}
      {alertas.length > 0 && (
        <div className="mb-4 p-3 rounded-lg border border-red-700 bg-red-950 flex items-center gap-3 flex-wrap">
          <AlertOctagon size={18} className="text-red-400 shrink-0" />
          <span className="text-sm text-red-300 font-medium">
            {alertas.filter(i => getStockStatus(i) === "critico").length} crítico(s) ·{" "}
            {alertas.filter(i => getStockStatus(i) === "bajo").length} bajo(s):{" "}
            {alertas.map(i => i.nombre).join(", ")}
          </span>
        </div>
      )}

      {/* ── tabs ── */}
      <div className="flex gap-2 mb-4">
        {(["inventario", "historial"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
              tab === t ? "bg-brand-red text-white" : "border border-brand-gray text-gray-300"
            }`}
          >
            {t === "inventario" ? <span className="flex items-center gap-1"><PackageOpen size={15} /> Inventario</span>
              : <span className="flex items-center gap-1"><ClipboardList size={15} /> Historial</span>}
          </button>
        ))}
        <button onClick={openNew} className="ml-auto btn-primary text-sm">
          <Plus size={16} /> Nuevo producto
        </button>
      </div>

      {/* ══ TAB INVENTARIO ══════════════════════════════════════ */}
      {tab === "inventario" && (
        <>
          {/* filtros */}
          <div className="card mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="flex items-center gap-2">
              <Search size={16} className="text-gray-400 shrink-0" />
              <input className="input" placeholder="Buscar nombre o proveedor…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="">Todas las categorías</option>
              {INVENTORY_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
              <option value="">Todos los estados</option>
              <option value="ok">OK</option>
              <option value="bajo">Stock bajo</option>
              <option value="critico">Crítico</option>
            </select>
          </div>

          {/* tabla */}
          <div className="card overflow-x-auto">
            <table className="table min-w-[700px]">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th className="text-center">Stock actual</th>
                  <th className="text-center">Mín.</th>
                  <th className="text-center">Seg.</th>
                  <th>Unidad</th>
                  <th>Proveedor</th>
                  <th className="text-center">Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item: InventoryItem) => {
                  const s = getStockStatus(item);
                  return (
                    <tr key={item.id} className={!item.activo ? "opacity-50" : ""}>
                      <td className="font-medium">{item.nombre}</td>
                      <td className="text-xs text-gray-400">{item.categoria}</td>
                      <td className="text-center font-bold text-brand-gold">{item.stockActual}</td>
                      <td className="text-center text-gray-400">{item.stockMinimo}</td>
                      <td className="text-center text-gray-400">{item.stockSeguridad}</td>
                      <td className="text-xs text-gray-400">{item.unidad}</td>
                      <td className="text-xs text-gray-400">{item.proveedor || "—"}</td>
                      <td className="text-center">
                        <span className={`badge flex items-center gap-1 justify-center w-fit mx-auto ${statusColor[s]}`}>
                          <StatusIcon s={s} /> {statusLabel[s]}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 justify-end">
                          <button title="Agregar stock" onClick={() => openMov(item, "entrada")}
                            className="p-1.5 hover:text-green-400 transition"><ArrowDownCircle size={16} /></button>
                          <button title="Rebajar stock" onClick={() => openMov(item, "salida")}
                            className="p-1.5 hover:text-red-400 transition"><ArrowUpCircle size={16} /></button>
                          <button title="Ajuste" onClick={() => openMov(item, "ajuste")}
                            className="p-1.5 hover:text-yellow-400 transition"><SlidersHorizontal size={16} /></button>
                          <button title="Editar" onClick={() => openEdit(item)}
                            className="p-1.5 hover:text-brand-gold transition"><Pencil size={16} /></button>
                          <button title="Eliminar" onClick={() => removeItem(item.id)}
                            className="p-1.5 hover:text-brand-red transition"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="text-center text-gray-400 py-8">Sin resultados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ══ TAB HISTORIAL ═══════════════════════════════════════ */}
      {tab === "historial" && (
        <div className="card overflow-x-auto">
          <table className="table min-w-[600px]">
            <thead>
              <tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th className="text-center">Cantidad</th><th className="text-center">Anterior</th><th className="text-center">Resultante</th><th>Motivo</th><th>Usuario</th></tr>
            </thead>
            <tbody>
              {(movements as InventoryMovement[]).map((m) => (
                <tr key={m.id}>
                  <td className="text-xs text-gray-400 whitespace-nowrap">
                    {m.createdAt && typeof (m.createdAt as any).toDate === "function"
                      ? (m.createdAt as any).toDate().toLocaleString("es-CL")
                      : new Date(m.createdAt as any).toLocaleString("es-CL")}
                  </td>
                  <td className="font-medium">{m.itemNombre}</td>
                  <td>
                    <span className={`badge text-xs ${
                      m.tipo === "entrada" ? "bg-green-800 text-green-200" :
                      m.tipo === "salida" ? "bg-red-800 text-red-200" :
                      "bg-yellow-700 text-yellow-100"
                    }`}>
                      {m.tipo === "entrada" ? "▼ Entrada" : m.tipo === "salida" ? "▲ Salida" : "⇄ Ajuste"}
                    </span>
                  </td>
                  <td className="text-center font-bold">{m.cantidad}</td>
                  <td className="text-center text-gray-400">{m.stockAnterior}</td>
                  <td className="text-center text-brand-gold font-bold">{m.stockResultante}</td>
                  <td className="text-xs text-gray-400">{m.motivo || "—"}</td>
                  <td className="text-xs text-gray-400">{m.usuarioNombre || "—"}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr><td colSpan={8} className="text-center text-gray-400 py-8">Sin movimientos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ══ MODAL: CREAR / EDITAR ITEM ══════════════════════════ */}
      {modal === "item" && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setModal(null)}>
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-gold">
                {selected ? "Editar producto" : "Nuevo producto"}
              </h3>
              <button onClick={() => setModal(null)}><X size={20} /></button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label">Nombre *</label>
                  <input className="input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Salmón fresco" />
                </div>
                <div>
                  <label className="label">Categoría</label>
                  <select className="input" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                    {INVENTORY_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Unidad</label>
                  <select className="input" value={form.unidad} onChange={e => setForm({ ...form, unidad: e.target.value })}>
                    {INVENTORY_UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="border border-brand-gray rounded-lg p-3 space-y-3">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Niveles de stock</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label">Stock actual</label>
                    <input type="number" min="0" className="input" value={form.stockActual}
                      onChange={e => setForm({ ...form, stockActual: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="label flex items-center gap-1">
                      <AlertTriangle size={12} className="text-yellow-400" /> Mínimo
                    </label>
                    <input type="number" min="0" className="input" value={form.stockMinimo}
                      onChange={e => setForm({ ...form, stockMinimo: Number(e.target.value) })} />
                    <p className="text-xs text-gray-500 mt-1">Alerta amarilla</p>
                  </div>
                  <div>
                    <label className="label flex items-center gap-1">
                      <AlertOctagon size={12} className="text-red-400" /> Seguridad
                    </label>
                    <input type="number" min="0" className="input" value={form.stockSeguridad}
                      onChange={e => setForm({ ...form, stockSeguridad: Number(e.target.value) })} />
                    <p className="text-xs text-gray-500 mt-1">Alerta roja</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Precio unitario (costo)</label>
                  <input type="number" min="0" className="input" value={form.precioUnitario ?? ""}
                    onChange={e => setForm({ ...form, precioUnitario: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Opcional" />
                </div>
                <div>
                  <label className="label">Proveedor</label>
                  <input className="input" value={form.proveedor} onChange={e => setForm({ ...form, proveedor: e.target.value })} placeholder="Opcional" />
                </div>
              </div>

              <div>
                <label className="label">Descripción</label>
                <textarea className="input" rows={2} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Opcional" />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} />
                Activo
              </label>
            </div>

            <div className="flex gap-2 mt-5">
              <button className="btn-primary flex-1" disabled={savingItem} onClick={saveItem}>
                <Plus size={16} /> {savingItem ? "Guardando…" : selected ? "Actualizar" : "Crear"}
              </button>
              <button className="btn-ghost flex-1" onClick={() => setModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: MOVIMIENTO ═══════════════════════════════════ */}
      {modal && modal !== "item" && selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" onClick={() => setModal(null)}>
          <div className="card w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-brand-gold flex items-center gap-2">
                {movIcon[modal]} {movTitle[modal]}
              </h3>
              <button onClick={() => setModal(null)}><X size={20} /></button>
            </div>

            <div className="bg-brand-gray rounded-lg p-3 mb-4 text-sm space-y-1">
              <div className="font-semibold">{selected.nombre}</div>
              <div className="text-gray-400">
                Stock actual: <span className="text-brand-gold font-bold">{selected.stockActual} {selected.unidad}</span>
              </div>
              <div className="text-gray-400 text-xs">
                Mínimo: {selected.stockMinimo} · Seguridad: {selected.stockSeguridad}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">
                  {modal === "ajuste" ? "Nuevo stock (cantidad absoluta)" :
                   modal === "entrada" ? "Cantidad a ingresar" : "Cantidad a rebajar"}
                </label>
                <input
                  type="number"
                  min="0"
                  className="input text-xl font-bold text-center"
                  value={movCantidad}
                  onChange={e => setMovCantidad(Number(e.target.value))}
                  autoFocus
                />
                {modal !== "ajuste" && (
                  <p className="text-xs text-gray-400 mt-1 text-center">
                    Resultado: {modal === "entrada"
                      ? selected.stockActual + movCantidad
                      : selected.stockActual - movCantidad} {selected.unidad}
                  </p>
                )}
              </div>
              <div>
                <label className="label">Motivo (opcional)</label>
                <input className="input" placeholder="Ej: Compra proveedor, merma, corrección…"
                  value={movMotivo} onChange={e => setMovMotivo(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button className="btn-primary flex-1" disabled={savingMov} onClick={saveMov}>
                {savingMov ? "Guardando…" : "Confirmar"}
              </button>
              <button className="btn-ghost flex-1" onClick={() => setModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

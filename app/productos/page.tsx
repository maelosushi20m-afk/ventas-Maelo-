"use client";
import { AppShell } from "@/components/layout/AppShell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct
} from "@/lib/services/productService";
import { PRODUCT_CATEGORIES, Product, ProductCategory } from "@/types";
import { useState } from "react";
import toast from "react-hot-toast";
import { formatCLP } from "@/lib/utils";
import { Pencil, Trash2, Plus } from "lucide-react";

const empty = {
  nombre: "",
  categoria: "Rolls" as ProductCategory,
  precioNormal: 0,
  precioOferta: undefined as number | undefined,
  descripcion: "",
  activo: true
};

export default function ProductosPage() {
  const qc = useQueryClient();
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: () => listProducts() });
  const [form, setForm] = useState<any>(empty);
  const [editing, setEditing] = useState<string | null>(null);

  const save = async () => {
    if (!form.nombre || !form.precioNormal) return toast.error("Nombre y precio requeridos");
    try {
      if (editing) {
        await updateProduct(editing, form);
        toast.success("Actualizado");
      } else {
        await createProduct(form);
        toast.success("Creado");
      }
      setForm(empty);
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products", "active"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const edit = (p: Product) => {
    setEditing(p.id);
    setForm({
      nombre: p.nombre,
      categoria: p.categoria,
      precioNormal: p.precioNormal,
      precioOferta: p.precioOferta,
      descripcion: p.descripcion || "",
      activo: p.activo
    });
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar?")) return;
    await deleteProduct(id);
    toast.success("Eliminado");
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["products", "active"] });
  };

  return (
    <AppShell title="Productos" roles={["admin"]}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1">
          <h3 className="font-semibold text-brand-gold mb-3">
            {editing ? "Editar producto" : "Nuevo producto"}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="label">Nombre</label>
              <input className="input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div>
              <label className="label">Categoría</label>
              <select
                className="input"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              >
                {PRODUCT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Precio normal</label>
                <input type="number" className="input" value={form.precioNormal}
                  onChange={(e) => setForm({ ...form, precioNormal: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Precio oferta</label>
                <input type="number" className="input" value={form.precioOferta ?? ""}
                  onChange={(e) => setForm({ ...form, precioOferta: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
            </div>
            <div>
              <label className="label">Descripción</label>
              <textarea className="input" rows={3} value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
              Activo
            </label>
            <button className="btn-primary w-full" onClick={save}>
              <Plus size={16} /> {editing ? "Actualizar" : "Crear"}
            </button>
            {editing && (
              <button className="btn-ghost w-full" onClick={() => { setEditing(null); setForm(empty); }}>
                Cancelar
              </button>
            )}
          </div>
        </div>

        <div className="card lg:col-span-2">
          <h3 className="font-semibold text-brand-gold mb-3">Listado</h3>
          <table className="table">
            <thead>
              <tr><th>Nombre</th><th>Categoría</th><th>Normal</th><th>Oferta</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.nombre}</td>
                  <td>{p.categoria}</td>
                  <td>{formatCLP(p.precioNormal)}</td>
                  <td>{p.precioOferta ? formatCLP(p.precioOferta) : "—"}</td>
                  <td>
                    <span className={`badge ${p.activo ? "bg-green-800" : "bg-brand-gray"}`}>
                      {p.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="text-right">
                    <button className="p-1 hover:text-brand-gold" onClick={() => edit(p)}><Pencil size={16} /></button>
                    <button className="p-1 hover:text-brand-red" onClick={() => remove(p.id)}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

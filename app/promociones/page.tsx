"use client";
import { AppShell } from "@/components/layout/AppShell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPromotion,
  deletePromotion,
  listPromotions,
  updatePromotion
} from "@/lib/services/promotionService";
import { Promotion } from "@/types";
import { useState } from "react";
import toast from "react-hot-toast";
import { formatCLP, toActor } from "@/lib/utils";
import { useAuth } from "@/lib/firebase/auth-context";
import { Pencil, Trash2 } from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";

const empty = {
  nombre: "",
  descripcion: "",
  precio: 0,
  foto: "",
  piezas: undefined as number | undefined,
  activo: true
};

export default function PromocionesPage() {
  const qc = useQueryClient();
  const { appUser } = useAuth();
  const actor = toActor(appUser);
  const { data: promos = [] } = useQuery({ queryKey: ["promotions"], queryFn: () => listPromotions() });
  const [form, setForm] = useState<any>(empty);
  const [editing, setEditing] = useState<string | null>(null);

  const save = async () => {
    if (!form.nombre || !form.precio) return toast.error("Nombre y precio requeridos");
    try {
      if (editing) {
        await updatePromotion(editing, form, actor);
        toast.success("Actualizada");
      } else {
        await createPromotion(form, actor);
        toast.success("Creada");
      }
      setForm(empty); setEditing(null);
      qc.invalidateQueries({ queryKey: ["promotions"] });
    } catch (e: any) { toast.error(e.message); }
  };

  const edit = (p: Promotion) => {
    setEditing(p.id);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion || "",
      precio: p.precio,
      foto: p.foto || "",
      piezas: p.piezas,
      activo: p.activo
    });
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar?")) return;
    await deletePromotion(id, actor);
    qc.invalidateQueries({ queryKey: ["promotions"] });
  };

  return (
    <AppShell title="Promociones">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="card">
          <h3 className="font-semibold text-brand-gold mb-3">{editing ? "Editar" : "Nueva"} promoción</h3>
          <div className="space-y-3">
            <div><label className="label">Nombre</label>
              <input className="input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
            <div><label className="label">Descripción</label>
              <textarea className="input" rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Precio</label>
                <input type="number" className="input" value={form.precio} onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })} /></div>
              <div><label className="label">Piezas</label>
                <input type="number" className="input" value={form.piezas ?? ""} onChange={(e) => setForm({ ...form, piezas: e.target.value ? Number(e.target.value) : undefined })} /></div>
            </div>
            <div>
              <label className="label">Foto</label>
              <ImageUpload folder="promotions" value={form.foto} onChange={(url) => setForm({ ...form, foto: url })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} /> Activo
            </label>
            <button className="btn-primary w-full" onClick={save}>{editing ? "Actualizar" : "Crear"}</button>
            {editing && <button className="btn-ghost w-full" onClick={() => { setEditing(null); setForm(empty); }}>Cancelar</button>}
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {promos.map((p) => (
            <div key={p.id} className="card">
              {p.foto && <img src={p.foto} alt={p.nombre} className="w-full h-32 object-cover rounded-lg mb-3" />}
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-brand-gold">{p.nombre}</div>
                  {p.piezas && <div className="text-xs text-gray-400">{p.piezas} piezas</div>}
                  <div className="text-sm mt-1">{p.descripcion}</div>
                  <div className="text-lg font-bold mt-2">{formatCLP(p.precio)}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => edit(p)} className="p-1 hover:text-brand-gold"><Pencil size={16} /></button>
                  <button onClick={() => remove(p.id)} className="p-1 hover:text-brand-red"><Trash2 size={16} /></button>
                </div>
              </div>
              <span className={`badge mt-2 ${p.activo ? "bg-green-800" : "bg-brand-gray"}`}>
                {p.activo ? "Activa" : "Inactiva"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

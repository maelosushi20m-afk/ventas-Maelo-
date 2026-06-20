"use client";
import { AppShell } from "@/components/layout/AppShell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listUsers,
  setUserActive,
  createUser,
  resetUserPassword,
  updateUserProfile,
  logAudit,
} from "@/lib/services/userService";
import { useAuth } from "@/lib/firebase/auth-context";
import toast from "react-hot-toast";
import { useState } from "react";
import {
  UserPlus,
  KeyRound,
  ToggleLeft,
  ToggleRight,
  Pencil,
  X,
  Check,
  Loader2,
} from "lucide-react";

interface CreateForm {
  name: string;
  email: string;
  password: string;
}

interface EditForm {
  uid: string;
  name: string;
}

interface ResetForm {
  uid: string;
  name: string;
  newPassword: string;
}

export default function UsuariosPage() {
  const { appUser } = useAuth();
  const qc = useQueryClient();
  const { data: users = [], isLoading } = useQuery({ queryKey: ["users"], queryFn: listUsers });

  const [showCreate, setShowCreate] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [resetForm, setResetForm] = useState<ResetForm | null>(null);
  const [busy, setBusy] = useState(false);

  const [createForm, setCreateForm] = useState<CreateForm>({
    name: "", email: "", password: "",
  });

  const audit = (accion: string, detalle?: string) => {
    if (!appUser) return;
    logAudit({
      usuarioId: appUser.uid,
      usuarioEmail: appUser.email,
      usuarioNombre: appUser.name,
      accion,
      modulo: "usuarios",
      detalle,
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      // role se mantiene fijo por compatibilidad con el backend; ya no se usa para permisos.
      await createUser({ ...createForm, role: "TRABAJADOR" });
      toast.success("Usuario creado");
      audit("crear_usuario", createForm.email);
      qc.invalidateQueries({ queryKey: ["users"] });
      setShowCreate(false);
      setCreateForm({ name: "", email: "", password: "" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    setBusy(true);
    try {
      await updateUserProfile(editForm.uid, { name: editForm.name });
      toast.success("Usuario actualizado");
      audit("editar_usuario", `uid:${editForm.uid} nombre:${editForm.name}`);
      qc.invalidateQueries({ queryKey: ["users"] });
      setEditForm(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = async (uid: string, activo: boolean) => {
    setBusy(true);
    try {
      await setUserActive(uid, !activo);
      audit(!activo ? "activar_usuario" : "desactivar_usuario", `uid:${uid}`);
      qc.invalidateQueries({ queryKey: ["users"] });
    } catch {
      toast.error("Error al cambiar estado");
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetForm) return;
    setBusy(true);
    try {
      await resetUserPassword(resetForm.uid, resetForm.newPassword);
      toast.success("Contraseña restablecida");
      audit("restablecer_contraseña", `uid:${resetForm.uid}`);
      setResetForm(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell title="Gestión de Usuarios">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">Usuarios con acceso al sistema.</p>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <UserPlus size={16} /> Nuevo usuario
        </button>
      </div>

      {/* Tabla */}
      <div className="card overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-brand-gold" />
          </div>
        ) : (
          <table className="table min-w-[520px]">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.uid}>
                  <td className="font-medium">{u.name || "—"}</td>
                  <td className="text-sm text-gray-300">{u.email}</td>
                  <td>
                    <button
                      disabled={busy}
                      onClick={() => handleToggle(u.uid, u.activo)}
                      className={`flex items-center gap-1.5 text-sm transition-colors ${
                        u.activo ? "text-green-400 hover:text-green-300" : "text-gray-500 hover:text-gray-400"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {u.activo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      {u.activo ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditForm({ uid: u.uid, name: u.name })}
                        title="Editar"
                        className="p-1.5 rounded hover:bg-brand-gray text-gray-400 hover:text-white transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setResetForm({ uid: u.uid, name: u.name, newPassword: "" })}
                        title="Restablecer contraseña"
                        className="p-1.5 rounded hover:bg-brand-gray text-gray-400 hover:text-yellow-400 transition-colors"
                      >
                        <KeyRound size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-6">Sin usuarios</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Crear usuario */}
      {showCreate && (
        <Modal title="Nuevo usuario" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <Field label="Nombre completo">
              <input
                className="input"
                required
                placeholder="Ej: María González"
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
              />
            </Field>
            <Field label="Email">
              <input
                className="input"
                type="email"
                required
                placeholder="usuario@email.com"
                value={createForm.email}
                onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
              />
            </Field>
            <Field label="Contraseña inicial">
              <input
                className="input"
                type="password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                value={createForm.password}
                onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
              />
            </Field>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={busy} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Crear usuario
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-ghost flex-1">
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Editar usuario */}
      {editForm && (
        <Modal title="Editar usuario" onClose={() => setEditForm(null)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <Field label="Nombre completo">
              <input
                className="input"
                required
                value={editForm.name}
                onChange={(e) => setEditForm((p) => p ? { ...p, name: e.target.value } : p)}
              />
            </Field>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={busy} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Guardar
              </button>
              <button type="button" onClick={() => setEditForm(null)} className="btn-ghost flex-1">
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Restablecer contraseña */}
      {resetForm && (
        <Modal title={`Restablecer contraseña — ${resetForm.name}`} onClose={() => setResetForm(null)}>
          <form onSubmit={handleReset} className="space-y-4">
            <Field label="Nueva contraseña">
              <input
                className="input"
                type="password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                value={resetForm.newPassword}
                onChange={(e) => setResetForm((p) => p ? { ...p, newPassword: e.target.value } : p)}
              />
            </Field>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={busy} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                Restablecer
              </button>
              <button type="button" onClick={() => setResetForm(null)} className="btn-ghost flex-1">
                Cancelar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AppShell>
  );
}

// ── Sub-componentes ──────────────────────────────────────────────

function Modal({ title, children, onClose }: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-brand-dark border border-brand-gray rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-brand-gray">
          <h2 className="font-semibold text-brand-gold">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-brand-gray rounded">
            <X size={18} className="text-gray-400" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

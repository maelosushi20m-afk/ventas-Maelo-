"use client";
import { AppShell } from "@/components/layout/AppShell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listUsers,
  setUserActive,
  setUserRole
} from "@/lib/services/userService";
import { Role } from "@/types";
import toast from "react-hot-toast";

const ROLES: Role[] = ["admin", "vendedor", "caja"];

export default function UsuariosPage() {
  const qc = useQueryClient();
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: listUsers });

  const cambiarRol = async (uid: string, role: Role) => {
    await setUserRole(uid, role);
    toast.success("Rol actualizado");
    qc.invalidateQueries({ queryKey: ["users"] });
  };

  const toggle = async (uid: string, activo: boolean) => {
    await setUserActive(uid, activo);
    qc.invalidateQueries({ queryKey: ["users"] });
  };

  return (
    <AppShell title="Usuarios" roles={["admin"]}>
      <div className="card mb-4 text-sm text-gray-300">
        Los usuarios se crean desde Firebase Authentication. Aquí gestionas roles y estado.
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.uid}>
                <td>{u.name || "—"}</td>
                <td>{u.email}</td>
                <td>
                  <select
                    className="input text-xs py-1"
                    value={u.role}
                    onChange={(e) => cambiarRol(u.uid, e.target.value as Role)}
                  >
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </td>
                <td>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={u.activo}
                      onChange={(e) => toggle(u.uid, e.target.checked)}
                    />
                    Activo
                  </label>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={4} className="text-center text-gray-400 py-4">Sin usuarios</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

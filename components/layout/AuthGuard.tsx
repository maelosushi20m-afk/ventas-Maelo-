"use client";
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { Role } from "@/types";

export function AuthGuard({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: Role[];
}) {
  const { user, appUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    // Si se especifican roles y el usuario no tiene el rol requerido, redirigir
    if (roles && roles.length > 0 && appUser && !roles.includes(appUser.role)) {
      router.replace("/sin-acceso");
    }
  }, [user, appUser, loading, router, roles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
          <div className="text-brand-gold text-sm">Cargando…</div>
        </div>
      </div>
    );
  }
  if (!user) return null;
  if (roles && roles.length > 0 && appUser && !roles.includes(appUser.role)) return null;
  return <>{children}</>;
}

"use client";
import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";

export function AuthGuard({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    // Solo se exige sesión iniciada. Sin roles ni cuenta "activa".
    if (!user) { router.replace("/login"); return; }
  }, [user, loading, router]);

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
  return <>{children}</>;
}

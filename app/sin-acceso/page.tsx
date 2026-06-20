"use client";
import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { useAuth } from "@/lib/firebase/auth-context";
import { ROLES_LABELS } from "@/types";

export default function SinAccesoPage() {
  const { appUser } = useAuth();
  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
          <ShieldOff size={32} className="text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Acceso restringido</h1>
        <p className="text-gray-400 text-sm mb-1">
          No tienes permisos para ver esta página.
        </p>
        {appUser && (
          <p className="text-gray-500 text-xs mb-6">
            Rol actual: <span className="text-brand-gold">{ROLES_LABELS[appUser.role]}</span>
          </p>
        )}
        <Link href="/pedidos" className="btn-primary inline-flex">
          Ir a Pedidos
        </Link>
      </div>
    </div>
  );
}

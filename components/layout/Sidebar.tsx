"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tag,
  Users,
  ClipboardList,
  Wallet,
  BarChart3,
  Shield,
  LogOut,
  Boxes,
  Menu,
  X
} from "lucide-react";
import { useState, useEffect } from "react";

const NAV = [
  { href: "/pos", label: "Nuevo pedido", icon: ShoppingCart },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/productos", label: "Productos", icon: Package },
  { href: "/promociones", label: "Promociones", icon: Tag },
  { href: "/inventario", label: "Inventario", icon: Boxes },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/caja", label: "Caja", icon: Wallet },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/usuarios", label: "Usuarios", icon: Shield }
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  // Cerrar sidebar al cambiar de ruta
  useEffect(() => { setOpen(false); }, [pathname]);

  // Cerrar sidebar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const navContent = (
    <>
      <div className="p-5 border-b border-brand-gray flex items-center justify-between">
        <div>
          <div className="text-xl font-bold text-brand-gold">MAELO ROLLS</div>
          <div className="text-xs text-gray-400 mt-1 truncate">{user?.email}</div>
        </div>
        <button className="lg:hidden p-1" onClick={() => setOpen(false)}>
          <X size={20} className="text-gray-400" />
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = pathname?.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                active ? "bg-brand-red text-white" : "text-gray-300 hover:bg-brand-gray"
              }`}
            >
              <Icon size={18} />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <button onClick={() => logout()} className="m-3 btn-ghost text-sm">
        <LogOut size={16} /> Cerrar sesión
      </button>
    </>
  );

  return (
    <>
      {/* Botón hamburguesa — visible solo en móvil/tablet */}
      <button
        className="lg:hidden fixed top-3 left-3 z-50 p-2 bg-brand-dark border border-brand-gray rounded-lg"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu size={20} className="text-brand-gold" />
      </button>

      {/* Overlay móvil/tablet */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar móvil/tablet — drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-brand-dark border-r border-brand-gray flex flex-col z-50 transform transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {navContent}
      </aside>

      {/* Sidebar desktop — estático */}
      <aside className="hidden lg:flex w-64 bg-brand-dark border-r border-brand-gray min-h-screen flex-col shrink-0">
        {navContent}
      </aside>
    </>
  );
}

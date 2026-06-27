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
  X,
  ScrollText,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useEffect } from "react";
import { Role, ROLES_LABELS } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: Role[]; // undefined = visible para todos autenticados
}

const NAV: NavItem[] = [
  // TRABAJADOR + SUPER_ADMIN: crear pedidos
  { href: "/pos", label: "Nuevo pedido", icon: ShoppingCart, roles: ["SUPER_ADMIN", "TRABAJADOR"] },
  // SUPER_ADMIN: dashboard con ventas
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN"] },
  // Todos: ver pedidos
  { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
  // SUPER_ADMIN + TRABAJADOR: productos completos
  { href: "/productos", label: "Productos", icon: Package, roles: ["SUPER_ADMIN", "TRABAJADOR"] },
  { href: "/promociones", label: "Promociones", icon: Tag, roles: ["SUPER_ADMIN", "TRABAJADOR"] },
  { href: "/inventario", label: "Inventario", icon: Boxes, roles: ["SUPER_ADMIN"] },
  { href: "/clientes", label: "Clientes", icon: Users, roles: ["SUPER_ADMIN"] },
  { href: "/caja", label: "Caja", icon: Wallet, roles: ["SUPER_ADMIN"] },
  { href: "/reportes", label: "Reportes", icon: BarChart3, roles: ["SUPER_ADMIN"] },
  { href: "/usuarios", label: "Usuarios", icon: Shield, roles: ["SUPER_ADMIN"] },
  { href: "/auditoria", label: "Historial de Actividad", icon: ScrollText },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user, appUser, logout } = useAuth();

  // Roles desactivados: todos los módulos visibles para cualquier usuario autenticado.
  const visibleNav = NAV;

  // Cerrar sidebar al cambiar de ruta
  useEffect(() => { onClose(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cerrar sidebar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Bloquear scroll del body mientras el drawer está abierto (iOS).
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const navContent = (
    <>
      <div className="p-5 border-b border-brand-gray flex items-center justify-between">
        <div>
          <div className="text-xl font-bold text-brand-gold">MAELO ROLLS</div>
          <div className="text-xs text-gray-400 mt-0.5 truncate">{appUser?.name || user?.email}</div>
          {appUser?.role && (
            <div className="text-[10px] mt-0.5 px-1.5 py-0.5 rounded bg-brand-red/20 text-brand-red inline-block font-medium">
              {ROLES_LABELS[appUser.role]}
            </div>
          )}
        </div>
        <button className="lg:hidden p-2 -mr-1 active:bg-brand-gray rounded-lg touch-manipulation" onClick={onClose} aria-label="Cerrar menú">
          <X size={20} className="text-gray-400" />
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleNav.map((n) => {
          const Icon = n.icon;
          const active = pathname?.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-brand-red/90 text-white font-medium shadow-[inset_3px_0_0_0_#D4AF37]"
                  : "text-gray-300 hover:bg-brand-gray hover:text-white"
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
      {/* Overlay móvil/tablet. pointer-events solo cuando abierto. */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`lg:hidden fixed inset-0 bg-black/60 z-40 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Sidebar móvil/tablet — drawer. Siempre montado; se desliza con transform.
          z-50 por encima del overlay y del header sticky (z-30).
          Safe-area en padding superior para el notch de iOS. */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-[100dvh] w-64 max-w-[85vw] bg-brand-dark border-r border-brand-gray flex flex-col z-50 transform transition-transform duration-200 will-change-transform pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] ${
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

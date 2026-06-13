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
  Boxes
} from "lucide-react";

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
  return (
    <aside className="w-64 bg-brand-dark border-r border-brand-gray min-h-screen flex flex-col">
      <div className="p-5 border-b border-brand-gray">
        <div className="text-xl font-bold text-brand-gold">MAELO ROLLS</div>
        <div className="text-xs text-gray-400 mt-1 truncate">{user?.email}</div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = pathname?.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
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
    </aside>
  );
}

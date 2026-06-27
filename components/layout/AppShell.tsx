"use client";
import { ReactNode, useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";
import { ConnectionIndicator } from "./ConnectionIndicator";
import { AuthGuard } from "./AuthGuard";
import { OrderSoundWatcher } from "./OrderSoundWatcher";

export function AppShell({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <AuthGuard>
      <OrderSoundWatcher />
      <div className="min-h-screen flex">
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 border-b border-brand-gray bg-brand-dark/80 backdrop-blur-md px-3 lg:px-6 py-3 flex items-center gap-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
            {/* Botón menú dentro del header (no fixed): seguro en iOS PWA */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
              className="lg:hidden p-2 -ml-1 rounded-lg text-brand-gold active:bg-brand-gray touch-manipulation"
            >
              <Menu size={22} />
            </button>
            <h1 className="text-lg font-semibold text-brand-gold truncate flex-1">{title}</h1>
            <div className="flex items-center gap-2 shrink-0">
              <ConnectionIndicator />
              <NotificationBell />
            </div>
          </header>
          <main className="p-3 sm:p-4 lg:p-6 flex-1 overflow-auto animate-fade-up">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}

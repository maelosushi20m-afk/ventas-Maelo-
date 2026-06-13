"use client";
import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";
import { AuthGuard } from "./AuthGuard";
import { Role } from "@/types";

export function AppShell({
  children,
  title,
  roles
}: {
  children: ReactNode;
  title: string;
  roles?: Role[];
}) {
  return (
    <AuthGuard roles={roles}>
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="border-b border-brand-gray bg-brand-dark px-4 lg:px-6 py-3 flex items-center justify-between">
            {/* Espacio para el botón hamburguesa en móvil */}
            <h1 className="text-lg font-semibold text-brand-gold pl-10 lg:pl-0 truncate">{title}</h1>
            <NotificationBell />
          </header>
          <main className="p-3 sm:p-4 lg:p-6 flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}

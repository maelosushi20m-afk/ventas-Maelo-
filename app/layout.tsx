import "./globals.css";
import { ReactNode } from "react";
import { Providers } from "@/components/layout/Providers";

export const metadata = {
  title: "Maelo Rolls",
  description: "Sistema de gestión Maelo Rolls",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Maelo Rolls", statusBarStyle: "black-translucent" as const }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#8B0000"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

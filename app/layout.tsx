import "./globals.css";
import { ReactNode } from "react";
import { Providers } from "@/components/layout/Providers";
import { InstallPWA } from "@/components/pwa/InstallPWA";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";

export const metadata = {
  title: "Maelo Rolls",
  description: "Sushi Delivery y Retiro",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Maelo Rolls",
    statusBarStyle: "black-translucent" as const,
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover" as const,
  themeColor: "#0a0a0b",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        {/* Tipografía premium (runtime, sin dependencia de red en build) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* iOS PWA meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Maelo Rolls" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {/* iOS splash screens */}
        <meta name="format-detection" content="telephone=no" />
        {/* MS Tile */}
        <meta name="msapplication-TileColor" content="#0F172A" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
      </head>
      <body>
        <Providers>
          {children}
          <InstallPWA />
          <ServiceWorkerRegistrar />
        </Providers>
      </body>
    </html>
  );
}

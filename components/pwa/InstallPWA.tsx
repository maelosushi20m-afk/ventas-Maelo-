"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Verificar si ya está instalada
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Detectar instalación
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  if (isInstalled || !showBanner) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        background: "#0F172A",
        border: "1px solid #334155",
        borderRadius: "12px",
        padding: "0.75rem 1rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        maxWidth: "calc(100vw - 2rem)",
        width: "380px",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          background: "#8B0000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: "1.2rem",
          fontWeight: 700,
          color: "#fff",
        }}
      >
        M
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "#F8FAFC", fontSize: "0.875rem", fontWeight: 600 }}>
          Instalar Maelo Rolls
        </div>
        <div style={{ color: "#94A3B8", fontSize: "0.75rem" }}>
          Acceso rápido desde tu pantalla
        </div>
      </div>
      <button
        onClick={handleInstall}
        style={{
          background: "#8B0000",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          padding: "0.5rem 1rem",
          fontSize: "0.8rem",
          fontWeight: 600,
          cursor: "pointer",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        Instalar
      </button>
      <button
        onClick={() => setShowBanner(false)}
        aria-label="Cerrar"
        style={{
          background: "none",
          border: "none",
          color: "#64748B",
          cursor: "pointer",
          fontSize: "1.2rem",
          padding: "0.25rem",
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}

"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        // Verificar actualizaciones cada 60 minutos
        setInterval(() => registration.update(), 60 * 60 * 1000);

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "activated" && navigator.serviceWorker.controller) {
              // Nueva versión disponible - recargar silenciosamente
              console.log("[PWA] Nueva versión disponible, recargando...");
              window.location.reload();
            }
          });
        });

        console.log("[PWA] Service Worker registrado:", registration.scope);
      } catch (err) {
        console.error("[PWA] Error registrando SW:", err);
      }
    };

    // Registrar después de que la página cargue
    if (document.readyState === "complete") {
      registerSW();
    } else {
      window.addEventListener("load", registerSW, { once: true });
    }
  }, []);

  return null;
}

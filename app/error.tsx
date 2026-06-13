"use client";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card text-center max-w-md">
        <div className="text-2xl font-bold text-brand-red mb-2">Algo salió mal</div>
        <div className="text-sm text-gray-400 mb-4">{error.message}</div>
        <button onClick={reset} className="btn-primary">Reintentar</button>
      </div>
    </div>
  );
}

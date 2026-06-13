import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card text-center max-w-md">
        <div className="text-5xl font-bold text-brand-gold mb-2">404</div>
        <div className="text-gray-300 mb-4">Página no encontrada</div>
        <Link href="/dashboard" className="btn-primary inline-flex">Ir al Dashboard</Link>
      </div>
    </div>
  );
}

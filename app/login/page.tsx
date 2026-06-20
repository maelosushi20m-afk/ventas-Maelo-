"use client";
import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

type Tab = "login" | "register";

export default function LoginPage() {
  const { login, register, user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [submitting, setSubmitting] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  const onLogin = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(loginEmail, loginPassword);
      toast.success("¡Bienvenido!");
      router.replace("/dashboard");
    } catch (err: any) {
      const msg = err.code === "auth/invalid-credential"
        ? "Email o contraseña incorrectos"
        : err.message || "Error al iniciar sesión";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const onRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirm) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (regPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setSubmitting(true);
    try {
      await register(regEmail, regPassword, regName);
      toast.success(
        "Cuenta creada. Tu acceso quedará pendiente hasta que el administrador lo active.",
        { duration: 6000 }
      );
      // Limpiar y volver a login
      setRegName(""); setRegEmail(""); setRegPassword(""); setRegConfirm("");
      setTab("login");
    } catch (err: any) {
      const msg = err.code === "auth/email-already-in-use"
        ? "Ese email ya está registrado"
        : err.message || "Error al registrarse";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-brand-dark">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-brand-gold tracking-wide">MAELO ROLLS</div>
          <div className="text-sm text-gray-400 mt-1">Sistema de gestión</div>
        </div>

        {/* Card */}
        <div className="card">
          {/* Tabs */}
          <div className="flex border-b border-brand-gray mb-5 -mx-1">
            <button
              type="button"
              onClick={() => setTab("login")}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === "login"
                  ? "text-brand-gold border-b-2 border-brand-gold"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => setTab("register")}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === "register"
                  ? "text-brand-gold border-b-2 border-brand-gold"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Login form */}
          {tab === "login" && (
            <form onSubmit={onLogin} className="space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  className="input"
                  type="email"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Contraseña</label>
                <input
                  className="input"
                  type="password"
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              <button className="btn-primary w-full flex items-center justify-center gap-2" disabled={submitting}>
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Entrando…</> : "Entrar"}
              </button>
            </form>
          )}

          {/* Register form */}
          {tab === "register" && (
            <form onSubmit={onRegister} className="space-y-4">
              <div>
                <label className="label">Nombre completo</label>
                <input
                  className="input"
                  type="text"
                  autoComplete="name"
                  placeholder="Ej: María González"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  className="input"
                  type="email"
                  autoComplete="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Contraseña</label>
                <input
                  className="input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="label">Confirmar contraseña</label>
                <input
                  className="input"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repetir contraseña"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3 py-2.5 text-xs text-yellow-300">
                Tu cuenta quedará pendiente de activación por el administrador antes de poder acceder.
              </div>
              <button
                className="btn-primary w-full flex items-center justify-center gap-2"
                disabled={submitting}
              >
                {submitting
                  ? <><Loader2 size={16} className="animate-spin" /> Creando cuenta…</>
                  : "Crear cuenta"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

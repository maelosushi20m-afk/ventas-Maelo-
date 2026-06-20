import { clsx, ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AppUser, AuditActor } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Convierte el AppUser de sesión en un AuditActor para los services. */
export function toActor(u: AppUser | null | undefined): AuditActor | undefined {
  if (!u) return undefined;
  return { uid: u.uid, email: u.email, name: u.name };
}

export function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(n || 0);
}

export function toDate(v: any): Date {
  if (!v) return new Date();
  if (v instanceof Date) return v;
  if (typeof v?.toDate === "function") return v.toDate();
  if (typeof v === "string" || typeof v === "number") return new Date(v);
  return new Date();
}

export function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
export function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
export function startOfWeek(d = new Date()) {
  const x = startOfDay(d);
  const day = x.getDay() || 7;
  x.setDate(x.getDate() - day + 1);
  return x;
}
export function startOfMonth(d = new Date()) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

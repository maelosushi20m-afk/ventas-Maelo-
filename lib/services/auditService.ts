import {
  collection,
  getDocs,
  orderBy,
  query,
  limit,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { AuditLog, AuditActor } from "@/types";

const col = () => collection(db, "audit_logs");

export async function listAuditLogs(n = 200): Promise<AuditLog[]> {
  const snap = await getDocs(query(col(), orderBy("createdAt", "desc"), limit(n)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as AuditLog[];
}

export interface LogAuditInput {
  usuarioId: string;
  usuarioEmail: string;
  usuarioNombre: string;
  accion: string;
  modulo: string;
  documentId?: string;
  beforeData?: any;
  afterData?: any;
  observaciones?: string;
  detalle?: string;
}

// Quita undefined (Firestore no acepta undefined)
function clean<T extends Record<string, any>>(obj: T): Partial<T> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

/**
 * Registra una acción en audit_logs. Nunca lanza: la auditoría no debe
 * romper la operación principal.
 */
export async function logAudit(data: LogAuditInput): Promise<void> {
  try {
    await addDoc(
      col(),
      clean({
        ...data,
        createdAt: serverTimestamp(),
      })
    );
  } catch (err) {
    // No interrumpir flujo si la auditoría falla
    console.error("[audit] error registrando log:", err);
  }
}

/**
 * Helper para registrar desde un service usando un actor.
 */
export async function audit(
  actor: AuditActor | null | undefined,
  params: {
    accion: string;
    modulo: string;
    documentId?: string;
    beforeData?: any;
    afterData?: any;
    observaciones?: string;
    detalle?: string;
  }
): Promise<void> {
  if (!actor) return;
  await logAudit({
    usuarioId: actor.uid,
    usuarioEmail: actor.email,
    usuarioNombre: actor.name,
    ...params,
  });
}

import {
  collection,
  getDocs,
  orderBy,
  query,
  limit,
  Timestamp,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { AuditLog } from "@/types";

const col = () => collection(db, "audit_logs");

export async function listAuditLogs(n = 50): Promise<AuditLog[]> {
  const snap = await getDocs(query(col(), orderBy("createdAt", "desc"), limit(n)));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as AuditLog[];
}

export async function logAudit(data: {
  usuarioId: string;
  usuarioEmail: string;
  usuarioNombre: string;
  accion: string;
  modulo: string;
  detalle?: string;
}): Promise<void> {
  await addDoc(col(), { ...data, createdAt: serverTimestamp() });
}

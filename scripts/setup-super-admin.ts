/**
 * Configura el SUPER_ADMIN en Firestore.
 * Uso: npx tsx scripts/setup-super-admin.ts
 *
 * Requiere variables de entorno FIREBASE_ADMIN_* en .env.local
 */
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  });
}

const auth = getAuth();
const db = getFirestore();

const SUPER_ADMIN_EMAIL = "lagaalfonso@gmail.com";

async function main() {
  console.log(`Buscando usuario ${SUPER_ADMIN_EMAIL}…`);

  let user;
  try {
    user = await auth.getUserByEmail(SUPER_ADMIN_EMAIL);
    console.log(`✓ Usuario encontrado: ${user.uid}`);
  } catch {
    console.error(`✗ Usuario no existe en Firebase Auth.`);
    console.error(`  Primero crea la cuenta en Firebase Authentication con ese email.`);
    process.exit(1);
  }

  // Actualizar/crear perfil en Firestore
  await db.collection("users").doc(user.uid).set(
    {
      email: SUPER_ADMIN_EMAIL,
      name: "Alfonso (Super Admin)",
      role: "SUPER_ADMIN",
      activo: true,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // También setear en el documento si no tiene createdAt
  const snap = await db.collection("users").doc(user.uid).get();
  if (!snap.data()?.createdAt) {
    await db.collection("users").doc(user.uid).update({
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  console.log(`✓ Perfil SUPER_ADMIN configurado en Firestore.`);
  console.log(`  UID: ${user.uid}`);
  console.log(`  Email: ${SUPER_ADMIN_EMAIL}`);
  console.log(`  Rol: SUPER_ADMIN`);

  // Log de auditoría
  await db.collection("audit_logs").add({
    usuarioId: user.uid,
    usuarioEmail: SUPER_ADMIN_EMAIL,
    usuarioNombre: "Sistema",
    accion: "configurar_super_admin",
    modulo: "auth",
    detalle: "Configuración inicial SUPER_ADMIN vía script",
    createdAt: FieldValue.serverTimestamp(),
  });

  console.log(`✓ Log de auditoría registrado.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

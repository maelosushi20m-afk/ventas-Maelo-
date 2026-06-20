import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { Role, SUPER_ADMIN_EMAIL } from "@/types";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email, name, role, password } = await req.json() as {
      email: string;
      name: string;
      role: Role;
      password: string;
    };

    // Validaciones
    if (!email || !name || !role || !password) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }
    if (!["TRABAJADOR", "AYUDANTE"].includes(role)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }
    // No se puede crear otro SUPER_ADMIN
    if (email === SUPER_ADMIN_EMAIL) {
      return NextResponse.json({ error: "No se puede crear este usuario" }, { status: 403 });
    }

    // Crear en Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      displayName: name,
      password,
      emailVerified: false,
    });

    // Guardar perfil en Firestore
    await adminDb.collection("users").doc(userRecord.uid).set({
      email,
      name,
      role,
      activo: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ uid: userRecord.uid }, { status: 201 });
  } catch (err: any) {
    console.error("[create-user]", err);
    if (err.code === "auth/email-already-exists") {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
  }
}

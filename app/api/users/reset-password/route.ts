import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

export async function POST(req: Request) {
  try {
    const { uid, newPassword } = await req.json() as { uid: string; newPassword: string };

    if (!uid || !newPassword) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    await adminAuth.updateUser(uid, { password: newPassword });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[reset-password]", err);
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
  }
}

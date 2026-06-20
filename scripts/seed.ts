/**
 * Seed inicial: crea admin y datos demo.
 * Uso: npx tsx scripts/seed.ts admin@maelo.cl Admin123!
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").replace(/\\n/g, "\n")
  })
});

const auth = getAuth();
const db = getFirestore();

async function main() {
  const email = process.argv[2] || "admin@maelo.cl";
  const password = process.argv[3] || "Admin123!";

  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch {
    user = await auth.createUser({ email, password });
  }

  await db.collection("users").doc(user.uid).set({
    email,
    name: "Administrador",
    role: "SUPER_ADMIN",
    activo: true,
    createdAt: FieldValue.serverTimestamp()
  });

  const productos = [
    { nombre: "Roll Maelo", categoria: "Rolls", precioNormal: 6500, activo: true },
    { nombre: "Roll Tempura", categoria: "Rolls", precioNormal: 6900, activo: true },
    { nombre: "Roll California", categoria: "Rolls", precioNormal: 5900, activo: true },
    { nombre: "Sashimi Salmón", categoria: "Sashimi", precioNormal: 7900, activo: true },
    { nombre: "Gohan Salmón", categoria: "Gohan", precioNormal: 6500, activo: true },
    { nombre: "Hand Roll Salmón", categoria: "Hand Roll", precioNormal: 4500, activo: true },
    { nombre: "Coca Cola 350ml", categoria: "Bebidas", precioNormal: 1500, activo: true },
    { nombre: "Palitos extras", categoria: "Extras", precioNormal: 500, activo: true }
  ];
  for (const p of productos) {
    await db.collection("products").add({ ...p, createdAt: FieldValue.serverTimestamp() });
  }

  const promos = [
    { nombre: "Promo 30 piezas", piezas: 30, precio: 14990, activo: true },
    { nombre: "Promo 50 piezas", piezas: 50, precio: 22990, activo: true },
    { nombre: "Promo 80 piezas", piezas: 80, precio: 32990, activo: true },
    { nombre: "Promo 100 piezas", piezas: 100, precio: 39990, activo: true }
  ];
  for (const p of promos) {
    await db.collection("promotions").add({ ...p, createdAt: FieldValue.serverTimestamp() });
  }

  await db.collection("counters").doc("orderNumber").set({ seq: 0 });

  console.log("Seed OK. Login:", email, password);
}

main().catch((e) => { console.error(e); process.exit(1); });

import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function main() {
  const email = process.argv[2] || "admin@maelo.cl";
  const password = process.argv[3] || "Admin123!";

  console.log("Iniciando seed cliente para:", email);

  if (!firebaseConfig.apiKey) {
    throw new Error("Faltan las variables de entorno de Firebase cliente en el archivo .env.local");
  }

  let user;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    user = userCredential.user;
    console.log("Usuario creado:", user.uid);
  } catch (err: any) {
    if (err.code === "auth/email-already-in-use") {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      user = userCredential.user;
      console.log("Usuario existente, sesión iniciada:", user.uid);
    } else {
      throw err;
    }
  }

  await setDoc(doc(db, "users", user.uid), {
    email,
    name: "Administrador",
    role: "SUPER_ADMIN",
    activo: true,
    createdAt: serverTimestamp()
  });
  console.log("Documento de usuario creado en Firestore.");

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
    const docRef = await addDoc(collection(db, "products"), {
      ...p,
      createdAt: serverTimestamp()
    });
    console.log("Producto agregado:", p.nombre, docRef.id);
  }

  const promos = [
    { nombre: "Promo 30 piezas", piezas: 30, precio: 14990, activo: true },
    { nombre: "Promo 50 piezas", piezas: 50, precio: 22990, activo: true },
    { nombre: "Promo 80 piezas", piezas: 80, precio: 32990, activo: true },
    { nombre: "Promo 100 piezas", piezas: 100, precio: 39990, activo: true }
  ];
  for (const p of promos) {
    const docRef = await addDoc(collection(db, "promotions"), {
      ...p,
      createdAt: serverTimestamp()
    });
    console.log("Promoción agregada:", p.nombre, docRef.id);
  }

  await setDoc(doc(db, "counters", "orderNumber"), { seq: 0 });
  console.log("Contador de órdenes inicializado.");

  console.log("Seed cliente completado con éxito!");
}

main().catch((e) => {
  console.error("Error en seed cliente:", e);
  process.exit(1);
});

# Maelo Rolls — Sistema de gestión

Sistema web profesional para registro de ventas, pedidos, promociones, clientes y reportes.
Sin inventario, sin control stock. Enfocado en velocidad operativa.

## Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (paleta negro / blanco / rojo oscuro / dorado)
- Firebase Auth + Firestore + Storage
- React Query + Zustand
- jsPDF + SheetJS (exportación)

## Requisitos
- Node.js 20+
- Cuenta Firebase con proyecto creado

## Instalación

```bash
cd maelo-rolls
npm install
cp .env.example .env.local
# completar variables Firebase (web + admin)
```

## Configurar Firebase

1. Crear proyecto en Firebase Console.
2. Activar **Authentication** → Email/Password.
3. Crear base de datos **Firestore** (modo producción).
4. Desplegar reglas e índices:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```
5. Generar service account JSON → completar `FIREBASE_ADMIN_*` en `.env.local`.

## Seed inicial (admin + datos demo)

```bash
npx tsx scripts/seed.ts admin@maelo.cl Admin123!
```

## Desarrollo

```bash
npm run dev
```

Visita http://localhost:3000 → redirige a `/login`.

## Build producción

```bash
npm run build
npm start
```

Deploy recomendado: **Vercel**.

## Roles
- **admin** — acceso total
- **vendedor** — crear pedidos, ver ventas, clientes
- **caja** — ver y cerrar caja, ver pedidos

Asignar rol manualmente en colección `users/{uid}.role`.

## Módulos
- `/dashboard` — KPIs día/semana/mes, top productos, métodos de pago
- `/pos` — registro rápido pedidos
- `/pedidos` — listado + buscador + cambio de estado
- `/productos` — CRUD productos por categoría
- `/promociones` — CRUD promociones (30/50/80/100 piezas, etc.)
- `/clientes` — historial completo de compras
- `/caja` — apertura/cierre diario con totales por método de pago
- `/reportes` — reportes por rango + exportación PDF/Excel
- `/usuarios` — gestión de roles y estado (solo admin)

## Categorías
Rolls, Promociones, Sashimi, Gohan, Hand Roll, Bebidas, Extras.

## Estados pedido
Pendiente → En preparación → Listo → En reparto → Entregado · (Cancelado)

## Métodos de pago
Efectivo · Transferencia · Débito · Crédito

## Estructura

```
maelo-rolls/
├── app/             # rutas Next.js
├── components/      # UI compartida + layout
├── lib/
│   ├── firebase/    # cliente y admin SDK
│   ├── services/    # lógica negocio
│   └── utils/       # helpers + exportadores
├── types/           # interfaces TypeScript
├── scripts/         # seed
├── firestore.rules
└── firestore.indexes.json
```

## Notas
- Diseño 100% responsive (móvil, tablet, escritorio).
- Notificaciones en tiempo real vía Firestore listeners.
- Búsqueda global por número, cliente o teléfono.
- Auto-incremento de número pedido vía counter atómico.

# Auditoría y optimización — Maelo Rolls

Fecha: 2026-06-27
Stack: Next.js 15 (App Router) · React 18 · Firebase/Firestore · Zustand · React Query · Tailwind · PWA

Esta versión documenta la auditoría completa y los cambios ya aplicados. Por
decisión del dueño, **la seguridad no se modificó en esta iteración**; queda
documentada como prioridad para la siguiente. Ninguna funcionalidad existente se
eliminó.

---

## 1. Qué encontré

### Seguridad (CRÍTICO — no modificado por decisión del usuario)

1. **Reglas de Firestore abiertas.** `firestore.rules` permite leer y escribir
   *cualquier* colección a *cualquier* usuario autenticado:
   ```
   match /{document=**} { allow read, write: if isSignedIn(); }
   ```
   Un trabajador (o cualquier cuenta con sesión) puede borrar pedidos, editar
   precios, leer clientes, alterar la caja o los logs de auditoría. Los logs de
   auditoría deberían ser *solo lectura/insertar*, nunca editables.

2. **Roles definidos pero desactivados.** Existen roles bien pensados
   (`SUPER_ADMIN`, `TRABAJADOR`, `AYUDANTE`) con permisos en `types/index.ts`,
   pero:
   - `AuthGuard` solo exige sesión iniciada (no valida rol ni `activo`).
   - `Sidebar` declara `roles` por ítem pero los ignora (`const visibleNav = NAV`).
   - No hay página `/sin-acceso` enlazada a ninguna comprobación real.

3. **API de usuarios sin autorización.** `/api/users/create` y
   `/api/users/reset-password` usan Firebase Admin (privilegio total) **sin
   verificar el token del llamante ni su rol**. Cualquiera que conozca la URL
   puede crear usuarios o resetear contraseñas con un `fetch`.

4. **Duplicación de tipos de permisos.** `lib/types/auth.ts` y `types/index.ts`
   definen el mismo sistema de roles/permisos por separado (riesgo de
   divergencia).

5. **Credenciales en el repositorio.** Existen `.github_token.txt`,
   `vercel-env-import.env` y `.env.local` en el árbol. `.github_token.txt` está
   en `.gitignore`, pero `vercel-env-import.env` **no** — conviene verificar que
   nunca se haya commiteado y rotar tokens por precaución. Además, el
   `firebaseConfig` del cliente trae claves *hardcodeadas* como fallback (las
   claves web de Firebase no son secretas, pero es mejor depender solo de envs).

### Bugs e inconsistencias

6. **Carrito duplicado.** Existía `stores/cartStore.ts` (Zustand persistente)
   pero `/pos` mantenía su **propio estado local** con la misma lógica copiada.
   Doble fuente de verdad y el carrito se perdía al recargar. (CORREGIDO)

7. **`searchOrders` y `listLatestOrders` traen de más.** Descargan 200 / N+20
   documentos y filtran `deleted` en cliente. Funciona, pero escala mal y gasta
   lecturas. Recomendado mover el filtro a la consulta.

8. **Dashboard con 3 consultas de rango solapadas.** Pedía día, semana y mes por
   separado, cuando "mes" ya contiene los otros dos. Triple lectura de rango por
   carga. (CORREGIDO: 1 consulta, día/semana derivados en cliente.)

9. **Tipos `any` extendidos.** Casi todos los services hacen
   `({ id, ...d.data() } as any)`. Es práctico pero anula el tipado; conviene un
   helper `mapDoc<T>()`.

10. **`React Query` sin `refetchOnWindowFocus: false`.** En un POS abierto todo
    el día, cada cambio de pestaña relee Firestore. (CORREGIDO)

11. **Fuente Inter referenciada pero no cargada.** El CSS pedía `Inter` sin
    `next/font` ni `<link>`, así que caía a `system-ui`. (CORREGIDO con
    `next/font/google`.)

### UX / UI

12. Tema oscuro correcto pero plano: sin profundidad, sombras, estados de foco
    accesibles ni microinteracciones. Botones algo pequeños para uso táctil.
13. Cantidades en el carrito solo ajustables con +/−, sin escribir el número.
14. Header no fijo: al hacer scroll se pierde el título y las notificaciones.

---

## 2. Qué optimicé en esta iteración

### Carrito (unificado y mejorado)
- `/pos` ahora usa **un único `cartStore` (Zustand persistente)**; se eliminó el
  estado duplicado. El pedido en curso **sobrevive a recargas**.
- Cantidades **editables escribiendo el número** (mejor en táctil), además de
  +/−.
- Botón **"Vaciar pedido"**, contador de unidades, subtotal por línea visible.
- Microinteracciones táctiles (`active:scale`) en tarjetas y controles.
- Alta automática de cliente desde el pedido ya existía vía
  `upsertCustomerFromOrder` (se mantiene) y la búsqueda con sugerencias se
  conserva, ahora escribiendo directo al store.

### Sistema de diseño premium (propagado a las 18 páginas sin reescribirlas)
- Se refinaron las clases base que ya consumen todas las páginas
  (`.card`, `.btn*`, `.input`, `.table`, `.badge`), por lo que el rediseño se
  aplica de forma global y consistente.
- Fondo con profundidad (gradientes radiales sutiles dorado/rojo), superficies
  con degradado y sombra, dorado con brillo, foco accesible (`focus-visible`),
  scrollbar estilizada, badges semánticos (ok/warn/danger/gold), animación de
  entrada `fade-up`, *skeletons* con shimmer y respeto a
  `prefers-reduced-motion`.
- Tipografía **Inter** real vía `next/font` (self-hosted, sin coste de red
  externo).
- Header **sticky con blur**; ítem activo del menú con acento dorado.

### Rendimiento / Firestore
- Dashboard: **3 → 1** consulta de rango (≈2 lecturas de rango menos por carga).
- React Query: `staleTime` 60s, `gcTime` 5min, `refetchOnWindowFocus: false`,
  `retry: 1` → menos relecturas de Firestore y menos costo.

---

## 3. Errores corregidos
- Doble fuente de verdad del carrito (estado local de POS vs. store) → unificado.
- Pérdida del pedido al recargar la página → ahora persiste.
- Fuente Inter que no se aplicaba → cargada correctamente.
- Lecturas redundantes del dashboard → consolidadas.

## 4. Mejoras de rendimiento logradas
- Menos lecturas de Firestore por carga del dashboard (3 rangos → 1).
- Menos refetches por foco de ventana (relevante en uso prolongado del POS).
- Tipografía self-hosted (sin petición a Google Fonts en runtime).
- Animaciones por GPU (`transform`/`opacity`) y desactivables por accesibilidad.

## 5. Mejoras de seguridad aplicadas
- En esta iteración **ninguna**, por decisión explícita del usuario. Ver §1 y §7.

## 6. Mejoras de UX/UI implementadas
- Look premium con profundidad, sombras y foco accesible en toda la app.
- Botones más grandes y con feedback táctil.
- Carrito con edición rápida de cantidades, vaciar pedido y persistencia.
- Header fijo con blur; navegación con acento dorado.

---

## 7. Recomendaciones para próximas versiones (priorizadas)

**P0 — Seguridad (hacer primero):**
1. Reglas de Firestore por rol y colección. Auditoría: `create` sí, `update`/
   `delete` no. Caja/usuarios: solo `SUPER_ADMIN`.
2. Proteger `/api/users/*`: verificar `Authorization: Bearer <idToken>` con
   `adminAuth.verifyIdToken()` y exigir rol `SUPER_ADMIN` (idealmente con
   *custom claims*).
3. Reactivar `AuthGuard` (rol + `activo`) y el filtrado por rol del `Sidebar`.
4. Unificar el sistema de permisos en un solo archivo (`types/index.ts`) y
   eliminar `lib/types/auth.ts`.
5. Rotar el token de GitHub y mover `vercel-env-import.env` fuera del repo;
   confirmar que no esté en el historial de git.

**P1 — Datos y consistencia:**
6. `mapDoc<T>()` tipado para eliminar los `as any`.
7. Filtrar `deleted == false` en consultas (requiere índice/campo) en lugar de
   en cliente, en `orders` y `customers`.
8. Buscador de pedidos/clientes por prefijo indexado o servicio de búsqueda, en
   vez de traer 200 docs.

**P2 — Producto:**
9. Carrito: descuentos y propinas (requiere ampliar el tipo `Order` y el total).
10. Descontar inventario automáticamente al crear pedidos (receta por producto).
11. Reportes: utilidad neta (ventas − gastos − costo inventario), horas pico,
    inventario valorizado — varios ya calculables con los datos existentes.
12. Tests: al menos unitarios de `reportService`, `cashService` y el carrito.

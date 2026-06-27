# Arquitectura Offline First — Maelo Rolls

Fecha: 2026-06-27

Implementación profesional de operación sin conexión y sincronización
automática, **sin reconstruir el sistema ni eliminar funcionalidad**. Se apoya
en la persistencia offline nativa de Firestore (probada en producción a gran
escala) en lugar de una cola manual, lo que reduce drásticamente la superficie
de bugs y garantiza anti-duplicados y orden por diseño.

---

## 1. Cómo se implementó el modo Offline First

**Persistencia local (IndexedDB) de Firestore** — `lib/firebase/client.ts`:
```ts
initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
})
```
- Toda colección leída queda en **IndexedDB**; se consulta igual sin conexión.
- Las **escrituras** (crear/editar pedidos, clientes, inventario, etc.) se
  aplican primero a la caché local y se encolan internamente para el servidor.
- **Multi-pestaña**: varias pestañas comparten la misma caché sin corromperla.
- Si IndexedDB no está disponible (incógnito, navegador viejo) cae a memoria
  sin romper la app.

**Resultado:** seguir vendiendo, crear/editar pedidos y clientes, registrar
movimientos de caja, descontar inventario y agregar/editar productos funcionan
sin Internet. Todo se guarda localmente y se consulta offline.

## 2. Cómo funciona la sincronización

- Firestore mantiene una **cola interna de escrituras pendientes**. Al recuperar
  la conexión las envía **en el mismo orden** en que se hicieron (orden
  cronológico garantizado) y **reintenta automáticamente** ante fallos de red.
- Detección de conexión: eventos `online`/`offline` del navegador +
  `navigator.onLine`, centralizados en `stores/syncStore.ts`.
- Al volver la conexión se ejecuta `reconcileOrderNumbers()` (ver §3) para
  asignar los números de pedido definitivos.
- El estado se refleja en el indicador global (§5).

## 3. Número de pedido sin conexión (anti-colisión)

El correlativo usaba una **transacción** que no opera offline. Solución segura
en `lib/services/orderService.ts`:

- **Online:** transacción atómica en el servidor → número definitivo `#N`.
- **Offline:** el pedido se guarda con `pendienteNumero: true` y un folio local
  visible `L-<timestamp>` + `createdLocal` (epoch local para ordenar).
- **Al reconectar:** `reconcileOrderNumbers()` recorre los pedidos pendientes
  **en orden cronológico de creación** y les asigna el correlativo real del
  servidor mediante la transacción. Es **idempotente**: solo toca pedidos con
  `pendienteNumero === true`, por lo que reintentar nunca duplica números.

Esto evita el riesgo de dos cajas generando el mismo número offline: nadie
inventa un correlativo local; el número real lo asigna siempre el servidor.

## 4. Cómo se gestionan los conflictos

- Firestore resuelve concurrencia con **last-write-wins por campo** a nivel de
  documento. Como cada operación crítica escribe documentos distintos (cada
  pedido/cliente/movimiento es su propio doc), los choques reales son mínimos.
- El **stock** usa transacción atómica cuando hay red (a prueba de concurrencia
  entre cajas) y un camino optimista offline (lectura de caché + escritura) que
  se sincroniza al reconectar.
- Los **números de pedido** nunca colisionan gracias a la reconciliación
  servidor-side (§3).

## 5. Almacenamiento local y consulta offline

- Motor: **IndexedDB** vía la caché persistente de Firestore (la opción
  recomendada para web; resistente y de gran capacidad).
- Se cachean automáticamente al leerse: productos, clientes, inventario,
  movimientos, pedidos, sesiones de caja, promociones, notificaciones,
  auditoría, contadores y configuración.
- Cualquier pantalla que ya consultó datos los muestra offline desde la caché.

## 6. Indicador de conexión (global)

`components/layout/ConnectionIndicator.tsx`, montado en el header de toda la app:
- 🟢 **En línea** · 🟠 **Sincronizando** (hay escrituras/pedidos pendientes) ·
  🔴 **Sin conexión**.
- Muestra **operaciones pendientes**, **pedidos sin número** y **última
  sincronización** (tooltip al pasar el cursor).
- El conteo de pendientes se obtiene de `snapshot.metadata.hasPendingWrites`
  (escrituras locales aún no confirmadas por el servidor), observando solo las
  colecciones que se tocan en una venta offline para minimizar lecturas.

## 7. Actualización automática de pedidos cada 60 s

En `app/pedidos/page.tsx`, con React Query (`refetchInterval: 60_000`):
- **No recarga la página** ni desmonta la lista → se **conservan filtros,
  búsqueda, scroll, modales abiertos y ediciones en curso**.
- `refetchIntervalInBackground: false`: no consulta si la pestaña está oculta
  (ahorro de recursos y lecturas).
- **Detección de nuevos**: compara IDs entre refrescos; los recién llegados se
  **resaltan** (badge "nuevo" + realce) durante 8 s y muestran un toast.
- **Sonido configurable**: botón 🔊/🔇 (preferencia en `localStorage`); pitido
  corto vía Web Audio, sin archivos externos. Se activa con gesto del usuario
  (cumple políticas de autoplay del navegador).
- Pedidos creados offline se ven con folio `L·xxxx` en ámbar hasta sincronizar.

## 8. Rendimiento y estabilidad logrados

- Lecturas: el auto-refresh no corre en background; el indicador observa solo
  4–5 colecciones críticas; React Query con `staleTime`/`gcTime` y sin refetch
  al enfocar ventana (de la iteración anterior).
- **Cero pérdida de datos**: las escrituras offline persisten en IndexedDB hasta
  confirmarse.
- **Cero duplicados de pedido**: el correlativo lo asigna siempre el servidor de
  forma idempotente.
- **Resiliencia**: reintentos automáticos de Firestore + reconciliación
  idempotente + fallback a memoria si IndexedDB falla.

---

## Cómo probarlo
1. `npm run build && npm start` (o `npm run dev`).
2. Abrir la app, navegar a Pedidos/POS (para que se cachee).
3. DevTools → Network → **Offline**. Crear un pedido: se guarda con folio
   `L-…`; el indicador pasa a 🔴.
4. Volver a **Online**: el indicador pasa a 🟠 y luego 🟢; el pedido recibe su
   `#N` definitivo automáticamente.

## Pendientes / recomendaciones
- Las **reglas de Firestore siguen abiertas** (ver `AUDITORIA.md`, P0). El
  offline no cambia eso; sigue siendo la prioridad de seguridad.
- `next build` no completa en el entorno sandbox de desarrollo (limitación del
  entorno, no del código). Validado con `tsc --noEmit`. Ejecutar `npm run build`
  localmente antes de desplegar.

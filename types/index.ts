import { Timestamp } from "firebase/firestore";

export type Role = "SUPER_ADMIN" | "TRABAJADOR" | "AYUDANTE";

export const ROLES_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  TRABAJADOR: "Trabajador",
  AYUDANTE: "Ayudante",
};

// Permisos por rol
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  SUPER_ADMIN: [
    "acceso_total", "crear_usuarios", "editar_usuarios", "eliminar_usuarios",
    "ver_ventas", "ver_reportes", "gestionar_productos", "gestionar_promociones",
    "gestionar_inventario", "configuracion_general", "ver_auditoria",
    "crear_pedidos", "editar_pedidos", "ver_pedidos", "cambiar_estado_pedidos",
    "marcar_preparados", "ver_productos", "ver_stock", "ver_promociones",
  ],
  TRABAJADOR: [
    "crear_pedidos", "editar_pedidos", "cambiar_estado_pedidos",
    "ver_productos", "ver_stock", "ver_promociones", "ver_pedidos",
  ],
  AYUDANTE: [
    "ver_pedidos", "marcar_preparados", "ver_productos",
  ],
};

export function hasPermission(role: Role | null, permission: string): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export const SUPER_ADMIN_EMAIL = "lagaalfonso@gmail.com";

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: Role;
  activo: boolean;
  createdAt: Timestamp | Date;
  createdBy?: string;
  updatedAt?: Timestamp | Date;
}

export type ProductCategory =
  | "Rolls"
  | "Promociones"
  | "Sashimi"
  | "Gohan"
  | "Hand Roll"
  | "Bebidas"
  | "Extras";

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "Rolls",
  "Promociones",
  "Sashimi",
  "Gohan",
  "Hand Roll",
  "Bebidas",
  "Extras"
];

export interface Product extends SoftDeletable {
  id: string;
  nombre: string;
  categoria: ProductCategory;
  precioNormal: number;
  precioOferta?: number;
  descripcion?: string;
  activo: boolean;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface Promotion extends SoftDeletable {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  foto?: string;
  piezas?: number;
  activo: boolean;
  createdAt: Timestamp | Date;
}

export interface Customer extends SoftDeletable {
  id: string;
  nombre: string;
  telefono: string;
  direccion?: string;
  fechaPrimerPedido: Timestamp | Date;
  cantidadPedidos: number;
  totalGastado: number;
  ultimoPedido?: Timestamp | Date;
}

export type OrderItemType = "product" | "promotion";

export interface OrderItem {
  tipo: OrderItemType;
  refId: string;
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

export type OrderStatus =
  | "Pendiente"
  | "En preparación"
  | "Listo"
  | "En reparto"
  | "Entregado"
  | "Cancelado";

export const ORDER_STATUSES: OrderStatus[] = [
  "Pendiente",
  "En preparación",
  "Listo",
  "En reparto",
  "Entregado",
  "Cancelado"
];

export type PaymentMethod = "Efectivo" | "Transferencia" | "Débito" | "Crédito";

export const PAYMENT_METHODS: PaymentMethod[] = [
  "Efectivo",
  "Transferencia",
  "Débito",
  "Crédito"
];

export interface Order extends SoftDeletable {
  id: string;
  numeroPedido: number;
  pendienteNumero?: boolean;   // creado offline; número correlativo aún sin asignar
  createdLocal?: number;       // epoch local de creación (orden cronológico offline)
  fecha: Timestamp | Date;
  clienteId?: string;
  clienteNombre: string;
  telefono?: string;
  direccion?: string;
  observaciones?: string;
  items: OrderItem[];
  total: number;
  metodoPago: PaymentMethod;
  estado: OrderStatus;
  vendedorId?: string;
  vendedorNombre?: string;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface CashSession {
  id: string;
  fechaApertura: Timestamp | Date;
  fechaCierre?: Timestamp | Date;
  usuarioId: string;
  usuarioNombre: string;
  totalEfectivo: number;
  totalTransferencia: number;
  totalDebito: number;
  totalCredito: number;
  totalGeneral: number;
  cantidadPedidos: number;
  estado: "abierta" | "cerrada";
}

// ── Inventario ────────────────────────────────────────────────
export type InventoryUnit = "kg" | "g" | "unidad" | "litro" | "ml" | "bandeja" | "caja" | "paquete";

export const INVENTORY_UNITS: InventoryUnit[] = [
  "kg", "g", "unidad", "litro", "ml", "bandeja", "caja", "paquete"
];

export type MovementType = "entrada" | "salida" | "ajuste";

export interface InventoryItem {
  id: string;
  nombre: string;
  categoria: string;
  unidad: InventoryUnit;
  stockActual: number;
  stockMinimo: number;       // alerta de stock bajo
  stockSeguridad: number;    // nivel crítico
  precioUnitario?: number;   // costo por unidad
  proveedor?: string;
  descripcion?: string;
  activo: boolean;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  itemNombre: string;
  tipo: MovementType;
  cantidad: number;
  stockAnterior: number;
  stockResultante: number;
  motivo?: string;
  usuarioId?: string;
  usuarioNombre?: string;
  createdAt: Timestamp | Date;
}

export const INVENTORY_CATEGORIES = [
  "Pescados y Mariscos",
  "Arroz y Granos",
  "Salsas y Condimentos",
  "Verduras y Vegetales",
  "Algas y Envolturas",
  "Bebidas",
  "Utensilios y Envases",
  "Otros"
];

// ── AppNotification ────────────────────────────────────────────
export interface AppNotification {
  id: string;
  tipo: "nuevo" | "listo" | "entregado" | "cancelado";
  mensaje: string;
  pedidoId?: string;
  leida: boolean;
  createdAt: Timestamp | Date;
  destinatarioRol?: Role | "todos";
}

// ── Auditoría ──────────────────────────────────────────────────
export type AuditModule =
  | "pedidos"
  | "productos"
  | "inventario"
  | "promociones"
  | "clientes"
  | "usuarios"
  | "caja"
  | "auth";

export interface AuditLog {
  id: string;
  usuarioId: string;
  usuarioEmail: string;
  usuarioNombre: string;
  accion: string;            // ej: "crear_producto", "cambiar_precio"
  modulo: AuditModule | string;
  documentId?: string;       // ID del documento afectado
  beforeData?: any;          // valor anterior
  afterData?: any;           // valor nuevo
  observaciones?: string;
  detalle?: string;          // resumen legible (compat)
  ip?: string;
  createdAt: Timestamp | Date;
}

// Actor que ejecuta una acción (se pasa a los services para auditar)
export interface AuditActor {
  uid: string;
  email: string;
  name: string;
}

// Campos de borrado lógico compartidos
export interface SoftDeletable {
  deleted?: boolean;
  deletedAt?: Timestamp | Date;
  deletedBy?: string;        // email del usuario que eliminó
}

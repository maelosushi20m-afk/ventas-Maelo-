import { Timestamp } from "firebase/firestore";

export type Role = "admin" | "vendedor" | "caja";

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: Role;
  activo: boolean;
  createdAt: Timestamp | Date;
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

export interface Product {
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

export interface Promotion {
  id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  foto?: string;
  piezas?: number;
  activo: boolean;
  createdAt: Timestamp | Date;
}

export interface Customer {
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

export interface Order {
  id: string;
  numeroPedido: number;
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

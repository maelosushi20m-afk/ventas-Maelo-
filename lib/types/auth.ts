// Roles del sistema Maelo Rolls
export type UserRole = 'SUPER_ADMIN' | 'TRABAJADOR' | 'AYUDANTE'

export interface UserClaims {
  role: UserRole
  uid: string
  email: string
}

export interface MaeloUser {
  uid: string
  email: string
  displayName: string
  role: UserRole
  active: boolean
  createdAt: Date | string
  createdBy?: string
  updatedAt?: Date | string
  lastLogin?: Date | string
}

// Permisos por rol
export const PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: [
    'acceso_total',
    'crear_usuarios',
    'editar_usuarios',
    'eliminar_usuarios',
    'ver_ventas',
    'ver_reportes',
    'gestionar_productos',
    'gestionar_promociones',
    'gestionar_inventario',
    'configuracion_general',
    'ver_auditoria',
    'crear_pedidos',
    'editar_pedidos',
    'ver_pedidos',
    'cambiar_estado_pedidos',
    'marcar_preparados',
    'ver_productos',
    'ver_stock',
    'ver_promociones',
  ],
  TRABAJADOR: [
    'crear_pedidos',
    'editar_pedidos',
    'cambiar_estado_pedidos',
    'ver_productos',
    'ver_stock',
    'ver_promociones',
  ],
  AYUDANTE: [
    'ver_pedidos',
    'marcar_preparados',
    'ver_productos',
  ],
}

export function hasPermission(role: UserRole, permission: string): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false
}

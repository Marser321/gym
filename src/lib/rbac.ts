// ==============================================================================
// GYM CRM SaaS - RBAC Utility Library
// Provides role checking, permission guards, and helper functions
// for use in Server Actions, API routes, and Server Components.
// ==============================================================================

import { createClient } from '@/lib/supabase/server'
import type { ProfileRole } from '@/types/database'

// ─── Role Hierarchy ──────────────────────────────────────────────────────────

/**
 * Jerarquía de roles del sistema.
 * owner > admin > trainer > member
 *
 * 'owner' y 'admin' se agrupan como 'gym_admin' en el JWT app_metadata.
 */
export const ROLE_HIERARCHY: Record<string, number> = {
  owner: 4,
  admin: 3,
  gym_admin: 3,
  trainer: 2,
  member: 1,
} as const

export type AppRole = 'owner' | 'admin' | 'gym_admin' | 'trainer' | 'member'

// ─── Permission Matrix ──────────────────────────────────────────────────────

/**
 * Matriz de permisos por recurso y acción.
 * Define qué roles pueden realizar cada acción en cada recurso.
 */
export const PERMISSIONS = {
  // Gestión del gimnasio
  gym: {
    read: ['owner', 'admin', 'trainer', 'member'],
    update: ['owner', 'admin'],
    delete: ['owner'],
  },

  // Perfiles
  profiles: {
    read_all: ['owner', 'admin'],
    read_own: ['owner', 'admin', 'trainer', 'member'],
    read_clients: ['trainer'],
    update_own: ['owner', 'admin', 'trainer', 'member'],
    update_any: ['owner', 'admin'],
    delete: ['owner', 'admin'],
    set_role: ['owner', 'admin'],
  },

  // Clases y sesiones
  classes: {
    read: ['owner', 'admin', 'trainer', 'member'],
    create: ['owner', 'admin'],
    update_own: ['trainer'],
    update_any: ['owner', 'admin'],
    delete: ['owner', 'admin'],
  },

  class_sessions: {
    read: ['owner', 'admin', 'trainer', 'member'],
    create: ['owner', 'admin'],
    update_own: ['trainer'],
    update_any: ['owner', 'admin'],
    delete: ['owner', 'admin'],
    mark_attendance: ['owner', 'admin', 'trainer'],
  },

  // Inscripciones
  enrollments: {
    read_own: ['owner', 'admin', 'trainer', 'member'],
    read_session: ['owner', 'admin', 'trainer'],
    create_own: ['owner', 'admin', 'trainer', 'member'],
    cancel_own: ['owner', 'admin', 'trainer', 'member'],
  },

  // Finanzas (RESTRINGIDO: sin acceso para trainer)
  payments: {
    read_all: ['owner', 'admin'],
    read_own: ['member'],
    create: ['owner', 'admin'],
    update: ['owner', 'admin'],
  },

  subscriptions: {
    read_all: ['owner', 'admin'],
    read_own: ['member'],
    create: ['owner', 'admin'],
    update: ['owner', 'admin'],
    cancel: ['owner', 'admin'],
  },

  memberships: {
    read: ['owner', 'admin', 'trainer', 'member'],
    create: ['owner', 'admin'],
    update: ['owner', 'admin'],
    delete: ['owner', 'admin'],
  },

  // Entrenamiento
  routines: {
    read_templates: ['owner', 'admin', 'trainer', 'member'],
    read_own: ['trainer', 'member'],
    create: ['owner', 'admin', 'trainer'],
    update: ['owner', 'admin', 'trainer'],
    delete: ['owner', 'admin'],
  },

  exercises: {
    read: ['owner', 'admin', 'trainer', 'member'],
    create: ['owner', 'admin', 'trainer'],
    update: ['owner', 'admin', 'trainer'],
    delete: ['owner', 'admin'],
  },

  // Check-ins
  checkins: {
    read_all: ['owner', 'admin', 'trainer'],
    read_own: ['member'],
    create_own: ['owner', 'admin', 'trainer', 'member'],
    create_for_member: ['owner', 'admin', 'trainer'],
  },

  // Trainers
  trainers: {
    read: ['owner', 'admin', 'trainer', 'member'],
    create: ['owner', 'admin'],
    update: ['owner', 'admin'],
    delete: ['owner', 'admin'],
  },

  // Mensajes
  messages: {
    read_own: ['owner', 'admin', 'trainer', 'member'],
    send: ['owner', 'admin', 'trainer', 'member'],
  },

  // Dashboard / Analytics
  dashboard: {
    read_full: ['owner', 'admin'],
    read_basic: ['trainer'],
    refresh_views: ['owner', 'admin'],
  },

  // Auditoría
  audit_log: {
    read: ['owner', 'admin'],
  },
} as const

type Resource = keyof typeof PERMISSIONS
type Action<R extends Resource> = keyof (typeof PERMISSIONS)[R]

// ─── Core Auth Functions ────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string | null
  gymId: string | null
  role: AppRole
}

/**
 * Obtiene el usuario autenticado con su gym_id y rol.
 * Retorna null si no hay sesión o no hay gym_id.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient()
  if (!supabase) return null

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const gymId = user.app_metadata?.gym_id || null
  const role = (user.app_metadata?.role as AppRole) || 'member'

  return {
    id: user.id,
    email: user.email || null,
    gymId,
    role,
  }
}

/**
 * Verifica si el usuario autenticado tiene un rol mínimo en la jerarquía.
 */
export function hasMinRole(userRole: AppRole, minimumRole: AppRole): boolean {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[minimumRole] || 0)
}

/**
 * Verifica si un rol tiene un permiso específico en un recurso.
 */
export function hasPermission<R extends Resource>(
  role: AppRole,
  resource: R,
  action: Action<R>
): boolean {
  const allowedRoles = PERMISSIONS[resource]?.[action] as readonly string[] | undefined
  if (!allowedRoles) return false

  // Mapear owner/admin a sus equivalentes en la matriz
  const normalizedRole = role === 'gym_admin' ? 'admin' : role
  return allowedRoles.includes(normalizedRole) || allowedRoles.includes(role)
}

// ─── Guard Functions (para Server Actions) ──────────────────────────────────

export interface GuardResult {
  user: AuthUser
  gymId: string
}

export interface GuardError {
  error: string
  code: 'UNAUTHENTICATED' | 'NO_GYM' | 'FORBIDDEN'
}

/**
 * Guard que verifica autenticación + gym_id.
 * Retorna user y gymId si todo es correcto, o un error tipado.
 */
export async function requireAuth(): Promise<GuardResult | GuardError> {
  const user = await getAuthUser()

  if (!user) {
    return { error: 'No autenticado.', code: 'UNAUTHENTICATED' }
  }

  if (!user.gymId) {
    return { error: 'No se encontró gym_id en el usuario.', code: 'NO_GYM' }
  }

  return { user, gymId: user.gymId }
}

/**
 * Guard que verifica autenticación + rol mínimo.
 */
export async function requireRole(minimumRole: AppRole): Promise<GuardResult | GuardError> {
  const result = await requireAuth()

  if ('error' in result) return result

  if (!hasMinRole(result.user.role, minimumRole)) {
    return {
      error: `Acceso denegado. Se requiere rol ${minimumRole} o superior.`,
      code: 'FORBIDDEN',
    }
  }

  return result
}

/**
 * Guard que verifica un permiso específico en un recurso.
 */
export async function requirePermission<R extends Resource>(
  resource: R,
  action: Action<R>
): Promise<GuardResult | GuardError> {
  const result = await requireAuth()

  if ('error' in result) return result

  if (!hasPermission(result.user.role, resource, action)) {
    return {
      error: `Acceso denegado: no tiene permiso para ${String(action)} en ${resource}.`,
      code: 'FORBIDDEN',
    }
  }

  return result
}

// ─── Helper: Verificar si el resultado es un error ──────────────────────────

export function isGuardError(result: GuardResult | GuardError): result is GuardError {
  return 'error' in result
}

/**
 * Wrapper para server actions que requieren un guard.
 * Simplifica el patrón repetitivo de check + early return.
 *
 * Uso:
 * ```ts
 * export async function myAction() {
 *   return withGuard('admin', async ({ user, gymId }) => {
 *     // ... lógica protegida
 *     return { data: result, error: null }
 *   })
 * }
 * ```
 */
export async function withGuard<T>(
  minimumRole: AppRole,
  handler: (context: GuardResult) => Promise<T>
): Promise<T | { data: null; error: string }> {
  const result = await requireRole(minimumRole)

  if (isGuardError(result)) {
    return { data: null, error: result.error }
  }

  return handler(result)
}

/**
 * Wrapper para permisos específicos por recurso/acción.
 */
export async function withPermission<R extends Resource, T>(
  resource: R,
  action: Action<R>,
  handler: (context: GuardResult) => Promise<T>
): Promise<T | { data: null; error: string }> {
  const result = await requirePermission(resource, action)

  if (isGuardError(result)) {
    return { data: null, error: result.error }
  }

  return handler(result)
}

// ─── Role Display Helpers ───────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  gym_admin: 'Administrador',
  trainer: 'Entrenador',
  member: 'Miembro',
}

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  gym_admin: 'bg-blue-100 text-blue-800',
  trainer: 'bg-green-100 text-green-800',
  member: 'bg-gray-100 text-gray-800',
}

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] || 'Miembro'
}

export function getRoleColor(role: string): string {
  return ROLE_COLORS[role] || 'bg-gray-100 text-gray-800'
}

/**
 * Mapea el rol de profile a rol de app_metadata.
 * owner/admin -> gym_admin (para el JWT)
 */
export function toAppMetadataRole(profileRole: ProfileRole): string {
  if (profileRole === 'owner' || profileRole === 'admin') return 'gym_admin'
  return profileRole
}

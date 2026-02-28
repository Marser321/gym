'use server'

// ==============================================================================
// GYM CRM SaaS - RBAC Server Actions
// Operaciones protegidas por rol que envuelven las funciones SECURITY DEFINER.
// ==============================================================================

import { createClient } from '@/lib/supabase/server'
import {
  withGuard,
  withPermission,
  isGuardError,
  requireRole,
  type AppRole,
} from '@/lib/rbac'
import { revalidateTag } from 'next/cache'

// ─── Trainer: Marcar asistencia individual ──────────────────────────────────

export async function trainerMarkAttendance(
  sessionId: string,
  userId: string,
  status: 'attended' | 'no_show'
) {
  return withGuard('trainer', async ({ user }) => {
    const supabase = await createClient()
    if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

    const { data, error } = await supabase.rpc('trainer_mark_attendance', {
      p_session_id: sessionId,
      p_user_id: userId,
      p_status: status,
    })

    if (error) {
      // Traducir errores de PostgreSQL a mensajes amigables
      const msg = error.message
      if (msg.includes('Acceso denegado')) return { data: null, error: msg }
      if (msg.includes('no encontrada')) return { data: null, error: msg }
      if (msg.includes('No tiene permiso')) return { data: null, error: msg }
      if (msg.includes('cancelada')) return { data: null, error: msg }
      if (msg.includes('no está inscrito')) return { data: null, error: msg }
      return { data: null, error: `Error al marcar asistencia: ${msg}` }
    }

    revalidateTag('class-sessions', 'max')
    return { data, error: null }
  })
}

// ─── Trainer: Marcar asistencia en lote ─────────────────────────────────────

export async function trainerBulkMarkAttendance(
  sessionId: string,
  attendedIds: string[],
  noShowIds: string[]
) {
  return withGuard('trainer', async () => {
    const supabase = await createClient()
    if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

    const { data, error } = await supabase.rpc('trainer_bulk_mark_attendance', {
      p_session_id: sessionId,
      p_attended_ids: attendedIds,
      p_no_show_ids: noShowIds,
    })

    if (error) return { data: null, error: error.message }

    revalidateTag('class-sessions', 'max')
    return { data, error: null }
  })
}

// ─── Trainer: Obtener roster de sesión ──────────────────────────────────────

export async function trainerGetSessionRoster(sessionId: string) {
  return withGuard('trainer', async () => {
    const supabase = await createClient()
    if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

    const { data, error } = await supabase.rpc('trainer_get_session_roster', {
      p_session_id: sessionId,
    })

    if (error) return { data: null, error: error.message }

    return { data, error: null }
  })
}

// ─── Trainer: Registrar check-in de miembro ─────────────────────────────────

export async function trainerCheckinMember(
  userId: string,
  method: 'qr' | 'manual' | 'nfc' | 'biometric' = 'manual'
) {
  return withGuard('trainer', async () => {
    const supabase = await createClient()
    if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

    const { data, error } = await supabase.rpc('trainer_checkin_member', {
      p_user_id: userId,
      p_method: method,
    })

    if (error) return { data: null, error: error.message }

    revalidateTag('checkins', 'max')
    return { data, error: null }
  })
}

// ─── Admin: Cambiar rol de usuario ──────────────────────────────────────────

export async function adminSetUserRole(
  userId: string,
  newRole: 'admin' | 'trainer' | 'member'
) {
  return withGuard('admin', async ({ gymId }) => {
    const supabase = await createClient()
    if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

    // 1. Llamar a la función SQL SECURITY DEFINER para actualizar profiles + trainers
    const { data: sqlResult, error: sqlError } = await supabase.rpc('admin_set_user_role', {
      p_user_id: userId,
      p_new_role: newRole,
    })

    if (sqlError) return { data: null, error: sqlError.message }

    // 2. Actualizar app_metadata en Supabase Auth via Admin API
    //    Esto requiere service_role key para funcionar.
    //    El app_metadata.role es lo que el JWT usa para evaluar RLS.
    const supabaseAdmin = await createServiceRoleClient()
    if (supabaseAdmin) {
      const appMetadataRole = newRole === 'admin' ? 'gym_admin' : newRole
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          app_metadata: {
            gym_id: gymId,
            role: appMetadataRole,
          },
        }
      )

      if (authError) {
        // El rol en profiles se actualizó pero el JWT no se refrescó.
        // El usuario necesitará cerrar sesión y volver a iniciar.
        return {
          data: sqlResult,
          error: `Rol actualizado en profiles pero el JWT no se pudo refrescar: ${authError.message}. El usuario debe cerrar sesión y volver a iniciar.`,
        }
      }
    }

    revalidateTag('profiles', 'max')
    return { data: sqlResult, error: null }
  })
}

// ─── Admin: Obtener log de auditoría RBAC ───────────────────────────────────

export async function getAuditLog(params?: {
  actorId?: string
  action?: string
  limit?: number
}) {
  return withPermission('audit_log', 'read', async () => {
    const supabase = await createClient()
    if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

    let query = supabase
      .from('rbac_audit_log')
      .select(`
        *,
        actor:actor_id (full_name, email, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(params?.limit || 100)

    if (params?.actorId) {
      query = query.eq('actor_id', params.actorId)
    }

    if (params?.action) {
      query = query.eq('action', params.action)
    }

    // NOTA: RLS ya filtra por gym_id + is_gym_admin()
    const { data, error } = await query

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  })
}

// ─── Admin: Obtener todos los miembros con sus roles ────────────────────────

export async function getGymMembers(params?: {
  role?: AppRole
  status?: string
  search?: string
  limit?: number
}) {
  return withGuard('admin', async () => {
    const supabase = await createClient()
    if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(params?.limit || 100)

    if (params?.role) {
      query = query.eq('role', params.role)
    }

    if (params?.status) {
      query = query.eq('subscription_status', params.status)
    }

    if (params?.search) {
      query = query.or(
        `full_name.ilike.%${params.search}%,email.ilike.%${params.search}%`
      )
    }

    // RLS ya filtra por gym_id para admin
    const { data, error } = await query

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  })
}

// ─── Trainer: Obtener mis sesiones asignadas ────────────────────────────────

export async function getMyTrainerSessions(params?: {
  startDate?: string
  endDate?: string
  status?: string
}) {
  return withGuard('trainer', async ({ user }) => {
    const supabase = await createClient()
    if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

    // Obtener el trainer_id del usuario
    const { data: trainer } = await supabase
      .from('trainers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!trainer) return { data: null, error: 'No se encontró su perfil de entrenador.' }

    let query = supabase
      .from('class_sessions')
      .select(`
        *,
        classes:class_id (title, category, image_url),
        session_enrollments (
          id, user_id, status,
          profiles:user_id (full_name, avatar_url)
        )
      `)
      .eq('trainer_id', trainer.id)
      .order('start_at', { ascending: true })

    if (params?.startDate) {
      query = query.gte('session_date', params.startDate)
    }
    if (params?.endDate) {
      query = query.lte('session_date', params.endDate)
    }
    if (params?.status) {
      query = query.eq('status', params.status)
    }

    const { data, error } = await query

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  })
}

// ─── Trainer: Obtener mis clientes asignados ────────────────────────────────

export async function getMyClients() {
  return withGuard('trainer', async ({ user }) => {
    const supabase = await createClient()
    if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

    const { data, error } = await supabase
      .from('trainer_assignments')
      .select(`
        *,
        client:client_id (
          id, full_name, email, phone, avatar_url,
          subscription_status, level, rank_name
        )
      `)
      .eq('trainer_id', user.id)
      .eq('status', 'active')
      .order('assigned_at', { ascending: false })

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  })
}

// ─── Member: Obtener mi perfil e historial ──────────────────────────────────

export async function getMyProfile() {
  const result = await requireRole('member')
  if (isGuardError(result)) return { data: null, error: result.error }

  const supabase = await createClient()
  if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', result.user.id)
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ─── Member: Obtener mi historial de pagos ──────────────────────────────────

export async function getMyPaymentHistory(limit: number = 50) {
  const result = await requireRole('member')
  if (isGuardError(result)) return { data: null, error: result.error }

  const supabase = await createClient()
  if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

  // RLS ya filtra por member_id = auth.uid()
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('member_id', result.user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ─── Helper: Crear cliente con service_role (para admin operations) ─────────

async function createServiceRoleClient() {
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return null
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import type { ClassSession } from '@/types/database'

// ─── Obtener sesiones de clase por rango de fechas ──────────────────────────

export async function getClassSessions(params: {
  startDate: string
  endDate: string
  trainerId?: string
  status?: string
}) {
  const supabase = await createClient()
  if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

  let query = supabase
    .from('class_sessions')
    .select(`
      *,
      classes:class_id (title, category, image_url),
      trainers:trainer_id (
        id,
        specialty,
        profiles:user_id (full_name, avatar_url)
      )
    `)
    .gte('session_date', params.startDate)
    .lte('session_date', params.endDate)
    .order('start_at', { ascending: true })

  if (params.trainerId) {
    query = query.eq('trainer_id', params.trainerId)
  }

  if (params.status) {
    query = query.eq('status', params.status)
  }

  const { data, error } = await query

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

// ─── Crear una sesión de clase ──────────────────────────────────────────────

export async function createClassSession(session: {
  class_id: string
  trainer_id?: string
  room?: string
  session_date: string
  start_at: string
  end_at: string
  capacity?: number
}) {
  const supabase = await createClient()
  if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No autenticado' }

  const gymId = user.app_metadata?.gym_id
  if (!gymId) return { data: null, error: 'No se encontró gym_id en el usuario' }

  const { data, error } = await supabase
    .from('class_sessions')
    .insert({
      gym_id: gymId,
      class_id: session.class_id,
      trainer_id: session.trainer_id || null,
      room: session.room || null,
      session_date: session.session_date,
      start_at: session.start_at,
      end_at: session.end_at,
      capacity: session.capacity || 20,
    })
    .select()
    .single()

  if (error) {
    // Manejar errores de exclusion constraint de forma legible
    if (error.message.includes('excl_trainer_time_overlap')) {
      return {
        data: null,
        error: 'El entrenador ya tiene una sesión programada en ese horario.',
      }
    }
    if (error.message.includes('excl_room_time_overlap')) {
      return {
        data: null,
        error: 'La sala ya tiene una sesión programada en ese horario.',
      }
    }
    return { data: null, error: error.message }
  }

  revalidateTag('class-sessions', 'max')

  return { data, error: null }
}

// ─── Actualizar una sesión de clase ─────────────────────────────────────────

export async function updateClassSession(
  sessionId: string,
  updates: Partial<Pick<ClassSession, 'trainer_id' | 'room' | 'start_at' | 'end_at' | 'capacity' | 'status' | 'notes'>>
) {
  const supabase = await createClient()
  if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

  const { data, error } = await supabase
    .from('class_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    if (error.message.includes('excl_trainer_time_overlap')) {
      return {
        data: null,
        error: 'El entrenador ya tiene otra sesión en ese horario.',
      }
    }
    if (error.message.includes('excl_room_time_overlap')) {
      return {
        data: null,
        error: 'La sala ya está ocupada en ese horario.',
      }
    }
    return { data: null, error: error.message }
  }

  revalidateTag('class-sessions', 'max')

  return { data, error: null }
}

// ─── Cancelar una sesión de clase ───────────────────────────────────────────

export async function cancelClassSession(sessionId: string) {
  return updateClassSession(sessionId, { status: 'cancelled' })
}

// ─── Inscribir miembro en una sesión ────────────────────────────────────────

export async function enrollInSession(sessionId: string) {
  const supabase = await createClient()
  if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No autenticado' }

  const gymId = user.app_metadata?.gym_id
  if (!gymId) return { data: null, error: 'No se encontró gym_id' }

  const { data, error } = await supabase
    .from('session_enrollments')
    .insert({
      gym_id: gymId,
      session_id: sessionId,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { data: null, error: 'Ya estás inscrito en esta sesión.' }
    }
    if (error.message.includes('sesión cancelada')) {
      return { data: null, error: 'No se puede inscribir en una sesión cancelada.' }
    }
    return { data: null, error: error.message }
  }

  revalidateTag('class-sessions', 'max')

  return { data, error: null }
}

// ─── Cancelar inscripción ───────────────────────────────────────────────────

export async function cancelSessionEnrollment(sessionId: string) {
  const supabase = await createClient()
  if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No autenticado' }

  const { data, error } = await supabase
    .from('session_enrollments')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidateTag('class-sessions', 'max')

  return { data, error: null }
}

// ─── Marcar asistencia (para trainers/admin) ────────────────────────────────

export async function markAttendance(
  sessionId: string,
  userId: string,
  status: 'attended' | 'no_show'
) {
  const supabase = await createClient()
  if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

  const { data, error } = await supabase
    .from('session_enrollments')
    .update({ status })
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  return { data, error: null }
}

// ─── Obtener inscripciones de una sesión ────────────────────────────────────

export async function getSessionEnrollments(sessionId: string) {
  const supabase = await createClient()
  if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

  const { data, error } = await supabase
    .from('session_enrollments')
    .select(`
      *,
      profiles:user_id (id, full_name, avatar_url, email, phone)
    `)
    .eq('session_id', sessionId)
    .order('enrolled_at', { ascending: true })

  if (error) return { data: null, error: error.message }

  return { data, error: null }
}

// ─── Generar sesiones desde plantillas (admin) ──────────────────────────────

export async function generateSessionsFromTemplates(weeksAhead: number = 2) {
  const supabase = await createClient()
  if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No autenticado' }

  const gymId = user.app_metadata?.gym_id
  if (!gymId) return { data: null, error: 'No se encontró gym_id' }

  const { data, error } = await supabase
    .rpc('generate_class_sessions', {
      p_gym_id: gymId,
      p_weeks_ahead: weeksAhead,
    })

  if (error) return { data: null, error: error.message }

  revalidateTag('class-sessions', 'max')

  return { data: { created: data }, error: null }
}

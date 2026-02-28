'use server'

import { createClient } from '@/lib/supabase/server'
import type { GymMrr, GymAttendance, GymDashboardStats } from '@/types/database'

// ─── Obtener métricas MRR del gimnasio ──────────────────────────────────────

export async function getGymMrr(): Promise<{
  data: GymMrr | null
  error: string | null
}> {
  const supabase = await createClient()
  if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No autenticado' }

  const gymId = user.app_metadata?.gym_id
  if (!gymId) return { data: null, error: 'No se encontró gym_id' }

  // Intentar leer la vista materializada
  const { data, error } = await supabase
    .from('mv_gym_mrr')
    .select('*')
    .eq('gym_id', gymId)
    .single()

  if (error) {
    // Si la vista está vacía (WITH NO DATA), calcular en tiempo real como fallback
    if (error.code === 'PGRST116' || error.message.includes('no rows')) {
      return await calculateMrrRealtime(supabase, gymId)
    }
    return { data: null, error: error.message }
  }

  return { data: data as GymMrr, error: null }
}

// ─── Fallback: Calcular MRR en tiempo real ──────────────────────────────────

async function calculateMrrRealtime(
  supabase: Awaited<ReturnType<typeof createClient>>,
  gymId: string
): Promise<{ data: GymMrr | null; error: string | null }> {
  if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

  // Suscripciones activas
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('*, memberships:membership_id (name, duration_days, price)')
    .eq('status', 'active')

  // Pagos del mes actual
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: payments } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'completed')
    .gte('created_at', startOfMonth.toISOString())

  // Gym info
  const { data: gym } = await supabase
    .from('gyms')
    .select('name, currency')
    .eq('id', gymId)
    .single()

  const activeSubs = subs || []
  const monthlyPayments = payments || []

  const mrr = activeSubs.reduce((sum, sub) => {
    const membership = sub.memberships as { duration_days: number; price: number } | null
    if (!membership || membership.duration_days === 0) return sum + (sub.final_price || 0)
    return sum + ((sub.final_price || membership.price) / membership.duration_days) * 30
  }, 0)

  const currentMonthRevenue = monthlyPayments.reduce((sum, p) => sum + (p.amount || 0), 0)

  return {
    data: {
      gym_id: gymId,
      gym_name: gym?.name || '',
      currency: gym?.currency || 'EUR',
      mrr: Math.round(mrr * 100) / 100,
      active_subscriptions: activeSubs.length,
      auto_renew_count: activeSubs.filter(s => s.auto_renew).length,
      current_month_revenue: currentMonthRevenue,
      current_month_payments: monthlyPayments.length,
      previous_month_revenue: 0,
      mom_growth_pct: 0,
      estimated_arr: Math.round(mrr * 12 * 100) / 100,
      monthly_churn_count: 0,
      churn_rate_pct: 0,
      arpu: activeSubs.length > 0 ? Math.round((mrr / activeSubs.length) * 100) / 100 : 0,
      mrr_by_plan: [],
      refreshed_at: new Date().toISOString(),
    },
    error: null,
  }
}

// ─── Obtener métricas de asistencia ─────────────────────────────────────────

export async function getGymAttendance(): Promise<{
  data: GymAttendance | null
  error: string | null
}> {
  const supabase = await createClient()
  if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No autenticado' }

  const gymId = user.app_metadata?.gym_id
  if (!gymId) return { data: null, error: 'No se encontró gym_id' }

  const { data, error } = await supabase
    .from('mv_gym_attendance')
    .select('*')
    .eq('gym_id', gymId)
    .single()

  if (error) {
    // Fallback: datos básicos de checkins
    if (error.code === 'PGRST116' || error.message.includes('no rows')) {
      return await calculateAttendanceRealtime(supabase, gymId)
    }
    return { data: null, error: error.message }
  }

  return { data: data as GymAttendance, error: null }
}

// ─── Fallback: Calcular asistencia en tiempo real ───────────────────────────

async function calculateAttendanceRealtime(
  supabase: Awaited<ReturnType<typeof createClient>>,
  gymId: string
): Promise<{ data: GymAttendance | null; error: string | null }> {
  if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

  const today = new Date().toISOString().split('T')[0]

  const { data: todayCheckins } = await supabase
    .from('checkins')
    .select('user_id')
    .gte('checked_in_at', `${today}T00:00:00`)

  const { data: gym } = await supabase
    .from('gyms')
    .select('name')
    .eq('id', gymId)
    .single()

  const { data: activeMembers } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'member')
    .eq('subscription_status', 'active')

  const checkins = todayCheckins || []
  const uniqueToday = new Set(checkins.map(c => c.user_id)).size

  return {
    data: {
      gym_id: gymId,
      gym_name: gym?.name || '',
      checkins_today: checkins.length,
      unique_visitors_today: uniqueToday,
      checkins_this_week: 0,
      unique_visitors_week: 0,
      checkins_this_month: 0,
      unique_visitors_month: 0,
      checkins_prev_month: 0,
      checkins_mom_growth_pct: 0,
      class_attended: 0,
      class_no_shows: 0,
      class_cancelled: 0,
      class_total_enrollments: 0,
      class_attendance_rate_pct: 0,
      no_show_rate_pct: 0,
      utilization_rate_pct: 0,
      avg_visits_per_member: 0,
      active_members: activeMembers?.length || 0,
      total_members: 0,
      peak_hours: [],
      refreshed_at: new Date().toISOString(),
    },
    error: null,
  }
}

// ─── Obtener estadísticas consolidadas del dashboard ────────────────────────

export async function getGymDashboardStats(): Promise<{
  data: GymDashboardStats | null
  error: string | null
}> {
  const supabase = await createClient()
  if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No autenticado' }

  const gymId = user.app_metadata?.gym_id
  if (!gymId) return { data: null, error: 'No se encontró gym_id' }

  const { data, error } = await supabase
    .from('mv_gym_dashboard_stats')
    .select('*')
    .eq('gym_id', gymId)
    .single()

  if (error) {
    if (error.code === 'PGRST116' || error.message.includes('no rows')) {
      // Retornar datos vacíos si la vista no se ha refrescado aún
      const { data: gym } = await supabase
        .from('gyms')
        .select('name, plan')
        .eq('id', gymId)
        .single()

      return {
        data: {
          gym_id: gymId,
          gym_name: gym?.name || '',
          saas_plan: gym?.plan || 'free',
          upcoming_sessions: 0,
          completed_sessions_month: 0,
          pending_payments_count: 0,
          pending_payments_amount: 0,
          failed_payments_count: 0,
          failed_payments_amount: 0,
          subs_expiring_7d: 0,
          new_members_this_month: 0,
          total_trainers: 0,
          active_trainers: 0,
          refreshed_at: new Date().toISOString(),
        },
        error: null,
      }
    }
    return { data: null, error: error.message }
  }

  return { data: data as GymDashboardStats, error: null }
}

// ─── Refrescar vistas materializadas (admin only) ───────────────────────────

export async function refreshDashboardViews(): Promise<{
  success: boolean
  error: string | null
}> {
  const supabase = await createClient()
  if (!supabase) return { success: false, error: 'No se pudo conectar con Supabase' }

  const { error } = await supabase.rpc('refresh_all_materialized_views')

  if (error) return { success: false, error: error.message }

  return { success: true, error: null }
}

'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'

// ─── Obtener suscripciones de un miembro ────────────────────────────────────

export async function getMemberSubscriptions(userId?: string) {
  const supabase = await createClient()
  if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No autenticado' }

  const targetUserId = userId || user.id

  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      memberships:membership_id (name, duration_days, price, features)
    `)
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }

  return { data, error: null }
}

// ─── Crear nueva suscripción ────────────────────────────────────────────────

export async function createSubscription(params: {
  user_id: string
  membership_id: string
  payment_method?: string
  auto_renew?: boolean
  discount_pct?: number
  notes?: string
}) {
  const supabase = await createClient()
  if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No autenticado' }

  const gymId = user.app_metadata?.gym_id
  if (!gymId) return { data: null, error: 'No se encontró gym_id' }

  // Obtener datos de la membresía para calcular end_date y precio
  const { data: membership, error: membershipError } = await supabase
    .from('memberships')
    .select('*')
    .eq('id', params.membership_id)
    .single()

  if (membershipError || !membership) {
    return { data: null, error: 'No se encontró la membresía seleccionada.' }
  }

  if (!membership.is_active) {
    return { data: null, error: 'Esta membresía no está activa.' }
  }

  // Calcular fechas y precio
  const startDate = new Date().toISOString().split('T')[0]
  const endDate = new Date(Date.now() + membership.duration_days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const discountPct = params.discount_pct || 0
  const finalPrice = membership.price * (1 - discountPct / 100)

  // Cancelar suscripciones activas previas del mismo usuario
  await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_id', params.user_id)
    .eq('gym_id', gymId)
    .eq('status', 'active')

  // Crear la nueva suscripción
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .insert({
      gym_id: gymId,
      user_id: params.user_id,
      membership_id: params.membership_id,
      start_date: startDate,
      end_date: endDate,
      status: 'active',
      payment_method: params.payment_method || null,
      auto_renew: params.auto_renew || false,
      base_price: membership.price,
      discount_pct: discountPct,
      final_price: finalPrice,
      notes: params.notes || null,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  // Activar perfil del miembro
  await supabase
    .from('profiles')
    .update({ subscription_status: 'active' })
    .eq('id', params.user_id)
    .eq('gym_id', gymId)

  // Crear registro de pago
  await supabase
    .from('payments')
    .insert({
      gym_id: gymId,
      member_id: params.user_id,
      subscription_id: subscription.id,
      amount: finalPrice,
      plan_name: membership.name,
      payment_method: params.payment_method || null,
      status: 'pending',
    })

  revalidateTag('subscriptions', 'max')

  return { data: subscription, error: null }
}

// ─── Pausar suscripción (freeze) ────────────────────────────────────────────

export async function pauseSubscription(
  subscriptionId: string,
  freezeDays: number
) {
  const supabase = await createClient()
  if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

  const freezeStart = new Date().toISOString().split('T')[0]
  const freezeEnd = new Date(Date.now() + freezeDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  // La lógica de cambiar el status del perfil a 'suspended' se maneja
  // automáticamente por el trigger handle_subscription_expiry
  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      status: 'paused',
      freeze_start: freezeStart,
      freeze_end: freezeEnd,
    })
    .eq('id', subscriptionId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidateTag('subscriptions', 'max')

  return { data, error: null }
}

// ─── Cancelar suscripción ───────────────────────────────────────────────────

export async function cancelSubscription(subscriptionId: string) {
  const supabase = await createClient()
  if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

  // El trigger handle_subscription_expiry se encargará de:
  // 1. Cambiar el perfil a 'inactive'
  // 2. Registrar en subscription_audit_log
  const { data, error } = await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .eq('id', subscriptionId)
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  revalidateTag('subscriptions', 'max')

  return { data, error: null }
}

// ─── Registrar pago ─────────────────────────────────────────────────────────

export async function recordPayment(params: {
  member_id: string
  subscription_id?: string
  amount: number
  plan_name?: string
  payment_method: string
  status?: string
  reference_code?: string
  notes?: string
}) {
  const supabase = await createClient()
  if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No autenticado' }

  const gymId = user.app_metadata?.gym_id
  if (!gymId) return { data: null, error: 'No se encontró gym_id' }

  const { data, error } = await supabase
    .from('payments')
    .insert({
      gym_id: gymId,
      member_id: params.member_id,
      subscription_id: params.subscription_id || null,
      amount: params.amount,
      plan_name: params.plan_name || null,
      payment_method: params.payment_method,
      status: params.status || 'completed',
      reference_code: params.reference_code || null,
      notes: params.notes || null,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }

  // Si el pago es completado y tiene suscripción vinculada,
  // actualizar el pago pendiente
  if (params.status === 'completed' && params.subscription_id) {
    await supabase
      .from('payments')
      .update({ status: 'completed' })
      .eq('subscription_id', params.subscription_id)
      .eq('status', 'pending')
  }

  revalidateTag('payments', 'max')

  return { data, error: null }
}

// ─── Obtener historial de pagos ─────────────────────────────────────────────

export async function getPaymentHistory(params?: {
  memberId?: string
  status?: string
  limit?: number
}) {
  const supabase = await createClient()
  if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

  let query = supabase
    .from('payments')
    .select(`
      *,
      profiles:member_id (full_name, email, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(params?.limit || 50)

  if (params?.memberId) {
    query = query.eq('member_id', params.memberId)
  }

  if (params?.status) {
    query = query.eq('status', params.status)
  }

  const { data, error } = await query

  if (error) return { data: null, error: error.message }

  return { data, error: null }
}

// ─── Obtener log de auditoría de suscripciones ──────────────────────────────

export async function getSubscriptionAuditLog(params?: {
  userId?: string
  subscriptionId?: string
  limit?: number
}) {
  const supabase = await createClient()
  if (!supabase) return { data: null, error: 'No se pudo conectar con Supabase' }

  let query = supabase
    .from('subscription_audit_log')
    .select(`
      *,
      profiles:user_id (full_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(params?.limit || 100)

  if (params?.userId) {
    query = query.eq('user_id', params.userId)
  }

  if (params?.subscriptionId) {
    query = query.eq('subscription_id', params.subscriptionId)
  }

  const { data, error } = await query

  if (error) return { data: null, error: error.message }

  return { data, error: null }
}

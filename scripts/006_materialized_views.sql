-- ==============================================================================
-- GYM CRM SaaS - MATERIALIZED VIEWS: MRR & ATTENDANCE (v3.1)
--
-- Vistas materializadas para dashboards de administrador.
-- Se refrescan periódicamente (no en tiempo real) para no sobrecargar la BD.
--
-- Vistas creadas:
--   1. mv_gym_mrr             - MRR (Monthly Recurring Revenue) por gimnasio
--   2. mv_gym_attendance      - Tasa de asistencia por gimnasio
--   3. mv_gym_dashboard_stats - Vista consolidada para el dashboard principal
-- ==============================================================================


-- ==============================================================================
-- VISTA MATERIALIZADA 1: MRR (Ingreso Mensual Recurrente)
--
-- Calcula el MRR de cada gimnasio basándose en:
--   - Suscripciones activas con precio mensual normalizado.
--   - Pagos completados del mes actual.
--   - Desglose por plan de membresía.
--   - Comparación MoM (mes actual vs mes anterior).
-- ==============================================================================

drop materialized view if exists public.mv_gym_mrr cascade;
create materialized view public.mv_gym_mrr as

with active_subs as (
  -- Suscripciones activas con su precio mensual normalizado
  select
    s.gym_id,
    s.id as subscription_id,
    s.user_id,
    s.membership_id,
    m.name as plan_name,
    m.duration_days,
    s.final_price,
    -- Normalizar a precio mensual (30 días)
    case
      when m.duration_days > 0
      then round((s.final_price / m.duration_days) * 30, 2)
      else s.final_price
    end as monthly_normalized_price,
    s.auto_renew,
    s.start_date,
    s.end_date
  from public.subscriptions s
  left join public.memberships m on m.id = s.membership_id
  where s.status = 'active'
),

current_month_revenue as (
  -- Pagos completados del mes actual
  select
    p.gym_id,
    sum(p.amount) as revenue,
    count(*) as payment_count
  from public.payments p
  where p.status = 'completed'
    and date_trunc('month', p.created_at) = date_trunc('month', current_timestamp)
  group by p.gym_id
),

previous_month_revenue as (
  -- Pagos completados del mes anterior (para comparación MoM)
  select
    p.gym_id,
    sum(p.amount) as revenue,
    count(*) as payment_count
  from public.payments p
  where p.status = 'completed'
    and date_trunc('month', p.created_at) = date_trunc('month', current_timestamp - interval '1 month')
  group by p.gym_id
),

mrr_by_plan as (
  -- MRR desglosado por plan de membresía
  select
    a.gym_id,
    a.plan_name,
    count(*) as active_subs_count,
    sum(a.monthly_normalized_price) as plan_mrr
  from active_subs a
  group by a.gym_id, a.plan_name
),

churn_data as (
  -- Suscripciones canceladas/expiradas este mes (para churn rate)
  select
    s.gym_id,
    count(*) as churned_count
  from public.subscriptions s
  where s.status in ('cancelled', 'expired')
    and date_trunc('month', s.updated_at) = date_trunc('month', current_timestamp)
  group by s.gym_id
)

select
  g.id as gym_id,
  g.name as gym_name,
  g.currency,

  -- MRR calculado desde suscripciones activas
  coalesce(sum(a.monthly_normalized_price), 0)::decimal(12,2) as mrr,

  -- Total de suscripciones activas
  count(distinct a.subscription_id)::int as active_subscriptions,

  -- Suscripciones con auto-renovación
  count(distinct a.subscription_id) filter (where a.auto_renew = true)::int as auto_renew_count,

  -- Ingreso real del mes actual
  coalesce(cmr.revenue, 0)::decimal(12,2) as current_month_revenue,
  coalesce(cmr.payment_count, 0)::int as current_month_payments,

  -- Ingreso del mes anterior
  coalesce(pmr.revenue, 0)::decimal(12,2) as previous_month_revenue,

  -- Crecimiento MoM (%)
  case
    when coalesce(pmr.revenue, 0) > 0
    then round(((coalesce(cmr.revenue, 0) - pmr.revenue) / pmr.revenue) * 100, 2)
    else 0
  end::decimal(6,2) as mom_growth_pct,

  -- ARR estimado (MRR x 12)
  (coalesce(sum(a.monthly_normalized_price), 0) * 12)::decimal(12,2) as estimated_arr,

  -- Churn del mes
  coalesce(cd.churned_count, 0)::int as monthly_churn_count,

  -- Churn rate (%)
  case
    when count(distinct a.subscription_id) > 0
    then round(
      (coalesce(cd.churned_count, 0)::decimal / count(distinct a.subscription_id)) * 100,
      2
    )
    else 0
  end::decimal(6,2) as churn_rate_pct,

  -- ARPU (Average Revenue Per User)
  case
    when count(distinct a.user_id) > 0
    then round(coalesce(sum(a.monthly_normalized_price), 0) / count(distinct a.user_id), 2)
    else 0
  end::decimal(10,2) as arpu,

  -- Desglose por plan (JSON array)
  coalesce(
    (select jsonb_agg(
      jsonb_build_object(
        'plan_name', mp.plan_name,
        'count', mp.active_subs_count,
        'mrr', mp.plan_mrr
      ) order by mp.plan_mrr desc
    )
    from mrr_by_plan mp
    where mp.gym_id = g.id),
    '[]'::jsonb
  ) as mrr_by_plan,

  -- Timestamp de refresco
  now() as refreshed_at

from public.gyms g
left join active_subs a on a.gym_id = g.id
left join current_month_revenue cmr on cmr.gym_id = g.id
left join previous_month_revenue pmr on pmr.gym_id = g.id
left join churn_data cd on cd.gym_id = g.id
where g.is_active = true
group by g.id, g.name, g.currency, cmr.revenue, cmr.payment_count, pmr.revenue, cd.churned_count

with no data;  -- Se llena al hacer REFRESH

comment on materialized view public.mv_gym_mrr is
  'MRR, ARR, churn rate, ARPU y desglose por plan para cada gimnasio. Refrescar cada hora.';

-- Índice único requerido para REFRESH CONCURRENTLY
create unique index if not exists idx_mv_gym_mrr_gym
  on public.mv_gym_mrr(gym_id);


-- ==============================================================================
-- VISTA MATERIALIZADA 2: TASA DE ASISTENCIA
--
-- Métricas de asistencia por gimnasio:
--   - Check-ins totales y únicos (día, semana, mes).
--   - Asistencia a clases (sesiones con attendance).
--   - Tasa de no-show y cancelaciones.
--   - Horarios pico.
-- ==============================================================================

drop materialized view if exists public.mv_gym_attendance cascade;
create materialized view public.mv_gym_attendance as

with daily_checkins as (
  select
    c.gym_id,
    count(*) as total_today,
    count(distinct c.user_id) as unique_today
  from public.checkins c
  where c.checked_in_at::date = current_date
  group by c.gym_id
),

weekly_checkins as (
  select
    c.gym_id,
    count(*) as total_week,
    count(distinct c.user_id) as unique_week
  from public.checkins c
  where c.checked_in_at >= date_trunc('week', current_timestamp)
  group by c.gym_id
),

monthly_checkins as (
  select
    c.gym_id,
    count(*) as total_month,
    count(distinct c.user_id) as unique_month
  from public.checkins c
  where c.checked_in_at >= date_trunc('month', current_timestamp)
  group by c.gym_id
),

previous_month_checkins as (
  select
    c.gym_id,
    count(*) as total_prev_month,
    count(distinct c.user_id) as unique_prev_month
  from public.checkins c
  where c.checked_in_at >= date_trunc('month', current_timestamp - interval '1 month')
    and c.checked_in_at < date_trunc('month', current_timestamp)
  group by c.gym_id
),

class_attendance as (
  -- Asistencia a sesiones de clases (del mes actual)
  select
    se.gym_id,
    count(*) filter (where se.status = 'attended') as attended,
    count(*) filter (where se.status = 'enrolled') as enrolled,
    count(*) filter (where se.status = 'no_show') as no_shows,
    count(*) filter (where se.status = 'cancelled') as cancelled,
    count(*) as total_enrollments
  from public.session_enrollments se
  join public.class_sessions cs on cs.id = se.session_id
  where cs.session_date >= date_trunc('month', current_date)::date
  group by se.gym_id
),

peak_hours as (
  -- Top 3 horas pico (últimos 30 días)
  select
    c.gym_id,
    jsonb_agg(
      jsonb_build_object(
        'hour', ph.hour_of_day,
        'count', ph.checkin_count
      ) order by ph.checkin_count desc
    ) as peak_hours_json
  from (
    select
      gym_id,
      extract(hour from checked_in_at)::int as hour_of_day,
      count(*) as checkin_count,
      row_number() over (partition by gym_id order by count(*) desc) as rn
    from public.checkins
    where checked_in_at >= (current_timestamp - interval '30 days')
    group by gym_id, extract(hour from checked_in_at)::int
  ) ph
  join public.checkins c on c.gym_id = ph.gym_id
  where ph.rn <= 5
  group by c.gym_id
),

member_counts as (
  select
    p.gym_id,
    count(*) filter (where p.subscription_status = 'active') as active_members,
    count(*) as total_members
  from public.profiles p
  where p.role = 'member'
  group by p.gym_id
)

select
  g.id as gym_id,
  g.name as gym_name,

  -- Check-ins hoy
  coalesce(dc.total_today, 0)::int as checkins_today,
  coalesce(dc.unique_today, 0)::int as unique_visitors_today,

  -- Check-ins esta semana
  coalesce(wc.total_week, 0)::int as checkins_this_week,
  coalesce(wc.unique_week, 0)::int as unique_visitors_week,

  -- Check-ins este mes
  coalesce(mc.total_month, 0)::int as checkins_this_month,
  coalesce(mc.unique_month, 0)::int as unique_visitors_month,

  -- Comparación con mes anterior
  coalesce(pmc.total_prev_month, 0)::int as checkins_prev_month,
  case
    when coalesce(pmc.total_prev_month, 0) > 0
    then round(((coalesce(mc.total_month, 0)::decimal - pmc.total_prev_month) / pmc.total_prev_month) * 100, 2)
    else 0
  end::decimal(6,2) as checkins_mom_growth_pct,

  -- Asistencia a clases
  coalesce(ca.attended, 0)::int as class_attended,
  coalesce(ca.no_shows, 0)::int as class_no_shows,
  coalesce(ca.cancelled, 0)::int as class_cancelled,
  coalesce(ca.total_enrollments, 0)::int as class_total_enrollments,

  -- Tasa de asistencia a clases (%)
  case
    when coalesce(ca.total_enrollments, 0) > 0
    then round((coalesce(ca.attended, 0)::decimal / ca.total_enrollments) * 100, 2)
    else 0
  end::decimal(6,2) as class_attendance_rate_pct,

  -- Tasa de no-show (%)
  case
    when coalesce(ca.total_enrollments, 0) > 0
    then round((coalesce(ca.no_shows, 0)::decimal / ca.total_enrollments) * 100, 2)
    else 0
  end::decimal(6,2) as no_show_rate_pct,

  -- Tasa de utilización (miembros activos que vinieron este mes / total activos)
  case
    when coalesce(memb.active_members, 0) > 0
    then round((coalesce(mc.unique_month, 0)::decimal / memb.active_members) * 100, 2)
    else 0
  end::decimal(6,2) as utilization_rate_pct,

  -- Frecuencia promedio (visitas por miembro activo este mes)
  case
    when coalesce(mc.unique_month, 0) > 0
    then round(coalesce(mc.total_month, 0)::decimal / mc.unique_month, 1)
    else 0
  end::decimal(6,1) as avg_visits_per_member,

  -- Miembros
  coalesce(memb.active_members, 0)::int as active_members,
  coalesce(memb.total_members, 0)::int as total_members,

  -- Horarios pico (JSON)
  coalesce(ph.peak_hours_json, '[]'::jsonb) as peak_hours,

  -- Timestamp de refresco
  now() as refreshed_at

from public.gyms g
left join daily_checkins dc on dc.gym_id = g.id
left join weekly_checkins wc on wc.gym_id = g.id
left join monthly_checkins mc on mc.gym_id = g.id
left join previous_month_checkins pmc on pmc.gym_id = g.id
left join class_attendance ca on ca.gym_id = g.id
left join peak_hours ph on ph.gym_id = g.id
left join member_counts memb on memb.gym_id = g.id
where g.is_active = true

with no data;

comment on materialized view public.mv_gym_attendance is
  'Métricas de asistencia, utilización y no-shows por gimnasio. Refrescar cada 15-30 minutos.';

create unique index if not exists idx_mv_gym_attendance_gym
  on public.mv_gym_attendance(gym_id);


-- ==============================================================================
-- VISTA MATERIALIZADA 3: DASHBOARD CONSOLIDADO
-- Combina MRR + Attendance + métricas generales para el dashboard principal.
-- ==============================================================================

drop materialized view if exists public.mv_gym_dashboard_stats cascade;
create materialized view public.mv_gym_dashboard_stats as

with gym_sessions as (
  select
    cs.gym_id,
    count(*) filter (where cs.status = 'scheduled' and cs.session_date >= current_date) as upcoming_sessions,
    count(*) filter (where cs.status = 'completed' and cs.session_date >= date_trunc('month', current_date)::date) as completed_sessions_month,
    count(*) filter (where cs.status = 'cancelled') as cancelled_sessions_month
  from public.class_sessions cs
  where cs.session_date >= date_trunc('month', current_date)::date
  group by cs.gym_id
),

pending_payments as (
  select
    p.gym_id,
    count(*) as pending_count,
    coalesce(sum(p.amount), 0) as pending_amount
  from public.payments p
  where p.status = 'pending'
  group by p.gym_id
),

failed_payments as (
  select
    p.gym_id,
    count(*) as failed_count,
    coalesce(sum(p.amount), 0) as failed_amount
  from public.payments p
  where p.status = 'failed'
    and p.created_at >= date_trunc('month', current_timestamp)
  group by p.gym_id
),

expiring_subs as (
  select
    s.gym_id,
    count(*) as expiring_7d_count
  from public.subscriptions s
  where s.status = 'active'
    and s.end_date between current_date and (current_date + 7)
  group by s.gym_id
),

new_members as (
  select
    p.gym_id,
    count(*) as new_this_month
  from public.profiles p
  where p.role = 'member'
    and p.created_at >= date_trunc('month', current_timestamp)
  group by p.gym_id
),

trainer_stats as (
  select
    t.gym_id,
    count(*) as total_trainers,
    count(*) filter (where t.is_active = true) as active_trainers
  from public.trainers t
  group by t.gym_id
)

select
  g.id as gym_id,
  g.name as gym_name,
  g.plan as saas_plan,

  -- Sesiones
  coalesce(gs.upcoming_sessions, 0)::int as upcoming_sessions,
  coalesce(gs.completed_sessions_month, 0)::int as completed_sessions_month,

  -- Pagos pendientes
  coalesce(pp.pending_count, 0)::int as pending_payments_count,
  coalesce(pp.pending_amount, 0)::decimal(12,2) as pending_payments_amount,

  -- Pagos fallidos
  coalesce(fp.failed_count, 0)::int as failed_payments_count,
  coalesce(fp.failed_amount, 0)::decimal(12,2) as failed_payments_amount,

  -- Suscripciones a punto de expirar
  coalesce(es.expiring_7d_count, 0)::int as subs_expiring_7d,

  -- Nuevos miembros este mes
  coalesce(nm.new_this_month, 0)::int as new_members_this_month,

  -- Trainers
  coalesce(ts.total_trainers, 0)::int as total_trainers,
  coalesce(ts.active_trainers, 0)::int as active_trainers,

  now() as refreshed_at

from public.gyms g
left join gym_sessions gs on gs.gym_id = g.id
left join pending_payments pp on pp.gym_id = g.id
left join failed_payments fp on fp.gym_id = g.id
left join expiring_subs es on es.gym_id = g.id
left join new_members nm on nm.gym_id = g.id
left join trainer_stats ts on ts.gym_id = g.id
where g.is_active = true

with no data;

comment on materialized view public.mv_gym_dashboard_stats is
  'Métricas consolidadas del dashboard: sesiones, pagos, suscripciones, nuevos miembros.';

create unique index if not exists idx_mv_gym_dashboard_gym
  on public.mv_gym_dashboard_stats(gym_id);


-- ==============================================================================
-- FUNCIONES DE REFRESCO
-- Diseñadas para ser invocadas desde pg_cron o Supabase Edge Functions.
-- Usan CONCURRENTLY para no bloquear lecturas durante el refresco.
-- ==============================================================================

-- Refresco individual de cada vista
create or replace function public.refresh_mrr_view()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  refresh materialized view concurrently public.mv_gym_mrr;
end;
$$;

create or replace function public.refresh_attendance_view()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  refresh materialized view concurrently public.mv_gym_attendance;
end;
$$;

create or replace function public.refresh_dashboard_view()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  refresh materialized view concurrently public.mv_gym_dashboard_stats;
end;
$$;

-- Refresco completo de todas las vistas (para cron diario o manual)
create or replace function public.refresh_all_materialized_views()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Primero, poblar si están vacías (WITH NO DATA)
  begin
    refresh materialized view public.mv_gym_mrr;
  exception when others then
    refresh materialized view public.mv_gym_mrr;
  end;

  begin
    refresh materialized view public.mv_gym_attendance;
  exception when others then
    refresh materialized view public.mv_gym_attendance;
  end;

  begin
    refresh materialized view public.mv_gym_dashboard_stats;
  exception when others then
    refresh materialized view public.mv_gym_dashboard_stats;
  end;

  -- Ahora refrescar concurrently (sin bloqueo)
  refresh materialized view concurrently public.mv_gym_mrr;
  refresh materialized view concurrently public.mv_gym_attendance;
  refresh materialized view concurrently public.mv_gym_dashboard_stats;
end;
$$;

comment on function public.refresh_all_materialized_views() is
  'Refresca todas las vistas materializadas. Ejecutar via cron cada 30-60 minutos.';


-- ==============================================================================
-- CONFIGURACIÓN RECOMENDADA DE pg_cron (ejecutar manualmente si está disponible)
-- ==============================================================================
-- Si pg_cron está habilitado en Supabase:
--
--   -- Refrescar MRR cada hora
--   select cron.schedule('refresh-mrr', '0 * * * *', 'select public.refresh_mrr_view()');
--
--   -- Refrescar asistencia cada 15 minutos
--   select cron.schedule('refresh-attendance', '*/15 * * * *', 'select public.refresh_attendance_view()');
--
--   -- Refrescar dashboard cada 30 minutos
--   select cron.schedule('refresh-dashboard', '*/30 * * * *', 'select public.refresh_dashboard_view()');
--
--   -- Expirar suscripciones diariamente a las 3:00 AM
--   select cron.schedule('expire-subs', '0 3 * * *', 'select public.expire_subscriptions_batch()');
--
--   -- Generar sesiones de clases semanalmente (domingos a las 2:00 AM)
--   select cron.schedule('gen-sessions', '0 2 * * 0',
--     $$select public.generate_class_sessions(id, 2) from public.gyms where is_active = true$$
--   );
-- ==============================================================================

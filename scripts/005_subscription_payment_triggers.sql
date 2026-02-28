-- ==============================================================================
-- GYM CRM SaaS - SUBSCRIPTION & PAYMENT EXPIRY TRIGGERS (v3.1)
--
-- Triggers automáticos que desactivan miembros cuando:
--   1. Su suscripción expira (end_date < current_date).
--   2. Un pago es rechazado (status = 'failed').
--   3. Una suscripción es cancelada manualmente.
--
-- Lógica de negocio:
--   - profiles.subscription_status se sincroniza con el estado real.
--   - Se da un período de gracia configurable antes de desactivar.
--   - Se registra un log de auditoría para rastrear cambios automáticos.
-- ==============================================================================


-- ==============================================================================
-- TABLA: SUBSCRIPTION_AUDIT_LOG
-- Registro inmutable de cambios de estado en suscripciones (trazabilidad).
-- ==============================================================================

create table if not exists public.subscription_audit_log (
  id              uuid primary key default gen_random_uuid(),
  gym_id          uuid not null references public.gyms(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  user_id         uuid references public.profiles(id) on delete set null,
  old_status      text,
  new_status      text,
  reason          text not null,                               -- 'expired', 'payment_failed', 'cancelled', 'manual'
  metadata        jsonb default '{}'::jsonb,                   -- Datos extra (payment_id, etc.)
  triggered_by    text default 'system'                        -- 'system', 'admin', 'cron'
                    check (triggered_by in ('system', 'admin', 'cron', 'webhook')),
  created_at      timestamptz default now()
);

comment on table public.subscription_audit_log is 'Log de auditoría inmutable para cambios automáticos y manuales de estado de suscripciones.';

-- RLS
alter table public.subscription_audit_log enable row level security;

create policy "audit_log_select_admin" on public.subscription_audit_log
  for select using (
    gym_id = public.get_my_gym_id()
    and public.is_gym_admin()
  );

create policy "audit_log_insert_system" on public.subscription_audit_log
  for insert with check (
    gym_id = public.get_my_gym_id()
  );

-- Índices
create index if not exists idx_audit_log_gym_id
  on public.subscription_audit_log(gym_id);

create index if not exists idx_audit_log_gym_user
  on public.subscription_audit_log(gym_id, user_id, created_at desc);

create index if not exists idx_audit_log_subscription
  on public.subscription_audit_log(subscription_id, created_at desc);


-- ==============================================================================
-- TRIGGER 1: Auto-expirar suscripción cuando end_date pasa
-- Se ejecuta cuando se actualiza una suscripción o se consulta.
-- Diseñado para uso con cron job (pg_cron o Supabase Edge Function).
-- ==============================================================================

create or replace function public.handle_subscription_expiry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _grace_days int := 3;  -- Período de gracia configurable
begin
  -- Solo actuar si el status cambia a 'expired' o si end_date pasó
  if new.status = 'active' and new.end_date < (current_date - _grace_days) then
    -- Marcar suscripción como expirada
    new.status := 'expired';

    -- Actualizar el perfil del miembro a 'inactive'
    update public.profiles
    set subscription_status = 'inactive',
        updated_at = now()
    where id = new.user_id
      and gym_id = new.gym_id;

    -- Registrar en auditoría
    insert into public.subscription_audit_log (
      gym_id, subscription_id, user_id,
      old_status, new_status, reason, metadata, triggered_by
    ) values (
      new.gym_id, new.id, new.user_id,
      'active', 'expired',
      'expired',
      jsonb_build_object(
        'end_date', new.end_date::text,
        'grace_days', _grace_days,
        'expired_at', now()::text
      ),
      'system'
    );
  end if;

  -- Si se cancela manualmente, también desactivar perfil
  if old.status = 'active' and new.status = 'cancelled' then
    update public.profiles
    set subscription_status = 'inactive',
        updated_at = now()
    where id = new.user_id
      and gym_id = new.gym_id;

    insert into public.subscription_audit_log (
      gym_id, subscription_id, user_id,
      old_status, new_status, reason, triggered_by
    ) values (
      new.gym_id, new.id, new.user_id,
      old.status, 'cancelled',
      'cancelled',
      'admin'
    );
  end if;

  -- Si se pausa, marcar perfil como suspended
  if old.status = 'active' and new.status = 'paused' then
    update public.profiles
    set subscription_status = 'suspended',
        updated_at = now()
    where id = new.user_id
      and gym_id = new.gym_id;

    insert into public.subscription_audit_log (
      gym_id, subscription_id, user_id,
      old_status, new_status, reason,
      metadata, triggered_by
    ) values (
      new.gym_id, new.id, new.user_id,
      old.status, 'paused',
      'paused',
      jsonb_build_object(
        'freeze_start', coalesce(new.freeze_start::text, current_date::text),
        'freeze_end', new.freeze_end::text
      ),
      'admin'
    );
  end if;

  -- Si se reactiva, volver a active
  if old.status in ('paused', 'expired', 'cancelled') and new.status = 'active' then
    update public.profiles
    set subscription_status = 'active',
        updated_at = now()
    where id = new.user_id
      and gym_id = new.gym_id;

    insert into public.subscription_audit_log (
      gym_id, subscription_id, user_id,
      old_status, new_status, reason, triggered_by
    ) values (
      new.gym_id, new.id, new.user_id,
      old.status, 'active',
      'reactivated',
      'admin'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_subscription_expiry on public.subscriptions;
create trigger trg_subscription_expiry
  before update on public.subscriptions
  for each row execute function public.handle_subscription_expiry();

comment on function public.handle_subscription_expiry() is
  'Gestiona transiciones de estado de suscripciones y sincroniza profiles.subscription_status.';


-- ==============================================================================
-- TRIGGER 2: Pago rechazado -> suspender suscripción y desactivar miembro
-- Se ejecuta cuando un pago cambia a status = 'failed'.
-- ==============================================================================

create or replace function public.handle_payment_failed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _sub_id       uuid;
  _user_id      uuid;
  _fail_count   int;
  _max_retries  int := 3;  -- Máximo de pagos fallidos antes de suspender
begin
  -- Solo actuar cuando el pago cambia a 'failed'
  if new.status = 'failed' and (old.status is null or old.status != 'failed') then

    -- Obtener la suscripción asociada
    _sub_id  := new.subscription_id;
    _user_id := new.member_id;

    -- Si no hay suscripción vinculada, intentar buscar la activa del miembro
    if _sub_id is null and _user_id is not null then
      select id into _sub_id
      from public.subscriptions
      where user_id = _user_id
        and gym_id = new.gym_id
        and status = 'active'
      order by end_date desc
      limit 1;
    end if;

    -- Contar pagos fallidos recientes (últimos 30 días) para este miembro
    select count(*) into _fail_count
    from public.payments
    where gym_id = new.gym_id
      and member_id = _user_id
      and status = 'failed'
      and created_at > (now() - interval '30 days');

    -- Registrar en auditoría siempre
    insert into public.subscription_audit_log (
      gym_id, subscription_id, user_id,
      old_status, new_status, reason,
      metadata, triggered_by
    ) values (
      new.gym_id, _sub_id, _user_id,
      'active', case when _fail_count >= _max_retries then 'suspended' else 'warning' end,
      'payment_failed',
      jsonb_build_object(
        'payment_id', new.id::text,
        'amount', new.amount::text,
        'fail_count', _fail_count,
        'max_retries', _max_retries,
        'payment_method', new.payment_method
      ),
      'system'
    );

    -- Si se superó el máximo de reintentos, suspender todo
    if _fail_count >= _max_retries then
      -- Suspender la suscripción
      if _sub_id is not null then
        update public.subscriptions
        set status = 'paused',
            notes = coalesce(notes, '') || ' [AUTO-SUSPENDIDO: ' || _fail_count || ' pagos fallidos el ' || now()::date::text || ']',
            updated_at = now()
        where id = _sub_id;
      end if;

      -- Desactivar el perfil del miembro
      if _user_id is not null then
        update public.profiles
        set subscription_status = 'inactive',
            updated_at = now()
        where id = _user_id
          and gym_id = new.gym_id;
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_payment_failed on public.payments;
create trigger trg_payment_failed
  after insert or update on public.payments
  for each row execute function public.handle_payment_failed();

comment on function public.handle_payment_failed() is
  'Suspende suscripciones y desactiva miembros tras múltiples pagos fallidos.';


-- ==============================================================================
-- FUNCIÓN CRON: Expirar suscripciones vencidas en batch
-- Reemplaza la función simple del script 003. Ahora con auditoría completa.
-- Diseñada para ejecutarse diariamente via pg_cron o Edge Function.
-- ==============================================================================

create or replace function public.expire_subscriptions_batch()
returns table (
  expired_count     int,
  notified_count    int,
  warning_count     int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  _grace_days       int := 3;
  _warning_days     int := 7;  -- Avisar 7 días antes de expirar
  _expired          int := 0;
  _notified         int := 0;
  _warned           int := 0;
  _sub              record;
begin
  -- ═══════════════════════════════════════════════════════════════════════════
  -- PASO 1: Expirar suscripciones vencidas (con período de gracia)
  -- ═══════════════════════════════════════════════════════════════════════════
  for _sub in
    select s.id, s.gym_id, s.user_id, s.end_date, s.status
    from public.subscriptions s
    where s.status = 'active'
      and s.end_date < (current_date - _grace_days)
  loop
    -- Marcar como expirada
    update public.subscriptions
    set status = 'expired',
        updated_at = now()
    where id = _sub.id;

    -- Desactivar perfil
    update public.profiles
    set subscription_status = 'inactive',
        updated_at = now()
    where id = _sub.user_id
      and gym_id = _sub.gym_id;

    -- Auditoría
    insert into public.subscription_audit_log (
      gym_id, subscription_id, user_id,
      old_status, new_status, reason,
      metadata, triggered_by
    ) values (
      _sub.gym_id, _sub.id, _sub.user_id,
      'active', 'expired', 'expired',
      jsonb_build_object(
        'end_date', _sub.end_date::text,
        'grace_days', _grace_days,
        'batch_run', now()::text
      ),
      'cron'
    );

    _expired := _expired + 1;
  end loop;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- PASO 2: Registrar avisos para suscripciones que están a punto de expirar
  -- (para que el backend envíe notificaciones por email/push)
  -- ═══════════════════════════════════════════════════════════════════════════
  for _sub in
    select s.id, s.gym_id, s.user_id, s.end_date
    from public.subscriptions s
    where s.status = 'active'
      and s.end_date between current_date and (current_date + _warning_days)
      -- Solo avisar una vez (no repetir si ya se avisó hoy)
      and not exists (
        select 1 from public.subscription_audit_log sal
        where sal.subscription_id = s.id
          and sal.reason = 'expiry_warning'
          and sal.created_at::date = current_date
      )
  loop
    insert into public.subscription_audit_log (
      gym_id, subscription_id, user_id,
      old_status, new_status, reason,
      metadata, triggered_by
    ) values (
      _sub.gym_id, _sub.id, _sub.user_id,
      'active', 'active', 'expiry_warning',
      jsonb_build_object(
        'end_date', _sub.end_date::text,
        'days_remaining', (_sub.end_date - current_date),
        'warning_date', current_date::text
      ),
      'cron'
    );

    _warned := _warned + 1;
  end loop;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- PASO 3: Descongelar suscripciones pausadas cuyo freeze_end ha llegado
  -- ═══════════════════════════════════════════════════════════════════════════
  for _sub in
    select s.id, s.gym_id, s.user_id, s.freeze_end, s.end_date
    from public.subscriptions s
    where s.status = 'paused'
      and s.freeze_end is not null
      and s.freeze_end <= current_date
      -- Solo descongelar si la suscripción no ha expirado
      and s.end_date >= current_date
  loop
    update public.subscriptions
    set status = 'active',
        freeze_start = null,
        freeze_end = null,
        updated_at = now()
    where id = _sub.id;

    update public.profiles
    set subscription_status = 'active',
        updated_at = now()
    where id = _sub.user_id
      and gym_id = _sub.gym_id;

    insert into public.subscription_audit_log (
      gym_id, subscription_id, user_id,
      old_status, new_status, reason,
      metadata, triggered_by
    ) values (
      _sub.gym_id, _sub.id, _sub.user_id,
      'paused', 'active', 'auto_unfreeze',
      jsonb_build_object(
        'freeze_end', _sub.freeze_end::text,
        'end_date', _sub.end_date::text
      ),
      'cron'
    );

    _notified := _notified + 1;
  end loop;

  return query select _expired, _notified, _warned;
end;
$$;

comment on function public.expire_subscriptions_batch() is
  'Proceso batch diario: expira suscripciones, envía avisos, descongela pausas. Ejecutar via cron.';


-- ==============================================================================
-- TRIGGER 3: Auto-renovar suscripciones con auto_renew = true
-- Se activa cuando una suscripción se marca como expirada.
-- ==============================================================================

create or replace function public.handle_auto_renewal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _membership   record;
  _new_sub_id   uuid;
begin
  -- Solo actuar cuando pasa de 'active' a 'expired' con auto_renew = true
  if old.status = 'active' and new.status = 'expired' and new.auto_renew = true then

    -- Obtener datos del plan de membresía
    if new.membership_id is not null then
      select duration_days, price, name
      into _membership
      from public.memberships
      where id = new.membership_id
        and is_active = true;

      -- Si el plan sigue activo, crear nueva suscripción
      if found then
        _new_sub_id := gen_random_uuid();

        insert into public.subscriptions (
          id, gym_id, user_id, membership_id,
          start_date, end_date, status,
          payment_method, auto_renew,
          base_price, final_price
        ) values (
          _new_sub_id, new.gym_id, new.user_id, new.membership_id,
          current_date,
          current_date + _membership.duration_days,
          'active',
          new.payment_method,
          true,
          _membership.price,
          _membership.price * (1 - coalesce(new.discount_pct, 0) / 100)
        );

        -- Reactivar perfil
        update public.profiles
        set subscription_status = 'active',
            updated_at = now()
        where id = new.user_id
          and gym_id = new.gym_id;

        -- Crear pago pendiente para la nueva suscripción
        insert into public.payments (
          gym_id, member_id, subscription_id,
          amount, plan_name, payment_method, status
        ) values (
          new.gym_id, new.user_id, _new_sub_id,
          _membership.price * (1 - coalesce(new.discount_pct, 0) / 100),
          _membership.name,
          new.payment_method,
          'pending'
        );

        -- Auditoría
        insert into public.subscription_audit_log (
          gym_id, subscription_id, user_id,
          old_status, new_status, reason,
          metadata, triggered_by
        ) values (
          new.gym_id, _new_sub_id, new.user_id,
          'expired', 'active', 'auto_renewed',
          jsonb_build_object(
            'old_subscription_id', new.id::text,
            'new_subscription_id', _new_sub_id::text,
            'membership_name', _membership.name,
            'price', _membership.price::text
          ),
          'system'
        );
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_auto_renewal on public.subscriptions;
create trigger trg_auto_renewal
  after update on public.subscriptions
  for each row execute function public.handle_auto_renewal();

comment on function public.handle_auto_renewal() is
  'Renueva automáticamente suscripciones con auto_renew=true cuando expiran.';

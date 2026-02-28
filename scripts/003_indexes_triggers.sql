-- ==============================================================================
-- GYM CRM SaaS - INDEXES & TRIGGERS (v3.0)
-- Índices B-tree en gym_id + triggers de utilidad.
-- ==============================================================================

-- ==============================================================================
-- ÍNDICES B-TREE EN TODAS LAS COLUMNAS gym_id
-- Optimizan las consultas filtradas por tenant (RLS + queries explícitas).
-- ==============================================================================

-- Core
create index if not exists idx_profiles_gym_id          on public.profiles(gym_id);
create index if not exists idx_trainers_gym_id          on public.trainers(gym_id);
create index if not exists idx_memberships_gym_id       on public.memberships(gym_id);
create index if not exists idx_subscriptions_gym_id     on public.subscriptions(gym_id);
create index if not exists idx_classes_gym_id           on public.classes(gym_id);
create index if not exists idx_class_enrollments_gym_id on public.class_enrollments(gym_id);
create index if not exists idx_payments_gym_id          on public.payments(gym_id);

-- Operations
create index if not exists idx_checkins_gym_id          on public.checkins(gym_id);
create index if not exists idx_routines_gym_id          on public.routines(gym_id);
create index if not exists idx_exercises_gym_id         on public.exercises(gym_id);
create index if not exists idx_routine_exercises_gym_id on public.routine_exercises(gym_id);
create index if not exists idx_workout_logs_gym_id      on public.workout_logs(gym_id);

-- Social / Communication
create index if not exists idx_trainer_assignments_gym_id on public.trainer_assignments(gym_id);
create index if not exists idx_messages_gym_id            on public.messages(gym_id);
create index if not exists idx_membership_requests_gym_id on public.membership_requests(gym_id);

-- ==============================================================================
-- ÍNDICES COMPUESTOS ADICIONALES (para queries frecuentes)
-- ==============================================================================

-- Búsqueda de perfiles por gym + role
create index if not exists idx_profiles_gym_role
  on public.profiles(gym_id, role);

-- Suscripciones activas por gym
create index if not exists idx_subscriptions_gym_status
  on public.subscriptions(gym_id, status);

-- Clases activas por gym + día
create index if not exists idx_classes_gym_day
  on public.classes(gym_id, day_of_week) where is_active = true;

-- Pagos por gym + fecha (para reportes financieros)
create index if not exists idx_payments_gym_created
  on public.payments(gym_id, created_at desc);

-- Check-ins por gym + fecha (para aforo en tiempo real)
create index if not exists idx_checkins_gym_date
  on public.checkins(gym_id, checked_in_at desc);

-- Rutinas por gym + asignación
create index if not exists idx_routines_gym_assigned
  on public.routines(gym_id, assigned_to);

-- Workout logs por usuario + fecha
create index if not exists idx_workout_logs_gym_user
  on public.workout_logs(gym_id, user_id, completed_at desc);

-- Mensajes por gym + receptor (para bandeja de entrada)
create index if not exists idx_messages_gym_receiver
  on public.messages(gym_id, receiver_id, created_at desc);

-- Gym slug (para lookups por URL)
create index if not exists idx_gyms_slug
  on public.gyms(slug);


-- ==============================================================================
-- TRIGGERS: updated_at automático
-- ==============================================================================

create or replace function public.trigger_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Aplicar trigger a todas las tablas con updated_at
do $$
declare
  tbl text;
begin
  for tbl in
    select unnest(array[
      'gyms', 'profiles', 'trainers', 'memberships',
      'subscriptions', 'classes', 'routines'
    ])
  loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I;
       create trigger set_updated_at
         before update on public.%I
         for each row execute function public.trigger_set_updated_at();',
      tbl, tbl
    );
  end loop;
end;
$$;


-- ==============================================================================
-- TRIGGER: Auto-crear perfil al registrarse (multi-tenant)
-- Extrae gym_id del user_metadata durante el signup.
-- ==============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _gym_id uuid;
begin
  -- El gym_id se pasa durante el signup en raw_user_meta_data
  _gym_id := (new.raw_user_meta_data ->> 'gym_id')::uuid;

  -- Si no hay gym_id, intentar extraerlo de app_metadata
  if _gym_id is null then
    _gym_id := (new.raw_app_meta_data ->> 'gym_id')::uuid;
  end if;

  -- Solo crear perfil si tenemos un gym_id válido
  if _gym_id is not null then
    insert into public.profiles (id, gym_id, email, full_name, avatar_url, role)
    values (
      new.id,
      _gym_id,
      new.email,
      coalesce(new.raw_user_meta_data ->> 'full_name', ''),
      coalesce(new.raw_user_meta_data ->> 'avatar_url', ''),
      coalesce(new.raw_user_meta_data ->> 'role', 'member')
    )
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

-- Recrear el trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ==============================================================================
-- FUNCIÓN: Gamificación (actualizada para multi-tenant)
-- ==============================================================================

create or replace function public.award_xp(p_user_id uuid, p_amount int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set 
    xp = xp + p_amount,
    level = floor((xp + p_amount) / 1000) + 1,
    rank_name = case
      when floor((xp + p_amount) / 1000) + 1 >= 10 then 'Diamante'
      when floor((xp + p_amount) / 1000) + 1 >= 7 then 'Platino'
      when floor((xp + p_amount) / 1000) + 1 >= 5 then 'Oro'
      when floor((xp + p_amount) / 1000) + 1 >= 3 then 'Plata'
      else 'Bronce'
    end
  where id = p_user_id;
end;
$$;


-- ==============================================================================
-- FUNCIÓN: Expirar suscripciones vencidas (para cron job)
-- ==============================================================================

create or replace function public.expire_subscriptions()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  affected int;
begin
  update public.subscriptions
  set status = 'expired'
  where status = 'active'
    and end_date < current_date;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

comment on function public.expire_subscriptions() is 'Marca como expiradas las suscripciones vencidas. Ejecutar periódicamente via cron.';


-- ==============================================================================
-- REALTIME: Habilitar para tablas clave
-- ==============================================================================

-- Nota: Solo ejecutar si las tablas no están ya en la publicación.
-- Supabase puede requerir que se ejecute desde el dashboard.
do $$
begin
  -- Intentar agregar las tablas a realtime (ignorar errores si ya existen)
  begin alter publication supabase_realtime add table checkins; exception when others then null; end;
  begin alter publication supabase_realtime add table messages; exception when others then null; end;
  begin alter publication supabase_realtime add table class_enrollments; exception when others then null; end;
end;
$$;

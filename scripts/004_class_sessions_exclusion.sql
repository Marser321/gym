-- ==============================================================================
-- GYM CRM SaaS - CLASS SESSIONS + EXCLUSION CONSTRAINTS (v3.1)
--
-- Problema: La tabla `classes` define plantillas recurrentes (ej. "Yoga lunes 10:00").
-- Se necesita una tabla `class_sessions` para instancias concretas con fecha y hora,
-- sobre la cual aplicar restricciones de exclusión temporal.
--
-- Restricciones implementadas:
--   1. Un mismo trainer no puede tener dos sesiones solapadas en el mismo gym.
--   2. Una misma sala (room) no puede tener dos sesiones solapadas en el mismo gym.
-- ==============================================================================

-- Extensión requerida para EXCLUDE con operador &&
create extension if not exists btree_gist;

-- ==============================================================================
-- TABLA: CLASS_SESSIONS (Instancias concretas de clases)
-- Cada fila = una sesión específica en una fecha/hora concreta.
-- ==============================================================================

create table if not exists public.class_sessions (
  id              uuid primary key default gen_random_uuid(),
  gym_id          uuid not null references public.gyms(id) on delete cascade,
  class_id        uuid not null references public.classes(id) on delete cascade,
  trainer_id      uuid references public.trainers(id) on delete set null,
  room            text,                                        -- Sala: "Sala A", "Estudio 1", etc.
  session_date    date not null,                               -- Fecha concreta de la sesión
  start_at        timestamptz not null,                        -- Inicio exacto (fecha + hora)
  end_at          timestamptz not null,                        -- Fin exacto (fecha + hora)
  capacity        int not null default 20,
  enrolled_count  int not null default 0,                      -- Contador desnormalizado
  status          text not null default 'scheduled'
                    check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')),
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),

  -- Validación básica: fin después de inicio
  constraint class_sessions_time_check check (end_at > start_at),

  -- Validación: enrolled no puede superar capacity
  constraint class_sessions_capacity_check check (enrolled_count <= capacity),

  -- =========================================================================
  -- EXCLUSION CONSTRAINT 1: Mismo trainer, mismo gym, no puede solaparse
  -- Usa btree_gist para combinar = con && (overlap de tstzrange).
  -- Solo aplica cuando trainer_id no es null y la sesión no está cancelada.
  -- =========================================================================
  constraint excl_trainer_time_overlap
    exclude using gist (
      gym_id       with =,
      trainer_id   with =,
      tstzrange(start_at, end_at, '[)') with &&
    )
    where (trainer_id is not null and status != 'cancelled'),

  -- =========================================================================
  -- EXCLUSION CONSTRAINT 2: Misma sala, mismo gym, no puede solaparse.
  -- Evita asignar la misma sala a dos sesiones simultáneas.
  -- =========================================================================
  constraint excl_room_time_overlap
    exclude using gist (
      gym_id       with =,
      room         with =,
      tstzrange(start_at, end_at, '[)') with &&
    )
    where (room is not null and status != 'cancelled')
);

comment on table public.class_sessions is 'Instancias concretas de clases con restricciones de exclusión temporal para trainers y salas.';
comment on constraint excl_trainer_time_overlap on public.class_sessions is 'Impide que un trainer tenga dos sesiones solapadas en el mismo gimnasio.';
comment on constraint excl_room_time_overlap on public.class_sessions is 'Impide que una sala tenga dos sesiones solapadas en el mismo gimnasio.';


-- ==============================================================================
-- TABLA: SESSION_ENROLLMENTS (Inscripciones a sesiones concretas)
-- Reemplaza class_enrollments para sesiones puntuales.
-- ==============================================================================

create table if not exists public.session_enrollments (
  id              uuid primary key default gen_random_uuid(),
  gym_id          uuid not null references public.gyms(id) on delete cascade,
  session_id      uuid not null references public.class_sessions(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  status          text not null default 'enrolled'
                    check (status in ('enrolled', 'attended', 'cancelled', 'no_show', 'waitlisted')),
  enrolled_at     timestamptz default now(),
  cancelled_at    timestamptz,

  -- Un usuario solo puede inscribirse una vez por sesión
  unique(session_id, user_id)
);

comment on table public.session_enrollments is 'Inscripciones de socios a sesiones concretas de clases.';


-- ==============================================================================
-- ÍNDICES B-TREE para class_sessions y session_enrollments
-- ==============================================================================

create index if not exists idx_class_sessions_gym_id
  on public.class_sessions(gym_id);

create index if not exists idx_class_sessions_gym_date
  on public.class_sessions(gym_id, session_date);

create index if not exists idx_class_sessions_gym_trainer
  on public.class_sessions(gym_id, trainer_id)
  where trainer_id is not null;

create index if not exists idx_class_sessions_gym_status
  on public.class_sessions(gym_id, status)
  where status != 'cancelled';

create index if not exists idx_class_sessions_class
  on public.class_sessions(class_id);

create index if not exists idx_session_enrollments_gym_id
  on public.session_enrollments(gym_id);

create index if not exists idx_session_enrollments_session
  on public.session_enrollments(session_id, status);

create index if not exists idx_session_enrollments_user
  on public.session_enrollments(user_id, enrolled_at desc);


-- ==============================================================================
-- TRIGGER: Actualizar enrolled_count automáticamente
-- Mantiene el contador desnormalizado sincronizado con session_enrollments.
-- ==============================================================================

create or replace function public.update_session_enrolled_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Recalcular el conteo desde la fuente de verdad
  if tg_op = 'DELETE' then
    update public.class_sessions
    set enrolled_count = (
      select count(*) from public.session_enrollments
      where session_id = old.session_id
        and status in ('enrolled', 'attended')
    )
    where id = old.session_id;
    return old;
  else
    update public.class_sessions
    set enrolled_count = (
      select count(*) from public.session_enrollments
      where session_id = new.session_id
        and status in ('enrolled', 'attended')
    )
    where id = new.session_id;
    return new;
  end if;
end;
$$;

drop trigger if exists trg_update_session_enrolled on public.session_enrollments;
create trigger trg_update_session_enrolled
  after insert or update or delete on public.session_enrollments
  for each row execute function public.update_session_enrolled_count();


-- ==============================================================================
-- FUNCIÓN: Validar capacidad antes de inscribir
-- Rechaza inscripción si la sesión está llena (con opción de lista de espera).
-- ==============================================================================

create or replace function public.validate_session_enrollment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _capacity    int;
  _enrolled    int;
  _status      text;
begin
  -- Solo validar en INSERT o UPDATE que cambie a 'enrolled'
  if new.status not in ('enrolled', 'attended') then
    return new;
  end if;

  -- Obtener datos de la sesión
  select capacity, enrolled_count, status
  into _capacity, _enrolled, _status
  from public.class_sessions
  where id = new.session_id;

  -- No permitir inscripción a sesiones canceladas
  if _status = 'cancelled' then
    raise exception 'No se puede inscribir en una sesión cancelada.';
  end if;

  -- Si está llena, poner en lista de espera automáticamente
  if _enrolled >= _capacity then
    new.status := 'waitlisted';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_session_enrollment on public.session_enrollments;
create trigger trg_validate_session_enrollment
  before insert or update on public.session_enrollments
  for each row execute function public.validate_session_enrollment();


-- ==============================================================================
-- FUNCIÓN: Generar sesiones a partir de plantillas de clases
-- Crea sesiones futuras basadas en las clases recurrentes de un gimnasio.
-- Parámetros: p_gym_id (UUID), p_weeks_ahead (int) = semanas a generar.
-- ==============================================================================

create or replace function public.generate_class_sessions(
  p_gym_id uuid,
  p_weeks_ahead int default 2
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  _class    record;
  _date     date;
  _start    timestamptz;
  _end      timestamptz;
  _tz       text;
  _created  int := 0;
  _week     int;
begin
  -- Obtener timezone del gimnasio
  select coalesce(timezone, 'Europe/Madrid')
  into _tz
  from public.gyms where id = p_gym_id;

  -- Iterar sobre cada clase activa del gimnasio
  for _class in
    select c.id, c.trainer_id, c.day_of_week, c.start_time, c.end_time,
           c.capacity, c.room
    from public.classes c
    where c.gym_id = p_gym_id
      and c.is_active = true
      and c.recurrence = 'weekly'
      and c.day_of_week is not null
  loop
    -- Generar para las próximas N semanas
    for _week in 0..(p_weeks_ahead - 1) loop
      -- Calcular la fecha de la sesión
      _date := current_date
        + ((_class.day_of_week - extract(dow from current_date)::int + 7) % 7)
        + (_week * 7);

      -- Solo generar sesiones futuras
      if _date >= current_date then
        -- Construir timestamps con timezone del gym
        _start := (_date || ' ' || _class.start_time)::timestamp at time zone _tz;
        _end   := (_date || ' ' || _class.end_time)::timestamp at time zone _tz;

        -- Insertar solo si no existe ya una sesión para esta clase en esa fecha
        insert into public.class_sessions (
          gym_id, class_id, trainer_id, room, session_date,
          start_at, end_at, capacity
        )
        values (
          p_gym_id, _class.id, _class.trainer_id, _class.room, _date,
          _start, _end, _class.capacity
        )
        on conflict do nothing;

        _created := _created + 1;
      end if;
    end loop;
  end loop;

  return _created;
end;
$$;

comment on function public.generate_class_sessions(uuid, int) is
  'Genera sesiones concretas a partir de plantillas de clases recurrentes. Ejecutar semanalmente via cron.';


-- ==============================================================================
-- RLS: CLASS_SESSIONS
-- ==============================================================================

alter table public.class_sessions enable row level security;

create policy "class_sessions_select_same_gym" on public.class_sessions
  for select using (
    gym_id = public.get_my_gym_id()
  );

create policy "class_sessions_insert_staff" on public.class_sessions
  for insert with check (
    gym_id = public.get_my_gym_id()
    and public.is_gym_trainer()
  );

create policy "class_sessions_update_staff" on public.class_sessions
  for update using (
    gym_id = public.get_my_gym_id()
    and public.is_gym_trainer()
  );

create policy "class_sessions_delete_admin" on public.class_sessions
  for delete using (
    gym_id = public.get_my_gym_id()
    and public.is_gym_admin()
  );


-- ==============================================================================
-- RLS: SESSION_ENROLLMENTS
-- ==============================================================================

alter table public.session_enrollments enable row level security;

create policy "session_enrollments_select_same_gym" on public.session_enrollments
  for select using (
    gym_id = public.get_my_gym_id()
    and (
      user_id = auth.uid()
      or public.is_gym_trainer()
    )
  );

create policy "session_enrollments_insert_member" on public.session_enrollments
  for insert with check (
    gym_id = public.get_my_gym_id()
    and user_id = auth.uid()
  );

create policy "session_enrollments_update_staff" on public.session_enrollments
  for update using (
    gym_id = public.get_my_gym_id()
    and (
      user_id = auth.uid()
      or public.is_gym_trainer()
    )
  );

create policy "session_enrollments_delete" on public.session_enrollments
  for delete using (
    gym_id = public.get_my_gym_id()
    and (
      user_id = auth.uid()
      or public.is_gym_admin()
    )
  );


-- ==============================================================================
-- TRIGGER: updated_at para class_sessions
-- ==============================================================================

drop trigger if exists set_updated_at on public.class_sessions;
create trigger set_updated_at
  before update on public.class_sessions
  for each row execute function public.trigger_set_updated_at();


-- ==============================================================================
-- REALTIME: Habilitar para sesiones y enrollments
-- ==============================================================================

do $$
begin
  begin alter publication supabase_realtime add table class_sessions; exception when others then null; end;
  begin alter publication supabase_realtime add table session_enrollments; exception when others then null; end;
end;
$$;

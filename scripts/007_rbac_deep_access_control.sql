-- ==============================================================================
-- GYM CRM SaaS - DEEP RBAC: Role-Based Access Control (v3.2)
--
-- Define tres roles:  gym_admin  |  trainer  |  member
-- Almacenados en  auth.users -> raw_app_meta_data ->> 'role'
-- y en  profiles.role  ('owner'|'admin' mapean a gym_admin).
--
-- Este script implementa:
--   1. Funciones helper puras de rol (reemplazan las v3.0).
--   2. Funciones SECURITY DEFINER para operaciones entre-roles.
--   3. Tabla rbac_audit_log para trazabilidad de acciones privilegiadas.
--   4. Reemplazo completo de políticas RLS con granularidad por rol.
-- ==============================================================================


-- ════════════════════════════════════════════════════════════════════════════
-- 0. TABLA: RBAC AUDIT LOG
-- Registra toda operación realizada vía funciones SECURITY DEFINER.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.rbac_audit_log (
  id            uuid primary key default gen_random_uuid(),
  gym_id        uuid not null references public.gyms(id) on delete cascade,
  actor_id      uuid not null,                     -- UID del usuario que ejecuta la acción
  actor_role    text not null,                     -- Rol del actor al momento de la acción
  action        text not null,                     -- 'mark_attendance', 'bulk_attendance', etc.
  target_table  text not null,                     -- Tabla afectada
  target_id     uuid,                              -- PK del registro afectado
  details       jsonb default '{}'::jsonb,         -- Datos contextuales
  created_at    timestamptz default now()
);

create index if not exists idx_rbac_audit_gym
  on public.rbac_audit_log(gym_id, created_at desc);
create index if not exists idx_rbac_audit_actor
  on public.rbac_audit_log(gym_id, actor_id, created_at desc);

alter table public.rbac_audit_log enable row level security;

-- Solo admins ven el audit log
create policy "rbac_audit_select_admin" on public.rbac_audit_log
  for select using (
    gym_id = public.get_my_gym_id()
    and public.is_gym_admin()
  );

-- Las inserciones se hacen desde funciones SECURITY DEFINER, no desde el cliente
create policy "rbac_audit_insert_definer" on public.rbac_audit_log
  for insert with check (
    gym_id = public.get_my_gym_id()
  );


-- ════════════════════════════════════════════════════════════════════════════
-- 1. FUNCIONES HELPER DE ROL (reemplazan v3.0)
-- Extraen rol del JWT app_metadata para evaluación rápida en RLS.
-- ════════════════════════════════════════════════════════════════════════════

-- Ya existe get_my_gym_id() del script 002. No se toca.

-- Obtener el rol del JWT directamente (sin consultar profiles)
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role',
    -- Fallback: consultar la tabla profiles si no está en el JWT
    (select role from public.profiles where id = auth.uid() and gym_id = public.get_my_gym_id() limit 1),
    'member'
  );
$$;

comment on function public.get_my_role() is
  'Retorna el rol del usuario desde app_metadata del JWT (gym_admin, trainer, member). Fallback a profiles.';

-- is_gym_admin: owner o admin del gimnasio
create or replace function public.is_gym_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.get_my_role() in ('owner', 'admin', 'gym_admin');
$$;

-- is_gym_trainer: trainer O superior (admin/owner)
create or replace function public.is_gym_trainer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.get_my_role() in ('owner', 'admin', 'gym_admin', 'trainer');
$$;

-- is_gym_member: cualquier rol autenticado del gimnasio (incluye member, trainer, admin)
create or replace function public.is_gym_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.get_my_gym_id() is not null;
$$;

-- Verificar si un trainer tiene acceso a una sesión específica
create or replace function public.is_my_session(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.class_sessions cs
    join public.trainers t on t.id = cs.trainer_id
    where cs.id = p_session_id
      and t.user_id = auth.uid()
      and cs.gym_id = public.get_my_gym_id()
  );
$$;

-- Verificar si un trainer tiene asignado a un cliente
create or replace function public.is_my_client(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.trainer_assignments ta
    where ta.trainer_id = auth.uid()
      and ta.client_id = p_client_id
      and ta.gym_id = public.get_my_gym_id()
      and ta.status = 'active'
  );
$$;

-- Verificar si un trainer imparte una clase concreta
create or replace function public.is_my_class(p_class_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.classes c
    join public.trainers t on t.id = c.trainer_id
    where c.id = p_class_id
      and t.user_id = auth.uid()
      and c.gym_id = public.get_my_gym_id()
  );
$$;


-- ════════════════════════════════════════════════════════════════════════════
-- 2. FUNCIONES SECURITY DEFINER
-- Permiten a trainers realizar operaciones específicas sin acceso directo
-- a tablas sensibles (pagos, datos financieros, etc.).
-- ════════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────
-- 2a. Trainer marca asistencia individual en una sesión
-- El trainer solo puede marcar asistencia en SUS sesiones asignadas.
-- ──────────────────────────────────────────────────────────────────────────

create or replace function public.trainer_mark_attendance(
  p_session_id   uuid,
  p_user_id      uuid,
  p_status       text    -- 'attended' | 'no_show'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _gym_id     uuid;
  _role       text;
  _trainer_id uuid;
  _session    record;
  _enrollment record;
  _result     jsonb;
begin
  -- Obtener gym_id y rol del actor
  _gym_id := public.get_my_gym_id();
  _role   := public.get_my_role();

  -- Verificar que el actor sea al menos trainer
  if _role not in ('owner', 'admin', 'gym_admin', 'trainer') then
    raise exception 'Acceso denegado: solo trainers y admins pueden marcar asistencia.';
  end if;

  -- Validar el status de entrada
  if p_status not in ('attended', 'no_show') then
    raise exception 'Estado inválido: use "attended" o "no_show".';
  end if;

  -- Verificar que la sesión pertenece al gym y obtener datos
  select cs.id, cs.gym_id, cs.trainer_id, cs.status
  into _session
  from public.class_sessions cs
  where cs.id = p_session_id
    and cs.gym_id = _gym_id;

  if not found then
    raise exception 'Sesión no encontrada o no pertenece a su gimnasio.';
  end if;

  -- Si es trainer (no admin), verificar que es SU sesión
  if _role = 'trainer' then
    select t.id into _trainer_id
    from public.trainers t
    where t.user_id = auth.uid()
      and t.gym_id = _gym_id
      and t.is_active = true;

    if not found then
      raise exception 'No se encontró su perfil de entrenador activo.';
    end if;

    if _session.trainer_id is distinct from _trainer_id then
      raise exception 'No tiene permiso para marcar asistencia en sesiones de otros entrenadores.';
    end if;
  end if;

  -- Verificar que la sesión no está cancelada
  if _session.status = 'cancelled' then
    raise exception 'No se puede marcar asistencia en una sesión cancelada.';
  end if;

  -- Verificar que el usuario está inscrito
  select se.id, se.status
  into _enrollment
  from public.session_enrollments se
  where se.session_id = p_session_id
    and se.user_id = p_user_id
    and se.gym_id = _gym_id;

  if not found then
    raise exception 'El usuario no está inscrito en esta sesión.';
  end if;

  if _enrollment.status in ('cancelled') then
    raise exception 'La inscripción del usuario fue cancelada.';
  end if;

  -- Actualizar la inscripción
  update public.session_enrollments
  set status = p_status
  where id = _enrollment.id;

  -- Otorgar XP si asistió
  if p_status = 'attended' then
    perform public.award_xp(p_user_id, 50);
  end if;

  -- Registrar en audit log
  insert into public.rbac_audit_log (
    gym_id, actor_id, actor_role, action, target_table, target_id, details
  ) values (
    _gym_id, auth.uid(), _role,
    'mark_attendance', 'session_enrollments', _enrollment.id,
    jsonb_build_object(
      'session_id', p_session_id,
      'user_id', p_user_id,
      'new_status', p_status,
      'old_status', _enrollment.status
    )
  );

  _result := jsonb_build_object(
    'success', true,
    'enrollment_id', _enrollment.id,
    'status', p_status,
    'xp_awarded', case when p_status = 'attended' then 50 else 0 end
  );

  return _result;
end;
$$;

comment on function public.trainer_mark_attendance(uuid, uuid, text) is
  'Permite a trainers marcar asistencia en SUS sesiones sin acceso a datos financieros.';


-- ──────────────────────────────────────────────────────────────────────────
-- 2b. Trainer marca asistencia en lote (toda la sesión)
-- ──────────────────────────────────────────────────────────────────────────

create or replace function public.trainer_bulk_mark_attendance(
  p_session_id     uuid,
  p_attended_ids   uuid[],        -- IDs de usuarios que asistieron
  p_no_show_ids    uuid[]         -- IDs de usuarios que no asistieron
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _gym_id      uuid;
  _role        text;
  _trainer_id  uuid;
  _session     record;
  _attended    int := 0;
  _no_shows    int := 0;
  _uid         uuid;
begin
  _gym_id := public.get_my_gym_id();
  _role   := public.get_my_role();

  if _role not in ('owner', 'admin', 'gym_admin', 'trainer') then
    raise exception 'Acceso denegado.';
  end if;

  -- Obtener sesión
  select cs.id, cs.gym_id, cs.trainer_id, cs.status
  into _session
  from public.class_sessions cs
  where cs.id = p_session_id and cs.gym_id = _gym_id;

  if not found then
    raise exception 'Sesión no encontrada.';
  end if;

  -- Verificar propiedad si es trainer
  if _role = 'trainer' then
    select t.id into _trainer_id
    from public.trainers t
    where t.user_id = auth.uid() and t.gym_id = _gym_id and t.is_active = true;

    if _session.trainer_id is distinct from _trainer_id then
      raise exception 'No tiene permiso sobre esta sesión.';
    end if;
  end if;

  -- Marcar asistentes
  if p_attended_ids is not null and array_length(p_attended_ids, 1) > 0 then
    update public.session_enrollments
    set status = 'attended'
    where session_id = p_session_id
      and user_id = any(p_attended_ids)
      and gym_id = _gym_id
      and status not in ('cancelled');

    get diagnostics _attended = row_count;

    -- Otorgar XP a todos los asistentes
    foreach _uid in array p_attended_ids loop
      perform public.award_xp(_uid, 50);
    end loop;
  end if;

  -- Marcar no-shows
  if p_no_show_ids is not null and array_length(p_no_show_ids, 1) > 0 then
    update public.session_enrollments
    set status = 'no_show'
    where session_id = p_session_id
      and user_id = any(p_no_show_ids)
      and gym_id = _gym_id
      and status not in ('cancelled');

    get diagnostics _no_shows = row_count;
  end if;

  -- Marcar la sesión como completada si es trainer
  update public.class_sessions
  set status = 'completed'
  where id = p_session_id
    and status = 'in_progress';

  -- Audit log
  insert into public.rbac_audit_log (
    gym_id, actor_id, actor_role, action, target_table, target_id, details
  ) values (
    _gym_id, auth.uid(), _role,
    'bulk_attendance', 'session_enrollments', p_session_id,
    jsonb_build_object(
      'attended_count', _attended,
      'no_show_count', _no_shows,
      'attended_ids', to_jsonb(p_attended_ids),
      'no_show_ids', to_jsonb(p_no_show_ids)
    )
  );

  return jsonb_build_object(
    'success', true,
    'attended', _attended,
    'no_shows', _no_shows,
    'session_status', 'completed'
  );
end;
$$;

comment on function public.trainer_bulk_mark_attendance(uuid, uuid[], uuid[]) is
  'Marca asistencia en lote para una sesión completa. Accesible para trainers y admins.';


-- ──────────────────────────────────────────────────────────────────────────
-- 2c. Trainer obtiene resumen de su sesión (sin datos financieros)
-- Devuelve la lista de inscritos con nombre y estado, nada más.
-- ──────────────────────────────────────────────────────────────────────────

create or replace function public.trainer_get_session_roster(
  p_session_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _gym_id      uuid;
  _role        text;
  _trainer_id  uuid;
  _session     record;
  _roster      jsonb;
begin
  _gym_id := public.get_my_gym_id();
  _role   := public.get_my_role();

  if _role not in ('owner', 'admin', 'gym_admin', 'trainer') then
    raise exception 'Acceso denegado.';
  end if;

  select cs.id, cs.trainer_id, cs.status, cs.capacity, cs.enrolled_count,
         c.title as class_title, cs.session_date, cs.start_at, cs.end_at, cs.room
  into _session
  from public.class_sessions cs
  join public.classes c on c.id = cs.class_id
  where cs.id = p_session_id and cs.gym_id = _gym_id;

  if not found then
    raise exception 'Sesión no encontrada.';
  end if;

  if _role = 'trainer' then
    select t.id into _trainer_id
    from public.trainers t
    where t.user_id = auth.uid() and t.gym_id = _gym_id and t.is_active = true;

    if _session.trainer_id is distinct from _trainer_id then
      raise exception 'No tiene permiso sobre esta sesión.';
    end if;
  end if;

  -- Construir roster (solo datos no financieros)
  select jsonb_agg(
    jsonb_build_object(
      'enrollment_id', se.id,
      'user_id', se.user_id,
      'full_name', p.full_name,
      'avatar_url', p.avatar_url,
      'email', p.email,
      'phone', p.phone,
      'status', se.status,
      'enrolled_at', se.enrolled_at
    ) order by se.enrolled_at
  )
  into _roster
  from public.session_enrollments se
  join public.profiles p on p.id = se.user_id
  where se.session_id = p_session_id
    and se.gym_id = _gym_id
    and se.status != 'cancelled';

  return jsonb_build_object(
    'session', jsonb_build_object(
      'id', _session.id,
      'class_title', _session.class_title,
      'session_date', _session.session_date,
      'start_at', _session.start_at,
      'end_at', _session.end_at,
      'room', _session.room,
      'status', _session.status,
      'capacity', _session.capacity,
      'enrolled_count', _session.enrolled_count
    ),
    'roster', coalesce(_roster, '[]'::jsonb)
  );
end;
$$;

comment on function public.trainer_get_session_roster(uuid) is
  'Retorna roster de una sesión sin exponer datos financieros. Para trainers y admins.';


-- ──────────────────────────────────────────────────────────────────────────
-- 2d. Trainer registra check-in de un miembro (acceso físico al gym)
-- ──────────────────────────────────────────────────────────────────────────

create or replace function public.trainer_checkin_member(
  p_user_id  uuid,
  p_method   text default 'manual'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _gym_id    uuid;
  _role      text;
  _profile   record;
  _checkin_id uuid;
begin
  _gym_id := public.get_my_gym_id();
  _role   := public.get_my_role();

  if _role not in ('owner', 'admin', 'gym_admin', 'trainer') then
    raise exception 'Acceso denegado.';
  end if;

  if p_method not in ('qr', 'manual', 'nfc', 'biometric') then
    raise exception 'Método de check-in inválido.';
  end if;

  -- Verificar que el miembro pertenece al gym
  select id, full_name, subscription_status
  into _profile
  from public.profiles
  where id = p_user_id and gym_id = _gym_id;

  if not found then
    raise exception 'Miembro no encontrado en este gimnasio.';
  end if;

  -- Advertencia si el miembro está inactivo (no bloquear, solo registrar)
  -- La política de acceso la decide el admin, no la BD.

  -- Registrar el check-in
  insert into public.checkins (gym_id, user_id, method)
  values (_gym_id, p_user_id, p_method)
  returning id into _checkin_id;

  -- Otorgar XP por asistencia al gym
  perform public.award_xp(p_user_id, 10);

  -- Audit
  insert into public.rbac_audit_log (
    gym_id, actor_id, actor_role, action, target_table, target_id, details
  ) values (
    _gym_id, auth.uid(), _role,
    'checkin_member', 'checkins', _checkin_id,
    jsonb_build_object(
      'member_id', p_user_id,
      'member_name', _profile.full_name,
      'method', p_method,
      'subscription_status', _profile.subscription_status
    )
  );

  return jsonb_build_object(
    'success', true,
    'checkin_id', _checkin_id,
    'member_name', _profile.full_name,
    'subscription_status', _profile.subscription_status,
    'is_active', (_profile.subscription_status = 'active'),
    'xp_awarded', 10
  );
end;
$$;

comment on function public.trainer_checkin_member(uuid, text) is
  'Permite a trainers registrar check-ins de miembros sin acceso a pagos/finanzas.';


-- ──────────────────────────────────────────────────────────────────────────
-- 2e. Admin: Asignar/cambiar rol de un usuario
-- Solo admins pueden promover/degradar roles dentro de su gym.
-- ──────────────────────────────────────────────────────────────────────────

create or replace function public.admin_set_user_role(
  p_user_id   uuid,
  p_new_role  text   -- 'admin', 'trainer', 'member'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _gym_id    uuid;
  _role      text;
  _target    record;
  _old_role  text;
begin
  _gym_id := public.get_my_gym_id();
  _role   := public.get_my_role();

  -- Solo admins/owners pueden cambiar roles
  if _role not in ('owner', 'admin', 'gym_admin') then
    raise exception 'Acceso denegado: solo administradores pueden cambiar roles.';
  end if;

  -- Validar nuevo rol
  if p_new_role not in ('admin', 'trainer', 'member') then
    raise exception 'Rol inválido. Use: admin, trainer, member.';
  end if;

  -- No permitir cambiar el rol de uno mismo
  if p_user_id = auth.uid() then
    raise exception 'No puede cambiar su propio rol.';
  end if;

  -- Obtener perfil del target
  select id, role, full_name
  into _target
  from public.profiles
  where id = p_user_id and gym_id = _gym_id;

  if not found then
    raise exception 'Usuario no encontrado en este gimnasio.';
  end if;

  -- No permitir degradar al owner
  if _target.role = 'owner' then
    raise exception 'No se puede cambiar el rol del propietario del gimnasio.';
  end if;

  _old_role := _target.role;

  -- Actualizar rol en profiles
  update public.profiles
  set role = p_new_role,
      updated_at = now()
  where id = p_user_id and gym_id = _gym_id;

  -- Si se promueve a trainer, crear registro en trainers si no existe
  if p_new_role = 'trainer' then
    insert into public.trainers (gym_id, user_id)
    values (_gym_id, p_user_id)
    on conflict (gym_id, user_id) do update
    set is_active = true, updated_at = now();
  end if;

  -- Si se degrada de trainer, desactivar en trainers
  if _old_role = 'trainer' and p_new_role != 'trainer' then
    update public.trainers
    set is_active = false, updated_at = now()
    where user_id = p_user_id and gym_id = _gym_id;
  end if;

  -- Actualizar app_metadata en auth.users (requiere service_role o admin API)
  -- Nota: esto se completa desde el backend con supabase.auth.admin.updateUserById()
  -- ya que no se puede alterar auth.users directamente desde SQL con anon key.

  -- Audit
  insert into public.rbac_audit_log (
    gym_id, actor_id, actor_role, action, target_table, target_id, details
  ) values (
    _gym_id, auth.uid(), _role,
    'set_user_role', 'profiles', p_user_id,
    jsonb_build_object(
      'user_name', _target.full_name,
      'old_role', _old_role,
      'new_role', p_new_role
    )
  );

  return jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'old_role', _old_role,
    'new_role', p_new_role
  );
end;
$$;

comment on function public.admin_set_user_role(uuid, text) is
  'Permite a admins cambiar el rol de usuarios dentro de su gimnasio.';


-- ════════════════════════════════════════════════════════════════════════════
-- 3. REEMPLAZO DE POLÍTICAS RLS - GRANULARIDAD POR ROL
-- Drops de las políticas antiguas + creación de las nuevas.
-- ════════════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────────────────
-- PROFILES: Admin ve todo, trainer ve sus clientes + perfil propio,
--           member ve solo su propio perfil.
-- ──────────────────────────────────────────────────────────────────────────

drop policy if exists "profiles_select_same_gym" on public.profiles;
create policy "profiles_select_rbac" on public.profiles
  for select using (
    gym_id = public.get_my_gym_id()
    and (
      -- Admin ve todos los perfiles del gym
      public.is_gym_admin()
      -- Trainer ve su perfil + sus clientes asignados
      or (
        public.get_my_role() = 'trainer'
        and (
          id = auth.uid()
          or public.is_my_client(id)
          -- Trainers también ven perfiles básicos para roster de sesiones
          or exists (
            select 1 from public.session_enrollments se
            join public.class_sessions cs on cs.id = se.session_id
            join public.trainers t on t.id = cs.trainer_id
            where se.user_id = profiles.id
              and t.user_id = auth.uid()
              and cs.gym_id = public.get_my_gym_id()
          )
        )
      )
      -- Member ve solo su propio perfil
      or id = auth.uid()
    )
  );

-- profiles_insert_own y profiles_update_own se mantienen del script 002
-- profiles_delete_admin se mantiene del script 002


-- ──────────────────────────────────────────────────────────────────────────
-- TRAINERS: Admin ve todos, trainer ve solo su propio registro,
--           member puede ver trainers (para reservar clases).
-- ──────────────────────────────────────────────────────────────────────────

drop policy if exists "trainers_select_same_gym" on public.trainers;
create policy "trainers_select_rbac" on public.trainers
  for select using (
    gym_id = public.get_my_gym_id()
    -- Todos en el gym pueden ver la lista de trainers (directorio público)
  );

-- Insert/Update/Delete se mantienen solo para admin (del script 002)


-- ──────────────────────────────────────────────────────────────────────────
-- CLASSES: Todos ven las clases. Trainers gestionan SUS clases.
--          Admin gestiona todas.
-- ──────────────────────────────────────────────────────────────────────────

drop policy if exists "classes_select_same_gym" on public.classes;
create policy "classes_select_rbac" on public.classes
  for select using (
    gym_id = public.get_my_gym_id()
    -- Todos pueden ver el catálogo de clases
  );

drop policy if exists "classes_insert_staff" on public.classes;
create policy "classes_insert_rbac" on public.classes
  for insert with check (
    gym_id = public.get_my_gym_id()
    and public.is_gym_admin()
    -- Solo admin puede crear clases (asigna trainers)
  );

drop policy if exists "classes_update_staff" on public.classes;
create policy "classes_update_rbac" on public.classes
  for update using (
    gym_id = public.get_my_gym_id()
    and (
      public.is_gym_admin()
      -- Trainer puede actualizar SUS clases (ej. descripción, notas)
      or (public.get_my_role() = 'trainer' and public.is_my_class(id))
    )
  );

-- classes_delete_admin se mantiene


-- ──────────────────────────────────────────────────────────────────────────
-- CLASS_SESSIONS: Trainer ve solo SUS sesiones. Admin ve todo.
--                 Member ve todo (para inscribirse).
-- ──────────────────────────────────────────────────────────────────────────

drop policy if exists "class_sessions_select_same_gym" on public.class_sessions;
create policy "class_sessions_select_rbac" on public.class_sessions
  for select using (
    gym_id = public.get_my_gym_id()
    -- Todos los miembros del gym ven las sesiones (para reservar)
  );

drop policy if exists "class_sessions_insert_staff" on public.class_sessions;
create policy "class_sessions_insert_rbac" on public.class_sessions
  for insert with check (
    gym_id = public.get_my_gym_id()
    and public.is_gym_admin()
    -- Solo admin puede crear sesiones (o la función generate_class_sessions)
  );

drop policy if exists "class_sessions_update_staff" on public.class_sessions;
create policy "class_sessions_update_rbac" on public.class_sessions
  for update using (
    gym_id = public.get_my_gym_id()
    and (
      public.is_gym_admin()
      or (public.get_my_role() = 'trainer' and public.is_my_session(id))
    )
  );

-- class_sessions_delete_admin se mantiene


-- ──────────────────────────────────────────────────────────────────────────
-- SESSION_ENROLLMENTS: Trainer ve inscripciones de SUS sesiones.
--                      Member ve solo las suyas. Admin ve todo.
-- ──────────────────────────────────────────────────────────────────────────

drop policy if exists "session_enrollments_select_same_gym" on public.session_enrollments;
create policy "session_enrollments_select_rbac" on public.session_enrollments
  for select using (
    gym_id = public.get_my_gym_id()
    and (
      public.is_gym_admin()
      or user_id = auth.uid()
      or (public.get_my_role() = 'trainer' and public.is_my_session(session_id))
    )
  );

-- session_enrollments_insert_member se mantiene (member se inscribe)
-- session_enrollments_update_staff -> reemplazar para solo sus sesiones

drop policy if exists "session_enrollments_update_staff" on public.session_enrollments;
create policy "session_enrollments_update_rbac" on public.session_enrollments
  for update using (
    gym_id = public.get_my_gym_id()
    and (
      public.is_gym_admin()
      -- Member puede cancelar su propia inscripción
      or user_id = auth.uid()
      -- Trainer puede actualizar inscripciones de SUS sesiones (marcar asistencia)
      or (public.get_my_role() = 'trainer' and public.is_my_session(session_id))
    )
  );


-- ──────────────────────────────────────────────────────────────────────────
-- PAYMENTS: Admin CRUD completo. Member ve solo SUS pagos.
--           Trainer NO tiene acceso a pagos (cero visibilidad financiera).
-- ──────────────────────────────────────────────────────────────────────────

drop policy if exists "payments_select_same_gym" on public.payments;
create policy "payments_select_rbac" on public.payments
  for select using (
    gym_id = public.get_my_gym_id()
    and (
      -- Admin ve todos los pagos
      public.is_gym_admin()
      -- Member ve solo SUS pagos
      or member_id = auth.uid()
      -- Trainer NO aparece aquí -> sin acceso a finanzas
    )
  );

-- payments_insert_admin y payments_update_admin se mantienen


-- ──────────────────────────────────────────────────────────────────────────
-- SUBSCRIPTIONS: Admin CRUD. Member ve la suya.
--                Trainer NO tiene acceso.
-- ──────────────────────────────────────────────────────────────────────────

drop policy if exists "subscriptions_select_same_gym" on public.subscriptions;
create policy "subscriptions_select_rbac" on public.subscriptions
  for select using (
    gym_id = public.get_my_gym_id()
    and (
      public.is_gym_admin()
      or user_id = auth.uid()
      -- Trainer explícitamente excluido de suscripciones
    )
  );

-- Insert/Update/Delete solo admin (del script 002)


-- ──────────────────────────────────────────────────────────────────────────
-- MEMBERSHIPS (catálogo de planes): Todos pueden ver.
--             Solo admin gestiona.
-- ──────────────────────────────────────────────────────────────────────────

-- memberships_select_same_gym ya permite lectura a todos -> se mantiene
-- Insert/Update/Delete solo admin -> se mantiene


-- ──────────────────────────────────────────────────────────────────────────
-- CHECKINS: Admin ve todo. Trainer ve todo (necesario para control de acceso).
--           Member ve solo SUS check-ins.
-- ──────────────────────────────────────────────────────────────────────────

drop policy if exists "checkins_select_same_gym" on public.checkins;
create policy "checkins_select_rbac" on public.checkins
  for select using (
    gym_id = public.get_my_gym_id()
    and (
      public.is_gym_trainer()  -- admin + trainer
      or user_id = auth.uid()   -- member solo los suyos
    )
  );

-- checkins_insert: member se hace check-in a sí mismo
-- checkins_update_staff: trainer puede hacer checkout (se mantiene)


-- ──────────────────────────────────────────────────────────────────────────
-- ROUTINES: Trainer ve sus rutinas + las asignadas a sus clientes.
--           Member ve sus rutinas asignadas + templates. Admin ve todo.
-- ──────────────────────────────────────────────────────────────────────────

drop policy if exists "routines_select_same_gym" on public.routines;
create policy "routines_select_rbac" on public.routines
  for select using (
    gym_id = public.get_my_gym_id()
    and (
      public.is_gym_admin()
      -- Templates públicos dentro del gym
      or is_template = true
      -- Member ve sus rutinas asignadas
      or assigned_to = auth.uid()
      -- Trainer ve las que creó + las de sus clientes
      or (
        public.get_my_role() = 'trainer'
        and (
          exists (
            select 1 from public.trainers t
            where t.user_id = auth.uid()
              and t.id = routines.trainer_id
              and t.gym_id = public.get_my_gym_id()
          )
          or public.is_my_client(routines.assigned_to)
        )
      )
    )
  );

-- Insert/Update para staff se mantienen
-- Delete para admin se mantiene


-- ──────────────────────────────────────────────────────────────────────────
-- WORKOUT_LOGS: Admin ve todo. Trainer ve logs de sus clientes.
--               Member ve solo SUS logs.
-- ──────────────────────────────────────────────────────────────────────────

drop policy if exists "workout_logs_select_same_gym" on public.workout_logs;
create policy "workout_logs_select_rbac" on public.workout_logs
  for select using (
    gym_id = public.get_my_gym_id()
    and (
      public.is_gym_admin()
      or user_id = auth.uid()
      or (public.get_my_role() = 'trainer' and public.is_my_client(user_id))
    )
  );

-- workout_logs_insert_own se mantiene (member inserta los suyos)


-- ──────────────────────────────────────────────────────────────────────────
-- TRAINER_ASSIGNMENTS: Admin gestiona todo. Trainer ve las suyas.
--                      Member ve su asignación.
-- ──────────────────────────────────────────────────────────────────────────

drop policy if exists "assignments_select_same_gym" on public.trainer_assignments;
create policy "assignments_select_rbac" on public.trainer_assignments
  for select using (
    gym_id = public.get_my_gym_id()
    and (
      public.is_gym_admin()
      or trainer_id = auth.uid()
      or client_id = auth.uid()
    )
  );

-- Insert/Update/Delete solo admin se mantienen


-- ──────────────────────────────────────────────────────────────────────────
-- MESSAGES: Usuarios solo ven SUS mensajes. Admin no puede leer DMs.
-- ──────────────────────────────────────────────────────────────────────────

-- messages_select_same_gym ya filtra por sender/receiver -> se mantiene
-- messages_insert_same_gym ya requiere sender = auth.uid() -> se mantiene


-- ──────────────────────────────────────────────────────────────────────────
-- CLASS_ENROLLMENTS (legacy): Trainer ve inscripciones de SUS clases.
-- ──────────────────────────────────────────────────────────────────────────

drop policy if exists "enrollments_select_same_gym" on public.class_enrollments;
create policy "enrollments_select_rbac" on public.class_enrollments
  for select using (
    gym_id = public.get_my_gym_id()
    and (
      public.is_gym_admin()
      or user_id = auth.uid()
      or (public.get_my_role() = 'trainer' and public.is_my_class(class_id))
    )
  );


-- ──────────────────────────────────────────────────────────────────────────
-- SUBSCRIPTION_AUDIT_LOG: Solo admin.
-- ──────────────────────────────────────────────────────────────────────────

-- audit_log_select_admin ya restringe a admin -> se mantiene


-- ──────────────────────────────────────────────────────────────────────────
-- EXERCISES, ROUTINE_EXERCISES: Trainer ve/gestiona. Member solo lee.
-- ──────────────────────────────────────────────────────────────────────────

-- Las políticas existentes ya son correctas:
--   exercises_select_same_gym -> todos leen
--   exercises_insert_staff / update_staff -> trainer+
--   routine_exercises_select_same_gym -> todos leen
--   routine_exercises_insert/update/delete_staff -> trainer+


-- ════════════════════════════════════════════════════════════════════════════
-- 4. ACTUALIZAR TRIGGER handle_new_user PARA INCLUIR ROL EN APP_METADATA
-- Cuando un usuario se registra, el rol se propaga a app_metadata.
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _gym_id uuid;
  _role   text;
begin
  -- Extraer gym_id y rol del metadata de registro
  _gym_id := coalesce(
    (new.raw_user_meta_data ->> 'gym_id')::uuid,
    (new.raw_app_meta_data ->> 'gym_id')::uuid
  );

  _role := coalesce(
    new.raw_app_meta_data ->> 'role',
    new.raw_user_meta_data ->> 'role',
    'member'
  );

  -- Solo crear perfil si tenemos un gym_id válido
  if _gym_id is not null then
    insert into public.profiles (id, gym_id, email, full_name, avatar_url, role)
    values (
      new.id,
      _gym_id,
      new.email,
      coalesce(new.raw_user_meta_data ->> 'full_name', ''),
      coalesce(new.raw_user_meta_data ->> 'avatar_url', ''),
      _role
    )
    on conflict (id) do nothing;

    -- Si el rol es trainer, crear registro en trainers automáticamente
    if _role = 'trainer' then
      insert into public.trainers (gym_id, user_id)
      values (_gym_id, new.id)
      on conflict (gym_id, user_id) do nothing;
    end if;
  end if;

  return new;
end;
$$;

-- Recrear el trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ════════════════════════════════════════════════════════════════════════════
-- 5. ÍNDICES ADICIONALES PARA RBAC
-- ════════════════════════════════════════════════════════════════════════════

-- Índice para la función is_my_client (buscar asignaciones por trainer)
create index if not exists idx_trainer_assignments_trainer_active
  on public.trainer_assignments(trainer_id, gym_id)
  where status = 'active';

-- Índice para la función is_my_session (buscar sesiones por trainer)
create index if not exists idx_class_sessions_trainer_gym
  on public.class_sessions(trainer_id, gym_id)
  where trainer_id is not null;

-- Índice para la función is_my_class (buscar clases por trainer)
create index if not exists idx_classes_trainer_gym
  on public.classes(trainer_id, gym_id)
  where trainer_id is not null;

-- Índice para el audit log RBAC por acción
create index if not exists idx_rbac_audit_action
  on public.rbac_audit_log(gym_id, action, created_at desc);

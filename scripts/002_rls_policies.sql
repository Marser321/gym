-- ==============================================================================
-- GYM CRM SaaS - RLS POLICIES (v3.0)
-- Row Level Security basado en gym_id extraído del JWT app_metadata.
-- Patrón: auth.jwt() -> 'app_metadata' ->> 'gym_id'
-- ==============================================================================

-- ============================================================================
-- FUNCIÓN HELPER: Extraer gym_id del JWT de forma segura
-- ============================================================================
create or replace function public.get_my_gym_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select (auth.jwt() -> 'app_metadata' ->> 'gym_id')::uuid;
$$;

comment on function public.get_my_gym_id() is 'Extrae gym_id del app_metadata del JWT del usuario autenticado.';

-- ============================================================================
-- FUNCIÓN HELPER: Verificar si el usuario actual es owner o admin del gym
-- ============================================================================
create or replace function public.is_gym_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and gym_id = public.get_my_gym_id()
      and role in ('owner', 'admin')
  );
$$;

comment on function public.is_gym_admin() is 'Verifica si el usuario autenticado es owner o admin de su gimnasio.';

-- ============================================================================
-- FUNCIÓN HELPER: Verificar si el usuario es trainer del gym
-- ============================================================================
create or replace function public.is_gym_trainer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and gym_id = public.get_my_gym_id()
      and role in ('owner', 'admin', 'trainer')
  );
$$;

comment on function public.is_gym_trainer() is 'Verifica si el usuario autenticado es trainer (o superior) de su gimnasio.';


-- ==============================================================================
-- RLS: GYMS
-- Solo owners pueden modificar su gimnasio. Lectura para miembros del gym.
-- ==============================================================================
alter table public.gyms enable row level security;

drop policy if exists "gym_select" on public.gyms;
create policy "gym_select" on public.gyms
  for select using (
    id = public.get_my_gym_id()
  );

drop policy if exists "gym_update" on public.gyms;
create policy "gym_update" on public.gyms
  for update using (
    id = public.get_my_gym_id()
    and public.is_gym_admin()
  );

-- Insert solo para superadmins (backend / service_role), no desde el cliente
drop policy if exists "gym_insert" on public.gyms;
create policy "gym_insert" on public.gyms
  for insert with check (
    -- La creación de gyms se hace desde el backend con service_role.
    -- Permitimos insert si el owner_id coincide con el usuario autenticado.
    owner_id = auth.uid()
  );


-- ==============================================================================
-- RLS: PROFILES
-- Usuarios ven solo perfiles de su gimnasio.
-- ==============================================================================
alter table public.profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Staff full access profiles" on public.profiles;

create policy "profiles_select_same_gym" on public.profiles
  for select using (
    gym_id = public.get_my_gym_id()
  );

create policy "profiles_insert_own" on public.profiles
  for insert with check (
    id = auth.uid()
    and gym_id = public.get_my_gym_id()
  );

create policy "profiles_update_own" on public.profiles
  for update using (
    gym_id = public.get_my_gym_id()
    and (
      id = auth.uid()                -- usuario edita su propio perfil
      or public.is_gym_admin()       -- admin edita cualquier perfil del gym
    )
  );

create policy "profiles_delete_admin" on public.profiles
  for delete using (
    gym_id = public.get_my_gym_id()
    and public.is_gym_admin()
  );


-- ==============================================================================
-- RLS: TRAINERS
-- ==============================================================================
alter table public.trainers enable row level security;

drop policy if exists "Trainers viewable by everyone" on public.trainers;
drop policy if exists "Admins can manage trainers" on public.trainers;

create policy "trainers_select_same_gym" on public.trainers
  for select using (
    gym_id = public.get_my_gym_id()
  );

create policy "trainers_insert_admin" on public.trainers
  for insert with check (
    gym_id = public.get_my_gym_id()
    and public.is_gym_admin()
  );

create policy "trainers_update_admin" on public.trainers
  for update using (
    gym_id = public.get_my_gym_id()
    and public.is_gym_admin()
  );

create policy "trainers_delete_admin" on public.trainers
  for delete using (
    gym_id = public.get_my_gym_id()
    and public.is_gym_admin()
  );


-- ==============================================================================
-- RLS: MEMBERSHIPS (Planes de membresía)
-- Todos los miembros del gym pueden verlas, solo admin puede gestionar.
-- ==============================================================================
alter table public.memberships enable row level security;

create policy "memberships_select_same_gym" on public.memberships
  for select using (
    gym_id = public.get_my_gym_id()
  );

create policy "memberships_insert_admin" on public.memberships
  for insert with check (
    gym_id = public.get_my_gym_id()
    and public.is_gym_admin()
  );

create policy "memberships_update_admin" on public.memberships
  for update using (
    gym_id = public.get_my_gym_id()
    and public.is_gym_admin()
  );

create policy "memberships_delete_admin" on public.memberships
  for delete using (
    gym_id = public.get_my_gym_id()
    and public.is_gym_admin()
  );


-- ==============================================================================
-- RLS: SUBSCRIPTIONS
-- Miembros ven su propia suscripción, admin ve todas del gym.
-- ==============================================================================
alter table public.subscriptions enable row level security;

drop policy if exists "Users view own subscription" on public.subscriptions;

create policy "subscriptions_select_same_gym" on public.subscriptions
  for select using (
    gym_id = public.get_my_gym_id()
    and (
      user_id = auth.uid()
      or public.is_gym_admin()
      or public.is_gym_trainer()
    )
  );

create policy "subscriptions_insert_admin" on public.subscriptions
  for insert with check (
    gym_id = public.get_my_gym_id()
    and public.is_gym_admin()
  );

create policy "subscriptions_update_admin" on public.subscriptions
  for update using (
    gym_id = public.get_my_gym_id()
    and public.is_gym_admin()
  );

create policy "subscriptions_delete_admin" on public.subscriptions
  for delete using (
    gym_id = public.get_my_gym_id()
    and public.is_gym_admin()
  );


-- ==============================================================================
-- RLS: CLASSES
-- Lectura para todos en el gym. CRUD para admin/trainer.
-- ==============================================================================
alter table public.classes enable row level security;

create policy "classes_select_same_gym" on public.classes
  for select using (
    gym_id = public.get_my_gym_id()
  );

create policy "classes_insert_staff" on public.classes
  for insert with check (
    gym_id = public.get_my_gym_id()
    and public.is_gym_trainer()
  );

create policy "classes_update_staff" on public.classes
  for update using (
    gym_id = public.get_my_gym_id()
    and public.is_gym_trainer()
  );

create policy "classes_delete_admin" on public.classes
  for delete using (
    gym_id = public.get_my_gym_id()
    and public.is_gym_admin()
  );


-- ==============================================================================
-- RLS: CLASS_ENROLLMENTS
-- ==============================================================================
alter table public.class_enrollments enable row level security;

create policy "enrollments_select_same_gym" on public.class_enrollments
  for select using (
    gym_id = public.get_my_gym_id()
    and (
      user_id = auth.uid()
      or public.is_gym_trainer()
    )
  );

create policy "enrollments_insert_member" on public.class_enrollments
  for insert with check (
    gym_id = public.get_my_gym_id()
    and user_id = auth.uid()
  );

create policy "enrollments_update_staff" on public.class_enrollments
  for update using (
    gym_id = public.get_my_gym_id()
    and public.is_gym_trainer()
  );

create policy "enrollments_delete" on public.class_enrollments
  for delete using (
    gym_id = public.get_my_gym_id()
    and (
      user_id = auth.uid()
      or public.is_gym_admin()
    )
  );


-- ==============================================================================
-- RLS: PAYMENTS
-- ==============================================================================
alter table public.payments enable row level security;

drop policy if exists "Staff manage payments" on public.payments;
drop policy if exists "Users read own payments" on public.payments;

create policy "payments_select_same_gym" on public.payments
  for select using (
    gym_id = public.get_my_gym_id()
    and (
      member_id = auth.uid()
      or public.is_gym_admin()
    )
  );

create policy "payments_insert_admin" on public.payments
  for insert with check (
    gym_id = public.get_my_gym_id()
    and public.is_gym_admin()
  );

create policy "payments_update_admin" on public.payments
  for update using (
    gym_id = public.get_my_gym_id()
    and public.is_gym_admin()
  );


-- ==============================================================================
-- RLS: CHECKINS
-- ==============================================================================
alter table public.checkins enable row level security;

drop policy if exists "Users view own checkins" on public.checkins;
drop policy if exists "Admins view all checkins" on public.checkins;

create policy "checkins_select_same_gym" on public.checkins
  for select using (
    gym_id = public.get_my_gym_id()
    and (
      user_id = auth.uid()
      or public.is_gym_trainer()
    )
  );

create policy "checkins_insert_same_gym" on public.checkins
  for insert with check (
    gym_id = public.get_my_gym_id()
    and user_id = auth.uid()
  );

create policy "checkins_update_staff" on public.checkins
  for update using (
    gym_id = public.get_my_gym_id()
    and public.is_gym_trainer()
  );


-- ==============================================================================
-- RLS: ROUTINES
-- ==============================================================================
alter table public.routines enable row level security;

drop policy if exists "Public read routines" on public.routines;
drop policy if exists "Staff manage routines" on public.routines;
drop policy if exists "Routines viewable by authenticated users" on public.routines;

create policy "routines_select_same_gym" on public.routines
  for select using (
    gym_id = public.get_my_gym_id()
    and (
      is_template = true                        -- templates visibles para todos
      or assigned_to = auth.uid()              -- asignada al usuario
      or public.is_gym_trainer()               -- staff ve todo
    )
  );

create policy "routines_insert_staff" on public.routines
  for insert with check (
    gym_id = public.get_my_gym_id()
    and public.is_gym_trainer()
  );

create policy "routines_update_staff" on public.routines
  for update using (
    gym_id = public.get_my_gym_id()
    and public.is_gym_trainer()
  );

create policy "routines_delete_admin" on public.routines
  for delete using (
    gym_id = public.get_my_gym_id()
    and public.is_gym_admin()
  );


-- ==============================================================================
-- RLS: EXERCISES
-- ==============================================================================
alter table public.exercises enable row level security;

drop policy if exists "Public read exercises" on public.exercises;
drop policy if exists "Staff manage exercises" on public.exercises;

create policy "exercises_select_same_gym" on public.exercises
  for select using (
    gym_id = public.get_my_gym_id()
  );

create policy "exercises_insert_staff" on public.exercises
  for insert with check (
    gym_id = public.get_my_gym_id()
    and public.is_gym_trainer()
  );

create policy "exercises_update_staff" on public.exercises
  for update using (
    gym_id = public.get_my_gym_id()
    and public.is_gym_trainer()
  );

create policy "exercises_delete_admin" on public.exercises
  for delete using (
    gym_id = public.get_my_gym_id()
    and public.is_gym_admin()
  );


-- ==============================================================================
-- RLS: ROUTINE_EXERCISES
-- ==============================================================================
alter table public.routine_exercises enable row level security;

drop policy if exists "Public read routine exercises" on public.routine_exercises;
drop policy if exists "Staff manage routine exercises" on public.routine_exercises;
drop policy if exists "Exercises viewable by auth users" on public.routine_exercises;

create policy "routine_exercises_select_same_gym" on public.routine_exercises
  for select using (
    gym_id = public.get_my_gym_id()
  );

create policy "routine_exercises_insert_staff" on public.routine_exercises
  for insert with check (
    gym_id = public.get_my_gym_id()
    and public.is_gym_trainer()
  );

create policy "routine_exercises_update_staff" on public.routine_exercises
  for update using (
    gym_id = public.get_my_gym_id()
    and public.is_gym_trainer()
  );

create policy "routine_exercises_delete_staff" on public.routine_exercises
  for delete using (
    gym_id = public.get_my_gym_id()
    and public.is_gym_trainer()
  );


-- ==============================================================================
-- RLS: WORKOUT_LOGS
-- ==============================================================================
alter table public.workout_logs enable row level security;

drop policy if exists "Users read own logs" on public.workout_logs;
drop policy if exists "Users insert own logs" on public.workout_logs;

create policy "workout_logs_select_same_gym" on public.workout_logs
  for select using (
    gym_id = public.get_my_gym_id()
    and (
      user_id = auth.uid()
      or public.is_gym_trainer()
    )
  );

create policy "workout_logs_insert_own" on public.workout_logs
  for insert with check (
    gym_id = public.get_my_gym_id()
    and user_id = auth.uid()
  );


-- ==============================================================================
-- RLS: TRAINER_ASSIGNMENTS
-- ==============================================================================
alter table public.trainer_assignments enable row level security;

drop policy if exists "Public read assignments" on public.trainer_assignments;
drop policy if exists "Staff manage assignments" on public.trainer_assignments;

create policy "assignments_select_same_gym" on public.trainer_assignments
  for select using (
    gym_id = public.get_my_gym_id()
    and (
      trainer_id = auth.uid()
      or client_id = auth.uid()
      or public.is_gym_admin()
    )
  );

create policy "assignments_insert_admin" on public.trainer_assignments
  for insert with check (
    gym_id = public.get_my_gym_id()
    and public.is_gym_admin()
  );

create policy "assignments_update_admin" on public.trainer_assignments
  for update using (
    gym_id = public.get_my_gym_id()
    and public.is_gym_admin()
  );

create policy "assignments_delete_admin" on public.trainer_assignments
  for delete using (
    gym_id = public.get_my_gym_id()
    and public.is_gym_admin()
  );


-- ==============================================================================
-- RLS: MESSAGES
-- ==============================================================================
alter table public.messages enable row level security;

drop policy if exists "Users view own messages" on public.messages;
drop policy if exists "Users insert own messages" on public.messages;

create policy "messages_select_same_gym" on public.messages
  for select using (
    gym_id = public.get_my_gym_id()
    and (sender_id = auth.uid() or receiver_id = auth.uid())
  );

create policy "messages_insert_same_gym" on public.messages
  for insert with check (
    gym_id = public.get_my_gym_id()
    and sender_id = auth.uid()
  );

create policy "messages_update_own" on public.messages
  for update using (
    gym_id = public.get_my_gym_id()
    and (sender_id = auth.uid() or receiver_id = auth.uid())
  );


-- ==============================================================================
-- RLS: MEMBERSHIP_REQUESTS
-- Inserts abiertos (formulario público del gym), lectura restringida a admin.
-- ==============================================================================
alter table public.membership_requests enable row level security;

drop policy if exists "Allow public inserts requests" on public.membership_requests;
drop policy if exists "Staff read requests" on public.membership_requests;

create policy "requests_insert_public" on public.membership_requests
  for insert with check (
    -- Permitir inserts públicos (landing page del gym).
    -- El gym_id se pasa desde el frontend basado en el slug del gym.
    true
  );

create policy "requests_select_admin" on public.membership_requests
  for select using (
    gym_id = public.get_my_gym_id()
    and public.is_gym_admin()
  );

create policy "requests_update_admin" on public.membership_requests
  for update using (
    gym_id = public.get_my_gym_id()
    and public.is_gym_admin()
  );

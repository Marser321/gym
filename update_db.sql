-- ================================================================
-- GYM PREMIUM - UPDATE SCRIPT (Version Robusta / Idempotente)
-- Ejecutar este script para habilitar Historial, XP y Gamificación.
-- ================================================================

-- 1. TABLAS NUEVAS
-- Tabla Exercises
create table if not exists public.exercises (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  muscle_group text,
  video_url text,
  created_at timestamptz default now()
);
alter table public.exercises enable row level security;

-- Limpiar y recrear políticas para exercises
drop policy if exists "Public read exercises" on public.exercises;
create policy "Public read exercises" on public.exercises for select using (true);
drop policy if exists "Staff manage exercises" on public.exercises;
create policy "Staff manage exercises" on public.exercises for all using (true) with check (true);

-- Tabla Routine Exercises
create table if not exists public.routine_exercises (
  id uuid default gen_random_uuid() primary key,
  routine_id uuid references public.routines(id) on delete cascade,
  exercise_id uuid references public.exercises(id) on delete cascade,
  order_index int default 0,
  sets int default 3,
  reps text default '10-12',
  rest_seconds int default 60,
  created_at timestamptz default now()
);
alter table public.routine_exercises enable row level security;

-- Limpiar y recrear políticas para routine_exercises
drop policy if exists "Public read routine exercises" on public.routine_exercises;
create policy "Public read routine exercises" on public.routine_exercises for select using (true);
drop policy if exists "Staff manage routine exercises" on public.routine_exercises;
create policy "Staff manage routine exercises" on public.routine_exercises for all using (true) with check (true);

-- Tabla User Routines (Asignaciones)
create table if not exists public.user_routines (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  routine_id uuid references public.routines(id) on delete cascade,
  assigned_at timestamptz default now(),
  status text default 'active',
  completed_at timestamptz
);
alter table public.user_routines enable row level security;

-- Limpiar y recrear políticas para user_routines
drop policy if exists "Users read own routines" on public.user_routines;
create policy "Users read own routines" on public.user_routines for select using (auth.uid() = user_id);
drop policy if exists "Staff manage user routines" on public.user_routines;
create policy "Staff manage user routines" on public.user_routines for all using (true) with check (true);

-- Tabla Workout Logs (Historial)
create table if not exists public.workout_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  routine_id uuid references public.routines(id) on delete set null,
  exercise_id uuid references public.exercises(id) on delete set null,
  set_number int,
  weight decimal(10,2),
  reps int,
  completed_at timestamptz default now()
);
alter table public.workout_logs enable row level security;

-- Limpiar y recrear políticas para workout_logs
drop policy if exists "Users read own logs" on public.workout_logs;
create policy "Users read own logs" on public.workout_logs for select using (auth.uid() = user_id);
drop policy if exists "Users insert own logs" on public.workout_logs;
create policy "Users insert own logs" on public.workout_logs for insert with check (auth.uid() = user_id);


-- 2. GAMIFICACIÓN (Columnas XP y Role en Profiles)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='xp') THEN
        ALTER TABLE public.profiles ADD COLUMN xp int default 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text default 'member';
    END IF;
END $$;

-- 3. TABLA: TRAINER_ASSIGNMENTS (Relación Entrenador-Cliente)
create table if not exists public.trainer_assignments (
  id uuid default gen_random_uuid() primary key,
  trainer_id uuid references public.profiles(id) on delete cascade,
  client_id uuid references public.profiles(id) on delete cascade,
  assigned_at timestamptz default now(),
  status text default 'active',
  unique(trainer_id, client_id)
);
alter table public.trainer_assignments enable row level security;

-- Limpiar y recrear políticas para trainer_assignments
drop policy if exists "Public read assignments" on public.trainer_assignments;
create policy "Public read assignments" on public.trainer_assignments for select using (true);
drop policy if exists "Staff manage assignments" on public.trainer_assignments;
create policy "Staff manage assignments" on public.trainer_assignments for all using (true) with check (true);

-- 4. TABLA: MESSAGES (Chat Entrenador-Cliente)
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade,
  receiver_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);
alter table public.messages enable row level security;

-- Políticas de Chat: Solo el emisor o receptor pueden ver/escribir
drop policy if exists "Users view own messages" on public.messages;
create policy "Users view own messages" on public.messages 
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Users insert own messages" on public.messages;
create policy "Users insert own messages" on public.messages 
  for insert with check (auth.uid() = sender_id);


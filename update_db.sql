-- ================================================================
-- GYM PREMIUM - UPDATE SCRIPT
-- Ejecutar este script para habilitar Historial, XP y Gamificación.
-- ================================================================

-- 1. TABLAS NUEVAS (Si no existen)

-- Tabla Exercises
create table if not exists public.exercises (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  muscle_group text,
  video_url text,
  created_at timestamptz default now()
);
alter table public.exercises enable row level security;
create policy "Public read exercises" on public.exercises for select using (true);
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
create policy "Public read routine exercises" on public.routine_exercises for select using (true);
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
create policy "Users read own routines" on public.user_routines for select using (auth.uid() = user_id);
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
create policy "Users read own logs" on public.workout_logs for select using (auth.uid() = user_id);
create policy "Users insert own logs" on public.workout_logs for insert with check (auth.uid() = user_id);


-- 2. GAMIFICACIÓN (Columnas XP en Profiles)

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='xp') THEN
        ALTER TABLE public.profiles ADD COLUMN xp int default 0;
    END IF;
    -- Add role column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text default 'member'; -- member, trainer, admin
    END IF;
END $$;

-- 11. TABLA: TRAINER_ASSIGNMENTS (Relación Entrenador-Cliente)
create table if not exists public.trainer_assignments (
  id uuid default gen_random_uuid() primary key,
  trainer_id uuid references public.profiles(id) on delete cascade,
  client_id uuid references public.profiles(id) on delete cascade,
  assigned_at timestamptz default now(),
  status text default 'active',
  unique(trainer_id, client_id)
);
alter table public.trainer_assignments enable row level security;
create policy "Public read assignments" on public.trainer_assignments for select using (true);
create policy "Staff manage assignments" on public.trainer_assignments for all using (true) with check (true);


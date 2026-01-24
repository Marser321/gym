-- 7. TABLA: EXERCISES (Biblioteca de Ejercicios)
create table if not exists public.exercises (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  muscle_group text, -- Pecho, Espalda, Piernas, etc.
  video_url text, -- YouTube/Vimeo/GIF
  created_at timestamptz default now()
);
alter table public.exercises enable row level security;
drop policy if exists "Public read exercises" on public.exercises;
create policy "Public read exercises" on public.exercises for select using (true);
drop policy if exists "Staff manage exercises" on public.exercises;
create policy "Staff manage exercises" on public.exercises for all using (true) with check (true);

-- 8. TABLA: ROUTINE_EXERCISES (Relación Rutina-Ejercicios)
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
drop policy if exists "Public read routine exercises" on public.routine_exercises;
create policy "Public read routine exercises" on public.routine_exercises for select using (true);
drop policy if exists "Staff manage routine exercises" on public.routine_exercises;
create policy "Staff manage routine exercises" on public.routine_exercises for all using (true) with check (true);

-- 9. TABLA: USER_ROUTINES (Asignaciones)
create table if not exists public.user_routines (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  routine_id uuid references public.routines(id) on delete cascade,
  assigned_at timestamptz default now(),
  status text default 'active', -- active, archived
  completed_at timestamptz
);
alter table public.user_routines enable row level security;
drop policy if exists "Users read own routines" on public.user_routines;
create policy "Users read own routines" on public.user_routines for select using (auth.uid() = user_id);
drop policy if exists "Staff manage user routines" on public.user_routines;
create policy "Staff manage user routines" on public.user_routines for all using (true) with check (true);

-- 10. TABLA: WORKOUT_LOGS (Historial de Series Realizadas)
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
drop policy if exists "Users read own logs" on public.workout_logs;
create policy "Users read own logs" on public.workout_logs for select using (auth.uid() = user_id);
drop policy if exists "Users insert own logs" on public.workout_logs;
create policy "Users insert own logs" on public.workout_logs for insert with check (auth.uid() = user_id);

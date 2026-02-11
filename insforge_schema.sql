-- ==============================================================================
-- INSFORGE - MASTER SCHEMA (Consolidated)
-- ==============================================================================

-- 1. EXTENSIONES
create extension if not exists "uuid-ossp";

-- 2. TABLA: PROFILES (Socios / Staff / Entrenadores)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  phone text,
  dni text,
  level int default 1,
  xp int default 0,
  role text default 'member', -- member, trainer, admin
  rank_name text default 'Bronce',
  qr_code_token text,
  subscription_status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS Profiles
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Staff full access profiles" on public.profiles for all using (true) with check (true);

-- 3. TABLA: MEMBERSHIP REQUESTS (Solicitudes Web)
create table if not exists public.membership_requests (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  email text not null,
  phone text,
  goal text,
  status text default 'pending', -- pending, approved, rejected
  created_at timestamptz default now()
);
alter table public.membership_requests enable row level security;
create policy "Allow public inserts requests" on public.membership_requests for insert with check (true);
create policy "Staff read requests" on public.membership_requests for select using (true);

-- 4. TABLA: GYM SERVICES (Clases y Servicios)
create table if not exists public.gym_services (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  instructor text,
  schedule text,
  capacity_text text,
  image_url text,
  status text default 'active', -- active, cancelled
  created_at timestamptz default now()
);
alter table public.gym_services enable row level security;
create policy "Public read services" on public.gym_services for select using (true);
create policy "Staff manage services" on public.gym_services for all using (true) with check (true);

-- Datos iniciales de Servicios
insert into public.gym_services (title, instructor, schedule, capacity_text, image_url, status)
values 
('CrossFit Élite', 'Marcos V.', '07:00 AM - 08:00 AM', '08/12', 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1470', 'active'),
('Yoga Flow', 'Elena R.', '09:00 AM - 10:00 AM', '12/15', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1470', 'active'),
('Boxeo Técnico', 'Javier M.', '18:00 PM - 19:30 PM', 'Full', 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=1470', 'active');

-- 5. TABLA: PAYMENTS (Finanzas)
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.profiles(id) on delete cascade,
  amount decimal(10,2) not null,
  plan_name text not null,
  payment_method text check (payment_method in ('efectivo', 'transferencia', 'debito', 'credito')),
  status text default 'completed',
  notes text,
  created_at timestamptz default now()
);
alter table public.payments enable row level security;
create policy "Staff manage payments" on public.payments for all using (true) with check (true);
create policy "Users read own payments" on public.payments for select using (auth.uid() = member_id);

-- 6. TABLA: ROUTINES (Rutinas de Entrenamiento)
create table if not exists public.routines (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  difficulty text default 'intermedio', -- principiante, intermedio, avanzado
  duration int default 60, -- minutos
  exercise_count int default 0,
  image_url text,
  created_at timestamptz default now()
);
alter table public.routines enable row level security;
create policy "Public read routines" on public.routines for select using (true);
create policy "Staff manage routines" on public.routines for all using (true) with check (true);

-- Insertar Rutinas de Ejemplo
insert into public.routines (name, description, difficulty, duration, exercise_count, image_url)
values
('Hipertrofia Pierna', 'Enfoque en cuádriceps y glúteos con alta intensidad.', 'intermedio', 60, 8, 'https://images.unsplash.com/photo-1434608519344-49d77a699ded?q=80&w=1474'),
('Upper Body Power', 'Pecho, espalda y hombros para fuerza máxima.', 'avanzado', 75, 10, 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1470');

-- 7. TABLA: EXERCISES (Biblioteca de Ejercicios)
create table if not exists public.exercises (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  muscle_group text, -- Pecho, Espalda, Piernas, etc.
  video_url text, -- YouTube/Vimeo/GIF
  created_at timestamptz default now()
);
alter table public.exercises enable row level security;
create policy "Public read exercises" on public.exercises for select using (true);
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
create policy "Public read routine exercises" on public.routine_exercises for select using (true);
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
create policy "Users read own routines" on public.user_routines for select using (auth.uid() = user_id);
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
create policy "Users read own logs" on public.workout_logs for select using (auth.uid() = user_id);
create policy "Users insert own logs" on public.workout_logs for insert with check (auth.uid() = user_id);

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

-- 12. TABLA: MESSAGES (Chat Entrenador-Cliente)
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade,
  receiver_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);
alter table public.messages enable row level security;
create policy "Users view own messages" on public.messages 
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users insert own messages" on public.messages 
  for insert with check (auth.uid() = sender_id);

-- 13. FUNCIONES: Gamificación
create or replace function award_xp(user_id uuid, amount int)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set xp = xp + amount,
      level = floor((xp + amount) / 1000) + 1 -- Simple logic: 1000 XP per level
  where id = user_id;
end;
$$;

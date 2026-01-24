-- ==============================================================================
-- GYM PREMIUM - MASTER SCHEMA (v2.0)
-- Ejecutar todo este script en el SQL Editor de Supabase para sincronizar la BD.
-- No borrará datos existentes, solo agregará lo que falte.
-- ==============================================================================

-- 1. EXTENSIONES
create extension if not exists "uuid-ossp";

-- 2. TABLA: PROFILES (Socios)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  phone text,
  dni text, -- Nuevo campo DNI
  level int default 1,
  rank_name text default 'Bronce',
  qr_code_token text,
  subscription_status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Asegurar columnas si la tabla ya existía
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists dni text;
alter table public.profiles add column if not exists qr_code_token text;
alter table public.profiles add column if not exists rank_name text default 'Bronce';

-- RLS Profiles
alter table public.profiles enable row level security;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- IMPORTANTE: Permitir al Staff gestionar perfiles (para el admin panel)
drop policy if exists "Staff full access profiles" on public.profiles;
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
drop policy if exists "Allow public inserts requests" on public.membership_requests;
create policy "Allow public inserts requests" on public.membership_requests for insert with check (true);
drop policy if exists "Staff read requests" on public.membership_requests;
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
drop policy if exists "Public read services" on public.gym_services;
create policy "Public read services" on public.gym_services for select using (true);
drop policy if exists "Staff manage services" on public.gym_services;
create policy "Staff manage services" on public.gym_services for all using (true) with check (true);


-- 5. TABLA: PAYMENTS (Finanzas)
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.profiles(id) on delete cascade,
  amount decimal(10,2) not null,
  plan_name text not null,
  payment_method text, -- efectivo, transferencia, etc
  status text default 'completed',
  created_at timestamptz default now()
);
alter table public.payments enable row level security;
drop policy if exists "Staff manage payments" on public.payments;
create policy "Staff manage payments" on public.payments for all using (true) with check (true);
drop policy if exists "Users read own payments" on public.payments;
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
drop policy if exists "Public read routines" on public.routines;
create policy "Public read routines" on public.routines for select using (true);
drop policy if exists "Staff manage routines" on public.routines;
create policy "Staff manage routines" on public.routines for all using (true) with check (true);

-- Insertar Rutinas de Ejemplo si está vacía
insert into public.routines (name, description, difficulty, duration, exercise_count, image_url)
select 'Hipertrofia Pierna', 'Enfoque en cuádriceps y glúteos con alta intensidad.', 'intermedio', 60, 8, 'https://images.unsplash.com/photo-1434608519344-49d77a699ded?q=80&w=1474'
where not exists (select 1 from public.routines limit 1);

insert into public.routines (name, description, difficulty, duration, exercise_count, image_url)
select 'Upper Body Power', 'Pecho, espalda y hombros para fuerza máxima.', 'avanzado', 75, 10, 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1470'
where not exists (select 1 from public.routines limit 1);

-- FIN DEL SCRIPT MAESTRO
